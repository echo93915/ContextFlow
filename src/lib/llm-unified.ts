/**
 * Unified LLM Interface
 * Based on the proven workflow with multiple provider fallbacks
 * Supports Google Gemini, OpenAI, and mock providers
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: string;
}

export interface ChatCompletionResult {
  response: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

export interface LLMSettings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  preferredProvider: 'gemini' | 'openai' | 'auto';
  embeddingModel: {
    gemini: string;
    openai: string;
  };
  chatModel: {
    gemini: string;
    openai: string;
  };
  maxRetries: number;
  retryDelay: number;
}

// Default settings
const DEFAULT_SETTINGS: LLMSettings = {
  preferredProvider: 'auto',
  embeddingModel: {
    gemini: 'models/text-embedding-004',
    openai: 'text-embedding-3-small'
  },
  chatModel: {
    gemini: 'gemini-1.5-flash',
    openai: 'gpt-3.5-turbo'
  },
  maxRetries: 3,
  retryDelay: 1000
};

class UnifiedLLMInterface {
  private settings: LLMSettings;
  private geminiClient?: GoogleGenerativeAI;
  private providersHealth: Record<string, boolean> = {
    gemini: true,
    openai: true
  };

  constructor(settings: Partial<LLMSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize Gemini client
    if (this.settings.geminiApiKey) {
      try {
        this.geminiClient = new GoogleGenerativeAI(this.settings.geminiApiKey);
        console.log('✅ Gemini client initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini client:', error);
        this.providersHealth.gemini = false;
      }
    } else {
      console.warn('⚠️ Gemini API key not provided');
      this.providersHealth.gemini = false;
    }

    // OpenAI will be initialized per request since it's just HTTP calls
    if (!this.settings.openaiApiKey) {
      console.warn('⚠️ OpenAI API key not provided');
      this.providersHealth.openai = false;
    }
  }

  /**
   * Generate embeddings with provider fallback
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    // Filter out empty texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    if (validTexts.length === 0) {
      throw new Error('No valid texts provided for embedding generation');
    }

    console.log(`🔄 Generating embeddings for ${validTexts.length} texts...`);

    // Try providers in order based on preference and health
    const providers = this.getProviderOrder();
    
    for (const provider of providers) {
      try {
        console.log(`🔧 Attempting embedding generation with ${provider}...`);
        const results = await this.generateEmbeddingsWithProvider(validTexts, provider);
        console.log(`✅ Successfully generated ${results.length} embeddings with ${provider}`);
        return results;
      } catch (error) {
        console.error(`❌ ${provider} embedding generation failed:`, error);
        this.providersHealth[provider] = false;
        
        // If this was the last provider, throw the error
        if (provider === providers[providers.length - 1]) {
          throw new Error(`All embedding providers failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    throw new Error('No embedding providers available');
  }

  private async generateEmbeddingsWithProvider(texts: string[], provider: string): Promise<EmbeddingResult[]> {
    switch (provider) {
      case 'gemini':
        return await this.generateGeminiEmbeddings(texts);
      case 'openai':
        return await this.generateOpenAIEmbeddings(texts);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async generateGeminiEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const results: EmbeddingResult[] = [];
    
    // Gemini processes one text at a time
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      try {
        const model = this.geminiClient.getGenerativeModel({ 
          model: this.settings.embeddingModel.gemini 
        });
        
        const result = await model.embedContent(text);
        
        if (!result.embedding || !result.embedding.values) {
          throw new Error('Invalid embedding response from Gemini');
        }

        results.push({
          embedding: result.embedding.values,
          dimensions: result.embedding.values.length,
          model: this.settings.embeddingModel.gemini,
          provider: 'gemini'
        });

        // Remove delay for faster processing - Gemini can handle the rate
        // if (i < texts.length - 1) {
        //   await new Promise(resolve => setTimeout(resolve, 100));
        // }

        console.log(`📄 Processed embedding ${i + 1}/${texts.length} with Gemini`);
        
      } catch (error) {
        console.error(`❌ Failed to generate embedding for text ${i + 1}:`, error);
        throw error;
      }
    }

    return results;
  }

  private async generateOpenAIEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.settings.openaiApiKey) {
      throw new Error('OpenAI API key not provided');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.settings.embeddingModel.openai,
          input: texts,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenAI API');
      }

      return data.data.map((item: any, index: number) => ({
        embedding: item.embedding,
        dimensions: item.embedding.length,
        model: this.settings.embeddingModel.openai,
        provider: 'openai'
      }));

    } catch (error) {
      console.error('❌ OpenAI embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate chat completion with provider fallback
   */
  async generateChatCompletion(
    systemMessage: string,
    userMessage: string
  ): Promise<ChatCompletionResult> {
    console.log('🔄 Generating chat completion...');

    const providers = this.getProviderOrder();
    
    for (const provider of providers) {
      try {
        console.log(`🔧 Attempting chat completion with ${provider}...`);
        const result = await this.generateChatCompletionWithProvider(systemMessage, userMessage, provider);
        console.log(`✅ Successfully generated response with ${provider}`);
        return result;
      } catch (error) {
        console.error(`❌ ${provider} chat completion failed:`, error);
        this.providersHealth[provider] = false;
        
        if (provider === providers[providers.length - 1]) {
          throw new Error(`All chat providers failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    throw new Error('No chat providers available');
  }

  private async generateChatCompletionWithProvider(
    systemMessage: string,
    userMessage: string,
    provider: string
  ): Promise<ChatCompletionResult> {
    switch (provider) {
      case 'gemini':
        return await this.generateGeminiChatCompletion(systemMessage, userMessage);
      case 'openai':
        return await this.generateOpenAIChatCompletion(systemMessage, userMessage);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async generateGeminiChatCompletion(
    systemMessage: string,
    userMessage: string
  ): Promise<ChatCompletionResult> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    try {
      const model = this.geminiClient.getGenerativeModel({ 
        model: this.settings.chatModel.gemini 
      });

      const prompt = `${systemMessage}\n\n${userMessage}`;
      const result = await model.generateContent(prompt);
      
      if (!result.response) {
        throw new Error('Invalid response from Gemini');
      }

      const responseText = result.response.text();
      
      return {
        response: responseText,
        model: this.settings.chatModel.gemini,
        provider: 'gemini'
      };

    } catch (error) {
      console.error('❌ Gemini chat completion failed:', error);
      throw error;
    }
  }

  private async generateOpenAIChatCompletion(
    systemMessage: string,
    userMessage: string
  ): Promise<ChatCompletionResult> {
    if (!this.settings.openaiApiKey) {
      throw new Error('OpenAI API key not provided');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.settings.chatModel.openai,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      return {
        response: data.choices[0].message.content,
        model: this.settings.chatModel.openai,
        provider: 'openai',
        tokensUsed: data.usage?.total_tokens
      };

    } catch (error) {
      console.error('❌ OpenAI chat completion failed:', error);
      throw error;
    }
  }

  private getProviderOrder(): string[] {
    const availableProviders = Object.entries(this.providersHealth)
      .filter(([_, healthy]) => healthy)
      .map(([provider]) => provider);

    if (availableProviders.length === 0) {
      // Return all providers to attempt recovery
      return ['gemini', 'openai'];
    }

    // Sort by preference
    if (this.settings.preferredProvider === 'auto') {
      // Auto mode: prefer Gemini first, then OpenAI
      return availableProviders.sort((a, b) => {
        const order = ['gemini', 'openai'];
        return order.indexOf(a) - order.indexOf(b);
      });
    } else {
      // Put preferred provider first
      const preferred = this.settings.preferredProvider;
      return availableProviders.sort((a, b) => {
        if (a === preferred) return -1;
        if (b === preferred) return 1;
        return 0;
      });
    }
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): Record<string, boolean> {
    return { ...this.providersHealth };
  }

  /**
   * Reset provider health (useful for recovery attempts)
   */
  resetProviderHealth() {
    this.providersHealth = {
      gemini: !!this.settings.geminiApiKey,
      openai: !!this.settings.openaiApiKey
    };
  }
}

// Export singleton instance
let unifiedLLM: UnifiedLLMInterface | null = null;

export function getUnifiedLLM(settings?: Partial<LLMSettings>): UnifiedLLMInterface {
  if (!unifiedLLM || settings) {
    unifiedLLM = new UnifiedLLMInterface(settings);
  }
  return unifiedLLM;
}

export { UnifiedLLMInterface };

