export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextUsed?: boolean;
  agentInfo?: {
    workflow: string;
    confidence: number;
    metadata?: any;
  };
}