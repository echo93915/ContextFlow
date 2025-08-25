# LLM Agent Planner: Routing Workflow for ContextFlow

## Overview

This planner outlines the implementation of an intelligent multi-tier routing system using LangGraph to classify user inputs and direct them to specialized processing workflows. The agent will enhance ContextFlow's capabilities by providing context-aware routing for different types of queries, document processing tasks, and advanced code generation workflows with parallel subtask execution and interactive GUI management.

## Architecture Design

### Current Integration Points

- **Frontend**: Existing chat interfaces (`chat-layout.tsx`, `chat-interface.tsx`)
- **API Layer**: Current `/api/chat` endpoint will be enhanced with agent routing
- **Backend**: LangGraph agent will integrate with existing `llm-unified.ts` and vector stores
- **Dependencies**: Leverages existing LangChain packages (`@langchain/community`, `langchain`)

## State Schema Design

### Primary State Schema

```typescript
interface AgentState {
  // Input
  user_input: string;
  user_context?: {
    conversation_history: ChatMessage[];
    uploaded_documents: string[];
    user_preferences?: Record<string, any>;
  };

  // Classification
  input_category: "document_query" | "general_chat" | "code_generation";
  confidence_score: number;
  reasoning: string;

  // Routing
  selected_workflow: string;
  workflow_parameters: Record<string, any>;

  // Processing
  intermediate_results: Record<string, any>;
  context_retrieved: boolean;
  context_chunks: any[];

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
```

### Supporting Type Definitions

```typescript
interface CodeTask {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  expected_output: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "failed";
  created_at: Date;
  estimated_duration?: number;
}

interface CodeSubtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string;
  type: "analysis" | "implementation" | "testing" | "documentation" | "review";
  dependencies: string[]; // IDs of other subtasks this depends on
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
  llm_response?: string;
  error_message?: string;
  progress: number; // 0-100
  start_time?: Date;
  end_time?: Date;
}

interface DocumentContext {
  source: string;
  relevant_chunks: string[];
  relevance_score: number;
  context_type:
    | "code_example"
    | "specification"
    | "documentation"
    | "requirements";
}
```

### Private State Schema

```typescript
interface PrivateAgentState {
  // Internal processing data
  classification_attempts: number;
  embedding_cache: Map<string, number[]>;
  workflow_history: string[];
  performance_metrics: {
    node_execution_times: Record<string, number>;
    api_call_count: number;
  };

  // Code Generation Internal State
  subtask_execution_pool: Map<string, Promise<any>>;
  parallel_api_calls: number;
  max_parallel_calls: number;
  task_dependency_graph: Map<string, string[]>;
}
```

## Node Definitions

### 1. Input Validation Node

**Purpose**: Validate and sanitize user input
**Function**: `validate_input`

```typescript
function validate_input(state: AgentState): AgentState {
  // Validate input length, content safety, format
  // Clean and normalize input
  // Set initial state values
  // Return updated state with validation results
}
```

### 2. Context Enrichment Node

**Purpose**: Gather conversation context and user history
**Function**: `enrich_context`

```typescript
function enrich_context(state: AgentState): AgentState {
  // Fetch conversation history
  // Load user preferences
  // Get available document context
  // Analyze user patterns
  // Return state with enriched context
}
```

### 3. Classification Node

**Purpose**: Classify input using Gemini API
**Function**: `classify_input`

```typescript
function classify_input(state: AgentState): AgentState {
  // Use Gemini API to classify input type
  // Generate confidence score and reasoning
  // Handle edge cases and ambiguous inputs
  // Return state with classification results
}
```

### 4. Document Query Processor Node

**Purpose**: Handle document-specific queries using RAG
**Function**: `process_document_query`

```typescript
function process_document_query(state: AgentState): AgentState {
  // Generate embeddings for query
  // Search vector store for relevant chunks
  // Rank and filter results
  // Prepare context for response generation
  // Return state with retrieved context
}
```

### 5. General Chat Processor Node

**Purpose**: Handle general conversational queries
**Function**: `process_general_chat`

```typescript
function process_general_chat(state: AgentState): AgentState {
  // Use conversational context
  // Apply general knowledge prompting
  // Handle follow-up questions
  // Return state with prepared response context
}
```

### 6. Code Generation Orchestrator Node

**Purpose**: Handle code generation requests with parallel subtask processing
**Function**: `process_code_generation`

```typescript
function process_code_generation(state: AgentState): AgentState {
  // Analyze code generation requirements
  // Collect relevant context from uploaded documents
  // Break down main task into parallelizable subtasks
  // Set up dependency graph for subtask execution
  // Initialize GUI task cards
  // Return state with structured code generation plan
}
```

### 7. Document Context Collector Node

**Purpose**: Gather relevant code examples and documentation from uploaded files
**Function**: `collect_code_context`

```typescript
function collect_code_context(state: AgentState): AgentState {
  // Search vector store for code-related content
  // Identify relevant documentation sections
  // Extract code examples and specifications
  // Rank context by relevance to code generation task
  // Return state with collected context
}
```

### 8. Subtask Decomposer Node

**Purpose**: Break down code generation into parallel subtasks
**Function**: `decompose_code_task`

```typescript
function decompose_code_task(state: AgentState): AgentState {
  // Analyze main task complexity
  // Identify independent components
  // Create subtasks with clear dependencies
  // Determine optimal parallelization strategy
  // Generate subtask execution plan
  // Return state with subtask structure
}
```

### 9. Parallel Executor Node

**Purpose**: Execute multiple subtasks in parallel using multiple LLM API calls
**Function**: `execute_subtasks_parallel`

```typescript
function execute_subtasks_parallel(state: AgentState): AgentState {
  // Initialize parallel execution pool
  // Launch independent subtasks simultaneously
  // Monitor progress and update GUI cards
  // Handle dependencies and sequential execution
  // Aggregate results from all subtasks
  // Return state with completed subtask results
}
```

### 10. Code Integration Node

**Purpose**: Combine subtask results into final code output
**Function**: `integrate_code_results`

```typescript
function integrate_code_results(state: AgentState): AgentState {
  // Collect all subtask outputs
  // Resolve integration conflicts
  // Apply code formatting and optimization
  // Generate comprehensive documentation
  // Create final deliverable
  // Return state with integrated code solution
}
```

### 11. Response Generation Node

**Purpose**: Generate final response using Gemini API
**Function**: `generate_response`

```typescript
function generate_response(state: AgentState): AgentState {
  // Construct appropriate prompt based on workflow
  // Call Gemini API for response generation
  // Apply response formatting and safety checks
  // Return state with final response
}
```

### 12. Error Handler Node

**Purpose**: Handle errors and provide fallback responses
**Function**: `handle_error`

```typescript
function handle_error(state: AgentState): AgentState {
  // Log error details
  // Provide user-friendly error messages
  // Suggest alternative actions
  // Return state with error response
}
```

## Routing Logic

### Overarching Router (Primary Classification)

```typescript
function overarching_router(state: AgentState): string {
  const { input_category, confidence_score } = state;

  if (confidence_score < 0.7) {
    return "process_general_chat"; // Handle unclear inputs as general chat
  }

  switch (input_category) {
    case "code_generation":
      return "process_code_generation"; // → Code Generation Workflow
    case "document_query":
      return "process_document_query"; // → RAG Workflow
    case "general_chat":
      return "process_general_chat"; // → Conversational Workflow
    default:
      return "handle_error";
  }
}
```

### Code Generation Sub-Router

```typescript
function code_generation_router(state: AgentState): string {
  const { code_generation_task } = state;

  if (!code_generation_task) {
    return "collect_code_context";
  }

  if (!code_generation_task.collected_context.length) {
    return "collect_code_context";
  }

  if (!code_generation_task.subtasks.length) {
    return "decompose_code_task";
  }

  const pendingSubtasks = code_generation_task.subtasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress"
  );

  if (pendingSubtasks.length > 0) {
    return "execute_subtasks_parallel";
  }

  const completedSubtasks = code_generation_task.subtasks.filter(
    (task) => task.status === "completed"
  );

  if (completedSubtasks.length === code_generation_task.subtasks.length) {
    return "integrate_code_results";
  }

  return "handle_error";
}
```

### Error Handling Router

```typescript
function error_router(state: AgentState): string {
  const { errors, retry_count } = state;

  if (errors.length > 0 && retry_count < 3) {
    return "retry_classification";
  }

  if (retry_count >= 3) {
    return "handle_error";
  }

  return "generate_response";
}
```

## Graph Structure

### Graph Flow

```
START → validate_input → enrich_context → classify_input → [OVERARCHING ROUTER]
                                                                      ↓
[DOCUMENT QUERY WORKFLOW]
[process_document_query] → [context_retrieved?] → generate_response → END

[GENERAL CHAT WORKFLOW]
[process_general_chat] → generate_response → END

[CODE GENERATION WORKFLOW]
[process_code_generation] → [CODE GENERATION SUB-ROUTER]
                                      ↓
collect_code_context → decompose_code_task → execute_subtasks_parallel
                                                        ↓
                           integrate_code_results → generate_response → END

[ERROR HANDLING]
[handle_error] → END
```

### Conditional Edges

1. **Overarching Router**: Routes to workflow based on primary input classification
2. **Code Generation Sub-Router**: Manages internal code generation workflow progression
3. **Post-Processing**: Routes to response generation or error handling
4. **Error Recovery**: Routes to retry logic or final error handling
5. **Parallel Execution Control**: Manages concurrent subtask execution and dependencies

## Gemini API Integration Points

### 1. Classification API Call

```typescript
// Prompt for input classification
const classificationPrompt = `
Analyze the following user input and classify it into one of these categories:
- code_generation: Requests to create, modify, or generate code, scripts, or programming solutions
- document_query: Questions about uploaded documents or document content
- general_chat: General conversation, questions, or assistance requests

User Input: "${user_input}"
Context: ${conversation_context}

Respond in JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "explanation"
}
`;
```

### 2. Code Task Decomposition API Call

```typescript
// Prompt for breaking down code generation tasks
const taskDecompositionPrompt = `
You are a senior software architect. Break down this code generation task into parallelizable subtasks.

Main Task: ${main_task_description}
Requirements: ${requirements.join(", ")}
Available Context: ${document_context_summary}

Create subtasks that can be executed in parallel, considering dependencies.
Each subtask should be specific, testable, and produce clear output.

Respond in JSON format:
{
  "subtasks": [
    {
      "title": "Subtask Name",
      "description": "Detailed description",
      "type": "analysis|implementation|testing|documentation|review",
      "dependencies": ["subtask_id1", "subtask_id2"],
      "estimated_duration": 120, // seconds
      "priority": "high|medium|low"
    }
  ],
  "execution_strategy": "parallel|sequential|hybrid",
  "estimated_total_time": 300
}
`;
```

### 3. Parallel Subtask Execution API Calls

```typescript
// Individual subtask prompts (executed in parallel)
const subtaskPrompt = `
You are a specialized code generation assistant working on a specific subtask.

Main Project: ${main_task_title}
Your Subtask: ${subtask.title}
Description: ${subtask.description}
Type: ${subtask.type}

Available Context:
${relevant_document_context}

Dependencies Completed:
${completed_dependencies_results}

Generate the specific output for this subtask. Be precise and follow the requirements exactly.
`;
```

### 4. Code Integration API Call

```typescript
// Prompt for integrating all subtask results
const integrationPrompt = `
You are a senior software engineer responsible for integrating code components.

Main Task: ${main_task_description}
Subtask Results:
${subtask_results
  .map(
    (result) => `
Subtask: ${result.title}
Output: ${result.result}
`
  )
  .join("\n")}

Integration Requirements:
- Ensure all components work together
- Resolve any conflicts or inconsistencies
- Apply best practices and code standards
- Generate comprehensive documentation
- Include error handling and testing guidance

Provide the final integrated solution with clear documentation.
`;
```

### 5. Response Generation API Call

```typescript
// Dynamic prompt based on workflow
const responsePrompt = `
You are an intelligent assistant for ContextFlow, a document processing and chat system.

Workflow: ${selected_workflow}
User Query: ${user_input}
${workflow_specific_context}

Generate a helpful, accurate, and context-aware response.
`;
```

## Integration with Existing Systems

### Vector Store Integration

- Leverage existing `enhanced-vector-store.ts` for document queries
- Maintain compatibility with current embedding generation
- Use existing similarity search capabilities

### LLM Unified Interface

- Extend `llm-unified.ts` to support agent-specific prompts
- Maintain provider fallback logic
- Add agent-specific error handling

### Frontend Integration

- Minimal changes to existing chat interfaces
- Enhanced with agent status indicators
- Support for workflow-specific UI elements
- **New Code Generation GUI Components** (detailed below)

## GUI Components for Code Generation

### Task Management Interface

#### 1. Main Task Card Component

```typescript
interface MainTaskCardProps {
  task: CodeTask;
  onTaskClick: (taskId: string) => void;
  onTaskEdit: (taskId: string) => void;
  onTaskCancel: (taskId: string) => void;
}

// Features:
// - Large card showing main task overview
// - Progress bar for overall completion
// - Status indicator (pending/in_progress/completed/failed)
// - Time estimation and elapsed time
// - Action buttons (view details, edit, cancel)
// - Expandable to show requirements and description
```

#### 2. Subtask Grid Component

```typescript
interface SubtaskGridProps {
  subtasks: CodeSubtask[];
  onSubtaskClick: (subtaskId: string) => void;
  onSubtaskRetry: (subtaskId: string) => void;
  layout: "grid" | "list" | "timeline";
}

// Features:
// - Grid layout of smaller cards for each subtask
// - Real-time status updates (pending/in_progress/completed/failed)
// - Progress indicators (0-100%)
// - Dependency visualization with connecting lines
// - Color-coded by type (analysis/implementation/testing/etc.)
// - Click to view detailed output
// - Retry button for failed tasks
```

#### 3. Task Status Indicators

**Visual Status System:**

```typescript
type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

const StatusIndicators = {
  pending: {
    color: "gray",
    icon: "Clock",
    animation: "pulse",
    description: "Waiting to start",
  },
  in_progress: {
    color: "blue",
    icon: "Loader",
    animation: "spin",
    description: "Processing...",
  },
  completed: {
    color: "green",
    icon: "CheckCircle",
    animation: "none",
    description: "Completed successfully",
  },
  failed: {
    color: "red",
    icon: "XCircle",
    animation: "shake",
    description: "Failed - click to retry",
  },
};
```

#### 4. Task Detail Modal Component

```typescript
interface TaskDetailModalProps {
  task: CodeTask | CodeSubtask;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onEdit?: () => void;
}

// Features:
// - Full-screen modal for task details
// - Tabbed interface: Overview | Output | Logs | Dependencies
// - Code syntax highlighting for generated output
// - Copy to clipboard functionality
// - Download generated code as files
// - Error details and retry options
// - Real-time updates while task is running
```

#### 5. Parallel Execution Visualizer

```typescript
interface ParallelExecutionProps {
  executionPool: Map<string, Promise<any>>;
  maxParallelCalls: number;
  currentParallelCalls: number;
}

// Features:
// - Visual representation of parallel API calls
// - Queue status showing waiting tasks
// - Real-time execution slots (e.g., "3/5 slots active")
// - Performance metrics (avg response time, throughput)
// - API usage monitoring
```

### GUI Layout Structure

#### Code Generation Chat Interface

```typescript
interface CodeGenerationChatProps {
  messages: ChatMessage[];
  activeCodeTask?: CodeTask;
  onSendMessage: (message: string) => void;
}

// Layout:
// ┌─────────────────────────────────────────────────────────────┐
// │                     Chat Messages Area                      │
// │  - Regular chat messages                                    │
// │  - Special code generation initiation message              │
// │  - Task creation confirmation                               │
// ├─────────────────────────────────────────────────────────────┤
// │                    Task Management Panel                    │
// │  ┌─────────────────┐  ┌─────────────────┐                  │
// │  │   Main Task     │  │   Subtask Grid  │                  │
// │  │     Card        │  │                 │                  │
// │  │                 │  │  [ST1] [ST2]    │                  │
// │  │   Progress:     │  │  [ST3] [ST4]    │                  │
// │  │   ████████░░    │  │  [ST5] [ST6]    │                  │
// │  │     80%         │  │                 │                  │
// │  └─────────────────┘  └─────────────────┘                  │
// ├─────────────────────────────────────────────────────────────┤
// │                     Chat Input Area                        │
// └─────────────────────────────────────────────────────────────┘
```

### Real-time Updates System

#### WebSocket Integration for Live Updates

```typescript
interface TaskUpdateMessage {
  type:
    | "task_status_update"
    | "subtask_progress"
    | "api_call_start"
    | "api_call_complete";
  taskId: string;
  subtaskId?: string;
  status?: TaskStatus;
  progress?: number;
  result?: string;
  error?: string;
  timestamp: Date;
}

// Features:
// - Real-time status updates without page refresh
// - Progress bar animations
// - Live API call monitoring
// - Instant error notifications
// - Completion celebrations (animations/sounds)
```

#### State Management for GUI

```typescript
interface CodeGenerationUIState {
  activeTask: CodeTask | null;
  subtasks: CodeSubtask[];
  selectedSubtask: string | null;
  showTaskDetails: boolean;
  executionMetrics: {
    totalApiCalls: number;
    activeApiCalls: number;
    avgResponseTime: number;
    totalProcessingTime: number;
  };
  uiPreferences: {
    layoutMode: "compact" | "expanded";
    showDependencies: boolean;
    autoExpandCompleted: boolean;
    enableAnimations: boolean;
  };
}
```

### Interaction Patterns

#### Task Card Click Behaviors

1. **Main Task Card Click**: Show full task overview with all subtasks
2. **Subtask Card Click**: Open detailed modal with output/logs
3. **Status Indicator Click**: Show quick status tooltip
4. **Progress Bar Click**: Show time estimates and completion details
5. **Dependency Lines Hover**: Highlight related tasks

#### Keyboard Shortcuts

- `Ctrl/Cmd + Space`: Focus on task search
- `Escape`: Close modal/details
- `Enter`: Start/retry selected task
- `Tab`: Navigate between subtask cards
- `Ctrl/Cmd + C`: Copy selected task output

## Performance Considerations

### Caching Strategy

- Cache classification results for similar inputs
- Store frequently accessed document chunks
- Implement response caching for common queries

### Error Recovery

- Implement exponential backoff for API failures
- Graceful degradation to simpler responses
- Fallback to current non-agent system

### Monitoring

- Track classification accuracy
- Monitor API usage and costs
- Measure response times by workflow

## Configuration Options

### Agent Settings

```typescript
interface AgentConfig {
  classification_confidence_threshold: number; // default: 0.7
  max_retry_attempts: number; // default: 3
  enable_context_enrichment: boolean; // default: true
  fallback_to_simple_chat: boolean; // default: true
  workflow_timeouts: Record<string, number>;
}
```

### Workflow Toggles

- Enable/disable document query vs general chat routing
- Adjust confidence thresholds for classification
- Configure timeout values for different operations

## Implementation Phases

### Phase 1: Core Infrastructure

1. Set up LangGraph integration
2. Implement basic state schema
3. Create classification node with Gemini API
4. Build simple routing logic

### Phase 2: Workflow Processors

1. Implement document query processor
2. Create general chat processor
3. Add error handling and retry logic
4. Integrate with existing vector store

### Phase 3: Advanced Features

1. Add performance monitoring
2. Implement advanced routing logic
3. Add conversation context awareness
4. Optimize classification accuracy

### Phase 4: Optimization

1. Implement caching strategies
2. Add configuration management
3. Optimize API usage and costs
4. Enhance error recovery

## Success Metrics

### Technical Metrics

- Classification accuracy > 90%
- Response time < 3 seconds per query
- API call efficiency (minimize redundant calls)
- Error rate < 5%

### User Experience Metrics

- Improved response relevance
- Reduced user confusion
- Better handling of edge cases
- Increased user satisfaction

## Risk Mitigation

### API Failures

- Implement circuit breaker pattern
- Fallback to non-agent responses
- Cache responses for offline scenarios

### Classification Errors

- Confidence threshold tuning
- Manual override mechanisms
- Continuous learning from user feedback

### Performance Issues

- Implement request queuing
- Add timeout handling
- Monitor resource usage

## Future Enhancements

### Advanced Routing

- Multi-step classification for complex queries
- Dynamic workflow creation
- User preference learning

### Integration Expansions

- Support for additional LLM providers
- Integration with external APIs
- Advanced document processing workflows

### Intelligence Improvements

- Conversation context awareness
- User behavior pattern recognition
- Adaptive confidence thresholds

---

**References:**

- [LangGraph Low-Level Concepts](https://langchain-ai.github.io/langgraph/concepts/low_level/)
- [LangGraph Compiling Graphs](https://langchain-ai.github.io/langgraph/concepts/low_level/#compiling-your-graph)
- [Anthropic Agent Workflows](https://github.com/anthropics/anthropic-cookbook/blob/main/patterns/agents/basic_workflows.ipynb)

This planner provides a comprehensive foundation for implementing intelligent routing in ContextFlow while leveraging existing infrastructure and maintaining backward compatibility.
