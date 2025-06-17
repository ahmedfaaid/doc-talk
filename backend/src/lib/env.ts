import { z, ZodError } from 'zod';

const EnvSchema = z
  .object({
    HUGGING_FACE_TOKEN: z.string().optional(),
    DB_FILE_NAME: z.string().url(),
    JWT_SECRET_KEY: z.string(),
    PORT: z.coerce.number().default(5155),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    LOG_LEVEL: z.enum([
      'fatal',
      'error',
      'warn',
      'info',
      'debug',
      'trace',
      'silent'
    ])
  })
  .superRefine((input, ctx) => {
    if (!input.JWT_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'undefined',
        path: ['JWT_SECRET_KEY'],
        message: 'JWT secret key is required.'
      });
    }
  });

export type env = z.infer<typeof EnvSchema>;

let env: env;

try {
  env = EnvSchema.parse(process.env);
} catch (error) {
  const err = error as ZodError;
  console.error('🔴 Error with env:');
  console.error(err.flatten().fieldErrors);
  process.exit(1);
}

export default env;
