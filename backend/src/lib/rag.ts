import { getVectorStore } from './chunk-and-store.js';
import { embeddings } from './AI.js';

import { EntityExtractor } from '../services/entity-extractor.service.js';
import { GraphDatabaseService } from '../services/graph-database.service.js';

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
  return results.map((r: { pageContent: string; metadata?: Record<string, any> }) => ({
    content: r.pageContent,
    metadata: r.metadata || {},
  }));
}


/**
 * Hybrid retrieval: combines vector search and graph search for richer context
 */
export async function retrieveHybridContext({
  userId,
  uploadId,
  query,
  topK = 5,
  graphLimit = 10
}: {
  userId: string;
  uploadId: string;
  query: string;
  topK?: number;
  graphLimit?: number;
}) {
  // 1. Vector search
  const vectorStore = await getVectorStore(userId, uploadId);
  const vectorResults: Array<{ pageContent: string; metadata?: Record<string, any> }> = await vectorStore.similaritySearch(query, topK);

  // 2. Extract entities from top vector results
  const entityExtractor = new EntityExtractor();
  const allEntities: { text: string; type: string }[] = [];
  for (const chunk of vectorResults) {
    // Try to use pre-extracted entities from metadata if available
    if (chunk.metadata && Array.isArray(chunk.metadata.entities) && chunk.metadata.entities.length > 0) {
      allEntities.push(...(chunk.metadata.entities as { text: string; type: string }[]));
    } else {
      // Otherwise, extract entities from the chunk content
      const entities = await entityExtractor.extractEntities(chunk.pageContent);
      allEntities.push(...entities);
    }
  }
  // Deduplicate entities
  const uniqueEntities = Array.from(
    new Map(allEntities.map(e => [e.text + '|' + e.type, e])).values()
  );

  // 3. Graph search for related entities/chunks
  const graphDb = new GraphDatabaseService();
  let graphResults: any[] = [];
  for (const entity of uniqueEntities.slice(0, graphLimit)) {
    const related: any[] = await graphDb.queryRelatedEntities({
      entityText: entity.text,
      entityType: entity.type,
      limit: graphLimit
    });
    graphResults.push(...related);
  }

  // 4. Merge and deduplicate results (by chunk id if available, else by content hash)
  const seenChunkIds = new Set<string>();
  const hybridChunks: any[] = [];

  // Add vector results first (with source: 'vector')
  for (const r of vectorResults) {
    const chunkId = r.metadata?.id || r.metadata?.chunk_id || r.metadata?.chunk_index || r.pageContent;
    if (!seenChunkIds.has(chunkId)) {
      hybridChunks.push({
        content: r.pageContent,
        metadata: r.metadata || {},
        source: 'vector'
      });
      seenChunkIds.add(chunkId);
    }
  }

  // Add graph results (with source: 'graph')
  for (const g of graphResults) {
    const chunkId = g.chunk?.id || g.chunk?.chunk_index || g.chunk?.content;
    if (chunkId && !seenChunkIds.has(chunkId)) {
      hybridChunks.push({
        content: g.chunk?.content,
        metadata: g.chunk || {},
        entity: g.entity || {},
        document: g.document || {},
        source: 'graph'
      });
      seenChunkIds.add(chunkId);
    }
  }

  // Optionally, sort or rank hybridChunks (e.g., prioritize those appearing in both)

  return {
    context: hybridChunks,
    entities: uniqueEntities,
    vectorResults,
    graphResults
  };
}
