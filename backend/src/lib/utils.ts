import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { UnstructuredLoader } from '@langchain/community/document_loaders/fs/unstructured';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { join } from 'node:path';
import { ChunkAndStoreProgress, FileExtension } from '../types';
import { chunkAndStoreProgress, UPLOAD_DIR, VECTOR_DIR } from './constants';

export const getLastPathSegment = (path: string): string => {
  return path.substring(path.lastIndexOf('/') + 1);
};

export const createVectorStorePath = (userId: string, uploadId: string) => {
  return join(VECTOR_DIR, userId, uploadId);
};

export const createUploadFilePath = (
  name: string,
  extension: string,
  userId: string
) => {
  return join(UPLOAD_DIR, userId, '-', name, '.', extension);
};

export const docLoader = (filePath: string, extension: FileExtension) => {
  switch (extension) {
    case 'txt':
      return new TextLoader(filePath);
    case 'md':
    case 'html':
    case 'xml':
      return new UnstructuredLoader(filePath);
    case 'doc':
    case 'docx':
      return new DocxLoader(filePath);
    case 'json':
      return new JSONLoader(filePath);
    case 'csv':
      return new CSVLoader(filePath);
    case 'pdf':
    default:
      return new PDFLoader(filePath);
  }
};

export const updateChunkAndStoreProgress = (
  uploadId: string,
  loaded: number,
  total: number,
  stage: ChunkAndStoreProgress['stage'],
  status: ChunkAndStoreProgress['status'] = 'processing',
  message?: string
) => {
  const progress: ChunkAndStoreProgress = {
    loaded,
    total,
    status,
    stage,
    message
  };

  chunkAndStoreProgress.set(uploadId, progress);
};
