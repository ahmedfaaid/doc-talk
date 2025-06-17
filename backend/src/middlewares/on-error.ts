import type { ErrorHandler } from 'hono';
import { StatusCode } from 'hono/utils/http-status';
import env from '../lib/env';
import { INTERNAL_SERVER_ERROR, OK } from '../lib/http-status-codes';

const onError: ErrorHandler = (error, c) => {
  const currentStatus =
    'status' in error ? error.status : c.newResponse(null).status;
  const statusCode =
    currentStatus !== OK
      ? (currentStatus as StatusCode)
      : INTERNAL_SERVER_ERROR;
  return c.json(
    {
      message: error.message,

      stack: env.NODE_ENV === 'production' ? undefined : error.stack
    },
    statusCode
  );
};

export default onError;
