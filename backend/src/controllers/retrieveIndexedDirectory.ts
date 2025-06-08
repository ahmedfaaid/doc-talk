import { Context } from 'hono';
import { db } from '../../db';

export const retrieveIndexedDirectory = async (c: Context) => {
  const directory = c.req.query('directory');

  try {
    if (!directory) {
      return c.json(
        { message: 'No directory provided', code: 400, directory: null },
        400
      );
    }

    const indexedDirectory = db.query(`
      SELECT id, name, directory_path, vector_path, indexed FROM directories WHERE directory_path = $directory
    `);
    const foundDirectory: any = indexedDirectory.get({ $directory: directory });

    if (!foundDirectory) {
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
        directory: foundDirectory
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
