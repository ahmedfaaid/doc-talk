import { OpenAPIHono, RouteConfig, RouteHandler, z } from '@hono/zod-openapi';
import { PinoLogger } from 'hono-pino';

export type Directory = {
  id: string;
  name: string;
  directory_path: string;
  vector_path: string;
  indexed: boolean;
  owner_id: string;
  created_at: string;
};

export type ChatThread = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  metadata: string | null;
};

export type Role = 'user' | 'admin' | 'superadmin';

export type ChatMessage = {
  id: string;
  thread_id: string;
  role: Role;
  content: string;
  timestamp: string;
  metadata: string | null;
};

export type User = {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company: string | null;
  is_company: boolean;
  role: Role;
  parent_id: string | null;
  parent?: User;
  created_at: string;
  updated_at: string;
};

export type ZodSchema =
  | z.ZodUnion<any>
  | z.AnyZodObject
  | z.ZodArray<z.AnyZodObject>;

export type AppBindings = {
  Variables: {
    logger: PinoLogger;
  };
};

export type AppOpenApi = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

export type JWTPayload = {
  id: number;
  email: string;
  exp: number;
};

export type FileExtension =
  | 'txt'
  | 'md'
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'json'
  | 'csv'
  | 'html'
  | 'xml';

export type File = {
  id: string;
  filename: string;
  extension: FileExtension;
  original_path: string;
  upload_path: string;
  size: string;
  batch_id: string;
  owner_id: string;
  owner: User;
  access_level: Role;
  status: 'uploading' | 'completed' | 'failed';
  created_at: string;
  completed_at: string;
};
