import { useChatStore } from '../lib/store';
import { X, Sliders } from 'lucide-react';

export function ConversationSettingsModal() {
  const {
    isConversationSettingsOpen,
    toggleConversationSettings,
    settings,
    updateSettings,
  } = useChatStore();

  if (!isConversationSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Conversation Settings</h2>
              <p className="text-sm text-muted-foreground">Customize AI behavior</p>
            </div>
          </div>
          <button
            onClick={() => toggleConversationSettings(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
            <p className="text-xs text-muted-foreground mt-2">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">System Prompt</label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none text-foreground placeholder:text-muted-foreground"
              placeholder="Define how the AI assistant behaves..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              This defines the AI's behavior for this conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
