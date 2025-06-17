import createMessageObjectSchema from './create-message-object';
import * as HttpStatusPhrases from './http-status-phrases';

export const notFoundSchema = createMessageObjectSchema(
  HttpStatusPhrases.NOT_FOUND
);
