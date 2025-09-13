import neo4j, { Driver, Session } from 'neo4j-driver';
import { FileExtension } from '../types/index.js';
import env from '../lib/env.js';

export class GraphDatabaseService {
  private driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD)
    );
  }

  async close() {
    await this.driver.close();
  }

  async createDocumentNode(params: {
    id: string;
    filename: string;
    extension: FileExtension;
    ownerId: string;
    jurisdiction: string;
    documentType: string;
  }) {
    const session = this.driver.session();
    try {
      await session.run(
        `CREATE (d:Document {
          id: $id,
          filename: $filename,
          extension: $extension,
          ownerId: $ownerId,
          jurisdiction: $jurisdiction,
          documentType: $documentType,
          createdAt: datetime()
        })`,
        params
      );
    } finally {
      await session.close();
    }
  }

  async createChunkNode(params: {
    id: string;
    documentId: string;
    content: string;
    index: number;
    metadata: Record<string, any>;
  }) {
    const session = this.driver.session();
    try {
      await session.run(
        `MATCH (d:Document {id: $documentId})
         CREATE (c:Chunk {
           id: $id,
           content: $content,
           index: $index,
           metadata: $metadata,
           createdAt: datetime()
         })
         CREATE (d)-[:HAS_CHUNK]->(c)`,
        params
      );
    } finally {
      await session.close();
    }
  }

  async createEntityNodes(params: {
    chunkId: string;
    entities: Array<{
      id: string;
      text: string;
      type: string;
      confidence: number;
      metadata?: Record<string, any>;
    }>;
  }) {
    const session = this.driver.session();
    try {
      for (const entity of params.entities) {
        await session.run(
          `MATCH (c:Chunk {id: $chunkId})
           MERGE (e:Entity {text: $text, type: $type})
           ON CREATE SET e.id = $id, e.confidence = $confidence, e.metadata = $metadata, e.createdAt = datetime()
           CREATE (c)-[:CONTAINS_ENTITY]->(e)`,
          {
            chunkId: params.chunkId,
            id: entity.id,
            text: entity.text,
            type: entity.type,
            confidence: entity.confidence,
            metadata: entity.metadata || {}
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  async createEntityRelationships(relationships: Array<{
    sourceEntityText: string;
    targetEntityText: string;
    relationshipType: string;
    metadata?: Record<string, any>;
  }>) {
    const session = this.driver.session();
    try {
      for (const rel of relationships) {
        await session.run(
          `MATCH (e1:Entity {text: $sourceText})
           MATCH (e2:Entity {text: $targetText})
           CREATE (e1)-[:RELATED_TO {type: $relType, metadata: $metadata}]->(e2)`,
          {
            sourceText: rel.sourceEntityText,
            targetText: rel.targetEntityText,
            relType: rel.relationshipType,
            metadata: rel.metadata || {}
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  async queryRelatedEntities(params: {
    entityText?: string;
    entityType?: string;
    documentId?: string;
    limit?: number;
  }) {
    const session = this.driver.session();
    try {
      let query = `
        MATCH (e:Entity)
        OPTIONAL MATCH (e)<-[:CONTAINS_ENTITY]-(c:Chunk)
        OPTIONAL MATCH (c)<-[:HAS_CHUNK]-(d:Document)
        OPTIONAL MATCH (e)-[r:RELATED_TO]-(re:Entity)
      `;
      
      const conditions = [];
      const queryParams: Record<string, any> = {};

      if (params.entityText) {
        conditions.push('e.text = $entityText');
        queryParams.entityText = params.entityText;
      }

      if (params.entityType) {
        conditions.push('e.type = $entityType');
        queryParams.entityType = params.entityType;
      }

      if (params.documentId) {
        conditions.push('d.id = $documentId');
        queryParams.documentId = params.documentId;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += `
        RETURN e as entity, c as chunk, d as document, r as relationship, re as relatedEntity
        LIMIT $limit
      `;

      queryParams.limit = params.limit || 10;

      const result = await session.run(query, queryParams);
      
      return result.records.map(record => ({
        entity: record.get('entity')?.properties,
        chunk: record.get('chunk')?.properties,
        document: record.get('document')?.properties,
        relationship: record.get('relationship')?.properties,
        relatedEntity: record.get('relatedEntity')?.properties
      }));
    } finally {
      await session.close();
    }
  }
}