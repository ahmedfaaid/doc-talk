import { Context } from 'hono';
import { AppRouteHandler } from '../types';
import { markAsLegalDocument } from '../db/operations/file.operation';
import * as HttpStatusCodes from '../lib/http-status-codes';
import { markFileAsLegalDocument } from '../routes/file/file.route';

export const markFileAsLegalDocumentHandler: AppRouteHandler<typeof markFileAsLegalDocument> = async (c: Context) => {
  try {
    const { userId, fileId, jurisdiction, documentType } = c.req.valid('json');
    const payload = c.get('user');

    // Verify user
    if (!payload || payload.id !== userId) {
      return c.json(
        { message: 'Unauthorized access' },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Mark file as legal document
    const updatedFile = await markAsLegalDocument(
      fileId,
      userId,
      jurisdiction,
      documentType
    );

    if (!updatedFile) {
      return c.json(
        { message: 'File not found or access denied' },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json({
      message: 'File marked as legal document successfully',
      file: updatedFile
    });
  } catch (error) {
    console.error('Error marking file as legal document:', error);
    return c.json(
      { message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const legalDocumentController = {
  markFileAsLegalDocumentHandler
};