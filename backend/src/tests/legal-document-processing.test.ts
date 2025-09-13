import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processLegalDocument } from '../lib/process-legal-document';
import { LegalDocumentProcessorService } from '../services/legal-document-processor.service';
import { ChromaClientService } from '../services/chroma-client.service';
import { GraphDatabaseService } from '../services/graph-database.service';
import { EntityExtractor } from '../services/entity-extractor.service';
import { updateVectorProgress } from '../db/operations/file.operation';
import { updateChunkAndStoreProgress } from '../lib/utils';
import { readFile } from 'fs/promises';

// Mock dependencies
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('Test legal document content'))
}));

vi.mock('../db/operations/file.operation', () => ({
  updateVectorProgress: vi.fn().mockResolvedValue({})
}));

vi.mock('../lib/utils', () => ({
  updateChunkAndStoreProgress: vi.fn(),
  docLoader: vi.fn().mockReturnValue({
    load: vi.fn().mockResolvedValue([{
      pageContent: 'Test legal document content',
      metadata: {}
    }])
  })
}));

// Mock services
vi.mock('../services/chroma-client.service');
vi.mock('../services/graph-database.service');
vi.mock('../services/entity-extractor.service');

describe('Legal Document Processing', () => {
  let legalDocProcessor: LegalDocumentProcessorService;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock implementations
    (ChromaClientService as any).mockImplementation(() => ({
      processDocument: vi.fn().mockResolvedValue({ collectionName: 'test-collection' })
    }));
    
    (GraphDatabaseService as any).mockImplementation(() => ({
      createDocumentNode: vi.fn().mockResolvedValue({}),
      createChunkNode: vi.fn().mockResolvedValue({}),
      createEntityNodes: vi.fn().mockResolvedValue({}),
      createEntityRelationships: vi.fn().mockResolvedValue({})
    }));
    
    (EntityExtractor as any).mockImplementation(() => ({
      extractEntities: vi.fn().mockResolvedValue([{ text: 'Entity1', type: 'Person' }]),
      extractRelationships: vi.fn().mockResolvedValue([{ source: 'Entity1', target: 'Entity2', type: 'RELATED_TO' }])
    }));
    
    legalDocProcessor = new LegalDocumentProcessorService();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should process a legal document successfully', async () => {
    // Test parameters
    const filePath = '/path/to/document.pdf';
    const filename = 'document.pdf';
    const extension = 'pdf' as const;
    const uploadId = 'test-upload-id';
    const ownerId = 'test-owner-id';
    const jurisdiction = 'US';
    const documentType = 'Contract';
    
    // Mock textSplitter to return chunks
    vi.mock('../lib/constants', () => ({
      textSplitter: {
        splitDocuments: vi.fn().mockResolvedValue([
          { pageContent: 'Chunk 1', metadata: {} },
          { pageContent: 'Chunk 2', metadata: {} }
        ])
      }
    }));
    
    // Call the function
    const result = await processLegalDocument(
      filePath,
      filename,
      extension,
      uploadId,
      ownerId,
      jurisdiction,
      documentType
    );
    
    // Assertions
    expect(readFile).toHaveBeenCalledWith(filePath);
    expect(updateChunkAndStoreProgress).toHaveBeenCalledTimes(expect.any(Number));
    expect(updateVectorProgress).toHaveBeenCalledWith(uploadId, 'completed', expect.any(String));
    
    // Verify the result
    expect(result).toEqual(expect.objectContaining({
      collectionName: 'test-collection',
      chunkCount: expect.any(Number)
    }));
  });
  
  it('should handle errors during processing', async () => {
    // Mock a failure in ChromaClientService
    (ChromaClientService as any).mockImplementation(() => ({
      processDocument: vi.fn().mockRejectedValue(new Error('ChromaDB error'))
    }));
    
    // Test parameters
    const filePath = '/path/to/document.pdf';
    const filename = 'document.pdf';
    const extension = 'pdf' as const;
    const uploadId = 'test-upload-id';
    const ownerId = 'test-owner-id';
    const jurisdiction = 'US';
    const documentType = 'Contract';
    
    // Call the function and expect it to throw
    await expect(processLegalDocument(
      filePath,
      filename,
      extension,
      uploadId,
      ownerId,
      jurisdiction,
      documentType
    )).rejects.toThrow('ChromaDB error');
    
    // Verify error handling
    expect(updateChunkAndStoreProgress).toHaveBeenCalledWith(
      uploadId,
      0,
      100,
      'loading',
      'failed',
      expect.stringContaining('Error')
    );
    expect(updateVectorProgress).toHaveBeenCalledWith(uploadId, 'failed');
  });
});