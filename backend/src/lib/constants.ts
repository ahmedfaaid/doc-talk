import createMessageObjectSchema from './create-message-object';
import * as HttpStatusPhrases from './http-status-phrases';

export const notFoundSchema = createMessageObjectSchema(
  HttpStatusPhrases.NOT_FOUND
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
