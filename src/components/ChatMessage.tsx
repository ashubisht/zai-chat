import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { AppMessage } from '../lib/types';
import { cn } from '../lib/utils';
import { Bot, User, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: AppMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (message.imageUrl) {
      // Create a temporary anchor element to download the image
      const link = document.createElement('a');
      link.href = message.imageUrl;
      link.download = `generated-image-${message.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-4 p-6',
        isUser ? 'bg-muted/30' : 'bg-transparent'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          isUser ? 'bg-blue-600' : 'bg-emerald-600'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm text-foreground">
            {isUser ? 'You' : 'Z.AI Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="prose prose-invert max-w-none markdown-body">
          {isUser ? (
            <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
          ) : (
            <div className="relative group">
              {message.content && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {message.content}
                </ReactMarkdown>
              )}

              {message.imageUrl && (
                <div className="mt-4 relative">
                  {imageLoading && (
                    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Generating image...</p>
                      </div>
                    </div>
                  )}
                  {imageError ? (
                    <div className="flex items-center justify-center h-64 bg-red-600/10 border border-red-600/30 rounded-lg">
                      <p className="text-red-600 dark:text-red-400">Failed to load image</p>
                    </div>
                  ) : (
                    <img
                      src={message.imageUrl}
                      alt="Generated image"
                      className={`max-w-full rounded-lg shadow-lg ${imageLoading ? 'hidden' : ''}`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                  )}
                  {!imageError && (
                    <button
                      onClick={handleDownloadImage}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-card/80 backdrop-blur-sm rounded-lg hover:bg-muted"
                      title="Download image"
                    >
                      <Download className="w-4 h-4 text-foreground" />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleCopy}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
