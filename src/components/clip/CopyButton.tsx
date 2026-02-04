import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyWithFallback = (text: string): boolean => {
    // Fallback using temporary textarea - works in all contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Prevent scrolling to bottom
    textArea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch {
      success = false;
    }

    document.body.removeChild(textArea);
    return success;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();

    let success = false;

    // Try modern clipboard API first (only works in secure contexts)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        success = true;
      } catch {
        // Fall through to fallback
      }
    }

    // Use fallback if modern API failed or unavailable
    if (!success) {
      success = copyWithFallback(value);
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center p-1 rounded hover:bg-accent transition-colors',
        className
      )}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}
