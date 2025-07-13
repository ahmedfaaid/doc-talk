import { OpenAPIHono, RouteConfig, RouteHandler, z } from '@hono/zod-openapi';
import { PinoLogger } from 'hono-pino';

export type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata: string | null;
};

export type UserRole = 'user' | 'admin' | 'superadmin';
export type AiRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  threadId: string;
  role: AiRole;
  content: string;
  timestamp: string;
  metadata: string | null;
};

export type User = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string | null;
  isCompany: boolean;
  role: UserRole;
  parentId: string | null;
  parent?: User;
  createdAt: string;
  updatedAt: string;
};

export type ZodSchema =
  | z.ZodUnion<any>
  | z.AnyZodObject
  | z.ZodArray<z.AnyZodObject>;

export type AppBindings = {
  Variables: {
    logger: PinoLogger;
    user: {
      id: string;
      email: string;
    };
  };
};

import { Context } from 'hono';
export type AppContext = Context<AppBindings>;

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
  originalPath: string;
  uploadPath: string;
  vectorStorePath: string | null;
  size: string;
  batchId: string;
  ownerId: string;
  owner?: User;
  accessLevel: UserRole;
  uploadStatus: 'uploading' | 'completed' | 'failed';
  vectorStatus: 'processing' | 'completed' | 'failed' | null;
  createdAt: string;
  uploadCompletedAt: string;
  vectorCompletedAt: string | null;
  // Legal document specific fields
  isLegalDocument?: boolean;
  jurisdiction?: string;
  documentType?: string;
  chunkCount?: number;
};

export type FileUploadProgress = {
  loaded: number;
  total: number;
  status: string;
};

export type ChunkAndStoreProgress = {
  loaded: number;
  total: number;
  status: 'processing' | 'completed' | 'failed';
  stage: 'loading' | 'chunking' | 'embedding' | 'storing';
  message?: string;
};

export type Blacklist = {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};
