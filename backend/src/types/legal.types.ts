// Enhanced Legal Entity and Data Models

export enum LegalEntityType {
  CASE = 'case',
  STATUTE = 'statute',
  REGULATION = 'regulation',
  COURT = 'court',
  PARTY = 'party',
  JUDGE = 'judge',
  LAWYER = 'lawyer',
  LEGAL_CONCEPT = 'legal_concept',
  PROCEDURAL_RULE = 'procedural_rule',
  CONTRACT_TERM = 'contract_term',
  CITATION = 'citation',
  DATE = 'date',
  LOCATION = 'location',
  ORGANIZATION = 'organization'
}

export enum QueryType {
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  DRAFTING = 'drafting',
  COMPLIANCE = 'compliance',
  INTERPRETATION = 'interpretation',
  COMPARISON = 'comparison',
  PRECEDENT_SEARCH = 'precedent_search'
}

export enum QueryIntent {
  FIND_PRECEDENT = 'find_precedent',
  ANALYZE_CONTRACT = 'analyze_contract',
  INTERPRET_STATUTE = 'interpret_statute',
  ASSESS_RISK = 'assess_risk',
  DRAFT_DOCUMENT = 'draft_document',
  COMPLIANCE_CHECK = 'compliance_check',
  CASE_COMPARISON = 'case_comparison'
}

export enum ComplexityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum AuthorityLevel {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  PERSUASIVE = 'persuasive',
  BINDING = 'binding'
}

export enum LegalErrorType {
  INSUFFICIENT_LEGAL_CONTEXT = 'insufficient_legal_context',
  CONFLICTING_JURISDICTIONS = 'conflicting_jurisdictions',
  OUTDATED_LEGAL_INFORMATION = 'outdated_legal_information',
  UNAUTHORIZED_LEGAL_ADVICE = 'unauthorized_legal_advice',
  INCOMPLETE_LEGAL_ANALYSIS = 'incomplete_legal_analysis',
  AMBIGUOUS_QUERY = 'ambiguous_query',
  MISSING_JURISDICTION = 'missing_jurisdiction'
}

export interface LegalEntity {
  id: string;
  text: string;
  type: LegalEntityType;
  jurisdiction?: string;
  authority?: AuthorityLevel;
  temporalContext?: TemporalContext;
  relationships: LegalRelationship[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface TemporalContext {
  effectiveDate?: string;
  expirationDate?: string;
  amendmentDate?: string;
  isActive: boolean;
  temporalRelations?: string[];
}

export interface LegalRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  strength: number;
  metadata?: Record<string, any>;
}

export interface QueryAnalysis {
  originalQuery: string;
  queryType: QueryType;
  queryIntent: QueryIntent;
  legalDomains: string[];
  complexity: ComplexityLevel;
  jurisdiction?: string;
  documentTypes: string[];
  entities: LegalEntity[];
  confidence: number;
  suggestedTools: string[];
  metadata?: Record<string, any>;
}

export interface LegalContext {
  userId: string;
  primaryJurisdiction: string;
  documentCorpus: DocumentReference[];
  legalDomains: string[];
  precedentHierarchy: PrecedentNode[];
  activeSession: SessionContext;
  lastUpdated: string;
}

export interface DocumentReference {
  id: string;
  filename: string;
  documentType: string;
  jurisdiction: string;
  isLegalDocument: boolean;
  authority?: AuthorityLevel;
  extractedEntities: LegalEntity[];
}

export interface PrecedentNode {
  caseId: string;
  caseName: string;
  court: string;
  jurisdiction: string;
  date: string;
  authority: AuthorityLevel;
  children: PrecedentNode[];
  parent?: PrecedentNode;
}

export interface SessionContext {
  sessionId: string;
  startTime: string;
  queryHistory: QueryAnalysis[];
  contextStack: string[];
  currentJurisdiction?: string;
}

export interface LegalReasoningChain {
  issue: string;
  applicableRules: LegalRule[];
  analysis: AnalysisStep[];
  conclusion: string;
  confidence: number;
  citations: Citation[];
  alternatives?: AlternativeAnalysis[];
}

export interface LegalRule {
  id: string;
  text: string;
  source: string;
  authority: AuthorityLevel;
  jurisdiction: string;
  elements?: string[];
  exceptions?: string[];
  relatedRules?: string[];
}

export interface AnalysisStep {
  stepNumber: number;
  description: string;
  reasoning: string;
  supportingEvidence: string[];
  confidence: number;
  citations: Citation[];
}

export interface Citation {
  id: string;
  text: string;
  source: string;
  pageNumber?: number;
  paragraph?: string;
  url?: string;
  authority: AuthorityLevel;
  jurisdiction: string;
}

export interface AlternativeAnalysis {
  theory: string;
  reasoning: string;
  strength: number;
  citations: Citation[];
}

export interface ConfidenceMetrics {
  overall: number;
  reasoning: number;
  citations: number;
  completeness: number;
  jurisdiction: number;
}

export interface EnhancedLegalResponse {
  answer: string;
  reasoning: LegalReasoningChain;
  citations: Citation[];
  confidence: ConfidenceMetrics;
  alternatives: AlternativeAnalysis[];
  recommendations: string[];
  disclaimers: string[];
  suggestedFollowUp: string[];
}

export interface DocumentCorpus {
  userId: string;
  documents: DocumentReference[];
  totalDocuments: number;
  jurisdictions: string[];
  documentTypes: string[];
  lastUpdated: string;
}

export interface LegalReasoningContext {
  query: string;
  queryType: QueryType;
  legalDomain: string;
  jurisdiction: string;
  relevantDocuments: DocumentContext[];
  applicableLaw: LegalAuthority[];
  precedents: Precedent[];
  conflicts: LegalConflict[];
}

export interface DocumentContext {
  documentId: string;
  relevantSections: string[];
  extractedEntities: LegalEntity[];
  relevanceScore: number;
}

export interface LegalAuthority {
  id: string;
  type: 'statute' | 'regulation' | 'case' | 'constitutional';
  text: string;
  jurisdiction: string;
  authority: AuthorityLevel;
  effectiveDate?: string;
}

export interface Precedent {
  caseId: string;
  caseName: string;
  holding: string;
  facts: string[];
  reasoning: string;
  jurisdiction: string;
  court: string;
  date: string;
  relevanceScore: number;
}

export interface LegalConflict {
  conflictType: 'jurisdictional' | 'temporal' | 'authority' | 'interpretation';
  description: string;
  conflictingAuthorities: LegalAuthority[];
  resolutionStrategy?: string;
}

// Tool-specific interfaces
export interface ContractAnalysis {
  parties: string[];
  keyTerms: ContractTerm[];
  obligations: Obligation[];
  risks: Risk[];
  recommendations: string[];
}

export interface ContractTerm {
  term: string;
  definition?: string;
  importance: 'high' | 'medium' | 'low';
  risks?: string[];
}

export interface Obligation {
  party: string;
  description: string;
  deadline?: string;
  conditions?: string[];
  penalties?: string[];
}

export interface Risk {
  description: string;
  severity: 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  mitigation?: string[];
}

export interface CaseLawAnalysis {
  holding: string;
  reasoning: string[];
  facts: string[];
  procedureHistory: string[];
  precedentialValue: AuthorityLevel;
  distinguishingFactors?: string[];
}

export interface StatutoryAnalysis {
  elements: StatutoryElement[];
  exceptions: string[];
  crossReferences: string[];
  interpretationNotes: string[];
  relatedProvisions: string[];
}

export interface StatutoryElement {
  element: string;
  description: string;
  required: boolean;
  caselaw?: string[];
}

// Legal Tool interfaces
export interface LegalTool {
  name: string;
  description: string;
  applicableDocumentTypes: string[];
  applicableQueryTypes: QueryType[];
  parameters: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
}