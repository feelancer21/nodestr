import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyWithFallback = (text: string, containerElement: HTMLElement): boolean => {
    // Fallback using temporary textarea
    // IMPORTANT: Insert into the button's container (not document.body) to work inside
    // Radix UI Dialogs which use focus-trapping portals
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Position offscreen but within the same stacking context
    textArea.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;padding:0;border:none;outline:none;box-shadow:none;background:transparent;';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('tabindex', '-1');
    textArea.setAttribute('aria-hidden', 'true');

    containerElement.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let success = false;
    try {
      success = document.execCommand('copy');
    } catch {
      success = false;
    }

    containerElement.removeChild(textArea);
    return success;
  };

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const button = e.currentTarget;
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
    // Pass the button element so textarea is inserted in the same DOM context
    // (critical for working inside Radix UI Dialog portals with focus-trapping)
    if (!success) {
      success = copyWithFallback(value, button);
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
