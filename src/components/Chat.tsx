import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../lib/store';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Bot, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Chat() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    settings,
    updateSettings,
  } = useChatStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Welcome to Z.AI Chat
              </h2>
              <p className="text-muted-foreground mb-8">
                Ask me anything. I'm here to help you with information, coding, writing, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="font-semibold mb-2 text-foreground">💡 Try asking</p>
                  <p className="text-muted-foreground">"Explain quantum computing in simple terms"</p>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="font-semibold mb-2 text-foreground">🔧 Need help with code?</p>
                  <p className="text-muted-foreground">"Write a Python function to sort a list"</p>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="font-semibold mb-2 text-foreground">✍️ Creative writing</p>
                  <p className="text-muted-foreground">"Help me write a professional email"</p>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="font-semibold mb-2 text-foreground">📚 Research & learning</p>
                  <p className="text-muted-foreground">"What are the main concepts in machine learning?"</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-4 p-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-600">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">Z.AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-600/10 dark:bg-red-900/20 border border-red-600/30 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => useChatStore.getState().setError(null)}
              className="text-red-600 dark:text-red-400 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="p-4 max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            {/* Model Selector - Always Visible */}
            <select
              value={settings.model}
              onChange={(e) => updateSettings({ model: e.target.value })}
              className="flex-shrink-0 px-3 py-3 rounded-xl border border-border bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
            >
              <option value="glm-5">GLM-5</option>
              <option value="glm-4-plus">GLM-4 Plus</option>
              <option value="glm-4.7">GLM-4.7</option>
              <option value="glm-4">GLM-4</option>
              <option value="glm-3-turbo">GLM-3 Turbo</option>
              <option value="glm-3">GLM-3</option>
            </select>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'flex-1 resize-none rounded-xl border border-border bg-muted px-4 py-3',
                'text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2',
                'focus:ring-blue-600 focus:border-transparent disabled:opacity-50',
                'disabled:cursor-not-allowed max-h-[200px] overflow-y-auto text-foreground'
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                'focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed',
                input.trim() && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>

        {/* Advanced Settings Toggle */}
        <div className="px-4 pb-4 max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 rounded-lg transition-colors text-sm text-muted-foreground"
          >
            <Settings2 className="w-4 h-4" />
            <span>Conversation Settings</span>
            {isAdvancedOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Advanced Settings Panel */}
          {isAdvancedOpen && (
            <div className="mt-3 space-y-4 p-4 bg-card rounded-lg border border-border">
              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Temperature</label>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {settings.temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">System Prompt</label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none text-foreground placeholder:text-muted-foreground"
                  placeholder="Define how the AI assistant behaves..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This defines the AI's behavior for this conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
