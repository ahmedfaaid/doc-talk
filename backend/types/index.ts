export type Directory = {
  id: number;
  name: string;
  directory_path: string;
  vector_path: string;
  indexed: boolean;
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
