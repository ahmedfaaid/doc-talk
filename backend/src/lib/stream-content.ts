import type { ZodSchema } from '../types';

const streamContent = <T extends ZodSchema>(schema: T, description: string) => {
  return {
    content: {
      'text/event-stream': {
        schema
      }
    },
    description
  };
};

export default streamContent;
