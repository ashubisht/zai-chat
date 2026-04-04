import { useEffect, useState } from 'react';
import { useChatStore } from './lib/store';
import { Chat } from './components/Chat';
import { Sidebar } from './components/Sidebar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Settings } from './components/Settings';
import { Menu } from 'lucide-react';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const { checkApiKey, loadConversations, createConversation, settings } = useChatStore();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [settings.theme]);

  useEffect(() => {
    // Initialize app
    checkApiKey();
    loadConversations();

    // Check screen size
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [checkApiKey, loadConversations]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModKey = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N: New conversation
      if (isModKey && e.key === 'n') {
        e.preventDefault();
        createConversation();
      }

      // Cmd/Ctrl + ,: Open settings
      if (isModKey && e.key === ',') {
        e.preventDefault();
        useChatStore.getState().toggleSettings(true);
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        useChatStore.getState().toggleApiKeyModal(false);
        useChatStore.getState().toggleSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createConversation]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-zinc-800 bg-zinc-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Z.AI Chat</h1>
        </div>

        {/* Chat Area */}
        <Chat />
      </div>

      {/* Modals */}
      <ApiKeyModal />
      <Settings />
    </div>
  );
}

export default App;
