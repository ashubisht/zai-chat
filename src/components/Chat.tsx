import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../lib/store';
import { ChatMessage } from './ChatMessage';
import { Send, Loader2, Bot, ChevronDown, Settings2, Image as ImageIcon, X, FileText, Video } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  base64?: string;
  type: 'image' | 'video' | 'document';
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Check if current model supports vision
  const visionModels = ['glm-5v-turbo', 'glm-4.6v', 'glm-4.5v', 'glm-5v', 'glm-4v'];
  const isVisionModel = visionModels.some(vm => settings.model.includes(vm));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const message = input.trim();
    setInput('');
    const files = [...uploadedFiles];
    setUploadedFiles([]);

    // Convert files to the format expected by the API
    const fileContents = files.map((file) => {
      if (file.type === 'image' && file.base64) {
        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:${file.file.type};base64,${file.base64}`,
          },
        };
      } else if (file.type === 'video' && file.base64) {
        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:${file.file.type};base64,${file.base64}`,
          },
        };
      } else if (file.type === 'document' && file.base64) {
        // For documents, we might need to send them differently
        // Try as base64 first
        return {
          type: 'image_url' as const,
          image_url: {
            url: `data:${file.file.type};base64,${file.base64}`,
          },
        };
      }
      return null;
    }).filter(Boolean) as Array<{ type: 'image_url'; image_url: { url: string } }>;

    await sendMessage(message, fileContents);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Process each file
    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      const fileType = file.type;

      // Determine file type
      let fileCategory: 'image' | 'video' | 'document';
      let maxSize = 10 * 1024 * 1024; // Default 10MB

      if (fileType.startsWith('image/')) {
        fileCategory = 'image';
        maxSize = 10 * 1024 * 1024; // 10MB for images
      } else if (fileType.startsWith('video/')) {
        fileCategory = 'video';
        maxSize = 200 * 1024 * 1024; // 200MB for videos
      } else if (
        fileType === 'application/pdf' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // docx
        fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || // pptx
        fileType === 'application/msword' || // doc
        fileType === 'application/vnd.ms-powerpoint' // ppt
      ) {
        fileCategory = 'document';
        maxSize = 20 * 1024 * 1024; // 20MB for documents
      } else {
        alert(`Unsupported file type: ${fileType || file.name}`);
        continue;
      }

      // Check file size
      if (file.size > maxSize) {
        alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        continue;
      }

      // Create preview for images and videos
      let preview: string | undefined;
      if (fileCategory === 'image' || fileCategory === 'video') {
        preview = URL.createObjectURL(file);
      }

      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          // Remove data URL prefix to get just the base64
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      newFiles.push({
        id: Date.now().toString() + Math.random(),
        file,
        preview,
        base64,
        type: fileCategory,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
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
          {/* File Previews */}
          {uploadedFiles.length > 0 && (
            <>
              {!isVisionModel && uploadedFiles.some(f => f.type === 'image') && (
                <div className="mb-3 p-3 bg-amber-600/10 dark:bg-amber-900/20 border border-amber-600/30 dark:border-amber-800 rounded-lg text-amber-600 dark:text-amber-400 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Vision model recommended</p>
                      <p className="text-xs">For best results with images, select a Vision model (GLM-4.6V or GLM-5V-Turbo). Current model: {settings.model}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-3 flex gap-2 flex-wrap">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative group">
                    {file.type === 'image' && file.preview ? (
                      <img
                        src={file.preview}
                        alt="Upload"
                        className="h-20 w-20 object-cover rounded-lg border border-border"
                      />
                    ) : file.type === 'video' && file.preview ? (
                      <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center relative overflow-hidden">
                        <video src={file.preview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <Video className="w-6 h-6 text-foreground relative z-10" />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center">
                        <FileText className="w-6 h-6 text-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                      {file.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.docx,.doc,.pptx,.ppt"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Integrated Buttons Container */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              {/* Left side: Model selector and Image upload */}
              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    'text-sm font-medium transition-colors',
                    'hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed',
                    'bg-card/80 backdrop-blur-sm border border-border',
                    'text-foreground'
                  )}
                  disabled={isLoading}
                  title="Upload files (images, videos, PDFs, documents)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

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
                     settings.model === 'glm-5v-turbo' ? 'GLM-5V Turbo' :
                     settings.model === 'glm-4.6v' ? 'GLM-4.6V' :
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
                        { value: 'glm-5v-turbo', label: 'GLM-5V Turbo', desc: 'Vision + fast' },
                        { value: 'glm-4.6v', label: 'GLM-4.6V', desc: 'Vision model' },
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
