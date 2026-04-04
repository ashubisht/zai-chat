// Types for the Z.AI API
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  stream?: boolean;
}

export interface ChatChoice {
  message: {
    role: string;
    content: string;
  };
  index?: number;
  finish_reason?: string;
}

export interface ChatResponse {
  choices: ChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  id?: string;
  object?: string;
  created?: number;
  model?: string;
}

export interface ErrorResponse {
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
}

// Types for conversations
export interface ConversationMessage {
  role: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  created_at: number;
  updated_at: number;
}

// Types for app state
export type MessageRole = 'user' | 'assistant' | 'system';

export interface AppMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface AppSettings {
  model: string;
  temperature: number;
  systemPrompt: string;
  theme: 'dark' | 'light';
  plan: 'regular' | 'coding';
}
