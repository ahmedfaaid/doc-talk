import { Context } from 'hono';
import { LegalAgentService } from '../services/legal-agent.service.js';
import { AppRouteHandler } from '../types/index.js';
import { getFileById } from '../db/operations/file.operation.js';
import { getUser } from '../db/operations/user.operation.js';
import { streamSSE } from 'hono/streaming';
import * as HttpStatusCodes from '../lib/http-status-codes.js';
import { legalQuery } from '../routes/legal-agent.route.js';

export const legalQueryHandler: AppRouteHandler<typeof legalQuery> = async (c: Context) => {
  try {
    const { userId, fileId, query, jurisdiction, documentType } = c.req.valid('json');
    const payload = c.get('user');

    // Verify user
    if (!payload || payload.id !== userId) {
      return c.json(
        { message: 'Unauthorized access' },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    const user = await getUser(userId, undefined);
    if (!user) {
      return c.json(
        { message: 'User not found' },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Verify file access
    const file = await getFileById(fileId, userId);
    if (!file) {
      return c.json(
        { message: 'File not found or access denied' },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Check if file is a legal document
    if (!file.isLegalDocument) {
      return c.json(
        { message: 'File is not a legal document' },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Check if file has been vectorized
    if (file.vectorStatus !== 'completed') {
      return c.json(
        {
          message: 'File has not been fully processed yet',
          status: file.vectorStatus
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Stream the response using SSE
    return streamSSE(c, async stream => {
      try {
        // Initialize the legal agent service
        const legalAgent = new LegalAgentService();

        // Send initial message
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'status',
            message: 'Processing your legal query...'
          }),
          event: 'status',
          id: String(Date.now())
        });

        // Process the query
        const result = await legalAgent.processLegalQuery({
          query,
          userId,
          uploadId: fileId,
          jurisdiction: jurisdiction || file.jurisdiction,
          documentType: documentType || file.documentType
        });

        // Send tool results
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'tools',
            data: result.toolResults
          }),
          event: 'tools',
          id: String(Date.now())
        });

        // Send final response
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'response',
            message: result.response
          }),
          event: 'response',
          id: String(Date.now())
        });

        // Send completion message
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'complete',
            message: 'Query processing completed'
          }),
          event: 'complete',
          id: String(Date.now())
        });
      } catch (error) {
        console.error('Error processing legal query:', error);
        
        // Send error message
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            message: `Error processing query: ${error instanceof Error ? error.message : 'Unknown error'}`
          }),
          event: 'error',
          id: String(Date.now())
        });
      } finally {
        await stream.close();
      }
    });
  } catch (error) {
    console.error('Error in legal query handler:', error);
    return c.json(
      { message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const legalAgentController = {
  legalQueryHandler
};
