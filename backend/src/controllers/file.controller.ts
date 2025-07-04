import { randomUUID } from 'crypto';
import { Context } from 'hono';
import { uploadFile as uf } from '../db/operations/file.operation';
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
import { UploadFileRoute } from '../routes/file/file.route';
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
