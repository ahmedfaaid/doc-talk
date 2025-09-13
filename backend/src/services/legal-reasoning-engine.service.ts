import { llm } from '../lib/AI.js';
import {
  LegalReasoningChain,
  LegalRule,
  AnalysisStep,
  Citation,
  AlternativeAnalysis,
  ConfidenceMetrics,
  EnhancedLegalResponse,
  QueryAnalysis,
  LegalContext,
  DocumentReference,
  LegalEntity,
  AuthorityLevel
} from '../types/legal.types.js';

/**
 * Legal Reasoning Engine - Implements IRAC methodology for structured legal analysis
 * This is the core of our agentic legal system, providing:
 * - Issue identification and framing
 * - Rule extraction from legal sources
 * - Application of rules to facts
 * - Conclusion with confidence scoring
 * - Alternative analysis paths
 */
export class LegalReasoningEngine {
  
  /**
   * Generate comprehensive legal reasoning using IRAC methodology
   */
  async generateLegalReasoning(
    query: string,
    queryAnalysis: QueryAnalysis,
    context: LegalContext,
    relevantDocuments: DocumentReference[]
  ): Promise<EnhancedLegalResponse> {
    try {
      // Step 1: Issue Identification
      const issue = await this.identifyLegalIssue(query, queryAnalysis, context);
      
      // Step 2: Rule Extraction
      const applicableRules = await this.extractApplicableRules(
        issue,
        relevantDocuments,
        queryAnalysis.legalDomains,
        context.primaryJurisdiction
      );
      
      // Step 3: Analysis Generation
      const analysisSteps = await this.generateAnalysisSteps(
        issue,
        applicableRules,
        query,
        queryAnalysis.entities
      );
      
      // Step 4: Conclusion Drawing
      const conclusion = await this.drawConclusion(issue, analysisSteps, applicableRules);
      
      // Step 5: Generate Citations
      const citations = this.generateCitations(applicableRules, relevantDocuments);
      
      // Step 6: Alternative Analysis
      const alternatives = await this.generateAlternativeAnalysis(
        issue,
        applicableRules,
        analysisSteps
      );
      
      // Step 7: Confidence Assessment
      const confidence = this.assessConfidence(
        analysisSteps,
        applicableRules,
        citations,
        queryAnalysis.complexity
      );
      
      // Step 8: Generate Recommendations and Disclaimers
      const recommendations = await this.generateRecommendations(
        conclusion,
        alternatives,
        queryAnalysis.queryIntent
      );
      
      const disclaimers = this.generateLegalDisclaimers(
        queryAnalysis.queryType,
        context.primaryJurisdiction
      );
      
      const suggestedFollowUp = this.generateFollowUpQuestions(
        issue,
        conclusion,
        alternatives
      );
      
      // Construct reasoning chain
      const reasoningChain: LegalReasoningChain = {
        issue,
        applicableRules,
        analysis: analysisSteps,
        conclusion,
        confidence: confidence.overall,
        citations,
        alternatives
      };
      
      // Generate final answer
      const answer = await this.synthesizeFinalAnswer(reasoningChain, query);
      
      return {
        answer,
        reasoning: reasoningChain,
        citations,
        confidence,
        alternatives,
        recommendations,
        disclaimers,
        suggestedFollowUp
      };
      
    } catch (error) {
      console.error('Error in legal reasoning:', error);
      throw new Error(`Legal reasoning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Identify the core legal issue from the query
   */
  private async identifyLegalIssue(
    query: string,
    queryAnalysis: QueryAnalysis,
    context: LegalContext
  ): Promise<string> {
    const prompt = `
      As a legal analyst, identify the core legal issue from this query.
      
      Query: "${query}"
      Legal Domains: ${queryAnalysis.legalDomains.join(', ')}
      Query Intent: ${queryAnalysis.queryIntent}
      Jurisdiction: ${context.primaryJurisdiction}
      
      Provide a clear, concise statement of the legal issue that needs to be resolved.
      Focus on the specific legal question that must be answered.
      
      Format: "The issue is whether [specific legal question]"
    `;
    
    const response = await llm.invoke(prompt);
    return response.content.toString().trim();
  }
  
  /**
   * Extract applicable legal rules from documents and knowledge
   */
  private async extractApplicableRules(
    issue: string,
    relevantDocuments: DocumentReference[],
    legalDomains: string[],
    jurisdiction: string
  ): Promise<LegalRule[]> {
    const rules: LegalRule[] = [];
    
    // Extract rules from each relevant document
    for (const doc of relevantDocuments) {
      const docRules = await this.extractRulesFromDocument(doc, issue, jurisdiction);
      rules.push(...docRules);
    }
    
    // Add general legal principles for the domain
    const generalRules = await this.extractGeneralLegalRules(legalDomains, jurisdiction, issue);
    rules.push(...generalRules);
    
    // Rank rules by relevance and authority
    return this.rankRulesByRelevance(rules, issue);
  }
  
  /**
   * Extract rules from a specific document
   */
  private async extractRulesFromDocument(
    document: DocumentReference,
    issue: string,
    jurisdiction: string
  ): Promise<LegalRule[]> {
    const prompt = `
      Extract applicable legal rules from this document that relate to the issue.
      
      Document: ${document.filename} (${document.documentType})
      Issue: ${issue}
      Jurisdiction: ${jurisdiction}
      
      For each rule, provide:
      1. The rule text
      2. The source (document section/page)
      3. Any elements or requirements
      4. Any exceptions
      
      Return as JSON array of rules.
    `;
    
    try {
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const rulesData = JSON.parse(jsonMatch[0]);
        
        return rulesData.map((ruleData: any, index: number) => ({
          id: `${document.id}_rule_${index}`,
          text: ruleData.text || ruleData.rule || '',
          source: `${document.filename} - ${ruleData.source || 'Document'}`,
          authority: this.determineAuthorityLevel(document.documentType),
          jurisdiction,
          elements: ruleData.elements || [],
          exceptions: ruleData.exceptions || [],
          relatedRules: []
        }));
      }
    } catch (error) {
      console.error('Error extracting rules from document:', error);
    }
    
    return [];
  }
  
  /**
   * Extract general legal rules for the domain
   */
  private async extractGeneralLegalRules(
    legalDomains: string[],
    jurisdiction: string,
    issue: string
  ): Promise<LegalRule[]> {
    const prompt = `
      Provide the fundamental legal rules and principles for these legal domains that apply to the issue.
      
      Legal Domains: ${legalDomains.join(', ')}
      Jurisdiction: ${jurisdiction}
      Issue: ${issue}
      
      Include:
      - Statutory requirements
      - Common law principles
      - Regulatory standards
      - Constitutional provisions (if applicable)
      
      Return as JSON array with rule text, source, elements, and exceptions.
    `;
    
    try {
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString();
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const rulesData = JSON.parse(jsonMatch[0]);
        
        return rulesData.map((ruleData: any, index: number) => ({
          id: `general_rule_${index}`,
          text: ruleData.text || ruleData.rule || '',
          source: ruleData.source || 'General Legal Principle',
          authority: 'primary' as AuthorityLevel,
          jurisdiction,
          elements: ruleData.elements || [],
          exceptions: ruleData.exceptions || [],
          relatedRules: []
        }));
      }
    } catch (error) {
      console.error('Error extracting general legal rules:', error);
    }
    
    return [];
  }
  
  /**
   * Generate analysis steps applying rules to facts
   */
  private async generateAnalysisSteps(
    issue: string,
    applicableRules: LegalRule[],
    query: string,
    entities: LegalEntity[]
  ): Promise<AnalysisStep[]> {
    const steps: AnalysisStep[] = [];
    
    for (let i = 0; i < applicableRules.length; i++) {
      const rule = applicableRules[i];
      
      const prompt = `
        Apply this legal rule to the facts presented in the query.
        
        Rule: ${rule.text}
        Source: ${rule.source}
        Elements: ${rule.elements.join(', ')}
        
        Query/Facts: ${query}
        Legal Entities: ${entities.map(e => `${e.text} (${e.type})`).join(', ')}
        
        Provide:
        1. How this rule applies to the facts
        2. Which elements are satisfied/not satisfied
        3. Supporting evidence from the facts
        4. Any gaps or ambiguities
        
        Be specific and cite relevant facts.
      `;
      
      try {
        const response = await llm.invoke(prompt);
        const analysisText = response.content.toString();
        
        const step: AnalysisStep = {
          stepNumber: i + 1,
          description: `Application of ${rule.source}`,
          reasoning: analysisText,
          supportingEvidence: this.extractSupportingEvidence(analysisText, entities),
          confidence: this.assessStepConfidence(rule, analysisText),
          citations: [{
            id: `citation_${rule.id}`,
            text: rule.text,
            source: rule.source,
            authority: rule.authority,
            jurisdiction: rule.jurisdiction
          }]
        };
        
        steps.push(step);
      } catch (error) {
        console.error('Error generating analysis step:', error);
      }
    }
    
    return steps;
  }
  
  /**
   * Draw conclusion based on analysis
   */
  private async drawConclusion(
    issue: string,
    analysisSteps: AnalysisStep[],
    applicableRules: LegalRule[]
  ): Promise<string> {
    const analysisText = analysisSteps.map(step => 
      `${step.description}: ${step.reasoning}`
    ).join('\n\n');
    
    const prompt = `
      Based on the legal analysis, provide a conclusion that answers the legal issue.
      
      Issue: ${issue}
      
      Analysis:
      ${analysisText}
      
      Applicable Rules: ${applicableRules.map(r => r.text).join('; ')}
      
      Provide a clear, definitive conclusion that:
      1. Directly answers the legal issue
      2. Explains the reasoning
      3. Acknowledges any limitations or uncertainties
      4. States the likely legal outcome
    `;
    
    const response = await llm.invoke(prompt);
    return response.content.toString().trim();
  }
  
  /**
   * Generate alternative analysis paths
   */
  private async generateAlternativeAnalysis(
    issue: string,
    applicableRules: LegalRule[],
    analysisSteps: AnalysisStep[]
  ): Promise<AlternativeAnalysis[]> {
    const alternatives: AlternativeAnalysis[] = [];
    
    // Generate alternative interpretations
    const prompt = `
      Consider alternative legal theories or interpretations for this issue.
      
      Issue: ${issue}
      Primary Analysis: ${analysisSteps.map(s => s.reasoning).join(' ')}
      
      Provide 2-3 alternative legal approaches or interpretations that could lead to different outcomes.
      For each alternative, explain:
      1. The alternative theory
      2. The reasoning
      3. The strength of this approach
      4. Supporting authorities
      
      Return as JSON array.
    `;
    
    try {
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString();
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const alternativesData = JSON.parse(jsonMatch[0]);
        
        return alternativesData.map((alt: any, index: number) => ({
          theory: alt.theory || `Alternative Theory ${index + 1}`,
          reasoning: alt.reasoning || '',
          strength: alt.strength || 0.5,
          citations: alt.citations || []
        }));
      }
    } catch (error) {
      console.error('Error generating alternative analysis:', error);
    }
    
    return alternatives;
  }
  
  /**
   * Assess confidence in the reasoning
   */
  private assessConfidence(
    analysisSteps: AnalysisStep[],
    applicableRules: LegalRule[],
    citations: Citation[],
    complexity: string
  ): ConfidenceMetrics {
    // Base confidence on various factors
    let overall = 0.7; // Base confidence
    
    // Adjust based on number and quality of rules
    const primaryRules = applicableRules.filter(r => r.authority === 'primary').length;
    const ruleConfidence = Math.min(0.9, 0.5 + (primaryRules * 0.1));
    
    // Adjust based on analysis depth
    const reasoningConfidence = Math.min(0.9, 0.4 + (analysisSteps.length * 0.1));
    
    // Adjust based on citations
    const citationConfidence = Math.min(0.9, 0.3 + (citations.length * 0.05));
    
    // Adjust based on complexity
    const complexityPenalty = complexity === 'very_high' ? 0.2 : 
                             complexity === 'high' ? 0.1 : 0;
    
    overall = Math.max(0.1, Math.min(0.95, 
      (ruleConfidence + reasoningConfidence + citationConfidence) / 3 - complexityPenalty
    ));
    
    return {
      overall,
      reasoning: reasoningConfidence,
      citations: citationConfidence,
      completeness: Math.min(0.9, analysisSteps.length / 3),
      jurisdiction: applicableRules.length > 0 ? 0.8 : 0.5
    };
  }
  
  /**
   * Generate practical recommendations
   */
  private async generateRecommendations(
    conclusion: string,
    alternatives: AlternativeAnalysis[],
    queryIntent: string
  ): Promise<string[]> {
    const prompt = `
      Based on the legal conclusion and alternatives, provide practical recommendations.
      
      Conclusion: ${conclusion}
      Query Intent: ${queryIntent}
      Alternatives: ${alternatives.map(a => a.theory).join('; ')}
      
      Provide 3-5 specific, actionable recommendations such as:
      - Next steps to take
      - Additional research needed
      - Risk mitigation strategies
      - Documentation requirements
      - Professional consultation needs
      
      Return as JSON array of recommendation strings.
    `;
    
    try {
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString();
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
    
    return [
      'Consult with a qualified attorney for specific legal advice',
      'Review all relevant documentation carefully',
      'Consider the jurisdiction-specific requirements'
    ];
  }
  
  /**
   * Helper methods
   */
  private determineAuthorityLevel(documentType: string): AuthorityLevel {
    switch (documentType.toLowerCase()) {
      case 'statute':
      case 'regulation':
      case 'constitutional':
        return 'primary';
      case 'case':
      case 'court_decision':
        return 'binding';
      case 'contract':
        return 'secondary';
      default:
        return 'persuasive';
    }
  }
  
  private rankRulesByRelevance(rules: LegalRule[], issue: string): LegalRule[] {
    // Simple relevance scoring based on text similarity
    return rules.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, issue);
      const scoreB = this.calculateRelevanceScore(b, issue);
      return scoreB - scoreA;
    });
  }
  
  private calculateRelevanceScore(rule: LegalRule, issue: string): number {
    const issueWords = issue.toLowerCase().split(' ');
    const ruleWords = rule.text.toLowerCase().split(' ');
    
    let score = 0;
    for (const word of issueWords) {
      if (word.length > 3 && ruleWords.includes(word)) {
        score += 1;
      }
    }
    
    // Boost score for primary authority
    if (rule.authority === 'primary' || rule.authority === 'binding') {
      score *= 1.5;
    }
    
    return score;
  }
  
  private extractSupportingEvidence(analysisText: string, entities: LegalEntity[]): string[] {
    const evidence: string[] = [];
    
    // Extract sentences that mention entities
    const sentences = analysisText.split(/[.!?]+/);
    for (const sentence of sentences) {
      for (const entity of entities) {
        if (sentence.toLowerCase().includes(entity.text.toLowerCase())) {
          evidence.push(sentence.trim());
          break;
        }
      }
    }
    
    return [...new Set(evidence)]; // Remove duplicates
  }
  
  private assessStepConfidence(rule: LegalRule, analysisText: string): number {
    let confidence = 0.6; // Base confidence
    
    // Boost for primary authority
    if (rule.authority === 'primary' || rule.authority === 'binding') {
      confidence += 0.2;
    }
    
    // Boost for detailed analysis
    if (analysisText.length > 200) {
      confidence += 0.1;
    }
    
    // Check for uncertainty indicators
    const uncertaintyWords = ['may', 'might', 'possibly', 'unclear', 'ambiguous'];
    const hasUncertainty = uncertaintyWords.some(word => 
      analysisText.toLowerCase().includes(word)
    );
    
    if (hasUncertainty) {
      confidence -= 0.2;
    }
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
  
  private generateCitations(rules: LegalRule[], documents: DocumentReference[]): Citation[] {
    const citations: Citation[] = [];
    
    // Add citations from rules
    for (const rule of rules) {
      citations.push({
        id: `citation_${rule.id}`,
        text: rule.text,
        source: rule.source,
        authority: rule.authority,
        jurisdiction: rule.jurisdiction
      });
    }
    
    // Add citations from documents
    for (const doc of documents) {
      citations.push({
        id: `doc_citation_${doc.id}`,
        text: `Referenced in analysis`,
        source: doc.filename,
        authority: this.determineAuthorityLevel(doc.documentType),
        jurisdiction: doc.jurisdiction
      });
    }
    
    return citations;
  }
  
  private generateLegalDisclaimers(queryType: string, jurisdiction: string): string[] {
    const disclaimers = [
      'This analysis is for informational purposes only and does not constitute legal advice.',
      'Consult with a qualified attorney licensed in your jurisdiction for specific legal guidance.',
      'Legal requirements and interpretations may vary by jurisdiction and change over time.'
    ];
    
    if (jurisdiction === 'unknown') {
      disclaimers.push('Jurisdiction-specific requirements have not been fully considered in this analysis.');
    }
    
    if (queryType === 'compliance') {
      disclaimers.push('Compliance requirements should be verified with current regulations and legal counsel.');
    }
    
    return disclaimers;
  }
  
  private generateFollowUpQuestions(
    issue: string,
    conclusion: string,
    alternatives: AlternativeAnalysis[]
  ): string[] {
    const questions = [
      'What specific facts or circumstances might change this analysis?',
      'Are there any recent legal developments that could affect this conclusion?',
      'What additional documentation would strengthen this legal position?'
    ];
    
    if (alternatives.length > 0) {
      questions.push('Which alternative legal theory would be most advantageous to pursue?');
    }
    
    return questions;
  }
  
  private async synthesizeFinalAnswer(
    reasoningChain: LegalReasoningChain,
    originalQuery: string
  ): Promise<string> {
    const prompt = `
      Synthesize a comprehensive answer to the original legal query based on the reasoning chain.
      
      Original Query: ${originalQuery}
      Issue: ${reasoningChain.issue}
      Conclusion: ${reasoningChain.conclusion}
      Analysis Steps: ${reasoningChain.analysis.length}
      Confidence: ${reasoningChain.confidence}
      
      Provide a clear, well-structured answer that:
      1. Directly addresses the original query
      2. Summarizes the key legal findings
      3. Explains the reasoning process
      4. Acknowledges limitations and uncertainties
      5. Is accessible to both legal and non-legal audiences
      
      Format the response in markdown with clear sections.
    `;
    
    const response = await llm.invoke(prompt);
    return response.content.toString();
  }
}