import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { updateVectorProgress } from '../db/operations/file.operation';
import { FileExtension } from '../types';
import { embeddings } from './AI';
import { textSplitter } from './constants';
import {
  createVectorStorePath,
  docLoader,
  updateChunkAndStoreProgress
} from './utils';

export async function chunkAndStore(
  filePath: string,
  filename: string,
  extension: FileExtension,
  uploadId: string,
  ownerId: string
) {
  try {
    updateChunkAndStoreProgress(
      uploadId,
      0,
      100,
      'loading',
      'processing',
      'Loading file...'
    );
    // Load documents
    const loader = docLoader(filePath, extension);
    let doc;
    try {
      doc = await loader.load();
    } catch (loadErr) {
      updateChunkAndStoreProgress(
        uploadId,
        0,
        100,
        'loading',
        'failed',
        `Failed to load file: ${loadErr instanceof Error ? loadErr.message : 'Unknown error'}`
      );
      await updateVectorProgress(uploadId, 'failed');
      throw loadErr;
    }
    updateChunkAndStoreProgress(
      uploadId,
      20,
      100,
      'loading',
      'processing',
      `Loaded ${filename}`
    );
    // Split documents into chunks
    let splitText;
    try {
      updateChunkAndStoreProgress(
        uploadId,
        25,
        100,
        'chunking',
        'processing',
        'Splitting file into chunks...'
      );
      splitText = await textSplitter.splitDocuments(doc);
    } catch (splitErr) {
      updateChunkAndStoreProgress(
        uploadId,
        25,
        100,
        'chunking',
        'failed',
        `Failed to split file: ${splitErr instanceof Error ? splitErr.message : 'Unknown error'}`
      );
      await updateVectorProgress(uploadId, 'failed');
      throw splitErr;
    }
    updateChunkAndStoreProgress(
      uploadId,
      40,
      100,
      'chunking',
      'processing',
      `Split ${filename} into ${splitText.length} chunks`
    );
    // Add metadata to each chunk
    const enrichedChunks = splitText.map((chunk, index) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        ownerId,
        filename,
        uploadId,
        chunk_index: index,
        total_chunks: splitText.length,
        processed_at: new Date().toISOString()
      }
    }));
    // Create vector store
    updateChunkAndStoreProgress(
      uploadId,
      50,
      100,
      'embedding',
      'processing',
      'Creating embeddings'
    );
    const vector_path = createVectorStorePath(ownerId, uploadId);
    // Create embeddings in batches to track progress
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < enrichedChunks.length; i += batchSize) {
      batches.push(enrichedChunks.slice(i, i + batchSize));
    }
    let vectorStore: HNSWLib;
    let processedChunks = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const progressPercent = 50 + Math.floor((i / batches.length) * 40);
      try {
        updateChunkAndStoreProgress(
          uploadId,
          progressPercent,
          100,
          'embedding',
          'processing',
          `Processing batch ${i + 1}/${batches.length} (${processedChunks}/${enrichedChunks.length} chunks processed)`
        );
        if (i === 0) {
          vectorStore = await HNSWLib.fromDocuments(batch, embeddings);
        } else {
          await vectorStore!.addDocuments(batch);
        }
        processedChunks += batch.length;
      } catch (embedErr) {
        updateChunkAndStoreProgress(
          uploadId,
          progressPercent,
          100,
          'embedding',
          'failed',
          `Failed to embed batch ${i + 1}: ${embedErr instanceof Error ? embedErr.message : 'Unknown error'}`
        );
        await updateVectorProgress(uploadId, 'failed');
        throw embedErr;
      }
    }
    // Save vector store
    try {
      updateChunkAndStoreProgress(
        uploadId,
        90,
        100,
        'storing',
        'processing',
        'Saving vector store'
      );
      await vectorStore!.save(vector_path);
    } catch (saveErr) {
      updateChunkAndStoreProgress(
        uploadId,
        90,
        100,
        'storing',
        'failed',
        `Failed to save vector store: ${saveErr instanceof Error ? saveErr.message : 'Unknown error'}`
      );
      await updateVectorProgress(uploadId, 'failed');
      throw saveErr;
    }
    // Update database
    await updateVectorProgress(uploadId, 'completed', vector_path);
    // Final progress update
    updateChunkAndStoreProgress(
      uploadId,
      100,
      100,
      'storing',
      'completed',
      `Successfully processed ${enrichedChunks.length} chunks from ${filename}`
    );
  } catch (error) {
    // Already handled above, but catch any unexpected errors
    updateChunkAndStoreProgress(
      uploadId,
      0,
      100,
      'loading',
      'failed',
      `Unexpected error processing ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    await updateVectorProgress(uploadId, 'failed');
    throw error;
  }
}

export async function getVectorStore(
  user_id: string,
  upload_id: string
): Promise<HNSWLib> {
  const vector_path = createVectorStorePath(user_id, upload_id);
  return await HNSWLib.load(vector_path, embeddings);
}
