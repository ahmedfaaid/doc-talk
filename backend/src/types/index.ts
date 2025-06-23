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

export type ChatMessage = {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
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
  role: 'user' | 'admin' | 'superadmin';
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
