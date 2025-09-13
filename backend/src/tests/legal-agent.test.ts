import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LegalAgentService } from '../services/legal-agent.service';
import { EnhancedRagService } from '../services/enhanced-rag.service';
import { GraphDatabaseService } from '../services/graph-database.service';
import { EntityExtractor } from '../services/entity-extractor.service';

// Mock dependencies
vi.mock('../services/enhanced-rag.service');
vi.mock('../services/graph-database.service');
vi.mock('../services/entity-extractor.service');
vi.mock('../lib/AI', () => ({
  llm: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test response from LLM'
            }
          }]
        })
      }
    }
  }
}));

describe('Legal Agent Service', () => {
  let legalAgentService: LegalAgentService;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock implementations
    (EnhancedRagService as any).mockImplementation(() => ({
      retrieveRelevantDocuments: vi.fn().mockResolvedValue([
        {
          id: 'chunk1',
          content: 'Legal document content 1',
          metadata: {
            filename: 'document1.pdf',
            documentId: 'doc1',
            jurisdiction: 'US',
            documentType: 'Contract'
          },
          score: 0.95
        },
        {
          id: 'chunk2',
          content: 'Legal document content 2',
          metadata: {
            filename: 'document2.pdf',
            documentId: 'doc2',
            jurisdiction: 'UK',
            documentType: 'Legislation'
          },
          score: 0.85
        }
      ])
    }));
    
    (GraphDatabaseService as any).mockImplementation(() => ({
      queryRelatedEntities: vi.fn().mockResolvedValue({
        entities: [
          { id: 'entity1', text: 'Entity 1', type: 'Person' },
          { id: 'entity2', text: 'Entity 2', type: 'Organization' }
        ],
        relationships: [
          { source: 'entity1', target: 'entity2', type: 'WORKS_FOR' }
        ]
      })
    }));
    
    (EntityExtractor as any).mockImplementation(() => ({
      extractEntities: vi.fn().mockResolvedValue([
        { text: 'Entity 1', type: 'Person' },
        { text: 'Entity 2', type: 'Organization' }
      ]),
      analyzeLegalDocument: vi.fn().mockResolvedValue({
        summary: 'This is a legal document summary',
        keyPoints: ['Point 1', 'Point 2'],
        legalImplications: ['Implication 1', 'Implication 2']
      })
    }));
    
    legalAgentService = new LegalAgentService();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should process a legal query successfully', async () => {
    // Test parameters
    const query = 'What are the legal implications of this contract?';
    const fileId = 'test-file-id';
    const userId = 'test-user-id';
    const jurisdiction = 'US';
    const documentType = 'Contract';
    
    // Mock the tools execution
    const mockToolExecution = vi.spyOn(legalAgentService as any, 'executeTools');
    mockToolExecution.mockImplementation(async (tools) => {
      return tools.map(tool => ({
        tool: tool.name,
        result: `Result from ${tool.name}`
      }));
    });
    
    // Call the function
    const result = await legalAgentService.processLegalQuery(
      query,
      fileId,
      userId,
      jurisdiction,
      documentType
    );
    
    // Assertions
    expect(result).toEqual(expect.objectContaining({
      response: expect.stringContaining('Test response from LLM'),
      toolResults: expect.arrayContaining([
        expect.objectContaining({
          tool: expect.any(String),
          result: expect.stringContaining('Result from')
        })
      ])
    }));
  });
  
  it('should handle errors during query processing', async () => {
    // Mock a failure in EnhancedRagService
    (EnhancedRagService as any).mockImplementation(() => ({
      retrieveRelevantDocuments: vi.fn().mockRejectedValue(new Error('RAG service error'))
    }));
    
    // Test parameters
    const query = 'What are the legal implications of this contract?';
    const fileId = 'test-file-id';
    const userId = 'test-user-id';
    const jurisdiction = 'US';
    const documentType = 'Contract';
    
    // Call the function and expect it to handle the error
    const result = await legalAgentService.processLegalQuery(
      query,
      fileId,
      userId,
      jurisdiction,
      documentType
    );
    
    // Verify error handling
    expect(result).toEqual(expect.objectContaining({
      response: expect.stringContaining('error'),
      error: expect.stringContaining('RAG service error')
    }));
  });
  
  it('should initialize tools correctly', () => {
    // Access the private tools property
    const tools = (legalAgentService as any).tools;
    
    // Verify tools initialization
    expect(tools).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'search_legal_documents' }),
      expect.objectContaining({ name: 'find_legal_entities' }),
      expect.objectContaining({ name: 'analyze_legal_context' }),
      expect.objectContaining({ name: 'generate_legal_reasoning' })
    ]));
  });
});