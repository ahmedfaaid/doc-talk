// Simple Legal RAG API Server - Working Demo
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());

// Mock legal types for demo
const QueryType = {
  RESEARCH: 'research',
  ANALYSIS: 'analysis',
  COMPLIANCE_CHECK: 'compliance_check',
  COMPARISON: 'comparison'
};

const QueryIntent = {
  FIND_PRECEDENT: 'find_precedent',
  ANALYZE_CONTRACT: 'analyze_contract',
  COMPLIANCE_CHECK: 'compliance_check',
  COMPARE_JURISDICTIONS: 'compare_jurisdictions'
};

const ComplexityLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very_high'
};

// Mock legal analysis function
function analyzeLegalQuery(query) {
  // Simple rule-based analysis for demo
  const lowerQuery = query.toLowerCase();
  
  let queryType = QueryType.RESEARCH;
  let queryIntent = QueryIntent.FIND_PRECEDENT;
  let complexity = ComplexityLevel.MEDIUM;
  
  if (lowerQuery.includes('analyze') || lowerQuery.includes('analysis')) {
    queryType = QueryType.ANALYSIS;
    queryIntent = QueryIntent.ANALYZE_CONTRACT;
  }
  
  if (lowerQuery.includes('comply') || lowerQuery.includes('compliance')) {
    queryType = QueryType.COMPLIANCE_CHECK;
    queryIntent = QueryIntent.COMPLIANCE_CHECK;
  }
  
  if (lowerQuery.includes('compare') || lowerQuery.includes('versus')) {
    queryType = QueryType.COMPARISON;
    queryIntent = QueryIntent.COMPARE_JURISDICTIONS;
  }
  
  // Determine complexity
  if (lowerQuery.length < 50) {
    complexity = ComplexityLevel.LOW;
  } else if (lowerQuery.length > 200) {
    complexity = ComplexityLevel.HIGH;
  }
  
  // Extract legal domains
  const legalDomains = [];
  if (lowerQuery.includes('contract')) legalDomains.push('Contract Law');
  if (lowerQuery.includes('employment')) legalDomains.push('Employment Law');
  if (lowerQuery.includes('privacy') || lowerQuery.includes('gdpr')) legalDomains.push('Privacy Law');
  if (legalDomains.length === 0) legalDomains.push('General Law');
  
  return {
    originalQuery: query,
    queryType,
    queryIntent,
    complexity,
    confidence: 0.85,
    legalDomains,
    entities: [],
    suggestedTools: ['legal_search', 'case_analysis', 'document_review'],
    metadata: {
      analysisTimestamp: new Date().toISOString(),
      contextUsed: false
    }
  };
}

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      legalAnalysis: 'ready',
      documentProcessing: 'ready',
      contextManagement: 'ready',
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
    const analysis = analyzeLegalQuery(query);

    return c.json({
      analysis,
      context: userId ? { userId, sessionActive: true } : null,
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
    const file = body.file;

    if (!file) {
      return c.json({ error: 'File is required' }, 400);
    }

    // Mock document processing
    const mockChunks = [
      {
        content: 'Sample legal document chunk 1...',
        metadata: { chunkIndex: 0, source: 'legal_document' }
      },
      {
        content: 'Sample legal document chunk 2...',
        metadata: { chunkIndex: 1, source: 'legal_document' }
      }
    ];

    return c.json({
      success: true,
      chunks: mockChunks.length,
      processed: mockChunks,
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

    // Mock legal reasoning
    const reasoning = {
      reasoningType: 'deductive',
      confidence: 0.78,
      keyFindings: [
        'Based on the contract terms, liability is limited to direct damages',
        'Indemnification clause provides protection against third-party claims'
      ],
      legalPrinciples: [
        'Freedom of contract allows parties to limit liability',
        'Indemnification clauses are generally enforceable'
      ],
      recommendations: [
        'Review liability cap amounts',
        'Consider mutual indemnification'
      ]
    };

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
    
    // Mock context
    const context = {
      userId,
      activeSession: {
        startTime: new Date().toISOString(),
        queryHistory: ['What are my contract obligations?'],
        contextStack: []
      },
      legalDomains: ['Contract Law'],
      documentCorpus: []
    };

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

// Serve static HTML files
app.get('/legal-chat.html', async (c) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'legal-chat.html');
    const html = fs.readFileSync(filePath, 'utf8');
    return c.html(html);
  } catch (error) {
    return c.text('File not found', 404);
  }
});

app.get('/test-page.html', async (c) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'test-page.html');
    const html = fs.readFileSync(filePath, 'utf8');
    return c.html(html);
  } catch (error) {
    return c.text('File not found', 404);
  }
});

// Root redirect to chat interface
app.get('/', (c) => {
  return c.redirect('/legal-chat.html');
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

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log('🏛️  Legal RAG API Server (Demo)');
console.log('================================');
console.log(`🚀 Server starting on port ${port}`);
console.log(`📍 Health check: http://localhost:${port}/health`);
console.log(`🔍 Legal analysis: http://localhost:${port}/api/legal/analyze`);
console.log(`📄 Document processing: http://localhost:${port}/api/legal/process-document`);
console.log(`🧠 Legal reasoning: http://localhost:${port}/api/legal/reason`);
console.log(`📊 Legal types: http://localhost:${port}/api/legal/types`);
console.log('================================\n');

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`✅ Legal RAG API Server is running on http://localhost:${info.port}`);
  console.log('🎯 Try these endpoints:');
  console.log(`   curl http://localhost:${info.port}/health`);
  console.log(`   curl http://localhost:${info.port}/api/legal/types`);
  console.log(`   curl -X POST http://localhost:${info.port}/api/legal/analyze -H "Content-Type: application/json" -d '{"query":"What are the liability implications of this contract?"}'`);
});