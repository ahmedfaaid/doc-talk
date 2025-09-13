import { llm } from '../lib/AI.js';
import { EnhancedRagService } from './enhanced-rag.service.js';
import { GraphDatabaseService } from './graph-database.service.js';

type LegalTool = {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
};

export class LegalAgentService {
  private enhancedRagService: EnhancedRagService;
  private graphService: GraphDatabaseService;
  private tools: LegalTool[];

  constructor() {
    this.enhancedRagService = new EnhancedRagService();
    this.graphService = new GraphDatabaseService();
    this.tools = this.initializeTools();
  }

  /**
   * Initialize the legal reasoning tools
   */
  private initializeTools(): LegalTool[] {
    return [
      {
        name: 'search_legal_documents',
        description: 'Search for relevant information in legal documents',
        parameters: {
          query: 'string',
          userId: 'string',
          uploadId: 'string',
          topK: 'number?'
        },
        execute: async (params) => {
          return await this.enhancedRagService.retrieveRelevantDocuments({
            query: params.query,
            userId: params.userId,
            uploadId: params.uploadId,
            topK: params.topK || 5
          });
        }
      },
      {
        name: 'find_legal_entities',
        description: 'Find legal entities and their relationships',
        parameters: {
          entityText: 'string?',
          entityType: 'string?',
          documentId: 'string?'
        },
        execute: async (params) => {
          return await this.graphService.queryRelatedEntities({
            entityText: params.entityText,
            entityType: params.entityType,
            documentId: params.documentId,
            limit: 10
          });
        }
      },
      {
        name: 'analyze_legal_context',
        description: 'Analyze the legal context of a query',
        parameters: {
          query: 'string',
          jurisdiction: 'string?',
          documentType: 'string?'
        },
        execute: async (params) => {
          const prompt = `
            Analyze the legal context of the following query:
            "${params.query}"
            ${params.jurisdiction ? `Jurisdiction: ${params.jurisdiction}` : ''}
            ${params.documentType ? `Document Type: ${params.documentType}` : ''}
            
            Provide a JSON object with the following information:
            1. Legal domain (e.g., contract law, criminal law, etc.)
            2. Key legal concepts mentioned
            3. Potential legal issues to consider
            4. Recommended search terms to find relevant legal information
            
            Format your response as a valid JSON object.
          `;
          
          const response = await llm.invoke(prompt);
          const responseText = response.content.toString();
          
          try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            return { error: 'Failed to parse analysis', raw: responseText };
          } catch (error) {
            return { error: 'Failed to parse analysis', raw: responseText };
          }
        }
      },
      {
        name: 'generate_legal_reasoning',
        description: 'Generate step-by-step legal reasoning for a question',
        parameters: {
          question: 'string',
          context: 'array',
          jurisdiction: 'string?'
        },
        execute: async (params) => {
          const contextText = params.context
            .map((item: any, index: number) => `[${index + 1}] ${item.content}`)
            .join('\n\n');
          
          const prompt = `
            You are a legal reasoning assistant. Based on the following context, provide step-by-step legal reasoning to answer the question.
            
            Question: ${params.question}
            ${params.jurisdiction ? `Jurisdiction: ${params.jurisdiction}` : ''}
            
            Context:
            ${contextText}
            
            Provide your reasoning in the following format:
            1. Issue: Identify the legal issue(s) presented
            2. Rule: Identify the relevant legal rules from the context
            3. Analysis: Apply the rules to the facts
            4. Conclusion: Provide a conclusion based on your analysis
            
            Be specific and cite the relevant parts of the context in your reasoning.
          `;
          
          const response = await llm.invoke(prompt);
          return response.content.toString();
        }
      }
    ];
  }

  /**
   * Process a legal query using the agent approach
   */
  async processLegalQuery({
    query,
    userId,
    uploadId,
    jurisdiction,
    documentType,
    chatHistory = []
  }: {
    query: string;
    userId: string;
    uploadId: string;
    jurisdiction?: string;
    documentType?: string;
    chatHistory?: Array<{ role: string; content: string }>;
  }) {
    try {
      // Step 1: Analyze the query to determine the approach
      const analysisPrompt = `
        Analyze the following legal query and determine which tools would be most helpful to answer it.
        Query: "${query}"
        
        Available tools:
        ${this.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}
        
        Return a JSON object with:
        1. analysis: Brief analysis of the query
        2. tools: Array of tool names to use, in the order they should be used
        3. parameters: Parameters to pass to each tool
        
        Format your response as a valid JSON object.
      `;
      
      const analysisResponse = await llm.invoke(analysisPrompt);
      const analysisText = analysisResponse.content.toString();
      
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse analysis response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Step 2: Execute the tools in sequence
      const toolResults = [];
      
      for (let i = 0; i < analysis.tools.length; i++) {
        const toolName = analysis.tools[i];
        const tool = this.tools.find(t => t.name === toolName);
        
        if (!tool) {
          continue;
        }
        
        // Get parameters for this tool
        const params = {
          ...analysis.parameters[toolName],
          userId,
          uploadId,
          jurisdiction,
          documentType
        };
        
        // Execute the tool
        const result = await tool.execute(params);
        toolResults.push({ tool: toolName, result });
      }
      
      // Step 3: Generate the final response
      const responsePrompt = `
        You are a legal assistant helping with the following query:
        "${query}"
        
        Based on the tools executed and their results, provide a comprehensive response.
        
        Tool results:
        ${JSON.stringify(toolResults, null, 2)}
        
        ${chatHistory.length > 0 ? `Chat history:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n` : ''}
        
        Your response should:
        1. Directly answer the query based on the tool results
        2. Cite specific sources from the results
        3. Explain your reasoning clearly
        4. Be professional and accurate
        5. Format your response in markdown
      `;
      
      const finalResponse = await llm.invoke(responsePrompt);
      
      return {
        response: finalResponse.content.toString(),
        toolResults
      };
    } catch (error) {
      console.error('Error processing legal query:', error);
      throw error;
    }
  }
}