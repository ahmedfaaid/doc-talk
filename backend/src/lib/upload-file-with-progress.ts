import { writeFile } from 'node:fs/promises';
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
)
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const chunkSize = 64 * 1024; // 64KB

    const chunks: Uint8Array[] = [];

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      chunks.push(chunk);

      const progress = uploadProgress.get(uploadId);
      if (progress) {
        progress.loaded = Math.min(i + chunkSize, uint8Array.length);
        uploadProgress.set(uploadId, progress);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedArray = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      combinedArray.set(chunk, offset);
      offset += chunk.length;
    }

    await writeFile(uploadPath, combinedArray);

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
