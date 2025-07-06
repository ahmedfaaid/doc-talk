import { randomUUID } from 'crypto';
import { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getFileById, uploadFile as uf } from '../db/operations/file.operation';
import { getUser } from '../db/operations/user.operation';
import {
  fileExtensions,
  MAX_FILE_SIZE,
  uploadProgress as uploadProgressMap
} from '../lib/constants';
import {
  BAD_REQUEST,
  CREATED,
  INTERNAL_SERVER_ERROR
} from '../lib/http-status-codes';
import uploadFileWithProgress from '../lib/upload-file-with-progress';
import { createUploadFilePath } from '../lib/utils';
import {
  UploadFileRoute,
  UploadProgressRoute
} from '../routes/file/file.route';
import { AppRouteHandler, FileExtension, UserRole } from '../types';

export const uploadFile: AppRouteHandler<UploadFileRoute> = async (
  c: Context
) => {
  try {
    const body = await c.req.parseBody();
    const payload = c.get('user');

    const user = await getUser(payload.id, undefined);

    const file = body['file'] as File;
    const filename = body['filename'] as string;
    const extension = body['extension'] as FileExtension;
    const originalPath = body['originalPath'] as string;
    const size = body['size'] as string;
    const batchId = body['batchId'] as string;
    const accessLevel = body['accessLevel'] as UserRole;

    const uploadPath = createUploadFilePath(
      filename,
      extension,
      user?.parentId! || user?.id!
    );

    if (!file || !(file instanceof File)) {
      return c.json(
        {
          message: 'No valid file provided in multipart data',
          code: BAD_REQUEST
        },
        BAD_REQUEST
      );
    }

    if (file.size === 0) {
      return c.json(
        { message: 'File is empty', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        { message: 'File size exceeds maximum limit (100MB)' },
        BAD_REQUEST
      );
    }

    const uploadId = randomUUID();

    uploadProgressMap.set(uploadId, {
      loaded: 0,
      total: file.size,
      status: 'uploading'
    });

    const newFile = await uf(
      {
        id: uploadId,
        filename,
        extension,
        originalPath,
        uploadPath,
        size,
        batchId,
        accessLevel
      },
      user?.id!
    );

    if (!newFile) {
      return c.json(
        { message: 'File could not be uploaded', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    await uploadFileWithProgress(
      file,
      uploadPath,
      uploadId,
      newFile.ownerId,
      filename,
      extension
    );

    const supportsVectorProcessing = fileExtensions.includes(
      extension.toLowerCase() as any
    );

    return c.json({
      message: 'File upload started successfully',
      code: CREATED,
      file: {
        ...newFile,
        progressUrl: `/files/progress/${uploadId}`,
        ...(supportsVectorProcessing && {
          vectorProgressUrl: `/files/vector-progress/${uploadId}`,
          supportsVectorProcessing: true
        })
      }
    });
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const uploadProgress: AppRouteHandler<UploadProgressRoute> = async (
  c: Context
) => {
  try {
    const uploadId = c.req.param('id');
    const payload = c.get('user');

    if (!uploadId) {
      return c.json(
        { message: 'Upload ID is required', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    return streamSSE(c, async stream => {
      const sendProgress = async () => {
        const progress = uploadProgressMap.get(uploadId);
        if (!progress) {
          try {
            const file = await getFileById(uploadId, payload.id);

            if (!file) {
              await stream.writeSSE({
                data: JSON.stringify({ error: 'Upload not found' }),
                event: 'error'
              });
              await stream.close();
              return;
            }

            // Check if upload is completed or failed
            if (file.uploadStatus === 'completed') {
              await stream.writeSSE({
                data: JSON.stringify({
                  uploadId,
                  loaded: file.size || 0,
                  total: file.size || 0,
                  percentage: 100,
                  status: 'completed',
                  filename: file.filename
                }),
                event: 'progress'
              });
              await stream.close();
              return;
            }

            if (file.uploadStatus === 'failed') {
              await stream.writeSSE({
                data: JSON.stringify({
                  uploadId,
                  loaded: 0,
                  total: file.size || 0,
                  percentage: 0,
                  status: 'failed',
                  filename: file.filename
                }),
                event: 'progress'
              });
              await stream.close();
              return;
            }

            // If status is still 'pending' or 'uploading', but not in memory
            // This might indicate the server restarted during upload
            await stream.writeSSE({
              data: JSON.stringify({
                error: 'Upload session lost. Please restart upload.',
                uploadId,
                status: file.uploadStatus
              }),
              event: 'error'
            });
            await stream.close();
            return;
          } catch (error) {
            await stream.writeSSE({
              data: JSON.stringify({ error: 'Database error occurred' }),
              event: 'error'
            });
            await stream.close();
            return;
          }
        }

        const progressData = {
          uploadId,
          loaded: progress.loaded,
          total: progress.total,
          percentage: Math.round((progress.loaded / progress.total) * 100),
          status: progress.status
        };

        await stream.writeSSE({
          data: JSON.stringify(progressData),
          event: 'progress'
        });

        // Clean up when complete or failed
        if (progress.status === 'completed' || progress.status === 'failed') {
          uploadProgressMap.delete(uploadId);
          stream.close();
        }
      };

      // Send initial progress
      await sendProgress();

      // Send progress updates every 500ms
      const interval = setInterval(async () => {
        await sendProgress();
      }, 500);

      // Cleanup on connection close
      stream.onAbort(() => {
        clearInterval(interval);
      });
    });
  } catch (error) {
    return c.json(
      {
        message: (error as Error).message,
        code: INTERNAL_SERVER_ERROR
      },
      INTERNAL_SERVER_ERROR
    );
  }
};
