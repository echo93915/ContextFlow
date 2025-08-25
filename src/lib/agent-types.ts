/**
 * Agent State Schemas and Type Definitions
 * Comprehensive type system for the LangGraph agent
 */

import { ChatMessage } from "./gemini";

// Task Status Types
export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";
export type TaskPriority = "high" | "medium" | "low";
export type SubtaskType = "analysis" | "implementation" | "testing" | "documentation" | "review";
export type ContextType = "code_example" | "specification" | "documentation" | "requirements";

// Core Task Interfaces
export interface CodeTask {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  expected_output: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: Date;
  estimated_duration?: number;
}

export interface CodeSubtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string;
  type: SubtaskType;
  dependencies: string[]; // IDs of other subtasks this depends on
  status: TaskStatus;
  result?: string;
  llm_response?: string;
  error_message?: string;
  progress: number; // 0-100
  start_time?: Date;
  end_time?: Date;
}

export interface DocumentContext {
  source: string;
  relevant_chunks: string[];
  relevance_score: number;
  context_type: ContextType;
}

// Main Agent State
export interface AgentState {
  // Input
  user_input: string;
  user_context?: {
    conversation_history: ChatMessage[];
    uploaded_documents: string[];
    user_preferences?: Record<string, unknown>;
  };

  // Classification
  input_category: "document_query" | "general_chat" | "code_generation";
  confidence_score: number;
  reasoning: string;

  // Routing
  selected_workflow: string;
  workflow_parameters: Record<string, unknown>;

  // Processing
  intermediate_results: Record<string, unknown>;
  context_retrieved: boolean;
  context_chunks: unknown[];

  // Code Generation Specific
  code_generation_task?: {
    main_task: CodeTask;
    subtasks: CodeSubtask[];
    parallel_execution: boolean;
    collected_context: DocumentContext[];
  };

  // Output
  final_response: string;
  response_metadata: {
    workflow_used: string;
    processing_time: number;
    sources_used: string[];
    confidence: number;
  };

  // Error handling
  errors: string[];
  retry_count: number;
}

// Private State for internal processing
export interface PrivateAgentState {
  // Internal processing data
  classification_attempts: number;
  embedding_cache: Map<string, number[]>;
  workflow_history: string[];
  performance_metrics: {
    node_execution_times: Record<string, number>;
    api_call_count: number;
  };

  // Code Generation Internal State
  subtask_execution_pool: Map<string, Promise<unknown>>;
  parallel_api_calls: number;
  max_parallel_calls: number;
  task_dependency_graph: Map<string, string[]>;
}

// Agent Configuration
export interface AgentConfig {
  classification_confidence_threshold: number; // default: 0.7
  max_retry_attempts: number; // default: 3
  enable_context_enrichment: boolean; // default: true
  fallback_to_simple_chat: boolean; // default: true
  workflow_timeouts: Record<string, number>;
  max_parallel_calls: number; // default: 5
}

// Default configuration
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  classification_confidence_threshold: 0.7,
  max_retry_attempts: 3,
  enable_context_enrichment: true,
  fallback_to_simple_chat: true,
  workflow_timeouts: {
    classification: 10000, // 10 seconds
    document_query: 30000, // 30 seconds
    general_chat: 15000, // 15 seconds
    code_generation: 120000, // 2 minutes
  },
  max_parallel_calls: 5,
};

// Utility functions for state management
export function createInitialAgentState(userInput: string): AgentState {
  return {
    user_input: userInput,
    user_context: {
      conversation_history: [],
      uploaded_documents: [],
    },
    input_category: "general_chat",
    confidence_score: 0,
    reasoning: "",
    selected_workflow: "",
    workflow_parameters: {},
    intermediate_results: {},
    context_retrieved: false,
    context_chunks: [],
    final_response: "",
    response_metadata: {
      workflow_used: "",
      processing_time: 0,
      sources_used: [],
      confidence: 0,
    },
    errors: [],
    retry_count: 0,
  };
}

export function createCodeTask(
  title: string,
  description: string,
  requirements: string[] = [],
  priority: TaskPriority = "medium"
): CodeTask {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    requirements,
    expected_output: "",
    priority,
    status: "pending",
    created_at: new Date(),
  };
}

export function createCodeSubtask(
  parentTaskId: string,
  title: string,
  description: string,
  type: SubtaskType,
  dependencies: string[] = []
): CodeSubtask {
  return {
    id: crypto.randomUUID(),
    parent_task_id: parentTaskId,
    title,
    description,
    type,
    dependencies,
    status: "pending",
    progress: 0,
  };
}

// Type guards for runtime type checking
export function isCodeGenerationState(state: AgentState): boolean {
  return state.input_category === "code_generation" && !!state.code_generation_task;
}

export function isDocumentQueryState(state: AgentState): boolean {
  return state.input_category === "document_query";
}

export function isGeneralChatState(state: AgentState): boolean {
  return state.input_category === "general_chat";
}

// Task status helpers
export function isTaskCompleted(task: CodeTask | CodeSubtask): boolean {
  return task.status === "completed";
}

export function isTaskFailed(task: CodeTask | CodeSubtask): boolean {
  return task.status === "failed";
}

export function isTaskInProgress(task: CodeTask | CodeSubtask): boolean {
  return task.status === "in_progress";
}

export function canTaskStart(subtask: CodeSubtask, allSubtasks: CodeSubtask[]): boolean {
  if (subtask.dependencies.length === 0) return true;
  
  return subtask.dependencies.every(depId => {
    const dependency = allSubtasks.find(t => t.id === depId);
    return dependency && isTaskCompleted(dependency);
  });
}
