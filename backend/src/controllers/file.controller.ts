import { randomUUID } from 'crypto';
import { Context } from 'hono';
import { uploadFile as uf } from '../db/operations/file.operation';
import { getUser } from '../db/operations/user.operation';
import { MAX_FILE_SIZE, uploadProgress } from '../lib/constants';
import {
  BAD_REQUEST,
  CREATED,
  INTERNAL_SERVER_ERROR
} from '../lib/http-status-codes';
import uploadFileWithProgress from '../lib/upload-file-with-progress';
import { createUploadFilePath } from '../lib/utils';
import { UploadFileRoute } from '../routes/file/file.route';
import { AppRouteHandler, FileExtension, Role } from '../types';

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
    const original_path = body['original_path'] as string;
    const size = body['size'] as string;
    const batch_id = body['batch_id'] as string;
    const access_level = body['access_level'] as Role;

    const upload_path = createUploadFilePath(filename, extension, user?.id!);

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

    uploadProgress.set(uploadId, {
      loaded: 0,
      total: file.size,
      status: 'uploading'
    });

    const newFile = await uf(
      {
        id: uploadId,
        filename,
        extension,
        original_path,
        upload_path,
        size,
        batch_id,
        access_level
      },
      user?.id!
    );

    if (!newFile) {
      return c.json(
        { message: 'File could not be uploaded', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    uploadFileWithProgress(file, upload_path, uploadId);

    return c.json({
      message: 'File upload started successfully',
      code: CREATED,
      file: {
        ...newFile,
        progress_url: `/files/progress/${uploadId}`
      }
    });
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};
