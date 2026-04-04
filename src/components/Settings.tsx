import { useChatStore } from '../lib/store';
import { X, Key, Trash2, Moon, Sun, Sliders, Trash } from 'lucide-react';
import { cn } from '../lib/utils';

export function Settings() {
  const {
    isSettingsOpen,
    toggleSettings,
    settings,
    updateSettings,
    apiKey,
    deleteApiKey,
    clearAllConversations,
  } = useChatStore();

  const handleDeleteApiKey = async () => {
    if (confirm('Are you sure you want to delete your API key? You will need to enter it again to use the app.')) {
      await deleteApiKey();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
      await clearAllConversations();
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Settings</h2>
              <p className="text-sm text-zinc-400">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={() => toggleSettings(false)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">API Key</h3>
            </div>
            <div className="p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-400 mb-1">Status</p>
                  <p className="font-medium">
                    {apiKey ? (
                      <span className="text-emerald-400">● Configured</span>
                    ) : (
                      <span className="text-red-400">● Not set</span>
                    )}
                  </p>
                </div>
                {apiKey && (
                  <button
                    onClick={handleDeleteApiKey}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Model Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Model Settings</h3>
            </div>

            <div className="space-y-4">
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => updateSettings({ model: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="glm-4.7">GLM-4.7 (Latest)</option>
                  <option value="glm-4">GLM-4</option>
                  <option value="glm-3-turbo">GLM-3 Turbo</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <span className="text-sm text-zinc-400">{settings.temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Lower values make responses more focused, higher values more creative
                </p>
              </div>
            </div>
          </section>

          {/* System Prompt */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                <span className="text-xs font-bold">AI</span>
              </div>
              <h3 className="font-semibold">System Prompt</h3>
            </div>
            <div>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none"
                placeholder="Enter a custom system prompt..."
              />
              <p className="text-xs text-zinc-500 mt-1">
                This defines how the AI assistant behaves
              </p>
            </div>
          </section>

          {/* Appearance */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold">Appearance</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors',
                  settings.theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700'
                )}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors',
                  settings.theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700'
                )}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Trash className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold">Data Management</h3>
            </div>
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Conversations
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
