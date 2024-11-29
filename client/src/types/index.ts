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

export interface UserMessage {
  id: number;
  role: string;
  content: string;
}
