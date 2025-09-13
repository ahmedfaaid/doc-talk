import { z, ZodError } from 'zod';

const EnvSchema = z
  .object({
    // Database
    DB_FILE_NAME: z.string().url(),
    
    // Authentication
    JWT_SECRET_KEY: z.string(),
    
    // Server
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
    ]),
    
    // AI Services
    OPENAI_API_KEY: z.string().optional(),
    LM_STUDIO_BASE_URL: z.string().default('http://localhost:1234/v1'),
    LM_STUDIO_API_KEY: z.string().default('lm-studio'),
    
    // Vector Database
    CHROMA_URL: z.string().default('http://localhost:8000'),
    
    // Graph Database
    NEO4J_URI: z.string().default('bolt://localhost:7687'),
    NEO4J_USERNAME: z.string().default('neo4j'),
    NEO4J_PASSWORD: z.string().default('password'),
    
    // Optional Services
    HUGGING_FACE_TOKEN: z.string().optional(),
    
    // Service Flags
    USE_LOCAL_AI: z.coerce.boolean().default(true),
    USE_CHROMADB: z.coerce.boolean().default(true),
    USE_NEO4J: z.coerce.boolean().default(true)
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
