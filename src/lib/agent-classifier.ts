/**
 * Agent Classification Node
 * Gemini API integration for intelligent input classification
 */

import { getUnifiedLLM } from "./llm-unified";
import { AgentState, AgentConfig } from "./agent-types";

// Classification result from Gemini API
interface ClassificationResult {
  category: "document_query" | "general_chat" | "code_generation";
  confidence: number;
  reasoning: string;
}

// Classification prompts for different scenarios
const CLASSIFICATION_PROMPTS = {
  standard: `
Analyze the following user input and classify it into one of these categories:

**Categories:**
- code_generation: Requests to create, modify, generate, or help with code, scripts, programming solutions, APIs, functions, or technical implementations
- document_query: Questions about uploaded documents, document content, files, PDFs, or requests to search/analyze existing documents
- general_chat: General conversation, questions, assistance requests, explanations, or discussions not specifically about code or documents

**Examples:**

Code Generation:
- "Create a REST API for user management"
- "Write a function to sort an array"
- "Help me build a React component"
- "Generate a Python script for data processing"
- "How do I implement authentication?"

Document Query:
- "What does the contract say about payment terms?"
- "Summarize the uploaded PDF"
- "Find information about pricing in the document"
- "What are the requirements mentioned in the specification?"

General Chat:
- "Hello, how are you?"
- "What is machine learning?"
- "Explain the concept of recursion"
- "Help me understand this topic"
- "What can you do?"

**User Input:** "{input}"

**Context:** {context}

Respond in JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this input belongs to this category"
}
`,

  withDocuments: `
Analyze the following user input and classify it into one of these categories:

**Categories:**
- code_generation: Requests to create, modify, generate, or help with code, scripts, programming solutions, APIs, functions, or technical implementations
- document_query: Questions about uploaded documents, document content, files, PDFs, or requests to search/analyze existing documents  
- general_chat: General conversation, questions, assistance requests, explanations, or discussions not specifically about code or documents

**Important:** The user has uploaded documents. Consider this context when classifying.

**User Input:** "{input}"
**Available Documents:** {documents}
**Conversation Context:** {context}

If the input could relate to the uploaded documents, prefer "document_query" classification.
If the input is about generating code that might use information from documents, prefer "code_generation".

Respond in JSON format:
{
  "category": "category_name", 
  "confidence": 0.95,
  "reasoning": "Brief explanation considering uploaded documents"
}
`,
};

/**
 * Classification Node Implementation
 */
export class AgentClassifier {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Main classification function - processes state through Gemini API
   */
  async classifyInput(state: AgentState): Promise<AgentState> {
    console.log("🔍 Starting input classification:", state.user_input);

    try {
      // Check if we have enough confidence or should skip classification
      if (this.shouldSkipClassification(state)) {
        return this.fallbackClassification(state);
      }

      // Get classification from Gemini API
      const result = await this.callGeminiClassification(state);

      // Validate and apply classification result
      const updatedState = this.applyClassificationResult(state, result);

      console.log(`✅ Classification complete: ${updatedState.input_category} (${updatedState.confidence_score})`);
      return updatedState;

    } catch (error) {
      console.error("❌ Classification error:", error);
      return this.handleClassificationError(state, error);
    }
  }

  /**
   * Call Gemini API for input classification
   */
  private async callGeminiClassification(state: AgentState): Promise<ClassificationResult> {
    const llm = getUnifiedLLM({
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      preferredProvider: "auto",
    });

    // Prepare context information
    const context = this.buildContextString(state);
    const hasDocuments = state.user_context?.uploaded_documents?.length > 0;
    
    // Select appropriate prompt
    const promptTemplate = hasDocuments 
      ? CLASSIFICATION_PROMPTS.withDocuments 
      : CLASSIFICATION_PROMPTS.standard;

    // Build the classification prompt
    const prompt = promptTemplate
      .replace("{input}", state.user_input)
      .replace("{context}", context)
      .replace("{documents}", hasDocuments ? state.user_context!.uploaded_documents!.join(", ") : "none");

    // Call Gemini API for classification
    const response = await llm.generateChatCompletion(
      "You are an expert at classifying user inputs for an AI assistant system. Analyze requests carefully and classify them accurately.",
      prompt
    );

    // Parse JSON response
    try {
      const parsed = JSON.parse(response.response);
      return {
        category: parsed.category,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      };
    } catch (parseError) {
      console.warn("⚠️ Failed to parse classification JSON, using fallback");
      return this.parseResponseFallback(response.response, state);
    }
  }

  /**
   * Build context string from conversation history
   */
  private buildContextString(state: AgentState): string {
    if (!state.user_context?.conversation_history?.length) {
      return "No previous conversation context";
    }

    const recentMessages = state.user_context.conversation_history
      .slice(-3) // Last 3 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    return `Recent conversation:\n${recentMessages}`;
  }

  /**
   * Apply classification result to state
   */
  private applyClassificationResult(state: AgentState, result: ClassificationResult): AgentState {
    // Validate confidence score
    const confidence = Math.max(0, Math.min(1, result.confidence));
    
    // Check if confidence meets threshold
    if (confidence < this.config.classification_confidence_threshold) {
      console.log(`⚠️ Low confidence (${confidence}), applying fallback`);
      return this.fallbackClassification(state, result.reasoning);
    }

    return {
      ...state,
      input_category: result.category,
      confidence_score: confidence,
      reasoning: result.reasoning,
      selected_workflow: result.category,
    };
  }

  /**
   * Parse response when JSON parsing fails
   */
  private parseResponseFallback(response: string, state: AgentState): ClassificationResult {
    const input = state.user_input.toLowerCase();
    
    // Simple keyword-based fallback
    if (input.includes("code") || input.includes("function") || input.includes("api") || 
        input.includes("script") || input.includes("generate") || input.includes("create") ||
        input.includes("implement") || input.includes("build")) {
      return {
        category: "code_generation",
        confidence: 0.6,
        reasoning: "Keyword-based fallback classification for code generation",
      };
    } else if (input.includes("document") || input.includes("pdf") || input.includes("file") ||
               input.includes("upload") || state.user_context?.uploaded_documents?.length > 0) {
      return {
        category: "document_query", 
        confidence: 0.6,
        reasoning: "Keyword-based fallback classification for document query",
      };
    } else {
      return {
        category: "general_chat",
        confidence: 0.5,
        reasoning: "Fallback to general chat classification",
      };
    }
  }

  /**
   * Check if classification should be skipped
   */
  private shouldSkipClassification(state: AgentState): boolean {
    // Skip if input is too short
    if (state.user_input.trim().length < 3) {
      return true;
    }

    // Skip if retry count is too high
    if (state.retry_count >= this.config.max_retry_attempts) {
      return true;
    }

    return false;
  }

  /**
   * Fallback classification when Gemini API is unavailable
   */
  private fallbackClassification(state: AgentState, reasoning?: string): AgentState {
    console.log("🔄 Using fallback classification");
    
    const input = state.user_input.toLowerCase();
    
    // Enhanced keyword-based classification
    if (this.isCodeGenerationInput(input)) {
      return {
        ...state,
        input_category: "code_generation",
        confidence_score: 0.7,
        reasoning: reasoning || "Fallback: Code generation keywords detected",
        selected_workflow: "code_generation",
      };
    } else if (this.isDocumentQueryInput(input, state)) {
      return {
        ...state,
        input_category: "document_query",
        confidence_score: 0.7,
        reasoning: reasoning || "Fallback: Document-related keywords detected",
        selected_workflow: "document_query",
      };
    } else {
      return {
        ...state,
        input_category: "general_chat",
        confidence_score: 0.6,
        reasoning: reasoning || "Fallback: Default to general chat",
        selected_workflow: "general_chat",
      };
    }
  }

  /**
   * Enhanced code generation detection
   */
  private isCodeGenerationInput(input: string): boolean {
    const codeKeywords = [
      "code", "function", "api", "script", "generate", "create", "implement", "build",
      "write", "develop", "program", "algorithm", "class", "method", "variable",
      "database", "sql", "javascript", "python", "react", "node", "server",
      "frontend", "backend", "component", "module", "library", "framework"
    ];
    
    return codeKeywords.some(keyword => input.includes(keyword));
  }

  /**
   * Enhanced document query detection
   */
  private isDocumentQueryInput(input: string, state: AgentState): boolean {
    const documentKeywords = [
      "document", "pdf", "file", "upload", "text", "content", "read",
      "search", "find", "analyze", "summarize", "extract", "parse"
    ];
    
    const hasDocuments = state.user_context?.uploaded_documents?.length > 0;
    const hasKeywords = documentKeywords.some(keyword => input.includes(keyword));
    
    return hasKeywords || hasDocuments;
  }

  /**
   * Handle classification errors with appropriate fallback
   */
  private handleClassificationError(state: AgentState, error: unknown): AgentState {
    const errorMessage = error instanceof Error ? error.message : "Unknown classification error";
    
    console.error("❌ Classification failed:", errorMessage);
    
    // Use fallback classification
    const fallbackState = this.fallbackClassification(state);
    
    return {
      ...fallbackState,
      errors: [...state.errors, `Classification error: ${errorMessage}`],
      retry_count: state.retry_count + 1,
    };
  }
}

/**
 * Factory function to create classifier instance
 */
export function createClassifier(config: AgentConfig): AgentClassifier {
  return new AgentClassifier(config);
}

/**
 * Standalone classification function for use in nodes
 */
export async function classifyUserInput(state: AgentState, config: AgentConfig): Promise<AgentState> {
  const classifier = createClassifier(config);
  return await classifier.classifyInput(state);
}
