import { ChromaClientService } from './chroma-client.service.js';
import { GraphDatabaseService } from './graph-database.service.js';
import { embeddings } from '../lib/AI.js';
import { EntityExtractor } from './entity-extractor.service.js';

type RetrievalResult = {
  content: string;
  metadata: Record<string, any>;
  score?: number;
  source?: string;
};

export class EnhancedRagService {
  private chromaService: ChromaClientService;
  private graphService: GraphDatabaseService;
  private entityExtractor: EntityExtractor;

  constructor() {
    this.chromaService = new ChromaClientService();
    this.graphService = new GraphDatabaseService();
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * Retrieve relevant documents using hybrid search (vector + graph)
   */
  async retrieveRelevantDocuments({
    userId,
    uploadId,
    query,
    topK = 5,
    useHybridSearch = true
  }: {
    userId: string;
    uploadId: string;
    query: string;
    topK?: number;
    useHybridSearch?: boolean;
  }): Promise<RetrievalResult[]> {
    try {
      // Extract entities from the query
      const queryEntities = await this.entityExtractor.extractEntities(query);
      
      // Get vector search results
      const collectionName = `legal_docs_${userId}`;
      const vectorResults = await this.chromaService.queryDocuments({
        collectionName,
        query,
        filter: { uploadId },
        topK: topK * 2 // Get more results than needed for reranking
      });

      if (!useHybridSearch || queryEntities.length === 0) {
        // If hybrid search is disabled or no entities found, return vector results only
        return vectorResults.slice(0, topK)
          .filter(result => result.content !== null)
          .map(result => ({
            content: result.content!,
            metadata: result.metadata || {},
            score: result.score,
            source: 'vector'
          }));
      }

      // Get graph search results for each entity in the query
      let graphResults: RetrievalResult[] = [];
      
      for (const entity of queryEntities) {
        const entityResults = await this.graphService.queryRelatedEntities({
          entityText: entity.text,
          entityType: entity.type,
          documentId: uploadId,
          limit: topK
        });
        
        // Convert graph results to the common format
        const formattedResults = entityResults
          .filter(result => result.chunk) // Ensure chunk exists
          .map(result => ({
            content: result.chunk.content,
            metadata: {
              ...JSON.parse(result.chunk.metadata || '{}'),
              entity: entity.text,
              entityType: entity.type,
              relatedEntity: result.relatedEntity?.text,
              relatedEntityType: result.relatedEntity?.type,
              relationshipType: result.relationship?.type
            },
            source: 'graph'
          }));
        
        graphResults = [...graphResults, ...formattedResults];
      }

      // Combine and deduplicate results
      const validVectorResults = vectorResults.filter(result => result.content !== null).map(result => ({
        content: result.content!,
        metadata: result.metadata || {},
        score: result.score,
        source: 'vector'
      }));
      
      const combinedResults = [...validVectorResults, ...graphResults];
      const deduplicated = this.deduplicateResults(combinedResults);
      
      // Rerank results
      const reranked = await this.rerank(deduplicated, query, topK);
      
      return reranked;
    } catch (error) {
      console.error('Error retrieving relevant documents:', error);
      throw error;
    }
  }

  /**
   * Deduplicate results based on content
   */
  private deduplicateResults(results: RetrievalResult[]): RetrievalResult[] {
    const seen = new Set<string>();
    const deduplicated: RetrievalResult[] = [];
    
    for (const result of results) {
      // Create a unique key for each chunk
      const key = `${result.metadata.uploadId}_${result.metadata.chunk_index}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      } else {
        // If duplicate found from different sources, merge metadata
        const existingIndex = deduplicated.findIndex(
          r => `${r.metadata.uploadId}_${r.metadata.chunk_index}` === key
        );
        
        if (existingIndex !== -1) {
          const existing = deduplicated[existingIndex];
          deduplicated[existingIndex] = {
            ...existing,
            metadata: { ...existing.metadata, ...result.metadata },
            source: `${existing.source},${result.source}`
          };
        }
      }
    }
    
    return deduplicated;
  }

  /**
   * Rerank results based on relevance to query
   */
  private async rerank(
    results: RetrievalResult[],
    query: string,
    topK: number
  ): Promise<RetrievalResult[]> {
    try {
      // Get query embedding
      const queryEmbedding = await embeddings.embedQuery(query);
      
      // Get embeddings for all results
      const contentEmbeddings = await Promise.all(
        results.map(result => embeddings.embedQuery(result.content))
      );
      
      // Calculate cosine similarity scores
      const scoredResults = results.map((result, i) => ({
        ...result,
        score: this.cosineSimilarity(queryEmbedding, contentEmbeddings[i])
      }));
      
      // Sort by score (descending)
      const sorted = scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Apply boost for graph results (they contain relationships)
      const boosted = sorted.map(result => {
        if (result.source === 'graph' || result.source?.includes('graph')) {
          return { ...result, score: (result.score || 0) * 1.2 };
        }
        return result;
      });
      
      // Re-sort after boosting
      const finalSorted = boosted.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Return top K results
      return finalSorted.slice(0, topK);
    } catch (error) {
      console.error('Error reranking results:', error);
      // Fall back to original results if reranking fails
      return results.slice(0, topK);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}