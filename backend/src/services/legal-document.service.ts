import { ChromaClientService } from './chroma-client.service.js';
import { GraphDatabaseService } from './graph-database.service.js';
import { EntityExtractor } from './entity-extractor.service.js';
import { FileExtension } from '../types/index.js';
import { readFile } from 'fs/promises';
import { updateChunkAndStoreProgress } from '../lib/utils.js';
import { updateVectorProgress } from '../db/operations/file.operation.js';

export class LegalDocumentService {
  private chromaClient: ChromaClientService;
  private graphDb: GraphDatabaseService;
  private entityExtractor: EntityExtractor;

  constructor() {
    this.chromaClient = new ChromaClientService();
    this.graphDb = new GraphDatabaseService();
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * Process a legal document by storing it in both ChromaDB and Neo4j
   */
  async processLegalDocument(
    filePath: string,
    filename: string,
    extension: FileExtension,
    fileId: string,
    ownerId: string,
    jurisdiction: string,
    documentType: string
  ): Promise<void> {
    try {
      console.log(`Processing legal document: ${filename}`);
      
      // Update status to processing
      await updateVectorProgress(fileId, 'processing');
      updateChunkAndStoreProgress(fileId, 0, 100, 'loading', 'processing');
      
      // 1. Process document with ChromaDB
      const collection = await this.chromaClient.getOrCreateCollection('legal-documents');
      
      // 2. Process the document and get chunks
      updateChunkAndStoreProgress(fileId, 20, 100, 'chunking', 'processing');
      // Read the file and process it
      const fileBuffer = await readFile(filePath);
      const result = await this.chromaClient.processDocument(
        fileBuffer,
        this.getMimeType(extension),
        {
          fileId,
          ownerId,
          filename,
          jurisdiction,
          documentType
        }
      );
      
      const chunkCount = result.chunkCount;
      
      // 3. Create document node in Neo4j
      updateChunkAndStoreProgress(fileId, 40, 100, 'embedding', 'processing');
      await this.graphDb.createDocumentNode({
        id: fileId,
        filename: filename,
        extension: extension,
        ownerId,
        jurisdiction,
        documentType
      });
      
      // 4. Process chunks (simulate chunk processing since we don't have actual chunks)
      updateChunkAndStoreProgress(fileId, 60, 100, 'storing', 'processing');
      
      // For now, create a single chunk representing the document
      const chunkId = `${fileId}-chunk-0`;
      
      // Read file content for entity extraction
      const fileContent = fileBuffer.toString('utf-8');
      
      // 5. Create chunk node and connect to document
      await this.graphDb.createChunkNode({
        id: chunkId,
        documentId: fileId,
        content: fileContent.substring(0, 1000), // Limit content size
        index: 0,
        metadata: { filename, jurisdiction, documentType }
      });
      
      // 6. Extract entities from chunk
      const entities = await this.entityExtractor.extractEntities(fileContent);
      
      if (entities && entities.length > 0) {
        // 7. Create entity nodes and connect to chunk
        await this.graphDb.createEntityNodes({
          chunkId,
          entities
        });
        
        // 8. Extract relationships between entities
        const relationships = await this.entityExtractor.extractRelationships(entities);
        
        if (relationships && relationships.length > 0) {
          // 9. Create relationships between entities
          await this.graphDb.createEntityRelationships(relationships);
        }
      }
      
      updateChunkAndStoreProgress(fileId, 90, 100, 'storing', 'processing');
      
      // 10. Mark processing as complete
      updateChunkAndStoreProgress(fileId, 100, 100, 'storing', 'completed');
      await updateVectorProgress(fileId, 'completed', filePath);
      
      console.log(`Legal document processing completed: ${filename}`);
    } catch (error) {
      console.error('Error processing legal document:', error);
      updateChunkAndStoreProgress(fileId, 0, 100, 'loading', 'failed', (error as Error).message);
      await updateVectorProgress(fileId, 'failed');
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

export const legalDocumentService = new LegalDocumentService();