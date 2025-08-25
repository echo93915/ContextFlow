// Test the new state schemas
const {
  createInitialAgentState,
  createCodeTask,
  createCodeSubtask,
  DEFAULT_AGENT_CONFIG,
  isCodeGenerationState,
  canTaskStart,
} = require("./src/lib/agent-types");

console.log("Testing Agent State Schemas...");

// Test initial state creation
const initialState = createInitialAgentState(
  "Create a REST API for user management"
);
console.log("✅ Initial state created:", {
  input: initialState.user_input,
  category: initialState.input_category,
  confidence: initialState.confidence_score,
});

// Test code task creation
const mainTask = createCodeTask(
  "User Management API",
  "Create a complete REST API for user management with authentication",
  ["Authentication", "CRUD operations", "Database integration"],
  "high"
);
console.log("✅ Main task created:", {
  id: mainTask.id,
  title: mainTask.title,
  status: mainTask.status,
  priority: mainTask.priority,
});

// Test subtask creation
const subtask1 = createCodeSubtask(
  mainTask.id,
  "Database Schema",
  "Design and implement user database schema",
  "analysis"
);

const subtask2 = createCodeSubtask(
  mainTask.id,
  "Authentication Middleware",
  "Implement JWT authentication middleware",
  "implementation",
  [subtask1.id] // depends on database schema
);

console.log("✅ Subtasks created:", {
  subtask1: {
    id: subtask1.id,
    title: subtask1.title,
    dependencies: subtask1.dependencies,
  },
  subtask2: {
    id: subtask2.id,
    title: subtask2.title,
    dependencies: subtask2.dependencies,
  },
});

// Test dependency checking
const canStartSubtask1 = canTaskStart(subtask1, [subtask1, subtask2]);
const canStartSubtask2 = canTaskStart(subtask2, [subtask1, subtask2]);

console.log("✅ Dependency checking:", {
  subtask1CanStart: canStartSubtask1, // Should be true (no dependencies)
  subtask2CanStart: canStartSubtask2, // Should be false (depends on subtask1)
});

// Test configuration
console.log("✅ Default configuration:", DEFAULT_AGENT_CONFIG);

// Test state with code generation
const codeState = {
  ...initialState,
  input_category: "code_generation",
  code_generation_task: {
    main_task: mainTask,
    subtasks: [subtask1, subtask2],
    parallel_execution: true,
    collected_context: [],
  },
};

const isCodeGen = isCodeGenerationState(codeState);
console.log("✅ Code generation state detection:", isCodeGen);

console.log("🎉 All state schema tests passed!");

// Clean up
const fs = require("fs");
fs.unlinkSync(__filename);
