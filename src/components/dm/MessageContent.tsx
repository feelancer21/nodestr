import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from '@/components/clip/CopyButton';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  isFromMe: boolean;
}

export function MessageContent({ content, isFromMe }: MessageContentProps) {
  return (
    <div className="text-sm">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p({ children }) {
          return <p className="whitespace-pre-wrap break-words mb-1 last:mb-0">{children}</p>;
        },
        code({ children, className, ...props }) {
          const isBlock = className?.startsWith('language-') || String(children).includes('\n');
          if (!isBlock) {
            return (
              <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          }
          const codeString = String(children).replace(/\n$/, '');
          return (
            <div className="relative mt-2 mb-2">
              <CopyButton
                value={codeString}
                className="absolute top-2 right-2"
              />
              <pre className={cn(
                'rounded-lg p-3 pr-8 text-xs font-mono whitespace-pre-wrap break-words',
                isFromMe ? 'bg-black/20' : 'bg-black/5 dark:bg-white/5'
              )}>
                <code {...props}>{children}</code>
              </pre>
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
