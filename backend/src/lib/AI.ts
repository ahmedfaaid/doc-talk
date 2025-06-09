import { OpenAIEmbeddings } from '@langchain/openai';

export const embeddings = new OpenAIEmbeddings({
  apiKey: 'lm-studio',
  model: 'nomic-ai/nomic-embed-text-v1.5-GGUF',
  configuration: {
    baseURL: 'http://localhost:1234/v1'
  }
});
