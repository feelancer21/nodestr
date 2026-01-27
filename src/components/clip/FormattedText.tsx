import { useMemo, Fragment } from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

// Regex patterns - matches URLs with http(s):// or www. prefix
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+)/gi;
const HASHTAG_REGEX = /(#[a-zA-Z0-9_]+)/g;

interface TextPart {
  type: 'text' | 'url' | 'hashtag';
  content: string;
}

export function FormattedText({ text, className }: FormattedTextProps) {
  const parts = useMemo(() => {
    const result: TextPart[] = [];

    // Split by URLs first, then by hashtags
    const urlParts = text.split(URL_REGEX);

    urlParts.forEach((part) => {
      if (URL_REGEX.test(part)) {
        // Reset lastIndex since we're reusing the regex
        URL_REGEX.lastIndex = 0;
        result.push({ type: 'url', content: part });
      } else {
        // Check for hashtags in non-URL parts
        const hashtagParts = part.split(HASHTAG_REGEX);
        hashtagParts.forEach((hp) => {
          if (HASHTAG_REGEX.test(hp)) {
            HASHTAG_REGEX.lastIndex = 0;
            result.push({ type: 'hashtag', content: hp });
          } else if (hp) {
            result.push({ type: 'text', content: hp });
          }
        });
      }
    });

    return result;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.type === 'url') {
          // Ensure URL has a protocol for href
          const href = part.content.startsWith('http') ? part.content : `https://${part.content}`;
          return (
            <a
              key={idx}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part.content}
            </a>
          );
        }
        if (part.type === 'hashtag') {
          return (
            <span key={idx} className="text-link">
              {part.content}
            </span>
          );
        }
        // Preserve line breaks
        return (
          <Fragment key={idx}>
            {part.content.split('\n').map((line, lineIdx, arr) => (
              <Fragment key={lineIdx}>
                {line}
                {lineIdx < arr.length - 1 && <br />}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </span>
  );
}
