import { ChromaClient } from 'chromadb';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { UnstructuredLoader } from '@langchain/community/document_loaders/fs/unstructured';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { FileExtension } from '../types/index.js';
import { embeddings } from '../lib/AI.js';

import env from '../lib/env.js';

export class ChromaClientService {
  private client: ChromaClient | null = null;
  private textSplitter: RecursiveCharacterTextSplitter;
  private isConnected = false;

  constructor() {
    if (env.USE_CHROMADB) {
      try {
        this.client = new ChromaClient({
          path: env.CHROMA_URL
        });
        this.isConnected = true;
        console.log('✅ ChromaDB client initialized');
      } catch (error) {
        console.warn('⚠️ ChromaDB client failed to initialize:', error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      console.log('ℹ️ ChromaDB is disabled by environment configuration');
    }
    
    // Using larger chunk size and overlap for legal documents
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2500,
      chunkOverlap: 800
    });
  }

  /**
   * Get or create a collection in ChromaDB
   */
  async getOrCreateCollection(collectionName: string) {
    if (!this.isConnected || !this.client) {
      throw new Error('ChromaDB client is not connected');
    }
    try {
      // Check if collection exists
      const collections = await this.client.listCollections();
      const exists = collections.some((c: any) => c.name === collectionName);
      
      const collectionOptions = {
        name: collectionName,
        embeddingFunction: embeddings as any // Cast to any to avoid type issues
      };

      if (exists) {
        return await this.client.getCollection(collectionOptions);
      } else {
        return await this.client.createCollection({
          ...collectionOptions,
          metadata: {
            'description': 'Legal document collection',
            'created_at': new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error getting or creating ChromaDB collection:', error);
      throw error;
    }
  }

  /**
   * Process a document and store it in ChromaDB
   */
  async processDocument(file: Buffer, mimeType: string, metadata: Record<string, any>) {
    if (!this.isConnected || !this.client) {
      console.warn('ChromaDB is not connected, skipping document processing');
      return { collectionName: '', chunkCount: 0 };
    }
    let loader;

    // Select appropriate loader based on file type
    switch (mimeType) {
      case 'application/pdf':
        loader = new PDFLoader(new Blob([file.buffer]));
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        loader = new DocxLoader(new Blob([file.buffer]));
        break;
      case 'application/json':
        loader = new JSONLoader(new Blob([file.buffer]));
        break;
      case 'text/csv':
        loader = new CSVLoader(new Blob([file.buffer]));
        break;
      case 'text/plain':
        loader = new TextLoader(new Blob([file.buffer]));
        break;
      default:
        const tempFilePath = join(tmpdir(), `unstructured_${Date.now()}`);
        await writeFile(tempFilePath, file);
        loader = new UnstructuredLoader(tempFilePath);
    }

    // Load and split the document
    const docs = await loader.load();
    const chunks = await this.textSplitter.splitDocuments(docs);

    // Get embeddings for each chunk
    const embeddingsArray = await Promise.all(
      chunks.map(chunk => embeddings.embedQuery(chunk.pageContent))
    );

    // Get or create collection
    const collectionName = `legal_docs_${metadata.ownerId}`;
    const collection = await this.getOrCreateCollection(collectionName);

    // Add documents to collection
    await collection.add({
      ids: chunks.map((_, i) => `${metadata.uploadId}_${i}`),
      embeddings: embeddingsArray,
      documents: chunks.map(chunk => chunk.pageContent),
      metadatas: chunks.map((chunk, index) => ({
        ...chunk.metadata,
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length,
        processed_at: new Date().toISOString()
      }))
    });

    return {
      collectionName,
      chunkCount: chunks.length
    };
  }

  /**
   * Query documents from ChromaDB
   */
  async queryDocuments({
    collectionName,
    query,
    filter,
    topK = 5
  }: {
    collectionName: string;
    query: string;
    filter?: Record<string, any>;
    topK?: number;
  }) {
    if (!this.isConnected || !this.client) {
      console.warn('ChromaDB is not connected, skipping query');
      return [];
    }
    try {
      const collection = await this.client.getCollection({
        name: collectionName,
        embeddingFunction: embeddings as any
      });

      const queryEmbedding = await embeddings.embedQuery(query);
      
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: filter
      });

      // Format results to match the expected structure
      return results.documents[0].map((content, i) => ({
        content,
        metadata: results.metadatas[0][i]
      }));
    } catch (error) {
      console.error('Error querying ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Delete documents from ChromaDB
   */
  async deleteDocuments(collectionName: string, documentIds: string[]) {
    if (!this.isConnected || !this.client) {
      console.warn('ChromaDB is not connected, skipping delete');
      return false;
    }
    try {
      const collection = await this.client.getCollection({
        name: collectionName,
        embeddingFunction: embeddings as any
      });
      
      await collection.delete({
        ids: documentIds
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting documents from ChromaDB:', error);
      throw error;
    }
  }
}
