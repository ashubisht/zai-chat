import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { AppMessage } from '../lib/types';
import { cn } from '../lib/utils';
import { Bot, User, Copy, Check, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ChatMessageProps {
  message: AppMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const isUser = message.role === 'user';

  // Extract SVG code from message content
  const extractSVG = (content: string): string | null => {
    const svgMatch = content.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
    return svgMatch ? svgMatch[0] : null;
  };

  const svgCode = extractSVG(message.content);
  const hasSVG = !!svgCode;

  // Create Blob URL for SVG when component mounts or svgCode changes
  useEffect(() => {
    if (svgCode) {
      try {
        const blob = new Blob([svgCode], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        setSvgUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to create SVG URL:', error);
      }
    }
  }, [svgCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (message.imageUrl) {
      // Download external image
      const link = document.createElement('a');
      link.href = message.imageUrl;
      link.download = `generated-image-${message.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (svgCode) {
      // Download SVG as file
      const blob = new Blob([svgCode], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${message.id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Get text content without SVG for display
  const getTextContent = (content: string) => {
    return content.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '').trim();
  };

  const textContent = getTextContent(message.content);

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
              {/* Display text content (excluding SVG code) */}
              {textContent && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {textContent}
                </ReactMarkdown>
              )}

              {/* Show SVG code in a code block */}
              {hasSVG && (
                <div className="mt-4">
                  <details className="cursor-pointer">
                    <summary className="text-sm text-muted-foreground hover:text-foreground mb-2 select-none">
                      View SVG Code
                    </summary>
                    <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs">
                      <code>{svgCode}</code>
                    </pre>
                  </details>
                </div>
              )}

              {/* Display SVG image if present */}
              {hasSVG && (
                <div className="mt-4 relative">
                  <div className="bg-card rounded-lg shadow-lg border border-border p-4">
                    {/* Render the SVG using Blob URL */}
                    {svgUrl ? (
                      <img
                        src={svgUrl}
                        alt="Generated SVG"
                        className="max-w-full max-h-[500px] object-contain mx-auto"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Loading SVG...</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleDownloadImage}
                    className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-card/80 backdrop-blur-sm rounded-lg hover:bg-muted border border-border shadow-lg"
                    title="Download SVG"
                  >
                    <Download className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              )}

              {/* Display external image if present */}
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
