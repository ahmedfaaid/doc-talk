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

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const uploadProgress = new Map<
  string,
  { loaded: number; total: number; status: string }
>();
