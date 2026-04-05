import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMessage, Conversation, AppSettings, ChatMessage } from './types';
import { sendChatCompletion, apiKeyAPI, conversationAPI, generateId, generateTitle, generateImage, isImageGenerationRequest } from './api';

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
  isConversationSettingsOpen: boolean;

  // Actions
  sendMessage: (content: string, images?: Array<{ type: 'image_url'; image_url: { url: string } }>) => Promise<void>;
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
  toggleConversationSettings: (open: boolean) => void;
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
        model: 'glm-4-plus',
        temperature: 0.7,
        systemPrompt: `You are a helpful, intelligent AI assistant designed to provide accurate, thoughtful, and useful information.

Core Principles:
- Be helpful: Provide comprehensive, relevant, and actionable responses
- Be accurate: Give correct information and acknowledge uncertainty when you don't know something
- Be clear: Use well-structured, easy-to-understand language appropriate for the user's level
- Be thoughtful: Consider the context and provide nuanced, well-reasoned answers
- Be safe: Refuse requests that could cause harm, but explain why and suggest alternatives when possible

Response Guidelines:
- Start answers directly without unnecessary pleasantries
- Use formatting (bullet points, numbered lists, headers) to organize complex information
- Provide examples and analogies when explaining difficult concepts
- If a question is unclear, ask for clarification before assuming
- For coding tasks, provide working code with brief explanations
- For creative tasks, be imaginative while maintaining coherence
- Cite general knowledge sources when appropriate, but don't make up specific citations
- Present balanced perspectives on subjective topics
- Admit mistakes and correct yourself when you realize an error

Capabilities:
- Answer questions on virtually any topic with depth and accuracy
- Write and debug code in multiple programming languages
- Analyze data, solve problems, and provide strategic insights
- Create and edit various forms of content
- Help with learning, research, and decision-making
- Translate and summarize text effectively
- Engage in creative and analytical thinking

Language: Respond in English unless the user explicitly requests another language.

Remember: Your goal is to be genuinely helpful while maintaining accuracy, safety, and integrity.`,
        theme: 'dark',
        plan: 'regular',
      },
      isApiKeyModalOpen: false,
      isSettingsOpen: false,
      isConversationSettingsOpen: false,

      // Send a message to the AI
      sendMessage: async (content: string, images?: Array<{ type: 'image_url'; image_url: { url: string } }>) => {
        const { apiKey, messages, settings, currentConversationId, conversations } = get();

        if (!apiKey) {
          set({ error: 'Please set your API key in settings', isApiKeyModalOpen: true });
          return;
        }

        // Check if images are being sent with a non-vision model
        const visionModels = ['glm-5v-turbo', 'glm-4.6v', 'glm-4.5v', 'glm-5v', 'glm-4v'];
        const isVisionModel = visionModels.some(vm => settings.model.includes(vm));

        if (images && images.length > 0 && !isVisionModel) {
          set({
            error: `Please select a Vision model (like GLM-4.6V or GLM-5V-Turbo) to analyze images. Current model: ${settings.model}`,
            isLoading: false,
          });
          return;
        }

        // Add user message (store image URLs for display)
        const userMessage: AppMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
          ...(images && images.length > 0
            ? {
                imageUrl: images[0]?.image_url?.url || '',
                images: images.map((img) => ({ url: img.image_url.url, type: 'image' })),
              }
            : {}),
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
          const updatedConversations = [...conversations, newConversation];
          set({ currentConversationId: conversationId, conversations: updatedConversations });

          console.log('Creating conversation from first message:', newConversation);
          // Save the new conversation immediately
          await conversationAPI.save(newConversation);
          console.log('Conversation saved from first message');
        }

        // Build message history for API
        const apiMessages: ChatMessage[] = [
          { role: 'system', content: settings.systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];

        // Add current message with or without images
        if (images && images.length > 0) {
          // Multimodal message: text + images
          apiMessages.push({
            role: 'user',
            content: [
              { type: 'text', text: content },
              ...images,
            ],
          } as ChatMessage);
        } else {
          // Text-only message
          apiMessages.push({ role: 'user', content });
        }

        try {
          // Check if this is an image generation request
          if (isImageGenerationRequest(content)) {
            console.log('Image generation request detected');

            try {
              const imageUrl = await generateImage(content, apiKey);

              const assistantMessage: AppMessage = {
                id: generateId(),
                role: 'assistant',
                content: `Here's your generated image:\n\n*Click the download button in the top-right corner of the image to save it.*`,
                timestamp: Date.now(),
                imageUrl,
              };

              const updatedMessages = [...messages, userMessage, assistantMessage];

              // Update conversation
              const updatedConversations = conversations.map((conv) => {
                if (conv.id === conversationId) {
                  const isFirstMessage = conv.messages.length === 0;
                  return {
                    ...conv,
                    title: isFirstMessage ? `Image: ${generateTitle(content)}` : conv.title,
                    messages: [
                      ...conv.messages,
                      {
                        role: 'user',
                        content,
                        timestamp: userMessage.timestamp,
                        ...(userMessage.imageUrl && { imageUrl: userMessage.imageUrl }),
                        ...(userMessage.images && { images: userMessage.images }),
                      },
                      {
                        role: 'assistant',
                        content: assistantMessage.content,
                        timestamp: assistantMessage.timestamp,
                        imageUrl: assistantMessage.imageUrl,
                      },
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

              // Save conversation
              const conversation = updatedConversations.find((c) => c.id === conversationId);
              if (conversation) {
                try {
                  await conversationAPI.save(conversation);
                } catch (saveError) {
                  console.error('Failed to save conversation:', saveError);
                }
              }
            } catch (imageError) {
              const errorMessage = imageError instanceof Error ? imageError.message : 'Failed to generate image';
              set({ error: errorMessage, isLoading: false });
            }
            return;
          }

          // Regular text chat
          // Call Z.AI API
          const response = await sendChatCompletion(
            apiMessages,
            apiKey,
            settings.model,
            settings.temperature,
            settings.plan
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
              const isFirstMessage = conv.messages.length === 0;
              return {
                ...conv,
                title: isFirstMessage ? generateTitle(content) : conv.title,
                messages: [
                  ...conv.messages,
                  {
                    role: 'user',
                    content,
                    timestamp: userMessage.timestamp,
                    ...(userMessage.imageUrl && { imageUrl: userMessage.imageUrl }),
                    ...(userMessage.images && { images: userMessage.images }),
                  },
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
            try {
              console.log('Saving conversation with messages:', conversation.id, conversation.messages.length);
              await conversationAPI.save(conversation);
              console.log('Conversation saved successfully with messages');
            } catch (saveError) {
              console.error('Failed to save conversation:', saveError);
              // Don't fail the entire operation if save fails, just log it
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // Create a new conversation
      createConversation: () => {
        const newConversation: Conversation = {
          id: generateId(),
          title: 'New Conversation',
          messages: [],
          created_at: Date.now(),
          updated_at: Date.now(),
        };

        const { conversations } = get();
        const updatedConversations = [...conversations, newConversation];

        console.log('Creating new conversation:', newConversation);
        set({
          messages: [],
          currentConversationId: newConversation.id,
          conversations: updatedConversations,
          error: null,
        });

        // Save the new conversation immediately
        conversationAPI.save(newConversation).then(() => {
          console.log('New conversation saved successfully');
        }).catch((err) => {
          console.error('Failed to save new conversation:', err);
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
          console.log('Loading conversations from disk...');
          const convs = await conversationAPI.getAll();
          console.log('Loaded conversations:', convs.length, convs);
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

      // Toggle conversation settings modal
      toggleConversationSettings: (open: boolean) => {
        set({ isConversationSettingsOpen: open });
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
