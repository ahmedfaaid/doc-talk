import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { updateUploadProgress } from '../db/operations/file.operation';
import { FileExtension } from '../types';
import { chunkAndStore } from './chunk-and-store';
import { fileExtensions, uploadProgress } from './constants';

async function uploadFileWithProgress(
  file: File,
  uploadPath: string,
  uploadId: string,
  ownerId?: string,
  filename?: string,
  extension?: FileExtension,
  isLegal?: boolean
) {
  try {
    // Stream file data directly to disk
    const stream = createWriteStream(uploadPath);
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const chunkSize = 64 * 1024; // 64KB
    let written = 0;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      stream.write(chunk);
      written += chunk.length;
      const progress = uploadProgress.get(uploadId);
      if (progress) {
        progress.loaded = written;
        uploadProgress.set(uploadId, progress);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    stream.end();
    await finished(stream);

    await updateUploadProgress(uploadId, 'completed');
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      progress.loaded = progress.total;
      progress.status = 'completed';
      uploadProgress.set(uploadId, progress);
    }

    // Return early if we don't need to process this file
    if (
      !extension ||
      !ownerId ||
      !filename ||
      !fileExtensions.includes(extension.toLowerCase() as any)
    ) {
      return;
    }
    // Don't process here - let the controller handle it so we can pass all parameters
    // This will be handled in the controller after upload completes
  } catch (error) {
    await updateUploadProgress(uploadId, 'failed');
    const progress = uploadProgress.get(uploadId);
    if (progress) {
      progress.status = 'failed';
      uploadProgress.set(uploadId, progress);
    }
  }
}

export default uploadFileWithProgress;
