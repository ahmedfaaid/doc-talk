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
