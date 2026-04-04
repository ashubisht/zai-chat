import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../lib/store';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Bot } from 'lucide-react';
import { cn } from '../lib/utils';

export function Chat() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
  } = useChatStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
              <p className="text-zinc-400 mb-8">
                Ask me anything. I'm here to help you with information, coding, writing, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <p className="font-semibold mb-2">💡 Try asking</p>
                  <p className="text-zinc-400">"Explain quantum computing in simple terms"</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <p className="font-semibold mb-2">🔧 Need help with code?</p>
                  <p className="text-zinc-400">"Write a Python function to sort a list"</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <p className="font-semibold mb-2">✍️ Creative writing</p>
                  <p className="text-zinc-400">"Help me write a professional email"</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <p className="font-semibold mb-2">📚 Research & learning</p>
                  <p className="text-zinc-400">"What are the main concepts in machine learning?"</p>
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
        <div className="mx-6 mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
            <button
              onClick={() => useChatStore.getState().setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 p-4 bg-zinc-950">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3',
                'text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2',
                'focus:ring-blue-600 focus:border-transparent disabled:opacity-50',
                'disabled:cursor-not-allowed max-h-[200px] overflow-y-auto'
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                'focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed',
                input.trim() && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-zinc-800 text-zinc-500'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
