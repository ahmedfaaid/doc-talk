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
import { getFileById } from '../db/operations/file.operation';
import { addMessage } from '../db/operations/message.operation';
import { createThread, getThread } from '../db/operations/thread.operation';
import { getUser } from '../db/operations/user.operation';
import { embeddings, llm } from '../lib/AI';
import { DbChatMessageHistory } from '../lib/chat';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED
} from '../lib/http-status-codes';
import { contextualPrompt, systemPrompt } from '../lib/prompts';
import { createVectorStorePath } from '../lib/utils';
import { ChatRoute } from '../routes/chat/chat.route';
import { AppRouteHandler } from '../types';

function getSessionHistory(sessionId: string): BaseChatMessageHistory {
  return new DbChatMessageHistory(sessionId);
}

export const chat: AppRouteHandler<ChatRoute> = async (c: Context) => {
  try {
    const { content, fileId, threadId, title, role } = await c.req.json();
    const payload = c.get('user');

    if (!content) {
      return c.json(
        { message: 'Query is required', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    if (!fileId) {
      return c.json(
        { message: 'File id is required', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    const user = await getUser(payload.id, undefined);

    if (!user) {
      return c.json(
        { message: 'User is not authorized', code: UNAUTHORIZED },
        UNAUTHORIZED
      );
    }

    const file = await getFileById(fileId, user?.id!);

    if (!file) {
      return c.json({ message: 'File not found', code: NOT_FOUND }, NOT_FOUND);
    }

    if (file.vectorStatus === 'processing') {
      return c.json(
        { message: 'File is still being processed', code: BAD_REQUEST },
        BAD_REQUEST
      );
    } else if (file.vectorStatus === 'failed') {
      return c.json(
        { message: 'File vectorization failed', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    // Handle thread creation/retrieval
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await createThread(title || `Chat: ${file.filename}`, {
        filename: file.filename,
        createdAt: new Date().toISOString()
      });
      currentThreadId = thread.id;
    }

    // Verify thread exists
    const thread = await getThread(currentThreadId);
    if (!thread) {
      return c.json(
        { message: 'Thread not found', code: NOT_FOUND },
        NOT_FOUND
      );
    }

    // Add user message to database
    await addMessage(currentThreadId, role, content);

    // Retrieve the vector store contents
    const vector_path = createVectorStorePath(user.id, fileId);
    const vectorStore = await HNSWLib.load(vector_path, embeddings);

    // Enhance retrieval with semantic search and contextual filtering
    const retriever = vectorStore.asRetriever({
      searchType: 'similarity'
    });

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
          { input: content },
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
            file: file.filename,
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
    return c.json({ error: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};
