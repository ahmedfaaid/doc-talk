import { llm } from '../lib/AI.js';
import { LegalEntity } from '../types/legal.types.js';

type Entity = {
  text: string;
  type: string;
  metadata?: Record<string, any>;
};

type Relationship = {
  sourceEntityText: string;
  sourceEntityType: string;
  targetEntityText: string;
  targetEntityType: string;
  relationshipType: string;
  metadata?: Record<string, any>;
};

export class EntityExtractor {
  /**
   * Extract entities from text using LLM
   */
  async extractEntities(text: string): Promise<LegalEntity[]> {
    try {
      // Truncate text if too long
      const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;
      
      const prompt = `
        Extract all legal entities from the following text. Return ONLY a valid JSON array of objects with 'text' and 'type' properties.
        Entity types to extract: Person, Organization, Location, Date, Law, Regulation, Court, Judge, Lawyer, Case, Citation, Legal Term.
        
        Text: ${truncatedText}
        
        Format your response as a valid JSON array like this:
        [
          { "text": "John Smith", "type": "Person" },
          { "text": "Supreme Court", "type": "Court" },
          { "text": "January 15, 2023", "type": "Date" }
        ]
        
        Only return the JSON array, nothing else.
      `;
      
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString().trim();
      
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
      if (!jsonMatch) {
        console.warn('Failed to extract JSON from LLM response:', responseText);
        return [];
      }
      
      const jsonStr = jsonMatch[0];
      const entities = JSON.parse(jsonStr) as Entity[];
      
      // Convert to LegalEntity format
      return entities.map((entity, index) => ({
        id: `entity_${index}_${Date.now()}`,
        text: entity.text,
        type: entity.type as any, // Will be validated by the enum
        relationships: [],
        confidence: 0.8, // Default confidence
        metadata: entity.metadata
      }));
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  /**
   * Extract relationships between entities using LLM
   */
  async extractRelationships(entities: Entity[]): Promise<Relationship[]> {
    if (entities.length < 2) {
      return [];
    }
    
    try {
      const entitiesJson = JSON.stringify(entities);
      
      const prompt = `
        Given these entities extracted from a legal document:
        ${entitiesJson}
        
        Identify relationships between these entities. Return ONLY a valid JSON array of relationship objects with the following properties:
        - sourceEntityText: The text of the source entity
        - sourceEntityType: The type of the source entity
        - targetEntityText: The text of the target entity
        - targetEntityType: The type of the target entity
        - relationshipType: The type of relationship (e.g., REPRESENTS, RULES_ON, CITES, LOCATED_IN, DATED_ON, etc.)
        
        Format your response as a valid JSON array like this:
        [
          {
            "sourceEntityText": "John Smith",
            "sourceEntityType": "Lawyer",
            "targetEntityText": "Acme Corp",
            "targetEntityType": "Organization",
            "relationshipType": "REPRESENTS"
          }
        ]
        
        Only return the JSON array, nothing else. If you can't identify any relationships, return an empty array [].
      `;
      
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString().trim();
      
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s) || responseText.match(/\[\s*\]/s);
      if (!jsonMatch) {
        console.warn('Failed to extract JSON from LLM response:', responseText);
        return [];
      }
      
      const jsonStr = jsonMatch[0];
      const relationships = JSON.parse(jsonStr) as Relationship[];
      
      return relationships;
    } catch (error) {
      console.error('Error extracting relationships:', error);
      return [];
    }
  }

  /**
   * Analyze a legal document to extract key information
   */
  async analyzeLegalDocument(text: string, documentType: string, jurisdiction: string): Promise<Record<string, any>> {
    try {
      // Truncate text if too long
      const truncatedText = text.length > 6000 ? text.substring(0, 6000) + '...' : text;
      
      const prompt = `
        Analyze the following ${documentType} from ${jurisdiction} jurisdiction and extract key information.
        Return ONLY a valid JSON object with relevant fields based on the document type.
        
        Text: ${truncatedText}
        
        Extract information appropriate for this document type. For example:
        - For contracts: parties, effective date, term, key provisions
        - For court cases: plaintiff, defendant, judge, ruling, precedents
        - For legislation: effective date, scope, key provisions
        
        Format your response as a valid JSON object. Only return the JSON object, nothing else.
      `;
      
      const response = await llm.invoke(prompt);
      const responseText = response.content.toString().trim();
      
      // Extract JSON object from response
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (!jsonMatch) {
        console.warn('Failed to extract JSON from LLM response:', responseText);
        return {};
      }
      
      const jsonStr = jsonMatch[0];
      const analysis = JSON.parse(jsonStr) as Record<string, any>;
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing legal document:', error);
      return {};
    }
  }
}