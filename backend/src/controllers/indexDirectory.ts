import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Context } from 'hono';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { access } from 'node:fs/promises';
import { db } from '../../db';

export const indexDirectory = async (c: Context) => {
  const { directoryPath, name } = await c.req.json();

  try {
    await access(directoryPath!);

    const vectorStoreBasePath: string = 'vectorstore';

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

    const embeddings = new OpenAIEmbeddings({
      apiKey: 'lm-studio',
      model: 'nomic-ai/nomic-embed-text-v1.5-GGUF',
      configuration: {
        baseURL: 'http://localhost:1234/v1'
      }
    });
    const vectorStore = await HNSWLib.fromDocuments(splitText, embeddings);
    await vectorStore.save(`${vectorStoreBasePath}/${name}`);

    const addDirectory = db.prepare(`
      INSERT INTO directories (name, directory_path, vector_path, indexed)
      SELECT $name, $directory_path, $vector_path, $indexed
      WHERE NOT EXISTS (
        SELECT 1
        FROM directories
        WHERE name = $name AND directory_path = $directory_path
      );
    `);
    const getDirectory = db.prepare(`
      SELECT * FROM directories 
      WHERE name = $name AND directory_path = $directory_path;
    `);

    addDirectory.run({
      $name: name,
      $vector_path: `${vectorStoreBasePath}/${name}`,
      $indexed: 1,
      $directory_path: directoryPath
    });

    const directory = getDirectory.get({
      $name: name,
      $directory_path: directoryPath
    });

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
