import { llm } from '../lib/AI.js';
import {
    QueryAnalysis,
    QueryType,
    QueryIntent,
    ComplexityLevel,
    LegalContext,
    LegalEntity
} from '../types/legal.types.js';
import { EntityExtractor } from './entity-extractor.service.js';

export class LegalQueryAnalyzer {
    private entityExtractor: EntityExtractor;

    constructor() {
        this.entityExtractor = new EntityExtractor();
    }

    /**
     * Analyze a legal query and return comprehensive analysis
     */
    async analyzeQuery(query: string, context?: LegalContext): Promise<QueryAnalysis> {
        try {
            // Run analysis tasks in parallel for better performance
            const [
                queryType,
                queryIntent,
                legalDomains,
                complexity,
                entities,
                documentTypes,
                jurisdiction
            ] = await Promise.all([
                this.classifyQueryType(query),
                this.detectQueryIntent(query),
                this.classifyLegalDomain(query),
                this.assessComplexity(query),
                this.entityExtractor.extractEntities(query),
                this.inferDocumentTypes(query),
                this.inferJurisdiction(query, context)
            ]);

            // Determine suggested tools based on analysis
            const suggestedTools = this.determineSuggestedTools(
                queryType,
                queryIntent,
                documentTypes,
                legalDomains
            );

            // Calculate overall confidence
            const confidence = this.calculateOverallConfidence(
                queryType,
                queryIntent,
                legalDomains,
                complexity,
                entities
            );

            return {
                originalQuery: query,
                queryType,
                queryIntent,
                legalDomains,
                complexity,
                jurisdiction,
                documentTypes,
                entities,
                confidence,
                suggestedTools,
                metadata: {
                    analysisTimestamp: new Date().toISOString(),
                    contextUsed: !!context
                }
            };
        } catch (error) {
            console.error('Error analyzing legal query:', error);
            throw new Error(`Failed to analyze legal query: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Classify the type of legal query
     */
    async classifyQueryType(query: string): Promise<QueryType> {
        try {
            const prompt = `
        Analyze this legal query and classify it into ONE of these categories:
        - RESEARCH: Looking for legal information, precedents, or authorities
        - ANALYSIS: Analyzing legal situations, documents, or implications
        - DRAFTING: Creating or modifying legal documents
        - COMPLIANCE: Checking compliance with laws or regulations
        - INTERPRETATION: Interpreting legal text, statutes, or contracts
        - COMPARISON: Comparing legal concepts, cases, or jurisdictions
        - PRECEDENT_SEARCH: Specifically looking for case law or precedents

        Query: "${query}"

        Respond with ONLY the category name (e.g., "RESEARCH").
      `;

            const response = await llm.invoke(prompt);
            const classification = response.content.toString().trim().toUpperCase();

            // Validate and return the classification
            if (Object.values(QueryType).includes(classification as QueryType)) {
                return classification as QueryType;
            }

            // Default fallback
            return QueryType.RESEARCH;
        } catch (error) {
            console.error('Error classifying query type:', error);
            return QueryType.RESEARCH;
        }
    }

    /**
     * Detect the specific intent of the legal query
     */
    async detectQueryIntent(query: string): Promise<QueryIntent> {
        try {
            const prompt = `
        Analyze this legal query and determine the specific intent from these options:
        - FIND_PRECEDENT: Looking for similar cases or legal precedents
        - ANALYZE_CONTRACT: Analyzing contract terms, obligations, or risks
        - INTERPRET_STATUTE: Interpreting statutory language or requirements
        - ASSESS_RISK: Evaluating legal risks or potential issues
        - DRAFT_DOCUMENT: Creating or modifying legal documents
        - COMPLIANCE_CHECK: Checking compliance with laws or regulations
        - CASE_COMPARISON: Comparing different cases or legal situations

        Query: "${query}"

        Respond with ONLY the intent name (e.g., "FIND_PRECEDENT").
      `;

            const response = await llm.invoke(prompt);
            const intent = response.content.toString().trim().toUpperCase();

            // Validate and return the intent
            if (Object.values(QueryIntent).includes(intent as QueryIntent)) {
                return intent as QueryIntent;
            }

            // Default fallback based on common patterns
            if (query.toLowerCase().includes('contract')) return QueryIntent.ANALYZE_CONTRACT;
            if (query.toLowerCase().includes('statute') || query.toLowerCase().includes('law')) return QueryIntent.INTERPRET_STATUTE;
            if (query.toLowerCase().includes('case') || query.toLowerCase().includes('precedent')) return QueryIntent.FIND_PRECEDENT;
            if (query.toLowerCase().includes('risk')) return QueryIntent.ASSESS_RISK;
            if (query.toLowerCase().includes('compliance')) return QueryIntent.COMPLIANCE_CHECK;

            return QueryIntent.FIND_PRECEDENT;
        } catch (error) {
            console.error('Error detecting query intent:', error);
            return QueryIntent.FIND_PRECEDENT;
        }
    }

    /**
     * Classify the legal domain(s) of the query
     */
    async classifyLegalDomain(query: string): Promise<string[]> {
        try {
            const prompt = `
        Identify the legal domain(s) for this query. Return a JSON array of relevant domains from this list:
        ["Contract Law", "Criminal Law", "Civil Procedure", "Constitutional Law", "Corporate Law", 
         "Employment Law", "Intellectual Property", "Real Estate Law", "Family Law", "Tax Law", 
         "Securities Law", "Environmental Law", "Immigration Law", "Administrative Law", 
         "Tort Law", "Evidence Law", "Bankruptcy Law", "International Law", "Antitrust Law", "Other"]

        Query: "${query}"

        Return ONLY a valid JSON array like: ["Contract Law", "Corporate Law"]
      `;

            const response = await llm.invoke(prompt);
            const responseText = response.content.toString().trim();

            // Extract JSON array from response
            const jsonMatch = responseText.match(/\[.*\]/);
            if (jsonMatch) {
                const domains = JSON.parse(jsonMatch[0]) as string[];
                return domains.length > 0 ? domains : ['Other'];
            }

            // Fallback domain detection
            return this.fallbackDomainDetection(query);
        } catch (error) {
            console.error('Error classifying legal domain:', error);
            return this.fallbackDomainDetection(query);
        }
    }

    /**
     * Assess the complexity level of the legal query
     */
    async assessComplexity(query: string): Promise<ComplexityLevel> {
        try {
            // Calculate complexity based on multiple factors
            const queryLength = query.length;
            const legalTermsCount = this.countLegalTerms(query);
            const booleanFactors = {
                multipleJurisdictions: this.hasMultipleJurisdictions(query),
                crossReferences: this.hasCrossReferences(query),
                multipleParties: this.hasMultipleParties(query),
                temporalElements: this.hasTemporalElements(query),
                technicalLanguage: this.hasTechnicalLanguage(query),
                proceduralComplexity: this.hasProceduralComplexity(query),
                multipleDocuments: this.referencesMultipleDocuments(query)
            };

            let complexityScore = 0;

            // Length factor (0-2 points)
            if (queryLength > 500) complexityScore += 2;
            else if (queryLength > 200) complexityScore += 1;

            // Legal terms factor (0-3 points)
            if (legalTermsCount > 10) complexityScore += 3;
            else if (legalTermsCount > 5) complexityScore += 2;
            else if (legalTermsCount > 2) complexityScore += 1;

            // Other factors (1 point each)
            if (booleanFactors.multipleJurisdictions) complexityScore += 1;
            if (booleanFactors.crossReferences) complexityScore += 1;
            if (booleanFactors.multipleParties) complexityScore += 1;
            if (booleanFactors.temporalElements) complexityScore += 1;
            if (booleanFactors.technicalLanguage) complexityScore += 1;
            if (booleanFactors.proceduralComplexity) complexityScore += 1;
            if (booleanFactors.multipleDocuments) complexityScore += 1;

            // Determine complexity level with enhanced thresholds
            if (complexityScore >= 8) return ComplexityLevel.VERY_HIGH;
            if (complexityScore >= 6) return ComplexityLevel.HIGH;
            if (complexityScore >= 3) return ComplexityLevel.MEDIUM;
            return ComplexityLevel.LOW;
        } catch (error) {
            console.error('Error assessing complexity:', error);
            return ComplexityLevel.MEDIUM;
        }
    }

    /**
     * Assess complexity with confidence metrics
     */
    async assessComplexityWithConfidence(query: string): Promise<{
        complexity: ComplexityLevel;
        confidence: number;
        factors: Record<string, boolean | number>;
        reasoning: string;
    }> {
        try {
            const factors: Record<string, boolean | number> = {
                length: query.length,
                legalTerms: this.countLegalTerms(query),
                multipleJurisdictions: this.hasMultipleJurisdictions(query),
                crossReferences: this.hasCrossReferences(query),
                multipleParties: this.hasMultipleParties(query),
                temporalElements: this.hasTemporalElements(query),
                technicalLanguage: this.hasTechnicalLanguage(query),
                proceduralComplexity: this.hasProceduralComplexity(query),
                multipleDocuments: this.referencesMultipleDocuments(query)
            };

            const complexity = await this.assessComplexity(query);

            // Calculate confidence based on clarity of indicators
            let confidence = 0.7; // Base confidence

            // Boost confidence if multiple clear indicators
            const positiveFactors = Object.values(factors).filter(f =>
                typeof f === 'boolean' ? f : f > 0
            ).length;

            if (positiveFactors >= 4) confidence += 0.2;
            else if (positiveFactors >= 2) confidence += 0.1;
            else if (positiveFactors === 0) confidence -= 0.2;

            // Generate reasoning
            const reasoning = this.generateComplexityReasoning(factors, complexity);

            return {
                complexity,
                confidence: Math.max(0.1, Math.min(1.0, confidence)),
                factors,
                reasoning
            };
        } catch (error) {
            console.error('Error assessing complexity with confidence:', error);
            return {
                complexity: ComplexityLevel.MEDIUM,
                confidence: 0.5,
                factors: {},
                reasoning: 'Unable to assess complexity due to analysis error'
            };
        }
    }

    /**
     * Generate human-readable reasoning for complexity assessment
     */
    private generateComplexityReasoning(
        factors: Record<string, boolean | number>,
        complexity: ComplexityLevel
    ): string {
        const reasons: string[] = [];

        if (typeof factors.length === 'number' && factors.length > 500) {
            reasons.push('lengthy query requiring detailed analysis');
        }
        if (typeof factors.legalTerms === 'number' && factors.legalTerms > 5) {
            reasons.push(`multiple legal terms (${factors.legalTerms}) indicating specialized knowledge`);
        }
        if (factors.multipleJurisdictions) {
            reasons.push('multiple jurisdictions requiring comparative analysis');
        }
        if (factors.crossReferences) {
            reasons.push('cross-references between legal authorities');
        }
        if (factors.multipleParties) {
            reasons.push('multiple parties with potentially conflicting interests');
        }
        if (factors.temporalElements) {
            reasons.push('temporal elements requiring chronological analysis');
        }
        if (factors.technicalLanguage) {
            reasons.push('technical legal language requiring specialized interpretation');
        }
        if (factors.proceduralComplexity) {
            reasons.push('procedural complexity involving multiple legal steps');
        }
        if (factors.multipleDocuments) {
            reasons.push('references to multiple documents requiring synthesis');
        }

        if (reasons.length === 0) {
            return `Query assessed as ${complexity.toLowerCase()} complexity with straightforward legal concepts`;
        }

        return `Query assessed as ${complexity.toLowerCase()} complexity due to: ${reasons.join(', ')}`;
    }

    /**
     * Infer relevant document types for the query
     */
    private async inferDocumentTypes(query: string): Promise<string[]> {
        const documentTypeKeywords = {
            'contract': ['contract', 'agreement', 'terms', 'obligations', 'parties'],
            'case_law': ['case', 'court', 'decision', 'ruling', 'precedent', 'holding'],
            'statute': ['statute', 'law', 'code', 'section', 'regulation', 'rule'],
            'litigation': ['complaint', 'motion', 'brief', 'pleading', 'discovery'],
            'corporate': ['bylaws', 'articles', 'incorporation', 'merger', 'acquisition'],
            'regulatory': ['regulation', 'compliance', 'filing', 'disclosure']
        };

        const queryLower = query.toLowerCase();
        const relevantTypes: string[] = [];

        for (const [type, keywords] of Object.entries(documentTypeKeywords)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                relevantTypes.push(type);
            }
        }

        return relevantTypes.length > 0 ? relevantTypes : ['general'];
    }

    /**
     * Infer jurisdiction from query and context
     */
    private async inferJurisdiction(query: string, context?: LegalContext): Promise<string | undefined> {
        // First check if context provides jurisdiction
        if (context?.primaryJurisdiction) {
            return context.primaryJurisdiction;
        }

        // Look for jurisdiction indicators in the query
        const jurisdictionKeywords = {
            'federal': ['federal', 'supreme court', 'circuit court', 'district court', 'sec', 'irs'],
            'california': ['california', 'ca', 'cal.', 'ninth circuit'],
            'new_york': ['new york', 'ny', 'n.y.', 'second circuit'],
            'texas': ['texas', 'tx', 'tex.', 'fifth circuit'],
            'florida': ['florida', 'fl', 'fla.', 'eleventh circuit'],
            'delaware': ['delaware', 'del.', 'chancery court'],
            'uk': ['uk', 'united kingdom', 'england', 'wales', 'scotland'],
            'eu': ['eu', 'european union', 'gdpr', 'european court']
        };

        const queryLower = query.toLowerCase();
        for (const [jurisdiction, keywords] of Object.entries(jurisdictionKeywords)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                return jurisdiction;
            }
        }

        return undefined;
    }

    /**
     * Determine suggested tools based on analysis
     */
    private determineSuggestedTools(
        _queryType: QueryType,
        queryIntent: QueryIntent,
        documentTypes: string[],
        legalDomains: string[]
    ): string[] {
        const tools: string[] = [];

        // Base tools for all queries
        tools.push('search_legal_documents');

        // Intent-based tool selection
        switch (queryIntent) {
            case QueryIntent.ANALYZE_CONTRACT:
                tools.push('contract_analysis_tool');
                break;
            case QueryIntent.FIND_PRECEDENT:
                tools.push('case_law_analysis_tool', 'precedent_search_tool');
                break;
            case QueryIntent.INTERPRET_STATUTE:
                tools.push('statutory_analysis_tool');
                break;
            case QueryIntent.ASSESS_RISK:
                tools.push('risk_assessment_tool');
                break;
            case QueryIntent.COMPLIANCE_CHECK:
                tools.push('compliance_analysis_tool');
                break;
        }

        // Document type-based tool selection
        if (documentTypes.includes('contract')) {
            tools.push('contract_analysis_tool');
        }
        if (documentTypes.includes('case_law')) {
            tools.push('case_law_analysis_tool');
        }
        if (documentTypes.includes('statute')) {
            tools.push('statutory_analysis_tool');
        }

        // Domain-specific tools
        if (legalDomains.includes('Contract Law')) {
            tools.push('contract_analysis_tool');
        }
        if (legalDomains.includes('Corporate Law')) {
            tools.push('corporate_analysis_tool');
        }

        // Always include entity extraction and legal reasoning
        tools.push('find_legal_entities', 'legal_reasoning_engine');

        // Remove duplicates and return
        return [...new Set(tools)];
    }

    /**
     * Calculate overall confidence score
     */
    private calculateOverallConfidence(
        _queryType: QueryType,
        _queryIntent: QueryIntent,
        legalDomains: string[],
        complexity: ComplexityLevel,
        entities: LegalEntity[]
    ): number {
        let confidence = 0.5; // Base confidence

        // Boost confidence if we have clear legal entities
        if (entities.length > 0) {
            confidence += 0.2;
        }

        // Boost confidence if we have specific legal domains
        if (legalDomains.length > 0 && !legalDomains.includes('Other')) {
            confidence += 0.2;
        }

        // Adjust based on complexity (simpler queries are more confident)
        switch (complexity) {
            case ComplexityLevel.LOW:
                confidence += 0.1;
                break;
            case ComplexityLevel.VERY_HIGH:
                confidence -= 0.1;
                break;
        }

        // Ensure confidence is within bounds
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Fallback domain detection using keyword matching
     */
    private fallbackDomainDetection(query: string): string[] {
        const domainKeywords = {
            'Contract Law': ['contract', 'agreement', 'breach', 'terms', 'consideration'],
            'Criminal Law': ['criminal', 'crime', 'felony', 'misdemeanor', 'prosecution'],
            'Civil Procedure': ['motion', 'discovery', 'pleading', 'jurisdiction', 'venue'],
            'Corporate Law': ['corporation', 'merger', 'acquisition', 'securities', 'board'],
            'Employment Law': ['employment', 'discrimination', 'harassment', 'wage', 'termination'],
            'Intellectual Property': ['patent', 'trademark', 'copyright', 'trade secret', 'infringement'],
            'Real Estate Law': ['property', 'real estate', 'lease', 'mortgage', 'zoning'],
            'Family Law': ['divorce', 'custody', 'alimony', 'adoption', 'marriage'],
            'Tax Law': ['tax', 'irs', 'deduction', 'audit', 'revenue']
        };

        const queryLower = query.toLowerCase();
        const matchedDomains: string[] = [];

        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                matchedDomains.push(domain);
            }
        }

        return matchedDomains.length > 0 ? matchedDomains : ['Other'];
    }

    /**
     * Helper methods for complexity assessment
     */
    private countLegalTerms(query: string): number {
        const legalTerms = [
            'plaintiff', 'defendant', 'jurisdiction', 'precedent', 'statute', 'regulation',
            'contract', 'breach', 'damages', 'liability', 'negligence', 'tort', 'remedy',
            'injunction', 'discovery', 'motion', 'appeal', 'court', 'judge', 'jury',
            'evidence', 'testimony', 'witness', 'subpoena', 'deposition', 'settlement'
        ];

        const queryLower = query.toLowerCase();
        return legalTerms.filter(term => queryLower.includes(term)).length;
    }

    private hasMultipleJurisdictions(query: string): boolean {
        const jurisdictions = ['federal', 'state', 'california', 'new york', 'texas', 'florida', 'uk', 'eu'];
        const queryLower = query.toLowerCase();
        return jurisdictions.filter(jurisdiction => queryLower.includes(jurisdiction)).length > 1;
    }

    private hasCrossReferences(query: string): boolean {
        const crossRefIndicators = ['section', 'subsection', 'paragraph', 'clause', 'article', 'see also', 'cf.', 'compare'];
        const queryLower = query.toLowerCase();
        return crossRefIndicators.some(indicator => queryLower.includes(indicator));
    }

    private hasMultipleParties(query: string): boolean {
        const partyIndicators = ['plaintiff', 'defendant', 'petitioner', 'respondent', 'appellant', 'appellee'];
        const queryLower = query.toLowerCase();
        return partyIndicators.filter(indicator => queryLower.includes(indicator)).length > 1;
    }

    private hasTemporalElements(query: string): boolean {
        const temporalIndicators = ['before', 'after', 'during', 'since', 'until', 'from', 'to', 'between'];
        const queryLower = query.toLowerCase();
        return temporalIndicators.some(indicator => queryLower.includes(indicator));
    }

    private hasTechnicalLanguage(query: string): boolean {
        const technicalTerms = [
            'res judicata', 'stare decisis', 'prima facie', 'de facto', 'de jure',
            'habeas corpus', 'amicus curiae', 'certiorari', 'mandamus', 'injunction',
            'estoppel', 'laches', 'quantum meruit', 'ultra vires', 'voir dire',
            'mens rea', 'actus reus', 'proximate cause', 'strict liability',
            'fiduciary duty', 'due process', 'equal protection', 'commerce clause'
        ];
        const queryLower = query.toLowerCase();
        return technicalTerms.some(term => queryLower.includes(term));
    }

    private hasProceduralComplexity(query: string): boolean {
        const proceduralTerms = [
            'motion to dismiss', 'summary judgment', 'discovery', 'deposition',
            'interrogatories', 'requests for admission', 'subpoena', 'appeal',
            'remand', 'venue', 'jurisdiction', 'standing', 'ripeness', 'mootness',
            'class action', 'joinder', 'intervention', 'consolidation'
        ];
        const queryLower = query.toLowerCase();
        return proceduralTerms.some(term => queryLower.includes(term));
    }

    private referencesMultipleDocuments(query: string): boolean {
        const documentIndicators = [
            'contract and', 'agreement and', 'statute and', 'case and',
            'multiple', 'various', 'several', 'different', 'compare',
            'contrast', 'versus', 'vs.', 'v.', 'between'
        ];
        const queryLower = query.toLowerCase();
        return documentIndicators.some(indicator => queryLower.includes(indicator));
    }

    /**
     * Get fallback mechanisms for ambiguous queries
     */
    async getFallbackSuggestions(query: string): Promise<{
        clarificationQuestions: string[];
        alternativeInterpretations: string[];
        suggestedRefinements: string[];
    }> {
        try {
            const analysis = await this.analyzeQuery(query);

            const clarificationQuestions: string[] = [];
            const alternativeInterpretations: string[] = [];
            const suggestedRefinements: string[] = [];

            // Generate clarification questions based on ambiguity
            if (!analysis.jurisdiction) {
                clarificationQuestions.push('Which jurisdiction or legal system applies to your question?');
            }

            if (analysis.legalDomains.includes('Other') || analysis.legalDomains.length > 3) {
                clarificationQuestions.push('Which specific area of law is most relevant to your question?');
            }

            if (analysis.complexity === ComplexityLevel.VERY_HIGH) {
                clarificationQuestions.push('Could you break down your question into more specific parts?');
                suggestedRefinements.push('Consider focusing on one specific legal issue at a time');
            }

            // Generate alternative interpretations
            if (analysis.queryIntent === QueryIntent.FIND_PRECEDENT) {
                alternativeInterpretations.push('Looking for case law analysis');
                alternativeInterpretations.push('Seeking statutory interpretation');
            }

            if (analysis.queryType === QueryType.ANALYSIS) {
                alternativeInterpretations.push('Risk assessment request');
                alternativeInterpretations.push('Compliance evaluation');
            }

            // Generate refinement suggestions
            if (analysis.entities.length === 0) {
                suggestedRefinements.push('Include specific legal entities, cases, or statutes');
            }

            if (analysis.confidence < 0.6) {
                suggestedRefinements.push('Provide more context about the legal situation');
                suggestedRefinements.push('Specify the type of legal document or issue involved');
            }

            return {
                clarificationQuestions,
                alternativeInterpretations,
                suggestedRefinements
            };
        } catch (error) {
            console.error('Error generating fallback suggestions:', error);
            return {
                clarificationQuestions: ['Could you provide more details about your legal question?'],
                alternativeInterpretations: [],
                suggestedRefinements: ['Try rephrasing your question with more specific legal terms']
            };
        }
    }
}