import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegalQueryAnalyzer } from '../services/legal-query-analyzer.service.js';
import { LegalContextManager } from '../services/legal-context-manager.service.js';
import { LegalReasoningEngine } from '../services/legal-reasoning-engine.service.js';
import { EnhancedRagService } from '../services/enhanced-rag.service.js';
import { QueryType, QueryIntent, ComplexityLevel, LegalEntityType } from '../types/legal.types.js';

// Mock the AI module
vi.mock('../lib/AI.js', () => ({
  llm: {
    invoke: vi.fn()
  }
}));

// Mock the services
vi.mock('../services/chroma-client.service.js', () => ({
  ChromaClientService: vi.fn().mockImplementation(() => ({
    queryDocuments: vi.fn().mockResolvedValue([
      {
        content: 'Sample contract clause about liability limitations',
        metadata: { documentType: 'contract', jurisdiction: 'california' },
        score: 0.85
      }
    ])
  }))
}));

vi.mock('../services/graph-database.service.js', () => ({
  GraphDatabaseService: vi.fn().mockImplementation(() => ({
    queryRelatedEntities: vi.fn().mockResolvedValue([
      {
        entity: { text: 'Liability Clause', type: 'contract_term' },
        chunk: { content: 'Liability is limited to direct damages only' },
        relationship: { type: 'DEFINES' }
      }
    ])
  }))
}));

describe('Agentic Legal System Integration', () => {
  let queryAnalyzer: LegalQueryAnalyzer;
  let contextManager: LegalContextManager;
  let reasoningEngine: LegalReasoningEngine;
  let ragService: EnhancedRagService;
  let mockLlm: any;

  beforeEach(async () => {
    queryAnalyzer = new LegalQueryAnalyzer();
    contextManager = new LegalContextManager();
    reasoningEngine = new LegalReasoningEngine();
    ragService = new EnhancedRagService();
    
    const aiModule = await import('../lib/AI.js');
    mockLlm = aiModule.llm;
    vi.clearAllMocks();
  });

  describe('End-to-End Legal Query Processing', () => {
    it('should provide comprehensive legal analysis for contract liability question', async () => {
      const userId = 'test-user-123';
      const query = 'What are the liability implications of this indemnification clause in our software license agreement?';
      
      // Mock LLM responses for different stages
      mockLlm.invoke
        .mockResolvedValueOnce({ content: 'ANALYSIS' }) // Query type
        .mockResolvedValueOnce({ content: 'ANALYZE_CONTRACT' }) // Query intent
        .mockResolvedValueOnce({ content: '["Contract Law", "Intellectual Property"]' }) // Legal domains
        .mockResolvedValueOnce({ content: 'The issue is whether the indemnification clause provides adequate protection against third-party claims' }) // Issue identification
        .mockResolvedValueOnce({ content: '[{"text": "Indemnification clauses must be clear and specific", "source": "Contract Law Principles"}]' }) // Rules extraction
        .mockResolvedValueOnce({ content: 'The clause applies to third-party claims arising from software use' }) // Analysis
        .mockResolvedValueOnce({ content: 'The indemnification clause provides reasonable protection but may have gaps in coverage' }) // Conclusion
        .mockResolvedValueOnce({ content: '[{"theory": "Mutual indemnification", "reasoning": "Both parties share liability risks"}]' }) // Alternatives
        .mockResolvedValueOnce({ content: '["Review clause scope", "Consider mutual indemnification", "Add carve-outs for gross negligence"]' }) // Recommendations
        .mockResolvedValueOnce({ content: '## Legal Analysis\n\nThe indemnification clause provides protection but requires review for completeness.' }); // Final answer

      // Step 1: Analyze the query
      const queryAnalysis = await queryAnalyzer.analyzeQuery(query);
      
      expect(queryAnalysis.queryType).toBe(QueryType.ANALYSIS);
      expect(queryAnalysis.queryIntent).toBe(QueryIntent.ANALYZE_CONTRACT);
      expect(queryAnalysis.legalDomains).toContain('Contract Law');
      expect(queryAnalysis.complexity).toBeDefined();
      expect(queryAnalysis.confidence).toBeGreaterThan(0);

      // Step 2: Initialize and update legal context
      const context = await contextManager.initializeContext(userId);
      const updatedContext = await contextManager.updateContextWithQuery(userId, queryAnalysis);
      
      expect(updatedContext.legalDomains).toContain('Contract Law');
      expect(updatedContext.activeSession.queryHistory).toHaveLength(1);

      // Step 3: Get relevant context and documents
      const relevantContext = await contextManager.getRelevantContext(userId, query);
      
      expect(relevantContext.context).toBeDefined();
      expect(relevantContext.suggestedJurisdiction).toBeDefined();

      // Step 4: Retrieve relevant documents using hybrid RAG
      const relevantDocs = await ragService.retrieveRelevantDocuments({
        userId,
        uploadId: 'test-upload-123',
        query,
        topK: 5,
        useHybridSearch: true
      });
      
      expect(relevantDocs).toHaveLength.greaterThan(0);
      expect(relevantDocs[0].content).toContain('liability');

      // Step 5: Generate comprehensive legal reasoning
      const legalResponse = await reasoningEngine.generateLegalReasoning(
        query,
        queryAnalysis,
        updatedContext,
        relevantContext.relevantDocuments
      );
      
      expect(legalResponse.answer).toBeDefined();
      expect(legalResponse.reasoning.issue).toContain('indemnification');
      expect(legalResponse.reasoning.applicableRules).toHaveLength.greaterThan(0);
      expect(legalResponse.reasoning.analysis).toHaveLength.greaterThan(0);
      expect(legalResponse.reasoning.conclusion).toBeDefined();
      expect(legalResponse.confidence.overall).toBeGreaterThan(0);
      expect(legalResponse.recommendations).toHaveLength.greaterThan(0);
      expect(legalResponse.disclaimers).toHaveLength.greaterThan(0);
      expect(legalResponse.suggestedFollowUp).toHaveLength.greaterThan(0);

      // Verify agentic behavior characteristics
      expect(legalResponse.reasoning.alternatives).toBeDefined();
      expect(legalResponse.citations).toHaveLength.greaterThan(0);
      expect(legalResponse.confidence.reasoning).toBeGreaterThan(0);
    });

    it('should demonstrate cross-document legal reasoning', async () => {
      const userId = 'test-user-456';
      const query = 'How do the terms in our employment contract conflict with the new state labor regulations?';
      
      // Mock responses for cross-document analysis
      mockLlm.invoke
        .mockResolvedValueOnce({ content: 'COMPLIANCE' }) // Query type
        .mockResolvedValueOnce({ content: 'COMPLIANCE_CHECK' }) // Query intent
        .mockResolvedValueOnce({ content: '["Employment Law", "Administrative Law"]' }); // Legal domains

      // Add documents to user's corpus
      await contextManager.addDocumentToCorpus(
        userId,
        'employment-contract-123',
        'Employment_Agreement.pdf',
        'contract',
        'california',
        [
          {
            id: 'entity-1',
            text: 'At-will employment',
            type: LegalEntityType.CONTRACT_TERM,
            relationships: [],
            confidence: 0.9
          }
        ]
      );

      await contextManager.addDocumentToCorpus(
        userId,
        'labor-regulations-456',
        'CA_Labor_Code_Updates.pdf',
        'statute',
        'california',
        [
          {
            id: 'entity-2',
            text: 'Minimum wage requirements',
            type: LegalEntityType.STATUTE,
            relationships: [],
            confidence: 0.95
          }
        ]
      );

      // Analyze query with cross-document context
      const queryAnalysis = await queryAnalyzer.analyzeQuery(query);
      const updatedContext = await contextManager.updateContextWithQuery(userId, queryAnalysis);
      
      // Get cross-document insights
      const insights = await contextManager.getCrossDocumentInsights(userId, query);
      
      expect(insights.commonEntities).toBeDefined();
      expect(insights.conflictingProvisions).toBeDefined();
      expect(insights.jurisdictionalIssues).toBeDefined();
      expect(insights.relatedConcepts).toBeDefined();

      // Verify the system can identify potential conflicts
      expect(updatedContext.documentCorpus).toHaveLength(2);
      expect(updatedContext.legalDomains).toContain('Employment Law');
    });

    it('should maintain legal context across multiple queries', async () => {
      const userId = 'test-user-789';
      const sessionId = 'session-abc-123';
      
      // Mock responses for context building
      mockLlm.invoke
        .mockResolvedValue({ content: 'RESEARCH' })
        .mockResolvedValue({ content: 'FIND_PRECEDENT' })
        .mockResolvedValue({ content: '["Contract Law"]' });

      // First query - establish context
      const query1 = 'What are the elements of a valid contract?';
      const analysis1 = await queryAnalyzer.analyzeQuery(query1);
      const context1 = await contextManager.updateContextWithQuery(userId, analysis1, sessionId);
      
      expect(context1.activeSession.queryHistory).toHaveLength(1);
      expect(context1.legalDomains).toContain('Contract Law');

      // Second query - build on context
      const query2 = 'How does consideration work in contract formation?';
      const analysis2 = await queryAnalyzer.analyzeQuery(query2);
      const context2 = await contextManager.updateContextWithQuery(userId, analysis2, sessionId);
      
      expect(context2.activeSession.queryHistory).toHaveLength(2);
      expect(context2.activeSession.contextStack).toHaveLength.greaterThan(0);

      // Third query - demonstrate contextual understanding
      const query3 = 'What if there\'s no consideration in our previous contract example?';
      const relevantContext = await contextManager.getRelevantContext(userId, query3, sessionId);
      
      expect(relevantContext.relatedQueries).toHaveLength.greaterThan(0);
      expect(relevantContext.context.activeSession.queryHistory).toHaveLength(2);
      
      // Verify the system remembers previous legal concepts
      const hasContractContext = relevantContext.relatedQueries.some(q => 
        q.legalDomains.includes('Contract Law')
      );
      expect(hasContractContext).toBe(true);
    });

    it('should provide jurisdiction-aware legal analysis', async () => {
      const userId = 'test-user-jurisdiction';
      const query = 'What are the requirements for a valid will in California versus New York?';
      
      // Mock responses for jurisdiction analysis
      mockLlm.invoke
        .mockResolvedValueOnce({ content: 'COMPARISON' })
        .mockResolvedValueOnce({ content: 'CASE_COMPARISON' })
        .mockResolvedValueOnce({ content: '["Estate Law", "Civil Procedure"]' });

      const queryAnalysis = await queryAnalyzer.analyzeQuery(query);
      const context = await contextManager.updateContextWithQuery(userId, queryAnalysis);
      
      expect(queryAnalysis.queryType).toBe(QueryType.COMPARISON);
      expect(queryAnalysis.legalDomains).toContain('Estate Law');
      
      // The system should detect multiple jurisdictions
      const relevantContext = await contextManager.getRelevantContext(userId, query);
      expect(relevantContext.suggestedJurisdiction).toBeDefined();
    });
  });

  describe('Agentic Behavior Verification', () => {
    it('should demonstrate learning from user interactions', async () => {
      const userId = 'learning-test-user';
      
      // Simulate multiple interactions in the same domain
      const queries = [
        'What is a breach of contract?',
        'What are the remedies for breach of contract?',
        'How do I calculate damages for breach of contract?'
      ];
      
      mockLlm.invoke.mockResolvedValue({ content: 'RESEARCH' });
      mockLlm.invoke.mockResolvedValue({ content: 'FIND_PRECEDENT' });
      mockLlm.invoke.mockResolvedValue({ content: '["Contract Law"]' });

      let context = await contextManager.initializeContext(userId);
      
      for (const query of queries) {
        const analysis = await queryAnalyzer.analyzeQuery(query);
        context = await contextManager.updateContextWithQuery(userId, analysis);
      }
      
      // Verify the system has learned the user's focus area
      expect(context.legalDomains).toContain('Contract Law');
      expect(context.activeSession.queryHistory).toHaveLength(3);
      expect(context.activeSession.contextStack.length).toBeGreaterThan(0);
      
      // The system should now provide more targeted suggestions
      const relevantContext = await contextManager.getRelevantContext(
        userId, 
        'Tell me more about contract law'
      );
      
      expect(relevantContext.relatedQueries.length).toBeGreaterThan(0);
    });

    it('should provide confidence-based responses', async () => {
      const userId = 'confidence-test-user';
      const highConfidenceQuery = 'What is the definition of a contract?';
      const lowConfidenceQuery = 'How do quantum computing patents interact with international trade law in emerging jurisdictions?';
      
      // Mock responses for different confidence levels
      mockLlm.invoke
        .mockResolvedValue({ content: 'RESEARCH' })
        .mockResolvedValue({ content: 'FIND_PRECEDENT' })
        .mockResolvedValue({ content: '["Contract Law"]' });

      const highConfidenceAnalysis = await queryAnalyzer.analyzeQuery(highConfidenceQuery);
      const lowConfidenceAnalysis = await queryAnalyzer.analyzeQuery(lowConfidenceQuery);
      
      // High confidence query should have higher confidence score
      expect(highConfidenceAnalysis.confidence).toBeGreaterThan(0.7);
      expect(highConfidenceAnalysis.complexity).toBe(ComplexityLevel.LOW);
      
      // Low confidence query should have lower confidence and higher complexity
      expect(lowConfidenceAnalysis.complexity).toBeOneOf([ComplexityLevel.HIGH, ComplexityLevel.VERY_HIGH]);
    });
  });
});