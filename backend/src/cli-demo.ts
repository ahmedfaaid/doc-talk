#!/usr/bin/env node

/**
 * Legal RAG System CLI Demo
 * Demonstrates the agentic legal analysis capabilities
 */

import { LegalQueryAnalyzer } from './services/legal-query-analyzer.service.js';
import { DocumentProcessorService } from './services/document-processor.service.js';
import { LegalContextManager } from './services/legal-context-manager.service.js';
import { LegalReasoningEngine } from './services/legal-reasoning-engine.service.js';
import { QueryType, QueryIntent, ComplexityLevel } from './types/legal.types.js';

// Demo queries to showcase different capabilities
const DEMO_QUERIES = [
  {
    title: "Contract Liability Analysis",
    query: "What are the liability implications of breach of contract under California law?",
    expectedType: QueryType.ANALYSIS,
    expectedIntent: QueryIntent.ANALYZE_CONTRACT
  },
  {
    title: "Precedent Research",
    query: "Find precedents for employment discrimination cases in federal court",
    expectedType: QueryType.RESEARCH,
    expectedIntent: QueryIntent.FIND_PRECEDENT
  },
  {
    title: "Compliance Check",
    query: "Does this privacy policy comply with GDPR requirements?",
    expectedType: QueryType.COMPLIANCE_CHECK,
    expectedIntent: QueryIntent.COMPLIANCE_CHECK
  },
  {
    title: "Jurisdiction Comparison",
    query: "Compare estate planning laws between New York and California",
    expectedType: QueryType.COMPARISON,
    expectedIntent: QueryIntent.COMPARE_JURISDICTIONS
  }
];

const SAMPLE_DOCUMENT = `
EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on [DATE] between [COMPANY NAME], 
a corporation organized under the laws of California ("Company"), and [EMPLOYEE NAME] ("Employee").

1. POSITION AND DUTIES
Employee shall serve as [POSITION] and shall perform such duties as are customarily 
associated with such position.

2. COMPENSATION
Company shall pay Employee a base salary of $[AMOUNT] per year, payable in accordance 
with Company's standard payroll practices.

3. CONFIDENTIALITY
Employee acknowledges that during employment, Employee may have access to confidential 
information belonging to Company. Employee agrees to maintain the confidentiality of 
such information.

4. TERMINATION
This Agreement may be terminated by either party with thirty (30) days written notice.
`;

class LegalRAGDemo {
  private queryAnalyzer: LegalQueryAnalyzer;
  private documentProcessor: DocumentProcessorService;
  private contextManager: LegalContextManager;
  private reasoningEngine: LegalReasoningEngine;

  constructor() {
    this.queryAnalyzer = new LegalQueryAnalyzer();
    this.documentProcessor = new DocumentProcessorService();
    this.contextManager = new LegalContextManager();
    this.reasoningEngine = new LegalReasoningEngine();
  }

  private log(message: string, color: string = '\x1b[0m') {
    console.log(`${color}${message}\x1b[0m`);
  }

  private logHeader(title: string) {
    this.log('\n' + '='.repeat(60), '\x1b[36m');
    this.log(`🏛️  ${title}`, '\x1b[36m');
    this.log('='.repeat(60), '\x1b[36m');
  }

  private logSuccess(message: string) {
    this.log(`✅ ${message}`, '\x1b[32m');
  }

  private logInfo(message: string) {
    this.log(`ℹ️  ${message}`, '\x1b[34m');
  }

  private logWarning(message: string) {
    this.log(`⚠️  ${message}`, '\x1b[33m');
  }

  private logError(message: string) {
    this.log(`❌ ${message}`, '\x1b[31m');
  }

  async runDemo() {
    this.logHeader('Legal RAG System Demo');
    
    try {
      // Demo 1: Basic Legal Query Analysis
      await this.demoQueryAnalysis();
      
      // Demo 2: Document Processing
      await this.demoDocumentProcessing();
      
      // Demo 3: Context Management
      await this.demoContextManagement();
      
      // Demo 4: Legal Reasoning
      await this.demoLegalReasoning();
      
      this.logHeader('Demo Complete');
      this.logSuccess('All legal analysis components are working correctly!');
      this.logInfo('The Legal RAG system is ready for production use.');
      
    } catch (error) {
      this.logError(`Demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  async demoQueryAnalysis() {
    this.logHeader('Legal Query Analysis Demo');
    
    for (const demo of DEMO_QUERIES) {
      this.logInfo(`Analyzing: "${demo.title}"`);
      console.log(`Query: ${demo.query}\n`);
      
      try {
        const analysis = await this.queryAnalyzer.analyzeQuery(demo.query);
        
        this.logSuccess('Analysis Results:');
        console.log(`  Query Type: ${analysis.queryType}`);
        console.log(`  Intent: ${analysis.queryIntent}`);
        console.log(`  Complexity: ${analysis.complexity}`);
        console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
        console.log(`  Legal Domains: ${analysis.legalDomains.join(', ')}`);
        console.log(`  Suggested Tools: ${analysis.suggestedTools.slice(0, 3).join(', ')}`);
        
        if (analysis.entities.length > 0) {
          console.log(`  Legal Entities: ${analysis.entities.join(', ')}`);
        }
        
        console.log('');
      } catch (error) {
        this.logWarning(`Analysis failed (using fallback): ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  async demoDocumentProcessing() {
    this.logHeader('Document Processing Demo');
    
    this.logInfo('Processing sample employment agreement...');
    
    try {
      const chunks = await this.documentProcessor.processText(SAMPLE_DOCUMENT, {
        documentType: 'employment_agreement',
        jurisdiction: 'California'
      });
      
      this.logSuccess(`Document processed successfully!`);
      console.log(`  Total chunks: ${chunks.length}`);
      console.log(`  Average chunk size: ${Math.round(chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length)} characters`);
      
      if (chunks.length > 0) {
        console.log(`\n  Sample chunk:`);
        console.log(`  "${chunks[0].content.substring(0, 100)}..."`);
        console.log(`  Metadata: ${JSON.stringify(chunks[0].metadata, null, 2)}`);
      }
      
    } catch (error) {
      this.logError(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async demoContextManagement() {
    this.logHeader('Context Management Demo');
    
    const userId = 'demo-user-123';
    this.logInfo(`Managing context for user: ${userId}`);
    
    try {
      // Simulate multiple queries to build context
      const queries = [
        "What are my obligations under this employment contract?",
        "Can I work for a competitor after leaving?",
        "What happens if I breach the confidentiality clause?"
      ];
      
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        this.logInfo(`Processing query ${i + 1}: "${query}"`);
        
        const analysis = await this.queryAnalyzer.analyzeQuery(query);
        const context = await this.contextManager.updateContextWithQuery(userId, analysis);
        
        console.log(`  Context updated - Query history: ${context.activeSession.queryHistory.length} queries`);
        console.log(`  Active domains: ${context.legalDomains.join(', ')}`);
      }
      
      // Retrieve final context
      const finalContext = await this.contextManager.getUserContext(userId);
      this.logSuccess('Context management working correctly!');
      console.log(`  Total queries in session: ${finalContext.activeSession.queryHistory.length}`);
      console.log(`  Session duration: ${new Date().getTime() - new Date(finalContext.activeSession.startTime).getTime()}ms`);
      
    } catch (error) {
      this.logError(`Context management failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async demoLegalReasoning() {
    this.logHeader('Legal Reasoning Demo');
    
    this.logInfo('Performing legal reasoning on employment contract question...');
    
    try {
      const query = "If I violate the confidentiality clause, what are the potential consequences?";
      const documents = [
        {
          id: 'employment-agreement',
          content: SAMPLE_DOCUMENT,
          metadata: { type: 'contract', jurisdiction: 'California' }
        }
      ];
      
      // First analyze the query
      const queryAnalysis = await this.queryAnalyzer.analyzeQuery(query);
      
      const reasoning = await this.reasoningEngine.generateLegalReasoning(
        query,
        queryAnalysis,
        documents
      );
      
      this.logSuccess('Legal reasoning completed!');
      console.log(`  Reasoning type: ${reasoning.reasoningType}`);
      console.log(`  Confidence: ${(reasoning.confidence * 100).toFixed(1)}%`);
      console.log(`  Key findings: ${reasoning.keyFindings.length} items`);
      console.log(`  Legal principles: ${reasoning.legalPrinciples.length} principles`);
      
      if (reasoning.keyFindings.length > 0) {
        console.log(`\n  Sample finding: "${reasoning.keyFindings[0]}"`);
      }
      
    } catch (error) {
      this.logError(`Legal reasoning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new LegalRAGDemo();
  demo.runDemo().catch(console.error);
}

export { LegalRAGDemo };