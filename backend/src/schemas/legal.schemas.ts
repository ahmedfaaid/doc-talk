import { z } from 'zod';
import {
  LegalEntityType,
  QueryType,
  QueryIntent,
  ComplexityLevel,
  AuthorityLevel,
  LegalErrorType
} from '../types/legal.types.js';

// Enum schemas
export const legalEntityTypeSchema = z.nativeEnum(LegalEntityType);
export const queryTypeSchema = z.nativeEnum(QueryType);
export const queryIntentSchema = z.nativeEnum(QueryIntent);
export const complexityLevelSchema = z.nativeEnum(ComplexityLevel);
export const authorityLevelSchema = z.nativeEnum(AuthorityLevel);
export const legalErrorTypeSchema = z.nativeEnum(LegalErrorType);

// Core entity schemas
export const temporalContextSchema = z.object({
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  amendmentDate: z.string().optional(),
  isActive: z.boolean(),
  temporalRelations: z.array(z.string()).optional()
});

export const legalRelationshipSchema = z.object({
  id: z.string(),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  relationshipType: z.string(),
  strength: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional()
});

export const legalEntitySchema = z.object({
  id: z.string(),
  text: z.string(),
  type: legalEntityTypeSchema,
  jurisdiction: z.string().optional(),
  authority: authorityLevelSchema.optional(),
  temporalContext: temporalContextSchema.optional(),
  relationships: z.array(legalRelationshipSchema),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional()
});

// Query analysis schemas
export const queryAnalysisSchema = z.object({
  originalQuery: z.string(),
  queryType: queryTypeSchema,
  queryIntent: queryIntentSchema,
  legalDomains: z.array(z.string()),
  complexity: complexityLevelSchema,
  jurisdiction: z.string().optional(),
  documentTypes: z.array(z.string()),
  entities: z.array(legalEntitySchema),
  confidence: z.number().min(0).max(1),
  suggestedTools: z.array(z.string()),
  metadata: z.record(z.any()).optional()
});

// Legal context schemas
export const documentReferenceSchema = z.object({
  id: z.string(),
  filename: z.string(),
  documentType: z.string(),
  jurisdiction: z.string(),
  isLegalDocument: z.boolean(),
  authority: authorityLevelSchema.optional(),
  extractedEntities: z.array(legalEntitySchema)
});

export const precedentNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  caseId: z.string(),
  caseName: z.string(),
  court: z.string(),
  jurisdiction: z.string(),
  date: z.string(),
  authority: authorityLevelSchema,
  children: z.array(precedentNodeSchema),
  parent: precedentNodeSchema.optional()
}));

export const sessionContextSchema = z.object({
  sessionId: z.string(),
  startTime: z.string(),
  queryHistory: z.array(queryAnalysisSchema),
  contextStack: z.array(z.string()),
  currentJurisdiction: z.string().optional()
});

export const legalContextSchema = z.object({
  userId: z.string(),
  primaryJurisdiction: z.string(),
  documentCorpus: z.array(documentReferenceSchema),
  legalDomains: z.array(z.string()),
  precedentHierarchy: z.array(precedentNodeSchema),
  activeSession: sessionContextSchema,
  lastUpdated: z.string()
});

// Legal reasoning schemas
export const citationSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: z.string(),
  pageNumber: z.number().optional(),
  paragraph: z.string().optional(),
  url: z.string().optional(),
  authority: authorityLevelSchema,
  jurisdiction: z.string()
});

export const legalRuleSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: z.string(),
  authority: authorityLevelSchema,
  jurisdiction: z.string(),
  elements: z.array(z.string()).optional(),
  exceptions: z.array(z.string()).optional(),
  relatedRules: z.array(z.string()).optional()
});

export const analysisStepSchema = z.object({
  stepNumber: z.number(),
  description: z.string(),
  reasoning: z.string(),
  supportingEvidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  citations: z.array(citationSchema)
});

export const alternativeAnalysisSchema = z.object({
  theory: z.string(),
  reasoning: z.string(),
  strength: z.number().min(0).max(1),
  citations: z.array(citationSchema)
});

export const legalReasoningChainSchema = z.object({
  issue: z.string(),
  applicableRules: z.array(legalRuleSchema),
  analysis: z.array(analysisStepSchema),
  conclusion: z.string(),
  confidence: z.number().min(0).max(1),
  citations: z.array(citationSchema),
  alternatives: z.array(alternativeAnalysisSchema).optional()
});

// Response schemas
export const confidenceMetricsSchema = z.object({
  overall: z.number().min(0).max(1),
  reasoning: z.number().min(0).max(1),
  citations: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  jurisdiction: z.number().min(0).max(1)
});

export const enhancedLegalResponseSchema = z.object({
  answer: z.string(),
  reasoning: legalReasoningChainSchema,
  citations: z.array(citationSchema),
  confidence: confidenceMetricsSchema,
  alternatives: z.array(alternativeAnalysisSchema),
  recommendations: z.array(z.string()),
  disclaimers: z.array(z.string()),
  suggestedFollowUp: z.array(z.string())
});

// Tool-specific schemas
export const contractTermSchema = z.object({
  term: z.string(),
  definition: z.string().optional(),
  importance: z.enum(['high', 'medium', 'low']),
  risks: z.array(z.string()).optional()
});

export const obligationSchema = z.object({
  party: z.string(),
  description: z.string(),
  deadline: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  penalties: z.array(z.string()).optional()
});

export const riskSchema = z.object({
  description: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
  likelihood: z.enum(['high', 'medium', 'low']),
  mitigation: z.array(z.string()).optional()
});

export const contractAnalysisSchema = z.object({
  parties: z.array(z.string()),
  keyTerms: z.array(contractTermSchema),
  obligations: z.array(obligationSchema),
  risks: z.array(riskSchema),
  recommendations: z.array(z.string())
});

export const caseLawAnalysisSchema = z.object({
  holding: z.string(),
  reasoning: z.array(z.string()),
  facts: z.array(z.string()),
  procedureHistory: z.array(z.string()),
  precedentialValue: authorityLevelSchema,
  distinguishingFactors: z.array(z.string()).optional()
});

export const statutoryElementSchema = z.object({
  element: z.string(),
  description: z.string(),
  required: z.boolean(),
  caselaw: z.array(z.string()).optional()
});

export const statutoryAnalysisSchema = z.object({
  elements: z.array(statutoryElementSchema),
  exceptions: z.array(z.string()),
  crossReferences: z.array(z.string()),
  interpretationNotes: z.array(z.string()),
  relatedProvisions: z.array(z.string())
});

// Input validation schemas for API endpoints
export const legalQueryInputSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  userId: z.string(),
  uploadId: z.string().optional(),
  jurisdiction: z.string().optional(),
  documentTypes: z.array(z.string()).optional(),
  includeReasoning: z.boolean().default(true),
  maxResults: z.number().min(1).max(50).default(10)
});

export const legalContextInputSchema = z.object({
  userId: z.string(),
  jurisdiction: z.string().optional(),
  documentIds: z.array(z.string()).optional()
});

export const documentAnalysisInputSchema = z.object({
  documentId: z.string(),
  analysisType: z.enum(['contract', 'case_law', 'statutory', 'general']),
  userId: z.string(),
  includeEntities: z.boolean().default(true),
  includeRelationships: z.boolean().default(true)
});

// Error schemas
export const legalErrorSchema = z.object({
  type: legalErrorTypeSchema,
  message: z.string(),
  details: z.record(z.any()).optional(),
  suggestions: z.array(z.string()).optional()
});

// Export types inferred from schemas
export type LegalQueryInput = z.infer<typeof legalQueryInputSchema>;
export type LegalContextInput = z.infer<typeof legalContextInputSchema>;
export type DocumentAnalysisInput = z.infer<typeof documentAnalysisInputSchema>;
export type LegalError = z.infer<typeof legalErrorSchema>;