import { z } from '@hono/zod-openapi';

const createMessageObjectSchema = (
  exampleMessage: string = 'This is a message'
) => {
  return z
    .object({
      message: z.string()
    })
    .openapi({
      example: { message: exampleMessage }
    });
};

export default createMessageObjectSchema;
