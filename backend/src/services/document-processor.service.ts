import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Faaid:
// I have this entire process broken up into different functions in 'lib/utils.ts' and 'lib/chunk-and-store.ts'

export class DocumentProcessorService {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }

  async processDocument(file: Buffer, mimeType: string) {
    let loader;

    switch (mimeType) {
      case 'application/pdf':
        loader = new PDFLoader(new Blob([file]));
        break;
      default:
        loader = new UnstructuredLoader(new Blob([file]));
    }

    const docs = await loader.load();
    const chunks = await this.textSplitter.splitDocuments(docs);

    return chunks.map(chunk => ({
      content: chunk.pageContent,
      metadata: {
        ...chunk.metadata,
        source: 'legal_document'
      }
    }));
  }
}
