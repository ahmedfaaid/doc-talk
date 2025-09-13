import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Import our legal services
import { LegalQueryAnalyzer } from './services/legal-query-analyzer.service.js';
import { DocumentProcessorService } from './services/document-processor.service.js';
import { LegalContextManager } from './services/legal-context-manager.service.js';
import { LegalReasoningEngine } from './services/legal-reasoning-engine.service.js';

// Types
import { QueryType, QueryIntent, ComplexityLevel } from './types/legal.types.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// Initialize services
const queryAnalyzer = new LegalQueryAnalyzer();
const documentProcessor = new DocumentProcessorService();
const contextManager = new LegalContextManager();
const reasoningEngine = new LegalReasoningEngine();

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      queryAnalyzer: 'ready',
      documentProcessor: 'ready',
      contextManager: 'ready',
      reasoningEngine: 'ready'
    }
  });
});

// Legal query analysis endpoint
app.post('/api/legal/analyze', async (c) => {
  try {
    const { query, userId, context } = await c.req.json();

    if (!query) {
      return c.json({ error: 'Query is required' }, 400);
    }

    // Analyze the legal query
    const analysis = await queryAnalyzer.analyzeQuery(query, context);

    // Update context if userId provided
    let updatedContext = null;
    if (userId) {
      updatedContext = await contextManager.updateContextWithQuery(userId, analysis);
    }

    return c.json({
      analysis,
      context: updatedContext,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Legal analysis error:', error);
    return c.json({
      error: 'Failed to analyze legal query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Document processing endpoint
app.post('/api/legal/process-document', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File;

    if (!file) {
      return c.json({ error: 'File is required' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const chunks = await documentProcessor.processDocument(buffer, file.type);

    return c.json({
      success: true,
      chunks: chunks.length,
      processed: chunks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return c.json({
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Legal reasoning endpoint
app.post('/api/legal/reason', async (c) => {
  try {
    const { query, documents, context } = await c.req.json();

    if (!query) {
      return c.json({ error: 'Query is required' }, 400);
    }

    // First analyze the query to get QueryAnalysis
    const queryAnalysis = await queryAnalyzer.analyzeQuery(query, context);
    
    const reasoning = await reasoningEngine.generateLegalReasoning(
      query,
      queryAnalysis,
      documents || []
    );

    return c.json({
      reasoning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Legal reasoning error:', error);
    return c.json({
      error: 'Failed to perform legal reasoning',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get user context
app.get('/api/legal/context/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const context = await contextManager.getUserContext(userId);

    return c.json({
      context,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Context retrieval error:', error);
    return c.json({
      error: 'Failed to retrieve user context',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Legal types info endpoint
app.get('/api/legal/types', (c) => {
  return c.json({
    queryTypes: Object.values(QueryType),
    queryIntents: Object.values(QueryIntent),
    complexityLevels: Object.values(ComplexityLevel),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: 'Internal server error',
    details: err.message
  }, 500);
});

export default app;