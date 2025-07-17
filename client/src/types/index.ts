export interface Directory {
  id: number;
  name: string;
  vector_path: string;
  indexed: boolean;
}

export interface ApiResponse {
  message: string;
  code: number;
  directory: Directory | null;
}

export interface ChatResponse {
  id: number;
  event: string;
  data: string;
}

export interface Message {
  id: number;
  role: string;
  content: string;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
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
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isCompany: boolean;
  company: string;
  role: UserRole;
  parentId: 'string';
}

export interface AuthResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
  };
  message?: string;
  code?: number;
  success?: boolean;
}

export interface AuthState {
  login: (data: { email: string; password: string }) => Promise<AuthResponse>;
  loading: boolean;
  user: {
    id: string;
    email: string;
  } | null;
  token: string | null;
}

export interface CookiesValues {
  'doc-talk-qid': {
    token: string;
    userId: string;
    email: string;
  };
}
