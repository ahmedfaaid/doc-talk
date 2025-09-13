import { describe, it, expect } from 'vitest';
import { LegalQueryAnalyzer } from '../services/legal-query-analyzer.service.js';
import { QueryType, ComplexityLevel } from '../types/legal.types.js';

describe('Integration Tests', () => {
  it('should create LegalQueryAnalyzer instance', () => {
    const analyzer = new LegalQueryAnalyzer();
    expect(analyzer).toBeDefined();
  });

  it('should have correct enum values', () => {
    expect(QueryType.RESEARCH).toBe('research');
    expect(QueryType.ANALYSIS).toBe('analysis');
    expect(ComplexityLevel.LOW).toBe('low');
    expect(ComplexityLevel.HIGH).toBe('high');
  });

  it('should handle basic complexity assessment without LLM', async () => {
    const analyzer = new LegalQueryAnalyzer();
    
    // Test a simple query that doesn't require LLM calls for complexity
    const simpleQuery = 'What is a contract?';
    const complexity = await analyzer.assessComplexity(simpleQuery);
    
    expect(Object.values(ComplexityLevel)).toContain(complexity);
  });
});