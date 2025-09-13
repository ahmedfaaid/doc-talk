import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import env from './env.js';

// Create embeddings with fallback logic
export const embeddings = (() => {
  if (env.USE_LOCAL_AI && env.LM_STUDIO_BASE_URL) {
    try {
      return new OpenAIEmbeddings({
        apiKey: env.LM_STUDIO_API_KEY,
        model: 'nomic-ai/nomic-embed-text-v1.5-GGUF',
        configuration: {
          baseURL: env.LM_STUDIO_BASE_URL
        }
      });
    } catch (error) {
      console.warn('⚠️ LM Studio embeddings not available, falling back to OpenAI');
    }
  }
  
  // Fallback to OpenAI if available
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    return new OpenAIEmbeddings({
      apiKey: env.OPENAI_API_KEY,
      model: 'text-embedding-3-small'
    });
  }
  
  // Mock embeddings for development
  console.warn('⚠️ No embeddings service available, using mock embeddings');
  return {
    embedQuery: async (text: string) => {
      // Return a mock embedding vector
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    },
    embedDocuments: async (texts: string[]) => {
      return texts.map(() => new Array(1536).fill(0).map(() => Math.random() - 0.5));
    }
  } as any;
})();

// Create LLM with fallback logic
export const llm = (() => {
  if (env.USE_LOCAL_AI && env.LM_STUDIO_BASE_URL) {
    try {
      return new ChatOpenAI({
        model: 'meta-llama-3.1-8b-instruct',
        temperature: 0.7,
        apiKey: env.LM_STUDIO_API_KEY,
        configuration: {
          baseURL: env.LM_STUDIO_BASE_URL
        }
      });
    } catch (error) {
      console.warn('⚠️ LM Studio LLM not available, falling back to OpenAI');
    }
  }
  
  // Fallback to OpenAI if available
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    return new ChatOpenAI({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      apiKey: env.OPENAI_API_KEY
    });
  }
  
  // Mock LLM for development
  console.warn('⚠️ No LLM service available, using mock LLM');
  return {
    invoke: async (messages: any) => {
      return {
        content: 'This is a mock response. Please configure your AI service (LM Studio or OpenAI) for actual functionality.'
      };
    },
    stream: async function* (messages: any) {
      const response = 'This is a mock streaming response. Please configure your AI service for actual functionality.';
      for (const char of response) {
        yield { content: char };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  } as any;
})();

// Health check functions
export const checkAIServices = async () => {
  const status = {
    embeddings: false,
    llm: false,
    lmStudio: false,
    openai: false
  };

  // Check LM Studio
  if (env.USE_LOCAL_AI && env.LM_STUDIO_BASE_URL) {
    try {
      const response = await fetch(`${env.LM_STUDIO_BASE_URL}/models`);
      if (response.ok) {
        status.lmStudio = true;
        status.embeddings = true;
        status.llm = true;
      }
    } catch (error) {
      console.warn('LM Studio not available:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Check OpenAI
  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      // Simple test to verify API key works
      const testEmbedding = new OpenAIEmbeddings({
        apiKey: env.OPENAI_API_KEY,
        model: 'text-embedding-3-small'
      });
      await testEmbedding.embedQuery('test');
      status.openai = true;
      if (!status.embeddings) status.embeddings = true;
      if (!status.llm) status.llm = true;
    } catch (error) {
      console.warn('OpenAI not available:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return status;
};
