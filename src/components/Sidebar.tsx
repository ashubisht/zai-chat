import { useState } from 'react';
import { useChatStore } from '../lib/store';
import { cn } from '../lib/utils';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
  Settings,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    conversations,
    currentConversationId,
    createConversation,
    deleteConversation,
    switchConversation,
    toggleSettings,
    toggleConversationSettings,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-card border-r border-border',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-lg text-foreground">Z.AI Chat</h1>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={() => {
                createConversation();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
                      currentConversationId === conv.id
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <button
                      onClick={() => {
                        switchConversation(conv.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm truncate text-foreground">
                        {conv.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this conversation?')) {
                          deleteConversation(conv.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-600/20 text-red-400 rounded-lg transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={() => {
                toggleConversationSettings(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-left text-foreground"
            >
              <Sliders className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Conversation Settings</span>
            </button>
            <button
              onClick={() => {
                toggleSettings(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-left text-foreground"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Settings</span>
            </button>
            <div className="pt-2 text-xs text-muted-foreground text-center">
              Z.AI Chat v1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
