import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Document-style markdown renderer using Tailwind Typography (prose) classes.
 * Suitable for long-form content like protocol specs and articles.
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none break-words', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ children, className: codeClassName, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : undefined;
            const isBlock = !!codeClassName?.startsWith('language-') || String(children).includes('\n');

            if (!isBlock) {
              return <code className={cn(codeClassName, 'break-all')} {...props}>{children}</code>;
            }

            return (
              <div className="not-prose overflow-hidden">
                <SyntaxHighlighter
                  language={language || 'text'}
                  style={oneDark}
                  customStyle={{ borderRadius: '0.5rem', fontSize: '0.8125rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflow: 'hidden' }}
                  codeTagProps={{ style: { whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }}
                  wrapLongLines
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
          a({ href, children }) {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-link hover:underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
