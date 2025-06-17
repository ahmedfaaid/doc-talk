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
import { getDirectory } from '../db/operations/directory';
import { addMessage } from '../db/operations/message';
import { createThread, getThread } from '../db/operations/thread';
import { embeddings, llm } from '../lib/AI';
import { DbChatMessageHistory } from '../lib/chat';
import { contextualPrompt, systemPrompt } from '../lib/prompts';
import { createVectorStorePath, getLastPathSegment } from '../lib/utils';

function getSessionHistory(sessionId: string): BaseChatMessageHistory {
  return new DbChatMessageHistory(sessionId);
}

export const chat = async (c: Context) => {
  try {
    const { query, directoryPath, threadId, title } = await c.req.json();

    if (!query) {
      return c.json({ message: 'Query is required', code: 400 }, 400);
    }

    if (!directoryPath) {
      return c.json({ message: 'Directory path is required', code: 400 }, 400);
    }

    // Handle thread creation/retrieval
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await createThread(
        title || `Chat: ${getLastPathSegment(directoryPath)}`,
        {
          directoryPath,
          createdAt: new Date().toISOString()
        }
      );
      currentThreadId = thread.id;
    }

    // Verify thread exists
    const thread = await getThread(currentThreadId);
    if (!thread) {
      return c.json({ message: 'Thread not found', code: 404 }, 404);
    }

    // Check if directory is indexed
    const directory = await getDirectory(directoryPath);

    if (!directory) {
      return c.json(
        {
          message: 'The selected directory has not been indexed',
          code: 400,
          directory: null
        },
        400
      );
    }

    // Add user message to database
    await addMessage(currentThreadId, 'user', query);

    // Retrieve the vector store contents
    const vector_path = createVectorStorePath(directory.name);
    const vectorStore = await HNSWLib.load(vector_path, embeddings);

    const retriever = vectorStore.asRetriever();

    // Construct prompts
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

    // Create history aware retriever, qa chain and rag chains
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

    // Stream the response from the llm
    return streamSSE(c, async stream => {
      let fullResponse = '';
      let sources: any[] = [];

      try {
        for await (const s of await conversationalRagChain.stream(
          { input: query },
          { configurable: { sessionId: currentThreadId } }
        )) {
          // Collect the full response and sources
          if (s.answer) {
            fullResponse += s.answer;
          }
          if (s.context) {
            sources = s.context;
          }

          await stream.writeSSE({
            data: JSON.stringify({
              ...s,
              threadId: currentThreadId
            }),
            event: 'answer',
            id: String(Date.now())
          });
        }

        // After streaming is complete, save the assistant's response to database
        if (fullResponse) {
          await addMessage(currentThreadId, 'assistant', fullResponse, {
            sources: sources.map(doc => ({
              pageContent: doc.pageContent,
              metadata: doc.metadata
            })),
            directory: directory.name,
            timestamp: new Date().toISOString()
          });
        }

        // Send final message with thread info
        await stream.writeSSE({
          data: JSON.stringify({
            threadId: currentThreadId,
            completed: true
          }),
          event: 'complete',
          id: String(Date.now())
        });
      } catch (error) {
        console.error('Streaming error: ' + error);
        await stream.writeSSE({
          data: JSON.stringify({
            error: 'Streaming failed',
            threadId: currentThreadId
          }),
          event: 'error',
          id: String(Date.now())
        });
      } finally {
        await stream.close();
      }
    });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
