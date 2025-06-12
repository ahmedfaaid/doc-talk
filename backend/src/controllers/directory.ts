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
import { addDirectory, getDirectory } from '../../db/operations/directory';
import { embeddings } from '../lib/AI';
import { createVectorStorePath } from '../lib/utils';

export const indexDirectory = async (c: Context) => {
  try {
    const { directoryPath, name } = await c.req.json();

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
          code: 404,
          directory: null
        },
        404
      );
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const splitText = await textSplitter.splitDocuments(docs);

    const vectorStore = await HNSWLib.fromDocuments(splitText, embeddings);
    await vectorStore.save(vector_path);

    const directory = await addDirectory(
      directoryPath,
      name,
      vector_path,
      true
    );

    return c.json(
      { message: 'Directory indexed successfully', code: 201, directory },
      201
    );
  } catch (error) {
    return c.json(
      { message: (error as Error).message, code: 500, directory: null },
      500
    );
  }
};

export const retrieveIndexedDirectory = async (c: Context) => {
  try {
    const directoryPath = c.req.query('directory');

    if (!directoryPath) {
      return c.json(
        { message: 'No directory provided', code: 400, directory: null },
        400
      );
    }

    const directory = await getDirectory(directoryPath);

    if (!directory) {
      return c.json(
        {
          message: 'No directory has been indexed',
          code: 400,
          directory: null
        },
        400
      );
    }

    return c.json(
      {
        message: 'Indexed directory retrieved successfully',
        code: 200,
        directory
      },
      200
    );
  } catch (error) {
    return c.json(
      { message: (error as Error).message, code: 500, directory: null },
      500
    );
  }
};
