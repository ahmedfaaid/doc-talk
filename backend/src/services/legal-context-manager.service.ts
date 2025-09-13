import {
  LegalContext,
  DocumentReference,
  SessionContext,
  QueryAnalysis,
  PrecedentNode,
  LegalEntity,
  AuthorityLevel
} from '../types/legal.types.js';
import { GraphDatabaseService } from './graph-database.service.js';
import { ChromaClientService } from './chroma-client.service.js';

/**
 * Legal Context Manager - Maintains legal context across user sessions
 * This is crucial for agentic behavior as it enables the system to:
 * - Remember previous legal queries and analyses
 * - Build up understanding of user's legal domain focus
 * - Maintain jurisdiction and document context
 * - Enable cross-document legal reasoning
 */
export class LegalContextManager {
  private graphService: GraphDatabaseService;
  private chromaService: ChromaClientService;
  private contextCache: Map<string, LegalContext> = new Map();
  getUserContext: any;

  constructor() {
    this.graphService = new GraphDatabaseService();
    this.chromaService = new ChromaClientService();
  }

  /**
   * Initialize or retrieve legal context for a user
   */
  async initializeContext(userId: string, sessionId?: string): Promise<LegalContext> {
    // Check cache first
    const cacheKey = `${userId}_${sessionId || 'default'}`;
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    // Load existing context from graph database
    const existingContext = await this.loadContextFromGraph(userId);

    if (existingContext) {
      // Update with new session if provided
      if (sessionId) {
        existingContext.activeSession = {
          sessionId,
          startTime: new Date().toISOString(),
          queryHistory: [],
          contextStack: [],
          currentJurisdiction: existingContext.primaryJurisdiction
        };
      }

      this.contextCache.set(cacheKey, existingContext);
      return existingContext;
    }

    // Create new context
    const newContext: LegalContext = {
      userId,
      primaryJurisdiction: 'unknown',
      documentCorpus: [],
      legalDomains: [],
      precedentHierarchy: [],
      activeSession: {
        sessionId: sessionId || `session_${Date.now()}`,
        startTime: new Date().toISOString(),
        queryHistory: [],
        contextStack: []
      },
      lastUpdated: new Date().toISOString()
    };

    await this.saveContextToGraph(newContext);
    this.contextCache.set(cacheKey, newContext);
    return newContext;
  }

  /**
   * Update context with new query analysis - key for agentic learning
   */
  async updateContextWithQuery(
    userId: string,
    queryAnalysis: QueryAnalysis,
    sessionId?: string
  ): Promise<LegalContext> {
    const context = await this.initializeContext(userId, sessionId);

    // Ensure activeSession exists
    if (!context.activeSession) {
      context.activeSession = {
        sessionId: sessionId || `session_${Date.now()}`,
        startTime: new Date().toISOString(),
        queryHistory: [],
        contextStack: []
      };
    }

    // Ensure queryHistory exists
    if (!context.activeSession.queryHistory) {
      context.activeSession.queryHistory = [];
    }

    // Add to query history
    context.activeSession.queryHistory.push(queryAnalysis);

    // Ensure legalDomains exists
    if (!context.legalDomains) {
      context.legalDomains = [];
    }

    // Update legal domains based on query
    for (const domain of queryAnalysis.legalDomains) {
      if (!context.legalDomains.includes(domain)) {
        context.legalDomains.push(domain);
      }
    }

    // Infer primary jurisdiction if not set
    if (context.primaryJurisdiction === 'unknown' && queryAnalysis.jurisdiction) {
      context.primaryJurisdiction = queryAnalysis.jurisdiction;
    }

    // Update context stack with key entities
    const entityTexts = queryAnalysis.entities.map(e => e.text);
    context.activeSession.contextStack.push(...entityTexts);

    // Keep context stack manageable (last 20 items)
    if (context.activeSession.contextStack.length > 20) {
      context.activeSession.contextStack = context.activeSession.contextStack.slice(-20);
    }

    context.lastUpdated = new Date().toISOString();

    await this.saveContextToGraph(context);
    this.contextCache.set(`${userId}_${sessionId || 'default'}`, context);

    return context;
  }

  /**
   * Add document to user's legal corpus - enables cross-document reasoning
   */
  async addDocumentToCorpus(
    userId: string,
    documentId: string,
    filename: string,
    documentType: string,
    jurisdiction: string,
    extractedEntities: LegalEntity[]
  ): Promise<void> {
    const context = await this.initializeContext(userId);

    const docRef: DocumentReference = {
      id: documentId,
      filename,
      documentType,
      jurisdiction,
      isLegalDocument: true,
      extractedEntities
    };

    // Add to corpus if not already present
    const existingIndex = context.documentCorpus.findIndex(doc => doc.id === documentId);
    if (existingIndex >= 0) {
      context.documentCorpus[existingIndex] = docRef;
    } else {
      context.documentCorpus.push(docRef);
    }

    // Update primary jurisdiction if this is the first document
    if (context.primaryJurisdiction === 'unknown') {
      context.primaryJurisdiction = jurisdiction;
    }

    context.lastUpdated = new Date().toISOString();
    await this.saveContextToGraph(context);

    // Clear cache to force reload
    this.contextCache.delete(`${userId}_default`);
  }

  /**
   * Get relevant context for a query - enables contextual responses
   */
  async getRelevantContext(
    userId: string,
    query: string,
    sessionId?: string
  ): Promise<{
    context: LegalContext;
    relevantDocuments: DocumentReference[];
    relatedQueries: QueryAnalysis[];
    suggestedJurisdiction?: string;
  }> {
    const context = await this.initializeContext(userId, sessionId);

    // Find relevant documents based on query content
    const relevantDocuments = await this.findRelevantDocuments(context, query);

    // Find related previous queries
    const relatedQueries = this.findRelatedQueries(context, query);

    // Suggest jurisdiction based on context
    const suggestedJurisdiction = this.inferJurisdictionFromContext(context, query);

    return {
      context,
      relevantDocuments,
      relatedQueries,
      suggestedJurisdiction
    };
  }

  /**
   * Build precedent hierarchy for legal reasoning
   */
  async buildPrecedentHierarchy(
    userId: string,
    caseEntities: LegalEntity[]
  ): Promise<PrecedentNode[]> {
    const context = await this.initializeContext(userId);

    const precedentNodes: PrecedentNode[] = [];

    for (const entity of caseEntities) {
      if (entity.type === 'case') {
        // Query graph for case relationships
        const relatedCases = await this.graphService.queryRelatedEntities({
          entityText: entity.text,
          entityType: 'case',
          limit: 10
        });

        const node: PrecedentNode = {
          caseId: entity.id,
          caseName: entity.text,
          court: entity.metadata?.court || 'Unknown Court',
          jurisdiction: entity.jurisdiction || context.primaryJurisdiction,
          date: entity.metadata?.date || 'Unknown Date',
          authority: entity.authority || AuthorityLevel.SECONDARY,
          children: []
        };

        precedentNodes.push(node);
      }
    }

    // Update context with precedent hierarchy
    context.precedentHierarchy = precedentNodes;
    await this.saveContextToGraph(context);

    return precedentNodes;
  }

  /**
   * Get cross-document insights - key for agentic analysis
   */
  async getCrossDocumentInsights(
    userId: string,
    query: string
  ): Promise<{
    commonEntities: LegalEntity[];
    conflictingProvisions: string[];
    relatedConcepts: string[];
    jurisdictionalIssues: string[];
  }> {
    const context = await this.initializeContext(userId);

    // Analyze entities across all documents
    const allEntities = context.documentCorpus.flatMap(doc => doc.extractedEntities);

    // Find common entities (appearing in multiple documents)
    const entityCounts = new Map<string, { entity: LegalEntity; count: number; docs: string[] }>();

    for (const doc of context.documentCorpus) {
      for (const entity of doc.extractedEntities) {
        const key = `${entity.text}_${entity.type}`;
        if (entityCounts.has(key)) {
          const existing = entityCounts.get(key)!;
          existing.count++;
          existing.docs.push(doc.filename);
        } else {
          entityCounts.set(key, {
            entity,
            count: 1,
            docs: [doc.filename]
          });
        }
      }
    }

    const commonEntities = Array.from(entityCounts.values())
      .filter(item => item.count > 1)
      .map(item => item.entity);

    // Identify jurisdictional issues
    const jurisdictions = [...new Set(context.documentCorpus.map(doc => doc.jurisdiction))];
    const jurisdictionalIssues = jurisdictions.length > 1
      ? [`Multiple jurisdictions detected: ${jurisdictions.join(', ')}`]
      : [];

    // Find conflicting provisions (simplified - would need more sophisticated analysis)
    const conflictingProvisions: string[] = [];
    const documentTypes = [...new Set(context.documentCorpus.map(doc => doc.documentType))];
    if (documentTypes.includes('contract') && documentTypes.includes('statute')) {
      conflictingProvisions.push('Potential conflicts between contractual obligations and statutory requirements');
    }

    // Extract related concepts from query and context
    const relatedConcepts = this.extractRelatedConcepts(query, context);

    return {
      commonEntities,
      conflictingProvisions,
      relatedConcepts,
      jurisdictionalIssues
    };
  }

  /**
   * Private helper methods
   */
  private async loadContextFromGraph(userId: string): Promise<LegalContext | null> {
    try {
      // Query graph database for user context
      const results = await this.graphService.queryRelatedEntities({
        entityText: userId,
        entityType: 'user',
        limit: 1
      });

      if (results.length > 0 && results[0].entity) {
        // Reconstruct context from graph data
        const contextData = results[0].entity;
        return JSON.parse(contextData.contextJson || '{}') as LegalContext;
      }

      return null;
    } catch (error) {
      console.error('Error loading context from graph:', error);
      return null;
    }
  }

  private async saveContextToGraph(context: LegalContext): Promise<void> {
    try {
      // Save context to graph database
      // This would involve creating/updating user context nodes
      // For now, we'll use a simplified approach
      console.log(`Saving context for user ${context.userId}`);
    } catch (error) {
      console.error('Error saving context to graph:', error);
    }
  }

  private async findRelevantDocuments(
    context: LegalContext,
    query: string
  ): Promise<DocumentReference[]> {
    // Use semantic similarity to find relevant documents
    const queryLower = query.toLowerCase();

    return context.documentCorpus.filter(doc => {
      // Check if document entities are mentioned in query
      const hasRelevantEntity = doc.extractedEntities.some(entity =>
        queryLower.includes(entity.text.toLowerCase())
      );

      // Check document type relevance
      const hasRelevantType = queryLower.includes(doc.documentType.toLowerCase());

      return hasRelevantEntity || hasRelevantType;
    });
  }

  private findRelatedQueries(context: LegalContext, query: string): QueryAnalysis[] {
    const queryLower = query.toLowerCase();

    return context.activeSession.queryHistory.filter(prevQuery => {
      // Check for similar legal domains
      const hasSimilarDomain = prevQuery.legalDomains.some(domain =>
        queryLower.includes(domain.toLowerCase())
      );

      // Check for similar entities
      const hasSimilarEntity = prevQuery.entities.some(entity =>
        queryLower.includes(entity.text.toLowerCase())
      );

      return hasSimilarDomain || hasSimilarEntity;
    });
  }

  private inferJurisdictionFromContext(context: LegalContext, query: string): string | undefined {
    // First check if query mentions specific jurisdiction
    const queryLower = query.toLowerCase();
    const jurisdictionKeywords = {
      'federal': ['federal', 'supreme court', 'circuit court'],
      'california': ['california', 'ca', 'cal.'],
      'new_york': ['new york', 'ny', 'n.y.'],
      'texas': ['texas', 'tx', 'tex.'],
      'florida': ['florida', 'fl', 'fla.']
    };

    for (const [jurisdiction, keywords] of Object.entries(jurisdictionKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return jurisdiction;
      }
    }

    // Fall back to context primary jurisdiction
    return context.primaryJurisdiction !== 'unknown' ? context.primaryJurisdiction : undefined;
  }

  private extractRelatedConcepts(query: string, context: LegalContext): string[] {
    const concepts = new Set<string>();

    // Add concepts from previous queries
    for (const prevQuery of context.activeSession.queryHistory) {
      for (const domain of prevQuery.legalDomains) {
        concepts.add(domain);
      }
    }

    // Add concepts from document corpus
    for (const doc of context.documentCorpus) {
      concepts.add(doc.documentType);
      for (const entity of doc.extractedEntities) {
        if (entity.type === 'legal_concept') {
          concepts.add(entity.text);
        }
      }
    }

    return Array.from(concepts);
  }

  /**
   * Clear context cache - useful for testing or memory management
   */
  clearCache(userId?: string): void {
    if (userId) {
      // Clear specific user's cache entries
      for (const key of this.contextCache.keys()) {
        if (key.startsWith(userId)) {
          this.contextCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.contextCache.clear();
    }
  }
}