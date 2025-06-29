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
  userId: string
) {
  try {
    // Initialize progress
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
    const doc = await loader.load();
    updateChunkAndStoreProgress(
      uploadId,
      20,
      100,
      'loading',
      'processing',
      `Loaded ${filename}`
    );

    // Split documents into chunks
    updateChunkAndStoreProgress(
      uploadId,
      25,
      100,
      'chunking',
      'processing',
      'Splitting file into chunks...'
    );
    const splitText = await textSplitter.splitDocuments(doc);
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
        userId,
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
    const vector_path = createVectorStorePath(userId, uploadId);

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
      updateChunkAndStoreProgress(
        uploadId,
        progressPercent,
        100,
        'embedding',
        'processing',
        `Processing batch ${i + 1}/${batches.length} (${processedChunks}/${
          enrichedChunks.length
        } chunks processed)`
      );

      if (i === 0) {
        // Create a new vector store with first batch
        vectorStore = await HNSWLib.fromDocuments(batch, embeddings);
      } else {
        // Add to existing vector store
        await vectorStore!.addDocuments(batch);
      }

      processedChunks += batch.length;
    }

    // Save vector store
    updateChunkAndStoreProgress(
      uploadId,
      90,
      100,
      'storing',
      'processing',
      'Saving vector store'
    );
    await vectorStore!.save(vector_path);

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
    await updateVectorProgress(uploadId, 'failed');

    updateChunkAndStoreProgress(
      uploadId,
      0,
      100,
      'loading',
      'failed',
      `Error processing ${filename}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
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
