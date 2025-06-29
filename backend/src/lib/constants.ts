import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChunkAndStoreProgress, FileUploadProgress } from '../types';
import createMessageObjectSchema from './create-message-object';
import * as HttpStatusPhrases from './http-status-phrases';

export const notFoundSchema = createMessageObjectSchema(
  HttpStatusPhrases.NOT_FOUND
);

export const serverErrorSchema = createMessageObjectSchema(
  HttpStatusPhrases.INTERNAL_SERVER_ERROR
);

export const ZOD_ERROR_MESSAGES = {
  REQUIRED: 'Required',
  EXPECTED_NUMBER: 'Expected number, received nan',
  NO_UPDATES: 'No updates provided',
  INVALID_UPDATES: 'Invalid updates',
  INVALID_JSON: 'Invalid JSON'
};

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: 'invalid_updates'
};

export const fileExtensions: [string, ...string[]] = [
  'txt',
  'md',
  'pdf',
  'doc',
  'docx',
  'json',
  'csv',
  'html',
  'xml'
];

export const UPLOAD_DIR = 'uploads';

export const VECTOR_DIR = 'vectorstore';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const uploadProgress = new Map<string, FileUploadProgress>();

export const chunkAndStoreProgress = new Map<string, ChunkAndStoreProgress>();

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
