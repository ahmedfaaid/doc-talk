import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import 'dotenv/config';
import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { db } from '../lib/db';
import { contextualPrompt, systemPrompt } from '../lib/prompts';

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

const llm = new ChatOpenAI({
  // model: 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
  model: 'meta-llama-3.1-8b-instruct',
  temperature: 0.7,
  apiKey: 'lm-studio',
  configuration: {
    baseURL: 'http://localhost:1234/v1'
  }
});

const embeddings = new OpenAIEmbeddings({
  apiKey: 'lm-studio',
  model: 'nomic-ai/nomic-embed-text-v1.5-GGUF',
  configuration: {
    baseURL: 'http://localhost:1234/v1'
  }
});

export const chat = async (c: Context) => {
  const { query, directoryPath } = await c.req.json();

  try {
    const indexedDirectory = db.prepare(`
      SELECT id, name, directory_path, vector_path, indexed FROM directories WHERE directory_path = $directory_path  
    `);
    const foundDirectory: any = indexedDirectory.get({
      $directory_path: directoryPath
    });

    if (!foundDirectory) {
      return c.json(
        {
          message: 'The selected directory has not been indexed',
          code: 400,
          directory: null
        },
        400
      );
    }

    const vectorStoreBasePath = 'vectorstore';
    const vectorStore = await HNSWLib.load(
      `${vectorStoreBasePath}/${foundDirectory.name}`,
      embeddings
    );

    const retriever = vectorStore.asRetriever();

    const prompt1 = ChatPromptTemplate.fromMessages([
      ['assistant', contextualPrompt],
      new MessagesPlaceholder('chat_history'),
      ['user', '{input}']
    ]);

    const prompt2 = ChatPromptTemplate.fromMessages([
      ['assistant', systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['user', '{input}']
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm,
      retriever,
      rephrasePrompt: prompt1
    });

    const qaChain = await createStuffDocumentsChain({
      llm,
      prompt: prompt2
    });

    const ragChain = await createRetrievalChain({
      retriever: historyAwareRetriever,
      combineDocsChain: qaChain
    });

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
