import { invoke } from '@tauri-apps/api/core';
import type { ChatRequest, ChatResponse, ErrorResponse, Conversation, ChatMessage } from './types';

const API_ENDPOINT = 'https://api.z.ai/api/paas/v4/chat/completions';

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
  temperature = 0.7
): Promise<ChatResponse> {
  try {
    const request: ChatRequest = {
      model,
      messages,
      temperature,
    };

    const response = await fetch(API_ENDPOINT, {
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
 * API key management using Tauri commands
 */
export const apiKeyAPI = {
  save: async (apiKey: string): Promise<void> => {
    await invoke('save_api_key', { apiKey });
  },

  get: async (): Promise<string | null> => {
    return await invoke('get_api_key');
  },

  delete: async (): Promise<void> => {
    await invoke('delete_api_key');
  },
};

/**
 * Conversation storage using Tauri commands
 */
export const conversationAPI = {
  save: async (conversation: Conversation): Promise<void> => {
    await invoke('save_conversation', { conversation });
  },

  getAll: async (): Promise<Conversation[]> => {
    return await invoke('get_conversations');
  },

  delete: async (id: string): Promise<void> => {
    await invoke('delete_conversation', { id });
  },

  clearAll: async (): Promise<void> => {
    await invoke('clear_all_conversations');
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
