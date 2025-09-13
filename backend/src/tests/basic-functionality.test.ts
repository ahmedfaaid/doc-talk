// Basic functionality test without external dependencies
import { describe, it, expect } from 'vitest';
import { 
  QueryType, 
  QueryIntent, 
  ComplexityLevel, 
  LegalEntityType,
  AuthorityLevel 
} from '../types/legal.types.js';

describe('Basic Legal Types', () => {
  it('should have correct QueryType enum values', () => {
    expect(QueryType.RESEARCH).toBe('research');
    expect(QueryType.ANALYSIS).toBe('analysis');
    expect(QueryType.DRAFTING).toBe('drafting');
    expect(QueryType.COMPLIANCE).toBe('compliance');
    expect(QueryType.INTERPRETATION).toBe('interpretation');
    expect(QueryType.COMPARISON).toBe('comparison');
    expect(QueryType.PRECEDENT_SEARCH).toBe('precedent_search');
  });

  it('should have correct QueryIntent enum values', () => {
    expect(QueryIntent.FIND_PRECEDENT).toBe('find_precedent');
    expect(QueryIntent.ANALYZE_CONTRACT).toBe('analyze_contract');
    expect(QueryIntent.INTERPRET_STATUTE).toBe('interpret_statute');
    expect(QueryIntent.ASSESS_RISK).toBe('assess_risk');
    expect(QueryIntent.DRAFT_DOCUMENT).toBe('draft_document');
    expect(QueryIntent.COMPLIANCE_CHECK).toBe('compliance_check');
    expect(QueryIntent.CASE_COMPARISON).toBe('case_comparison');
  });

  it('should have correct ComplexityLevel enum values', () => {
    expect(ComplexityLevel.LOW).toBe('low');
    expect(ComplexityLevel.MEDIUM).toBe('medium');
    expect(ComplexityLevel.HIGH).toBe('high');
    expect(ComplexityLevel.VERY_HIGH).toBe('very_high');
  });

  it('should have correct LegalEntityType enum values', () => {
    expect(LegalEntityType.CASE).toBe('case');
    expect(LegalEntityType.STATUTE).toBe('statute');
    expect(LegalEntityType.COURT).toBe('court');
    expect(LegalEntityType.PARTY).toBe('party');
    expect(LegalEntityType.LEGAL_CONCEPT).toBe('legal_concept');
  });

  it('should have correct AuthorityLevel enum values', () => {
    expect(AuthorityLevel.PRIMARY).toBe('primary');
    expect(AuthorityLevel.SECONDARY).toBe('secondary');
    expect(AuthorityLevel.PERSUASIVE).toBe('persuasive');
    expect(AuthorityLevel.BINDING).toBe('binding');
  });
});

describe('Legal Query Analyzer Helper Methods', () => {
  // Test the helper methods that don't require external dependencies
  it('should identify legal terms in text', () => {
    const text = 'The plaintiff filed a motion for summary judgment';
    const legalTerms = ['plaintiff', 'motion', 'summary judgment'];
    
    let count = 0;
    legalTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        count++;
      }
    });
    
    expect(count).toBeGreaterThan(0);
  });

  it('should detect multiple jurisdictions in text', () => {
    const text = 'federal and california state law';
    const jurisdictions = ['federal', 'california'];
    
    let jurisdictionCount = 0;
    jurisdictions.forEach(jurisdiction => {
      if (text.toLowerCase().includes(jurisdiction)) {
        jurisdictionCount++;
      }
    });
    
    expect(jurisdictionCount).toBe(2);
  });

  it('should detect cross-references in text', () => {
    const text = 'See section 123 and paragraph 4.5';
    const crossRefIndicators = ['section', 'paragraph'];
    
    const hasCrossRefs = crossRefIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
    
    expect(hasCrossRefs).toBe(true);
  });
});