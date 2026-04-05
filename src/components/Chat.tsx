import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../lib/store';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Bot, ChevronDown, Settings2 } from 'lucide-react';
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
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

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
          {/* Integrated Input Area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={isLoading}
              rows={3}
              className={cn(
                'w-full resize-none rounded-xl border border-border bg-muted px-4 py-3',
                'text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2',
                'focus:ring-blue-600 focus:border-transparent disabled:opacity-50',
                'disabled:cursor-not-allowed text-foreground pb-14' // Extra padding at bottom for buttons
              )}
            />

            {/* Integrated Buttons Container */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              {/* Model Selector Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    'text-sm font-medium transition-colors',
                    'hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed',
                    'bg-card/80 backdrop-blur-sm border border-border',
                    'text-foreground'
                  )}
                  disabled={isLoading}
                >
                  <Settings2 className="w-4 h-4" />
                  <span className="text-xs">
                    {settings.model === 'glm-4-plus' ? 'GLM-4 Plus' :
                     settings.model === 'glm-5' ? 'GLM-5' :
                     settings.model === 'glm-5-turbo' ? 'GLM-5 Turbo' :
                     settings.model === 'glm-4.7' ? 'GLM-4.7' :
                     settings.model === 'glm-4.6' ? 'GLM-4.6' :
                     settings.model === 'glm-3-turbo' ? 'GLM-3 Turbo' : 'GLM-3'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Model Dropdown */}
                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-card rounded-lg border border-border shadow-lg z-10">
                    <div className="p-1">
                      {[
                        { value: 'glm-4-plus', label: 'GLM-4 Plus', desc: 'Highest rate limit' },
                        { value: 'glm-5', label: 'GLM-5', desc: 'Latest model' },
                        { value: 'glm-5-turbo', label: 'GLM-5 Turbo', desc: 'Fast & advanced' },
                        { value: 'glm-4.7', label: 'GLM-4.7', desc: 'Balanced' },
                        { value: 'glm-4.6', label: 'GLM-4.6', desc: 'Good rate limit' },
                        { value: 'glm-3-turbo', label: 'GLM-3 Turbo', desc: 'Fast & cheap' },
                        { value: 'glm-3', label: 'GLM-3', desc: 'Basic model' },
                      ].map((model) => (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => {
                            updateSettings({ model: model.value });
                            setShowModelDropdown(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                            'hover:bg-muted/70',
                            settings.model === model.value
                              ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-foreground'
                          )}
                        >
                          {model.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  input.trim() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-muted/80 text-muted-foreground',
                  'border border-border'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
