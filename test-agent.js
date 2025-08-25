// Simple test to verify LangGraph integration
const { StateGraph, START, END } = require("@langchain/langgraph");

console.log("Testing LangGraph integration...");

// Basic state interface
const testState = {
  input: "",
  output: "",
};

// Create a simple graph
const graph = new StateGraph({
  channels: {
    input: null,
    output: null,
  },
});

// Add a simple node
graph.addNode("test_node", (state) => {
  console.log("✅ Node executed successfully!");
  return { ...state, output: "LangGraph is working!" };
});

// Add edges
graph.addEdge(START, "test_node");
graph.addEdge("test_node", END);

// Test compilation
try {
  const compiled = graph.compile();
  console.log("✅ LangGraph compilation successful!");

  // Test execution
  compiled
    .invoke({ input: "test", output: "" })
    .then((result) => {
      console.log("✅ LangGraph execution successful!");
      console.log("Result:", result);
      console.log("🎉 LangGraph integration is working correctly!");

      // Clean up test file
      const fs = require("fs");
      fs.unlinkSync(__filename);
    })
    .catch((error) => {
      console.error("❌ LangGraph execution failed:", error);
    });
} catch (error) {
  console.error("❌ LangGraph compilation failed:", error);
}
