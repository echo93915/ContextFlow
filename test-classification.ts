/**
 * Test Gemini-powered classification
 */

import { getSimpleAgent } from "./src/lib/agent-simple";
import { createInitialAgentState } from "./src/lib/agent-types";

async function testClassification() {
  console.log("🧪 Testing Gemini-powered classification...");
  
  const agent = getSimpleAgent();
  
  // Test cases
  const testCases = [
    {
      input: "Create a REST API for user management with authentication",
      expected: "code_generation",
    },
    {
      input: "What does the contract say about payment terms?",
      expected: "document_query",
    },
    {
      input: "Hello, how are you today?",
      expected: "general_chat",
    },
    {
      input: "Build a React component for a login form",
      expected: "code_generation",
    },
    {
      input: "Summarize the uploaded PDF document",
      expected: "document_query",
    },
  ];

  console.log("Running classification tests...\n");

  for (const testCase of testCases) {
    try {
      console.log(`Input: "${testCase.input}"`);
      console.log(`Expected: ${testCase.expected}`);
      
      const result = await agent.processInput(testCase.input);
      
      console.log(`Classified as: ${result.input_category}`);
      console.log(`Confidence: ${result.confidence_score}`);
      console.log(`Reasoning: ${result.reasoning}`);
      
      const isCorrect = result.input_category === testCase.expected;
      console.log(`Result: ${isCorrect ? "✅ PASS" : "❌ FAIL"}`);
      console.log("---");
      
    } catch (error) {
      console.error(`❌ Error testing "${testCase.input}":`, error);
      console.log("---");
    }
  }

  console.log("🎉 Classification testing complete!");
}

// Run the test
testClassification().catch(console.error);
