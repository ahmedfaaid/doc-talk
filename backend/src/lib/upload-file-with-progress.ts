import { writeFile } from 'node:fs/promises';
import { updateUploadProgress } from '../db/operations/file.operation';
import { uploadProgress } from './constants';

async function uploadFileWithProgress(
  file: File,
  upload_path: string,
  upload_id: string
) {
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const chunkSize = 64 * 1024; // 64KB

    const chunks: Uint8Array[] = [];

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      chunks.push(chunk);

      const progress = uploadProgress.get(upload_id);
      if (progress) {
        progress.loaded = Math.min(i + chunkSize, uint8Array.length);
        uploadProgress.set(upload_id, progress);
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

    await writeFile(upload_path, combinedArray);

    await updateUploadProgress(upload_id, 'completed');

    const progress = uploadProgress.get(upload_id);
    if (progress) {
      progress.loaded = progress.total;
      progress.status = 'completed';
      uploadProgress.set(upload_id, progress);
    }
  } catch (error) {
    await updateUploadProgress(upload_id, 'failed');

    const progress = uploadProgress.get(upload_id);
    if (progress) {
      progress.status = 'failed';
      uploadProgress.set(upload_id, progress);
    }
  }
}

export default uploadFileWithProgress;
