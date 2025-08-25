/**
 * Integration test for classification system
 * Tests actual Gemini API integration
 */

import { createInitialAgentState, DEFAULT_AGENT_CONFIG } from "./agent-types";
import { classifyUserInput } from "./agent-classifier";

async function testGeminiClassification() {
  console.log("🧪 Testing Gemini API classification integration...");

  // Test case
  const testInput = "Create a REST API for user management with JWT authentication";
  const state = createInitialAgentState(testInput);

  try {
    console.log(`\nClassifying: "${testInput}"`);
    
    const result = await classifyUserInput(state, DEFAULT_AGENT_CONFIG);
    
    console.log("✅ Classification successful!");
    console.log(`Category: ${result.input_category}`);
    console.log(`Confidence: ${result.confidence_score}`);
    console.log(`Reasoning: ${result.reasoning}`);
    
    // Verify expected result
    if (result.input_category === "code_generation" && result.confidence_score > 0.7) {
      console.log("🎉 Classification test PASSED!");
    } else {
      console.log("⚠️ Unexpected classification result");
    }
    
  } catch (error) {
    console.error("❌ Classification failed:", error);
    
    // Test fallback classification
    console.log("\n🔄 Testing fallback classification...");
    
    // This should trigger fallback due to API error
    const fallbackResult = await classifyUserInput(state, {
      ...DEFAULT_AGENT_CONFIG,
      classification_confidence_threshold: 0.1, // Lower threshold to accept fallback
    });
    
    console.log("Fallback result:");
    console.log(`Category: ${fallbackResult.input_category}`);
    console.log(`Confidence: ${fallbackResult.confidence_score}`);
    console.log(`Reasoning: ${fallbackResult.reasoning}`);
  }
}

export { testGeminiClassification };
