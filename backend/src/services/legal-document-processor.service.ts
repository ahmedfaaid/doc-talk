import { FileExtension } from '../types/index.js';
import { readFile } from 'fs/promises';
import { ChromaClientService } from './chroma-client.service.js';
import { GraphDatabaseService } from './graph-database.service.js';
import { docLoader } from '../lib/utils.js';
import { textSplitter } from '../lib/constants.js';
import { updateVectorProgress } from '../db/operations/file.operation.js';
import { updateChunkAndStoreProgress } from '../lib/utils.js';
import { embeddings } from '../lib/AI.js';
import { EntityExtractor } from './entity-extractor.service.js';

export class LegalDocumentProcessorService {
  private chromaService: ChromaClientService;
  private graphService: GraphDatabaseService;
  private entityExtractor: EntityExtractor;

  constructor() {
    this.chromaService = new ChromaClientService();
    this.graphService = new GraphDatabaseService();
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * Process a legal document and store it in both ChromaDB and Neo4j
   */
  async processLegalDocument(
    filePath: string,
    filename: string,
    extension: FileExtension,
    uploadId: string,
    ownerId: string,
    jurisdiction: string,
    documentType: string
  ) {
    try {
      // Update progress
      updateChunkAndStoreProgress(
        uploadId,
        0,
        100,
        'loading',
        'processing',
        'Loading legal document...'
      );

      // Read file
      const fileBuffer = await readFile(filePath);
      
      // Load document
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

      // Split document into chunks
      updateChunkAndStoreProgress(
        uploadId,
        25,
        100,
        'chunking',
        'processing',
        'Splitting document into chunks...'
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
          ownerId,
          filename,
          uploadId,
          jurisdiction,
          documentType,
          chunk_index: index,
          total_chunks: splitText.length,
          processed_at: new Date().toISOString()
        }
      }));

      // Create document node in Neo4j
      updateChunkAndStoreProgress(
        uploadId,
        45,
        100,
        'embedding',
        'processing',
        'Creating document graph structure...'
      );
      
      await this.graphService.createDocumentNode({
        id: uploadId,
        filename,
        extension,
        ownerId,
        jurisdiction,
        documentType
      });

      // Process chunks in batches
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < enrichedChunks.length; i += batchSize) {
        batches.push(enrichedChunks.slice(i, i + batchSize));
      }

      // Store in ChromaDB
      updateChunkAndStoreProgress(
        uploadId,
        50,
        100,
        'embedding',
        'processing',
        'Storing document in vector database...'
      );
      
      const { collectionName } = await this.chromaService.processDocument(
        fileBuffer,
        this.getMimeType(extension),
        {
          uploadId,
          ownerId,
          filename,
          jurisdiction,
          documentType
        }
      );

      // Process each batch for Neo4j and entity extraction
      let processedChunks = 0;
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const progressPercent = 60 + Math.floor((i / batches.length) * 30);
        
        updateChunkAndStoreProgress(
          uploadId,
          progressPercent,
          100,
          'embedding',
          'processing',
          `Processing batch ${i + 1}/${batches.length} (${processedChunks}/${enrichedChunks.length} chunks processed)`
        );

        // Process each chunk in the batch
        for (const chunk of batch) {
          // Create chunk node in Neo4j
          const chunkId = `${uploadId}_${chunk.metadata.chunk_index}`;
          await this.graphService.createChunkNode({
            id: chunkId,
            documentId: uploadId,
            content: chunk.pageContent,
            index: chunk.metadata.chunk_index,
            metadata: chunk.metadata
          });

          // Extract entities from chunk
          const entities = await this.entityExtractor.extractEntities(chunk.pageContent);
          
          // Store entities in Neo4j
          if (entities.length > 0) {
            await this.graphService.createEntityNodes({
              chunkId,
              entities
            });
          }

          // Extract relationships between entities
          const relationships = await this.entityExtractor.extractRelationships(entities);
          
          // Store relationships in Neo4j
          if (relationships.length > 0) {
            await this.graphService.createEntityRelationships(relationships);
          }
        }

        processedChunks += batch.length;
      }

      // Update database with completion status
      updateChunkAndStoreProgress(
        uploadId,
        95,
        100,
        'storing',
        'processing',
        'Finalizing document processing...'
      );
      
      await updateVectorProgress(uploadId, 'completed', collectionName);
      
      // Final progress update
      updateChunkAndStoreProgress(
        uploadId,
        100,
        100,
        'storing',
        'completed',
        `Successfully processed ${enrichedChunks.length} chunks from ${filename}`
      );

      return {
        collectionName,
        chunkCount: enrichedChunks.length
      };
    } catch (error) {
      // Handle errors
      updateChunkAndStoreProgress(
        uploadId,
        0,
        100,
        'loading',
        'failed',
        `Error processing legal document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      await updateVectorProgress(uploadId, 'failed');
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(extension: FileExtension): string {
    const mimeTypeMap: Record<FileExtension, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      csv: 'text/csv',
      html: 'text/html',
      xml: 'text/xml'
    };

    return mimeTypeMap[extension] || 'application/octet-stream';
  }
}