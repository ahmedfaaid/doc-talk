import { FileExtension } from '../types';
import { LegalDocumentProcessorService } from '../services/legal-document-processor.service';

/**
 * Process a legal document by storing it in both ChromaDB and Neo4j
 * This function is called from file.operation.ts when a legal document is accessed
 */
export async function processLegalDocument(
  filePath: string,
  filename: string,
  extension: FileExtension,
  uploadId: string,
  ownerId: string,
  jurisdiction: string,
  documentType: string
) {
  try {
    const legalDocProcessor = new LegalDocumentProcessorService();
    
    return await legalDocProcessor.processLegalDocument(
      filePath,
      filename,
      extension,
      uploadId,
      ownerId,
      jurisdiction,
      documentType
    );
  } catch (error) {
    console.error('Error processing legal document:', error);
    throw error;
  }
}