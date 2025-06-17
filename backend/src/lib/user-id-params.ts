import { z } from '@hono/zod-openapi';

const userIdParamsSchema = z.object({
  id: z.coerce.string().openapi({
    param: {
      name: 'id',
      in: 'path',
      required: true
    },
    required: ['id'],
    example: '235f26b1-062c-4c82-ba8d-d41bd3c35331'
  })
});

export default userIdParamsSchema;
