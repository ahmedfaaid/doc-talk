import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import 'dotenv/config';
import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { access } from 'node:fs/promises';
import { db } from '../lib/db';
import { systemPrompt } from '../lib/prompts';

let vectorStore: HNSWLib | null = null;
let vectorStorePath: string = 'vectorstore/dir-contents.index';
let historyAwareRetriever: any = null;
let qaChain: any = null;
let ragChain: any = null;
const uniqueId: string = String(
  Math.random().toString(16) + '-' + Date.now().toString(32)
);
let streamId: number = 0;

let store: Record<string, BaseChatMessageHistory> = {};

function getSessionHistory(sessionId: string): BaseChatMessageHistory {
  if (!(sessionId in store)) {
    store[sessionId] = new ChatMessageHistory();
  }
  return store[sessionId];
}

const llm = new HuggingFaceInference({
  model: 'meta-llama/Llama-3.1-8B-Instruct',
  apiKey: process.env.HUGGING_FACE_TOKEN
});

export const indexDirectory = async (c: Context) => {
  const { directory } = await c.req.json();

  try {
    await access(directory);

    const loader = new DirectoryLoader(directory, {
      '.txt': path => new TextLoader(path),
      '.pdf': path => new PDFLoader(path),
      '.csv': path => new CSVLoader(path),
      '.docx': path => new DocxLoader(path),
      '.pptx': path => new PPTXLoader(path)
    });
    const docs = await loader.load();

    if (docs.length === 0) {
      return c.json(
        {
          message:
            'No text, pdf, csv, docx or pptx files found in the directory'
        },
        404
      );
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const splitText = await textSplitter.splitDocuments(docs);

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGING_FACE_TOKEN
    });
    vectorStore = await HNSWLib.fromDocuments(splitText, embeddings);
    await vectorStore.save(vectorStorePath);

    const addDirectory = db.query(`
      INSERT INTO directories (name, vector_path, indexed)
      SELECT $name, $vector_path, $indexed
      WHERE NOT EXISTS (
        SELECT 1
        FROM directories
        WHERE name = $name
      )
    `);
    addDirectory.run({
      $name: directory,
      $vector_path: vectorStorePath,
      $indexed: 1
    });

    const retriever = vectorStore.asRetriever();

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}']
    ]);

    historyAwareRetriever = createHistoryAwareRetriever({
      llm,
      retriever,
      rephrasePrompt: prompt
    });

    qaChain = await createStuffDocumentsChain({
      llm,
      prompt
    });

    ragChain = await createRetrievalChain({
      retriever: historyAwareRetriever,
      combineDocsChain: qaChain
    });

    return c.json({ message: 'Directory indexed successfully' }, 201);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

export const query = async (c: Context) => {
  const { query } = await c.req.json();

  try {
    if (!qaChain && !ragChain) {
      return c.json({ message: 'The directory has not been indexed yet' }, 404);
    }

    const conversationalRagChain = new RunnableWithMessageHistory({
      runnable: ragChain,
      getMessageHistory: getSessionHistory,
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history',
      outputMessagesKey: 'answer'
    });

    return streamSSE(c, async stream => {
      for await (const s of await conversationalRagChain.stream(
        { input: query },
        { configurable: { sessionId: uniqueId } }
      )) {
        await stream.writeSSE({
          data: JSON.stringify(s),
          event: 'answer',
          id: String(streamId++)
        });
      }
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

export const retrieveIndexedDirectory = async (c: Context) => {
  try {
    const indexedDirectory = db.query(`
      SELECT id, name, vector_path, indexed FROM directories
    `);
    const directories = indexedDirectory.all();

    if (directories.length === 0) {
      return c.json(
        { message: 'No directories have been indexed', directories: null },
        400
      );
    }

    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGING_FACE_TOKEN
    });
    vectorStore = await HNSWLib.load(vectorStorePath, embeddings);

    const retriever = vectorStore.asRetriever();

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}']
    ]);

    historyAwareRetriever = createHistoryAwareRetriever({
      llm,
      retriever,
      rephrasePrompt: prompt
    });

    qaChain = await createStuffDocumentsChain({
      llm,
      prompt
    });

    ragChain = await createRetrievalChain({
      retriever: historyAwareRetriever,
      combineDocsChain: qaChain
    });

    return c.json(
      { message: 'Indexed directory retrieved successfully', directories },
      200
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
