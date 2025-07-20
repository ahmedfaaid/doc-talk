import { getVectorStore } from './chunk-and-store';
import { embeddings } from './AI';

export async function retrieveRelevantChunks({
  userId,
  uploadId,
  query,
  topK = 5
}: {
  userId: string;
  uploadId: string;
  query: string;
  topK?: number;
}) {
  const vectorStore = await getVectorStore(userId, uploadId);
  // Perform similarity search
  const results = await vectorStore.similaritySearch(query, topK);
  // Expose chunk metadata for each result
  return results.map(r => ({
    content: r.pageContent,
    metadata: r.metadata || {},
  }));
}
