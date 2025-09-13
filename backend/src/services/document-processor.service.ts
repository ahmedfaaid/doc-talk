import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

export class DocumentProcessorService {
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor() {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
    }

    async processDocument(file: Buffer, mimeType: string) {
        // For now, create a simple document from the buffer
        // In a real implementation, you'd use proper document loaders
        const text = file.toString('utf-8');

        const doc = new Document({
            pageContent: text,
            metadata: {
                mimeType,
                source: 'legal_document',
                processedAt: new Date().toISOString()
            }
        });

        const chunks = await this.textSplitter.splitDocuments([doc]);

        return chunks.map((chunk: Document) => ({
            content: chunk.pageContent,
            metadata: {
                ...chunk.metadata,
                source: 'legal_document',
            }
        }));
    }

    async processText(text: string, metadata: Record<string, any> = {}) {
        const doc = new Document({
            pageContent: text,
            metadata: {
                ...metadata,
                source: 'legal_document',
                processedAt: new Date().toISOString()
            }
        });

        const chunks = await this.textSplitter.splitDocuments([doc]);

        return chunks.map((chunk: Document) => ({
            content: chunk.pageContent,
            metadata: chunk.metadata
        }));
    }
}