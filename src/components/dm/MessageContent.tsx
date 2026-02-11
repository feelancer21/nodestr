import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stripCodeBlocks } from '@/lib/dmUtils';

interface MessageContentProps {
  content: string;
  isFromMe: boolean;
  /** Called when user clicks a blockquote (reply quote) — passes the quoted text */
  onQuoteClick?: (quotedText: string) => void;
}

/** Map language identifiers to display names (Telegram-style) */
function getLanguageName(lang?: string): string {
  if (!lang) return 'Code';
  const map: Record<string, string> = {
    js: 'JavaScript', javascript: 'JavaScript',
    ts: 'TypeScript', typescript: 'TypeScript',
    tsx: 'TSX', jsx: 'JSX',
    py: 'Python', python: 'Python',
    rb: 'Ruby', ruby: 'Ruby',
    go: 'Go', golang: 'Go',
    rs: 'Rust', rust: 'Rust',
    sh: 'Shell', bash: 'Bash', shell: 'Shell', zsh: 'Shell',
    json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
    html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'LESS',
    sql: 'SQL', graphql: 'GraphQL',
    md: 'Markdown', markdown: 'Markdown',
    c: 'C', cpp: 'C++', 'c++': 'C++', cs: 'C#', csharp: 'C#',
    java: 'Java', kotlin: 'Kotlin', swift: 'Swift',
    php: 'PHP', lua: 'Lua', perl: 'Perl',
    dockerfile: 'Dockerfile', docker: 'Dockerfile',
    xml: 'XML', svg: 'SVG',
    diff: 'Diff', plaintext: 'Text', text: 'Text',
  };
  return map[lang.toLowerCase()] || lang.toUpperCase();
}

/** Lighter variant of oneDark — brighter comments, base text, and punctuation */
const chatCodeTheme: { [key: string]: React.CSSProperties } = {
  ...oneDark,
  'code[class*="language-"]': {
    ...(oneDark['code[class*="language-"]'] as React.CSSProperties),
    color: '#bec5cf',
    background: 'transparent',
  },
  'pre[class*="language-"]': {
    ...(oneDark['pre[class*="language-"]'] as React.CSSProperties),
    color: '#bec5cf',
    background: 'transparent',
  },
  'comment': { color: '#7a8393', fontStyle: 'italic' as const },
  'prolog': { color: '#7a8393' },
  'cdata': { color: '#7a8393' },
  'punctuation': { color: '#9da5b4' },
};

/** Copy text to clipboard with fallback for non-HTTPS contexts */
async function copyText(text: string, containerElement: HTMLElement): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fall through to fallback */ }
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
  textArea.setAttribute('readonly', '');
  textArea.setAttribute('tabindex', '-1');
  textArea.setAttribute('aria-hidden', 'true');
  containerElement.appendChild(textArea);
  textArea.focus({ preventScroll: true });
  textArea.select();
  let success = false;
  try { success = document.execCommand('copy'); } catch { success = false; }
  containerElement.removeChild(textArea);
  return success;
}

/** Copy button for code block header (light-on-dark, with clipboard fallback) */
function CodeCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const success = await copyText(value, e.currentTarget);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors"
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-white/60" />
      )}
    </button>
  );
}

/** Compact clickable quote block — renders plain text (no syntax highlighting) */
function QuoteBlock({ rawText, onQuoteClick }: { rawText: string; onQuoteClick?: (text: string) => void }) {
  const isClickable = !!onQuoteClick;
  const displayText = stripCodeBlocks(rawText);

  return (
    <blockquote
      className={cn(
        'border-l-2 border-white/30 pl-2 my-1 text-xs overflow-hidden',
        isClickable && 'cursor-pointer hover:opacity-100 opacity-80'
      )}
      onClick={isClickable ? () => onQuoteClick(rawText) : undefined}
    >
      <p className="line-clamp-2 whitespace-pre-wrap break-words">{displayText}</p>
    </blockquote>
  );
}

export function MessageContent({ content, isFromMe, onQuoteClick }: MessageContentProps) {
  // Extract raw text from blockquote lines for plain-text rendering and click matching
  const quotedRawText = useMemo(() => {
    return content.split('\n')
      .filter(line => line.startsWith('>'))
      .map(line => line.startsWith('> ') ? line.slice(2) : line.slice(1))
      .join('\n');
  }, [content]);

  return (
    <div className="text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="whitespace-pre-wrap break-words mb-1 last:mb-0">{children}</p>;
          },
          // Remove default <pre> wrapper — our code component handles the full block
          pre({ children }) {
            return <>{children}</>;
          },
          code({ children, className, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : undefined;
            const isBlock = !!className?.startsWith('language-') || String(children).includes('\n');

            if (!isBlock) {
              return (
                <code
                  className={cn(
                    'px-1 py-0.5 rounded text-xs font-mono',
                    isFromMe ? 'bg-white/15' : 'bg-black/10 dark:bg-white/10'
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const codeString = String(children).replace(/\n$/, '');

            return (
              <div className="mt-2 mb-2 rounded-lg overflow-hidden" style={{ background: 'hsl(220, 13%, 22%)' }}>
                {/* Telegram-style header: language name + copy button */}
                <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'hsl(220, 13%, 16%)' }}>
                  <span className="text-xs text-white/70 font-mono">
                    {getLanguageName(language)}
                  </span>
                  <CodeCopyButton value={codeString} />
                </div>
                {/* Syntax-highlighted code (transparent bg, wraps long lines) */}
                <SyntaxHighlighter
                  language={language || 'text'}
                  style={chatCodeTheme}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: 0,
                    background: 'transparent',
                    overflowWrap: 'break-word',
                  }}
                  codeTagProps={{ style: { background: 'transparent' } }}
                  wrapLongLines
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer"
                 className="text-link hover:underline">
                {children}
              </a>
            );
          },
          blockquote() {
            return <QuoteBlock rawText={quotedRawText} onQuoteClick={onQuoteClick} />;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside my-1 text-sm">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside my-1 text-sm">{children}</ol>;
          },
          strong({ children }) {
            return <strong className="font-bold">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
