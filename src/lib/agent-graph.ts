/**
 * LangGraph Agent Configuration
 * Basic setup for the multi-tier routing agent system
 */

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  AgentState,
  createInitialAgentState,
  AgentConfig,
  DEFAULT_AGENT_CONFIG,
} from "./agent-types";
import { classifyUserInput } from "./agent-classifier";

// Node function types
type NodeFunction = (state: AgentState) => AgentState;
type AsyncNodeFunction = (state: AgentState) => Promise<AgentState>;
type RouterFunction = (state: AgentState) => string;

// LangGraph Annotation-based state definition
const GraphAnnotation = Annotation.Root({
  user_input: Annotation<string>(),
  user_context: Annotation<any>(),
  input_category: Annotation<"document_query" | "general_chat" | "code_generation">(),
  confidence_score: Annotation<number>(),
  reasoning: Annotation<string>(),
  selected_workflow: Annotation<string>(),
  workflow_parameters: Annotation<Record<string, unknown>>(),
  intermediate_results: Annotation<Record<string, unknown>>(),
  context_retrieved: Annotation<boolean>(),
  context_chunks: Annotation<unknown[]>(),
  code_generation_task: Annotation<any>(),
  final_response: Annotation<string>(),
  response_metadata: Annotation<any>(),
  errors: Annotation<string[]>(),
  retry_count: Annotation<number>(),
});

/**
 * Basic Agent Graph Setup
 * This will be expanded with actual nodes in subsequent phases
 */
export class ContextFlowAgent {
  private graph: StateGraph<typeof GraphAnnotation.State>;
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    
    // Initialize the state graph with the correct annotation
    this.graph = new StateGraph(GraphAnnotation);

    this.setupBasicGraph();
  }

  private setupBasicGraph() {
    // Add input validation and context enrichment nodes
    this.graph.addNode("validate_input", this.validateInput.bind(this));
    this.graph.addNode("enrich_context", this.enrichContext.bind(this));
    this.graph.addNode("classify_input", this.classifyInput.bind(this));
    
    // Add workflow processor nodes
    this.graph.addNode("process_document_query", this.processDocumentQuery.bind(this));
    this.graph.addNode("process_general_chat", this.processGeneralChat.bind(this));
    this.graph.addNode("process_code_generation", this.processCodeGeneration.bind(this));
    
    // Add response generation and error handling
    this.graph.addNode("generate_response", this.generateResponse.bind(this));
    this.graph.addNode("handle_error", this.handleError.bind(this));

    // Add basic flow
    this.graph.addEdge(START, "validate_input");
    this.graph.addEdge("validate_input", "enrich_context");
    this.graph.addEdge("enrich_context", "classify_input");
    
    // Add conditional edges using the overarching router
    this.graph.addConditionalEdges(
      "classify_input",
      this.overarchingRouter.bind(this),
      {
        "process_document_query": "process_document_query",
        "process_general_chat": "process_general_chat", 
        "process_code_generation": "process_code_generation",
        "handle_error": "handle_error"
      }
    );
    
    // Connect workflow processors to response generation
    this.graph.addEdge("process_document_query", "generate_response");
    this.graph.addEdge("process_general_chat", "generate_response");
    this.graph.addEdge("process_code_generation", "generate_response");
    
    // Connect to end
    this.graph.addEdge("generate_response", END);
    this.graph.addEdge("handle_error", END);
  }

  /**
   * OVERARCHING ROUTER - Main routing logic based on classification
   */
  private overarchingRouter: RouterFunction = (state: AgentState) => {
    const { input_category, confidence_score, errors, retry_count } = state;
    
    console.log(`🚦 Overarching Router: category=${input_category}, confidence=${confidence_score}`);
    
    // Handle errors first
    if (errors.length > 0) {
      if (retry_count < this.config.max_retry_attempts) {
        console.log(`🔄 Error detected, retry attempt ${retry_count + 1}`);
        return "classify_input"; // Retry classification
      } else {
        console.log(`❌ Max retries reached, routing to error handler`);
        return "handle_error";
      }
    }
    
    // Check confidence threshold
    if (confidence_score < this.config.classification_confidence_threshold) {
      console.log(`⚠️ Low confidence (${confidence_score}), defaulting to general chat`);
      return "process_general_chat";
    }
    
    // Route based on classification
    switch (input_category) {
      case "code_generation":
        console.log("📝 Routing to code generation workflow");
        return "process_code_generation";
      case "document_query":
        console.log("📄 Routing to document query workflow");
        return "process_document_query";
      case "general_chat":
        console.log("💬 Routing to general chat workflow");
        return "process_general_chat";
      default:
        console.warn(`❓ Unknown category: ${input_category}, defaulting to error handler`);
        return "handle_error";
    }
  };

  /**
   * INPUT VALIDATION NODE
   */
  private validateInput: NodeFunction = (state: AgentState) => {
    console.log("✅ Validating input:", state.user_input?.slice(0, 50) + "...");
    
    // Validate input length
    if (!state.user_input || state.user_input.trim().length === 0) {
      return {
        ...state,
        errors: [...state.errors, "Empty input provided"],
      };
    }
    
    // Validate input length (reasonable limits)
    if (state.user_input.length > 10000) {
      return {
        ...state,
        errors: [...state.errors, "Input too long (max 10,000 characters)"],
      };
    }
    
    // Clean and normalize input
    const cleanedInput = state.user_input.trim();
    
    return {
      ...state,
      user_input: cleanedInput,
    };
  };

  /**
   * CONTEXT ENRICHMENT NODE
   */
  private enrichContext: NodeFunction = (state: AgentState) => {
    console.log("🔍 Enriching context...");
    
    // Initialize user context if not present
    if (!state.user_context) {
      state.user_context = {
        conversation_history: [],
        uploaded_documents: [],
      };
    }
    
    // TODO: In Phase 2, add actual context enrichment:
    // - Fetch conversation history
    // - Load user preferences
    // - Get available document context
    // - Analyze user patterns
    
    return state;
  };

  /**
   * CLASSIFICATION NODE (using actual classifier with fallback)
   */
  private classifyInput: AsyncNodeFunction = async (state: AgentState) => {
    console.log("🔍 Classifying input:", state.user_input?.slice(0, 50) + "...");
    
    try {
      // Use the actual classifier if API key is available
      if (process.env.GEMINI_API_KEY) {
        const classifiedState = await classifyUserInput(state, this.config);
        console.log(`✅ Classification complete: ${classifiedState.input_category} (${classifiedState.confidence_score})`);
        return classifiedState;
      } else {
        console.log("⚠️ No GEMINI_API_KEY found, using keyword-based fallback classification");
        return this.fallbackClassification(state);
      }
    } catch (error) {
      console.error("❌ Classification error:", error);
      console.log("🔄 Falling back to keyword-based classification");
      return this.fallbackClassification(state);
    }
  };

  /**
   * FALLBACK CLASSIFICATION (keyword-based)
   */
  private fallbackClassification(state: AgentState): AgentState {
    const input = state.user_input.toLowerCase();
    
    // Enhanced keyword-based classification
    const codeKeywords = [
      "create", "build", "generate", "code", "function", "api", "script", 
      "implement", "develop", "program", "write", "algorithm", "class", 
      "method", "variable", "database", "sql", "javascript", "python", 
      "react", "node", "server", "frontend", "backend", "component"
    ];
    
    const documentKeywords = [
      "document", "pdf", "file", "upload", "text", "content", "read",
      "search", "find", "analyze", "summarize", "extract", "parse",
      "what does", "according to", "in the document"
    ];
    
    let category: "document_query" | "general_chat" | "code_generation" = "general_chat";
    let confidence = 0.6;
    let reasoning = "Keyword-based fallback classification";
    
    if (codeKeywords.some(keyword => input.includes(keyword))) {
      category = "code_generation";
      confidence = 0.7;
      reasoning = "Detected code generation keywords";
    } else if (documentKeywords.some(keyword => input.includes(keyword)) || 
               state.user_context?.uploaded_documents?.length > 0) {
      category = "document_query";
      confidence = 0.7;
      reasoning = "Detected document query keywords or uploaded documents";
    }
    
    console.log(`📊 Fallback classification: ${category} (${confidence}) - ${reasoning}`);
    
    return {
      ...state,
      input_category: category,
      confidence_score: confidence,
      reasoning: reasoning,
      selected_workflow: category,
    };
  };

  /**
   * WORKFLOW PROCESSOR NODES (Phase 2 implementations)
   */
  private processDocumentQuery: NodeFunction = (state: AgentState) => {
    console.log("📄 Processing document query workflow");
    // TODO: Implement in Phase 2.1
    return {
      ...state,
      selected_workflow: "document_query",
      workflow_parameters: { type: "rag_search" },
    };
  };

  private processGeneralChat: NodeFunction = (state: AgentState) => {
    console.log("💬 Processing general chat workflow");
    // TODO: Implement in Phase 2.2
    return {
      ...state,
      selected_workflow: "general_chat",
      workflow_parameters: { type: "conversational" },
    };
  };

  private processCodeGeneration: NodeFunction = (state: AgentState) => {
    console.log("📝 Processing code generation workflow");
    // TODO: Implement in Phase 2.3
    return {
      ...state,
      selected_workflow: "code_generation",
      workflow_parameters: { type: "parallel_execution" },
    };
  };

  /**
   * RESPONSE GENERATION NODE
   */
  private generateResponse: NodeFunction = (state: AgentState) => {
    console.log("💬 Generating response for:", state.selected_workflow);
    
    // TODO: Implement actual response generation in Phase 2
    const workflowResponses = {
      document_query: "This is a document-based response (placeholder)",
      general_chat: "This is a general chat response (placeholder)",
      code_generation: "This is a code generation response (placeholder)",
    };
    
    const response = workflowResponses[state.selected_workflow as keyof typeof workflowResponses] 
      || "Unknown workflow response";
    
    return {
      ...state,
      final_response: response,
      response_metadata: {
        workflow_used: state.selected_workflow,
        processing_time: Date.now(),
        sources_used: [],
        confidence: state.confidence_score,
      },
    };
  };

  /**
   * ERROR HANDLER NODE
   */
  private handleError: NodeFunction = (state: AgentState) => {
    console.log("❌ Handling errors:", state.errors);
    
    const errorMessage = state.errors.length > 0 
      ? `I encountered an error: ${state.errors[state.errors.length - 1]}` 
      : "I encountered an unknown error while processing your request.";
    
    return {
      ...state,
      final_response: errorMessage + " Please try rephrasing your request.",
      response_metadata: {
        workflow_used: "error_handler",
        processing_time: Date.now(),
        sources_used: [],
        confidence: 0,
      },
    };
  };

  /**
   * Compile the graph for execution
   */
  compile() {
    return this.graph.compile();
  }

  /**
   * Process input through the agent graph
   */
  async processInput(input: string, userContext?: any): Promise<string> {
    const compiledGraph = this.compile();
    const initialState = createInitialAgentState(input);
    
    // Add user context if provided
    if (userContext) {
      initialState.user_context = userContext;
    }

    try {
      console.log("🚀 Starting agent processing for:", input.slice(0, 50) + "...");
      const result = await compiledGraph.invoke(initialState as any);
      
      const finalResponse = (result as any).final_response || "No response generated";
      console.log("✅ Agent processing complete");
      
      return finalResponse;
    } catch (error) {
      console.error("❌ Agent processing error:", error);
      return "Sorry, I encountered an error processing your request. Please try again.";
    }
  }

  /**
   * Process input with detailed response metadata
   */
  async processInputDetailed(input: string, userContext?: any): Promise<{
    response: string;
    metadata: any;
    workflow: string;
    confidence: number;
  }> {
    const compiledGraph = this.compile();
    const initialState = createInitialAgentState(input);
    
    if (userContext) {
      initialState.user_context = userContext;
    }

    try {
      const result = await compiledGraph.invoke(initialState as any) as AgentState;
      
      return {
        response: result.final_response || "No response generated",
        metadata: result.response_metadata || {},
        workflow: result.selected_workflow || "unknown",
        confidence: result.confidence_score || 0,
      };
    } catch (error) {
      console.error("❌ Agent processing error:", error);
      return {
        response: "Sorry, I encountered an error processing your request.",
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
        workflow: "error",
        confidence: 0,
      };
    }
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
let agent: ContextFlowAgent | null = null;

export function getAgent(): ContextFlowAgent {
  if (!agent) {
    agent = new ContextFlowAgent();
  }
  return agent;
}

