import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

export const embeddings = new OpenAIEmbeddings({
  apiKey: 'lm-studio',
  model: 'nomic-ai/nomic-embed-text-v1.5-GGUF',
  configuration: {
    baseURL: 'http://localhost:1234/v1'
  }
});

export const llm = new ChatOpenAI({
  model: 'meta-llama-3.1-8b-instruct',
  temperature: 0.7,
  apiKey: 'lm-studio',
  configuration: {
    baseURL: 'http://localhost:1234/v1'
  }
});
