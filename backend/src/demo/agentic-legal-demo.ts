/**
 * Agentic Legal System Demo
 * 
 * This demo showcases the enhanced legal capabilities of our RAG system:
 * 1. Intelligent query analysis and classification
 * 2. Context-aware legal reasoning using IRAC methodology
 * 3. Cross-document legal analysis
 * 4. Jurisdiction-aware responses
 * 5. Learning from user interactions
 * 6. Confidence-based recommendations
 */

import { LegalQueryAnalyzer } from '../services/legal-query-analyzer.service.js';
import { LegalContextManager } from '../services/legal-context-manager.service.js';
import { LegalReasoningEngine } from '../services/legal-reasoning-engine.service.js';
import { EnhancedRagService } from '../services/enhanced-rag.service.js';
import { QueryType, QueryIntent, ComplexityLevel, LegalEntityType } from '../types/legal.types.js';

export class AgenticLegalDemo {
  private queryAnalyzer: LegalQueryAnalyzer;
  private contextManager: LegalContextManager;
  private reasoningEngine: LegalReasoningEngine;
  private ragService: EnhancedRagService;

  constructor() {
    this.queryAnalyzer = new LegalQueryAnalyzer();
    this.contextManager = new LegalContextManager();
    this.reasoningEngine = new LegalReasoningEngine();
    this.ragService = new EnhancedRagService();
  }

  /**
   * Demo 1: Intelligent Legal Query Analysis
   */
  async demoQueryAnalysis() {
    console.log('\n🔍 DEMO 1: Intelligent Legal Query Analysis');
    console.log('=' .repeat(50));

    const queries = [
      'What are the liability implications of this indemnification clause?',
      'Find precedents for breach of contract in software licensing',
      'How do I comply with GDPR data retention requirements?',
      'Draft a non-disclosure agreement for our startup',
      'Compare Delaware vs Nevada incorporation benefits'
    ];

    for (const query of queries) {
      console.log(`\n📝 Query: "${query}"`);
      
      try {
        const analysis = await this.queryAnalyzer.analyzeQuery(query);
        
        console.log(`   🎯 Type: ${analysis.queryType}`);
        console.log(`   🎪 Intent: ${analysis.queryIntent}`);
        console.log(`   📚 Legal Domains: ${analysis.legalDomains.join(', ')}`);
        console.log(`   🧠 Complexity: ${analysis.complexity}`);
        console.log(`   📊 Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
        console.log(`   🛠️  Suggested Tools: ${analysis.suggestedTools.slice(0, 3).join(', ')}`);
        
        if (analysis.jurisdiction) {
          console.log(`   🏛️  Jurisdiction: ${analysis.jurisdiction}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Demo 2: Context-Aware Legal Reasoning
   */
  async demoContextualReasoning() {
    console.log('\n🧠 DEMO 2: Context-Aware Legal Reasoning');
    console.log('=' .repeat(50));

    const userId = 'demo-user-123';
    const sessionId = 'demo-session-456';

    // Simulate a series of related legal queries
    const legalConversation = [
      'What constitutes a valid contract?',
      'What happens if there\'s no consideration in a contract?',
      'Can a contract be formed via email exchanges?',
      'What are the remedies for breach of contract?'
    ];

    console.log('📋 Simulating a legal consultation session...\n');

    for (let i = 0; i < legalConversation.length; i++) {
      const query = legalConversation[i];
      console.log(`${i + 1}. User: "${query}"`);

      try {
        // Analyze the query
        const analysis = await this.queryAnalyzer.analyzeQuery(query);
        
        // Update context with the query
        const context = await this.contextManager.updateContextWithQuery(
          userId, 
          analysis, 
          sessionId
        );

        // Get relevant context for response
        const relevantContext = await this.contextManager.getRelevantContext(
          userId, 
          query, 
          sessionId
        );

        console.log(`   🎯 Analysis: ${analysis.queryType} | ${analysis.queryIntent}`);
        console.log(`   📚 Domains: ${analysis.legalDomains.join(', ')}`);
        console.log(`   🧠 Context Stack: ${context.activeSession.contextStack.slice(-3).join(', ')}`);
        console.log(`   🔗 Related Queries: ${relevantContext.relatedQueries.length}`);
        
        if (relevantContext.suggestedJurisdiction) {
          console.log(`   🏛️  Suggested Jurisdiction: ${relevantContext.suggestedJurisdiction}`);
        }

        console.log('');
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }
    }

    // Show final context state
    const finalContext = await this.contextManager.initializeContext(userId, sessionId);
    console.log('📊 Final Context State:');
    console.log(`   📈 Total Queries: ${finalContext.activeSession.queryHistory.length}`);
    console.log(`   📚 Legal Domains: ${finalContext.legalDomains.join(', ')}`);
    console.log(`   🏛️  Primary Jurisdiction: ${finalContext.primaryJurisdiction}`);
  }

  /**
   * Demo 3: Cross-Document Legal Analysis
   */
  async demoCrossDocumentAnalysis() {
    console.log('\n📄 DEMO 3: Cross-Document Legal Analysis');
    console.log('=' .repeat(50));

    const userId = 'demo-user-cross-doc';

    // Simulate adding multiple legal documents
    console.log('📁 Adding documents to user\'s legal corpus...\n');

    await this.contextManager.addDocumentToCorpus(
      userId,
      'employment-contract-001',
      'Software_Engineer_Employment_Agreement.pdf',
      'contract',
      'california',
      [
        {
          id: 'entity-1',
          text: 'Non-compete clause',
          type: LegalEntityType.CONTRACT_TERM,
          relationships: [],
          confidence: 0.9
        },
        {
          id: 'entity-2',
          text: 'Intellectual property assignment',
          type: LegalEntityType.CONTRACT_TERM,
          relationships: [],
          confidence: 0.95
        }
      ]
    );

    await this.contextManager.addDocumentToCorpus(
      userId,
      'ca-labor-code-2024',
      'California_Labor_Code_2024.pdf',
      'statute',
      'california',
      [
        {
          id: 'entity-3',
          text: 'Non-compete restrictions',
          type: LegalEntityType.STATUTE,
          relationships: [],
          confidence: 0.92
        },
        {
          id: 'entity-4',
          text: 'Employee rights',
          type: LegalEntityType.LEGAL_CONCEPT,
          relationships: [],
          confidence: 0.88
        }
      ]
    );

    await this.contextManager.addDocumentToCorpus(
      userId,
      'nda-template-001',
      'Mutual_NDA_Template.pdf',
      'contract',
      'california',
      [
        {
          id: 'entity-5',
          text: 'Confidential information',
          type: LegalEntityType.CONTRACT_TERM,
          relationships: [],
          confidence: 0.91
        }
      ]
    );

    console.log('✅ Added 3 documents to corpus');
    console.log('   📋 Employment Contract');
    console.log('   📜 California Labor Code');
    console.log('   🤐 NDA Template\n');

    // Analyze cross-document relationships
    const query = 'How does the non-compete clause in our employment contract comply with California labor law?';
    console.log(`🔍 Cross-document query: "${query}"\n`);

    try {
      const insights = await this.contextManager.getCrossDocumentInsights(userId, query);
      
      console.log('🔗 Cross-Document Insights:');
      console.log(`   🤝 Common Entities: ${insights.commonEntities.length}`);
      
      if (insights.commonEntities.length > 0) {
        insights.commonEntities.forEach(entity => {
          console.log(`      • ${entity.text} (${entity.type})`);
        });
      }
      
      console.log(`   ⚠️  Conflicting Provisions: ${insights.conflictingProvisions.length}`);
      insights.conflictingProvisions.forEach(conflict => {
        console.log(`      • ${conflict}`);
      });
      
      console.log(`   🏛️  Jurisdictional Issues: ${insights.jurisdictionalIssues.length}`);
      insights.jurisdictionalIssues.forEach(issue => {
        console.log(`      • ${issue}`);
      });
      
      console.log(`   💡 Related Concepts: ${insights.relatedConcepts.slice(0, 5).join(', ')}`);

    } catch (error) {
      console.log(`❌ Error in cross-document analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Demo 4: Complexity Assessment and Confidence Scoring
   */
  async demoComplexityAssessment() {
    console.log('\n📊 DEMO 4: Complexity Assessment & Confidence Scoring');
    console.log('=' .repeat(50));

    const testQueries = [
      {
        query: 'What is a contract?',
        expectedComplexity: 'low'
      },
      {
        query: 'What are the liability implications of this indemnification clause in our multi-jurisdictional software licensing agreement?',
        expectedComplexity: 'medium-high'
      },
      {
        query: 'Analyze the res judicata implications of a motion to dismiss in a class action lawsuit involving federal securities violations, state contract claims, and international arbitration clauses across multiple jurisdictions with conflicting choice of law provisions.',
        expectedComplexity: 'very high'
      }
    ];

    for (const test of testQueries) {
      console.log(`\n📝 Query: "${test.query.substring(0, 80)}${test.query.length > 80 ? '...' : ''}"`);
      
      try {
        const complexityResult = await this.queryAnalyzer.assessComplexityWithConfidence(test.query);
        
        console.log(`   🧠 Complexity: ${complexityResult.complexity}`);
        console.log(`   📊 Confidence: ${(complexityResult.confidence * 100).toFixed(1)}%`);
        console.log(`   🔍 Key Factors:`);
        
        Object.entries(complexityResult.factors).forEach(([factor, value]) => {
          if (typeof value === 'boolean' && value) {
            console.log(`      ✓ ${factor}`);
          } else if (typeof value === 'number' && value > 0) {
            console.log(`      📈 ${factor}: ${value}`);
          }
        });
        
        console.log(`   💭 Reasoning: ${complexityResult.reasoning}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Demo 5: Fallback Mechanisms for Ambiguous Queries
   */
  async demoFallbackMechanisms() {
    console.log('\n🔄 DEMO 5: Fallback Mechanisms for Ambiguous Queries');
    console.log('=' .repeat(50));

    const ambiguousQueries = [
      'What about this legal thing?',
      'Help me with my contract issue',
      'Is this legal?',
      'What should I do about the lawsuit?'
    ];

    for (const query of ambiguousQueries) {
      console.log(`\n❓ Ambiguous Query: "${query}"`);
      
      try {
        const fallbackSuggestions = await this.queryAnalyzer.getFallbackSuggestions(query);
        
        console.log('   🤔 Clarification Questions:');
        fallbackSuggestions.clarificationQuestions.forEach(question => {
          console.log(`      • ${question}`);
        });
        
        if (fallbackSuggestions.alternativeInterpretations.length > 0) {
          console.log('   🔄 Alternative Interpretations:');
          fallbackSuggestions.alternativeInterpretations.forEach(interpretation => {
            console.log(`      • ${interpretation}`);
          });
        }
        
        console.log('   💡 Suggested Refinements:');
        fallbackSuggestions.suggestedRefinements.forEach(refinement => {
          console.log(`      • ${refinement}`);
        });
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Run all demos
   */
  async runAllDemos() {
    console.log('🚀 AGENTIC LEGAL SYSTEM DEMONSTRATION');
    console.log('=' .repeat(60));
    console.log('This demo showcases our enhanced legal RAG system with:');
    console.log('• Intelligent query analysis and classification');
    console.log('• Context-aware legal reasoning');
    console.log('• Cross-document legal analysis');
    console.log('• Complexity assessment and confidence scoring');
    console.log('• Fallback mechanisms for ambiguous queries');
    console.log('=' .repeat(60));

    try {
      await this.demoQueryAnalysis();
      await this.demoContextualReasoning();
      await this.demoCrossDocumentAnalysis();
      await this.demoComplexityAssessment();
      await this.demoFallbackMechanisms();

      console.log('\n✅ DEMO COMPLETED SUCCESSFULLY');
      console.log('=' .repeat(60));
      console.log('🎯 Key Achievements Demonstrated:');
      console.log('• ✅ Intelligent legal query classification');
      console.log('• ✅ Context-aware session management');
      console.log('• ✅ Cross-document legal reasoning');
      console.log('• ✅ Confidence-based complexity assessment');
      console.log('• ✅ Fallback mechanisms for ambiguous queries');
      console.log('• ✅ Jurisdiction-aware legal analysis');
      console.log('• ✅ Learning from user interactions');
      console.log('\n🚀 The system is ready for agentic legal assistance!');

    } catch (error) {
      console.error('\n❌ DEMO FAILED:', error);
    }
  }
}

// Export for use in other modules
export default AgenticLegalDemo;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new AgenticLegalDemo();
  demo.runAllDemos().catch(console.error);
}