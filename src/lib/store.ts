import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMessage, Conversation, AppSettings, ChatMessage } from './types';
import { sendChatCompletion, apiKeyAPI, conversationAPI, generateId, generateTitle } from './api';

interface ChatStore {
  // State
  messages: AppMessage[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  apiKey: string | null;
  settings: AppSettings;
  isApiKeyModalOpen: boolean;
  isSettingsOpen: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  createConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  clearCurrentConversation: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  saveApiKey: (key: string) => Promise<void>;
  deleteApiKey: () => Promise<void>;
  checkApiKey: () => Promise<void>;
  setError: (error: string | null) => void;
  loadConversations: () => Promise<void>;
  clearAllConversations: () => Promise<void>;
  toggleApiKeyModal: (open: boolean) => void;
  toggleSettings: (open: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      error: null,
      apiKey: null,
      settings: {
        model: 'glm-4.7',
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant. Always respond in English.',
        theme: 'dark',
      },
      isApiKeyModalOpen: false,
      isSettingsOpen: false,

      // Send a message to the AI
      sendMessage: async (content: string) => {
        const { apiKey, messages, settings, currentConversationId, conversations } = get();

        if (!apiKey) {
          set({ error: 'Please set your API key in settings', isApiKeyModalOpen: true });
          return;
        }

        // Add user message
        const userMessage: AppMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        set({ messages: [...messages, userMessage], isLoading: true, error: null });

        // Create conversation if needed
        let conversationId = currentConversationId;
        if (!conversationId) {
          const newConversation: Conversation = {
            id: generateId(),
            title: generateTitle(content),
            messages: [],
            created_at: Date.now(),
            updated_at: Date.now(),
          };
          conversationId = newConversation.id;
          set({ currentConversationId: conversationId, conversations: [...conversations, newConversation] });
        }

        // Build message history for API
        const apiMessages: ChatMessage[] = [
          { role: 'system', content: settings.systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ];

        try {
          // Call Z.AI API
          const response = await sendChatCompletion(
            apiMessages,
            apiKey,
            settings.model,
            settings.temperature
          );

          // Add assistant message
          const assistantContent = response.choices[0]?.message?.content;
          if (!assistantContent) {
            throw new Error('Empty response from AI');
          }

          const assistantMessage: AppMessage = {
            id: generateId(),
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
          };

          const updatedMessages = [...messages, userMessage, assistantMessage];

          // Update conversation
          const updatedConversations = conversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: [
                  ...conv.messages,
                  { role: 'user', content, timestamp: userMessage.timestamp },
                  { role: 'assistant', content: assistantMessage.content, timestamp: assistantMessage.timestamp },
                ],
                updated_at: Date.now(),
              };
            }
            return conv;
          });

          set({
            messages: updatedMessages,
            conversations: updatedConversations,
            isLoading: false,
          });

          // Save conversation to disk
          const conversation = updatedConversations.find((c) => c.id === conversationId);
          if (conversation) {
            await conversationAPI.save(conversation);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Create a new conversation
      createConversation: () => {
        set({
          messages: [],
          currentConversationId: null,
          error: null,
        });
      },

      // Delete a conversation
      deleteConversation: async (id: string) => {
        const { conversations, currentConversationId } = get();

        await conversationAPI.delete(id);

        const updatedConversations = conversations.filter((c) => c.id !== id);

        if (currentConversationId === id) {
          set({
            conversations: updatedConversations,
            messages: [],
            currentConversationId: null,
          });
        } else {
          set({ conversations: updatedConversations });
        }
      },

      // Switch to a different conversation
      switchConversation: async (id: string) => {
        const { conversations } = get();
        const conversation = conversations.find((c) => c.id === id);

        if (conversation) {
          const messages = conversation.messages.map((m, i) => ({
            id: `${id}-${i}`,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp,
          }));

          set({
            messages,
            currentConversationId: id,
            error: null,
          });
        }
      },

      // Clear current conversation messages
      clearCurrentConversation: () => {
        set({ messages: [] });
      },

      // Update settings
      updateSettings: (newSettings: Partial<AppSettings>) => {
        set({ settings: { ...get().settings, ...newSettings } });
      },

      // Save API key
      saveApiKey: async (key: string) => {
        await apiKeyAPI.save(key);
        set({ apiKey: key, isApiKeyModalOpen: false });
      },

      // Delete API key
      deleteApiKey: async () => {
        await apiKeyAPI.delete();
        set({ apiKey: null });
      },

      // Check for existing API key on startup
      checkApiKey: async () => {
        try {
          const key = await apiKeyAPI.get();
          if (key) {
            set({ apiKey: key });
          }
        } catch (error) {
          console.error('Failed to check API key:', error);
        }
      },

      // Set error message
      setError: (error: string | null) => {
        set({ error });
      },

      // Load conversations from disk
      loadConversations: async () => {
        try {
          const convs = await conversationAPI.getAll();
          set({ conversations: convs });
        } catch (error) {
          console.error('Failed to load conversations:', error);
        }
      },

      // Clear all conversations
      clearAllConversations: async () => {
        await conversationAPI.clearAll();
        set({ conversations: [], messages: [], currentConversationId: null });
      },

      // Toggle API key modal
      toggleApiKeyModal: (open: boolean) => {
        set({ isApiKeyModalOpen: open });
      },

      // Toggle settings panel
      toggleSettings: (open: boolean) => {
        set({ isSettingsOpen: open });
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist messages, conversations, or API key
        // They'll be loaded from disk
      }),
    }
  )
);
