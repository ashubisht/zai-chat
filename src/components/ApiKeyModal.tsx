import { useState, useEffect } from 'react';
import { useChatStore } from '../lib/store';
import { X, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function ApiKeyModal() {
  const {
    isApiKeyModalOpen,
    toggleApiKeyModal,
    saveApiKey,
    checkApiKey,
  } = useChatStore();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isApiKeyModalOpen) {
      checkApiKey();
    }
  }, [isApiKeyModalOpen, checkApiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsLoading(true);
    try {
      await saveApiKey(apiKey.trim());
      setApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isApiKeyModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Enter Your API Key</h2>
              <p className="text-sm text-zinc-400">Get started with Z.AI Chat</p>
            </div>
          </div>
          <button
            onClick={() => {
              toggleApiKeyModal(false);
              setError('');
              setApiKey('');
            }}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Z.AI API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                className={cn(
                  'w-full px-4 py-3 bg-zinc-800 border rounded-lg',
                  'text-sm placeholder:text-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-blue-600',
                  error ? 'border-red-600' : 'border-zinc-700'
                )}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Eye className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Where to find your API key?</p>
                <p className="text-blue-300/70">
                  Visit{' '}
                  <a
                    href="https://z.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-200"
                  >
                    z.ai
                  </a>
                  , go to your account settings, and generate a new API key.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                toggleApiKeyModal(false);
                setError('');
                setApiKey('');
              }}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
