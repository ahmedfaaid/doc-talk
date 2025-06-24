import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Context } from 'hono';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { access } from 'node:fs/promises';
import {
  createDirectory,
  getDirectory
} from '../db/operations/directory.operation';
import { getUser } from '../db/operations/user.operation';
import { embeddings } from '../lib/AI';
import {
  BAD_REQUEST,
  CREATED,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK
} from '../lib/http-status-codes';
import { createVectorStorePath } from '../lib/utils';
import {
  IndexDirectoryRoute,
  RetrieveIndexedDirectoryRoute
} from '../routes/directory/directory.route';
import { AppRouteHandler } from '../types';

export const indexDirectory: AppRouteHandler<IndexDirectoryRoute> = async (
  c: Context
) => {
  try {
    const { directoryPath, name } = await c.req.json();
    const payload = c.get('user');

    const user = await getUser(payload.id, undefined);

    await access(directoryPath!);

    const vector_path = createVectorStorePath(name);

    const loader = new DirectoryLoader(directoryPath!, {
      '.txt': path => new TextLoader(path),
      '.pdf': path => new PDFLoader(path),
      '.csv': path => new CSVLoader(path),
      '.docx': path => new DocxLoader(path),
      '.pptx': path => new PPTXLoader(path)
    });
    const docs = await loader.load();

    if (docs.length === 0) {
      return c.json(
        {
          message:
            'No text, pdf, csv, docx or pptx files found in the directory',
          code: NOT_FOUND,
          directory: null
        },
        NOT_FOUND
      );
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const splitText = await textSplitter.splitDocuments(docs);

    const vectorStore = await HNSWLib.fromDocuments(splitText, embeddings);
    await vectorStore.save(vector_path);

    const directory = await createDirectory(
      { directory_path: directoryPath, name, vector_path, indexed: true },
      user?.id as string
    );

    if (!directory) {
      return c.json(
        {
          message: 'The directory could not be indexed',
          code: BAD_REQUEST,
          directory: null
        },
        BAD_REQUEST
      );
    }

    return c.json(
      { message: 'Directory indexed successfully', code: CREATED, directory },
      CREATED
    );
  } catch (error) {
    return c.json(
      {
        message: (error as Error).message,
        code: INTERNAL_SERVER_ERROR,
        directory: null
      },
      INTERNAL_SERVER_ERROR
    );
  }
};

export const retrieveIndexedDirectory: AppRouteHandler<
  RetrieveIndexedDirectoryRoute
> = async (c: Context) => {
  try {
    const directoryPath = c.req.query('directory');

    if (!directoryPath) {
      return c.json(
        {
          message: 'No directory provided',
          code: BAD_REQUEST,
          directory: null
        },
        BAD_REQUEST
      );
    }

    const directory = await getDirectory(directoryPath);

    if (!directory) {
      return c.json(
        {
          message: 'No directory has been indexed',
          code: BAD_REQUEST,
          directory: null
        },
        BAD_REQUEST
      );
    }

    return c.json(
      {
        message: 'Indexed directory retrieved successfully',
        code: OK,
        directory
      },
      OK
    );
  } catch (error) {
    return c.json(
      {
        message: (error as Error).message,
        code: INTERNAL_SERVER_ERROR,
        directory: null
      },
      INTERNAL_SERVER_ERROR
    );
  }
};
