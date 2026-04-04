import { invoke } from '@tauri-apps/api/core';
import type { ChatRequest, ChatResponse, ErrorResponse, Conversation, ChatMessage } from './types';

const API_ENDPOINTS = {
  regular: 'https://api.z.ai/api/paas/v4/chat/completions',
  coding: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
};

// Check if we're running in Tauri or web mode
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Helper function to invoke Tauri commands with web fallback
 */
async function invokeCommand<T>(command: string, args?: any): Promise<T> {
  if (isTauri) {
    return await invoke<T>(command, args);
  } else {
    // Web mode fallback using localStorage
    return await handleWebModeCommand<T>(command, args);
  }
}

/**
 * Handle commands in web mode using localStorage
 */
async function handleWebModeCommand<T>(command: string, args?: any): Promise<T> {
  switch (command) {
    case 'save_api_key':
      localStorage.setItem('zai_api_key', args.apiKey);
      return undefined as T;

    case 'get_api_key':
      const key = localStorage.getItem('zai_api_key');
      return (key || null) as T;

    case 'delete_api_key':
      localStorage.removeItem('zai_api_key');
      return undefined as T;

    case 'save_conversation': {
      const conversations = JSON.parse(localStorage.getItem('zai_conversations') || '[]');
      const index = conversations.findIndex((c: Conversation) => c.id === args.conversation.id);
      if (index >= 0) {
        conversations[index] = args.conversation;
      } else {
        conversations.push(args.conversation);
      }
      localStorage.setItem('zai_conversations', JSON.stringify(conversations));
      return undefined as T;
    }

    case 'get_conversations':
      return JSON.parse(localStorage.getItem('zai_conversations') || '[]') as T;

    case 'delete_conversation': {
      const conversations = JSON.parse(localStorage.getItem('zai_conversations') || '[]');
      const filtered = conversations.filter((c: Conversation) => c.id !== args.id);
      localStorage.setItem('zai_conversations', JSON.stringify(filtered));
      return undefined as T;
    }

    case 'clear_all_conversations':
      localStorage.removeItem('zai_conversations');
      return undefined as T;

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Send a chat completion request to Z.AI API
 */
export async function sendChatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  model = 'glm-4.7',
  temperature = 0.7,
  plan: 'regular' | 'coding' = 'regular'
): Promise<ChatResponse> {
  try {
    const request: ChatRequest = {
      model,
      messages,
      temperature,
    };

    const endpoint = API_ENDPOINTS[plan];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'API request failed';
      throw new APIError(errorMessage, response.status, JSON.stringify(errorData));
    }

    const data: ChatResponse = await response.json();

    // Validate response
    if (!data.choices || data.choices.length === 0) {
      throw new APIError('No response from AI model');
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new APIError('Empty response from AI model');
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError('Network error. Please check your internet connection.');
    }

    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

/**
 * API key management using Tauri commands or localStorage fallback
 */
export const apiKeyAPI = {
  save: async (apiKey: string): Promise<void> => {
    await invokeCommand('save_api_key', { apiKey });
  },

  get: async (): Promise<string | null> => {
    return await invokeCommand<string | null>('get_api_key');
  },

  delete: async (): Promise<void> => {
    await invokeCommand('delete_api_key');
  },
};

/**
 * Conversation storage using Tauri commands or localStorage fallback
 */
export const conversationAPI = {
  save: async (conversation: Conversation): Promise<void> => {
    await invokeCommand('save_conversation', { conversation });
  },

  getAll: async (): Promise<Conversation[]> => {
    return await invokeCommand<Conversation[]>('get_conversations');
  },

  delete: async (id: string): Promise<void> => {
    await invokeCommand('delete_conversation', { id });
  },

  clearAll: async (): Promise<void> => {
    await invokeCommand('clear_all_conversations');
  },
};

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a title from the first user message
 */
export function generateTitle(firstMessage: string): string {
  const maxLength = 50;
  const cleaned = firstMessage.trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.substring(0, maxLength).trim() + '...';
}
