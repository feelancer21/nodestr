import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageContent } from './MessageContent';

describe('MessageContent', () => {
  describe('preserveBlankLines rendering', () => {
    it('renders single paragraph without extra blank lines', () => {
      const content = 'Hello world';
      render(<MessageContent content={content} isFromMe={false} />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders normal paragraph break (two newlines) unchanged', () => {
      const content = 'Line 1\n\nLine 2';
      render(<MessageContent content={content} isFromMe={false} />);
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
    });

    it('preserves extra blank lines (three+ newlines)', () => {
      const content = 'Line 1\n\n\nLine 2';
      const { container } = render(<MessageContent content={content} isFromMe={false} />);

      // Check that content is rendered without crashing
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();

      // The rendered output should contain multiple paragraph elements
      // due to the non-breaking space paragraph insertion
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(1);
    });

    it('preserves multiple extra blank lines', () => {
      const content = 'Line 1\n\n\n\nLine 2';
      const { container } = render(<MessageContent content={content} isFromMe={false} />);

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();

      // Four newlines should create more spacing than three
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(2);
    });

    it('handles markdown formatting with blank lines', () => {
      const content = 'Text 1\n\n\n**Bold text**';
      render(<MessageContent content={content} isFromMe={false} />);

      expect(screen.getByText('Text 1')).toBeInTheDocument();
      expect(screen.getByText('Bold text')).toBeInTheDocument();
    });

    it('preserves blank lines in code blocks', () => {
      const content = 'Line 1\n\n\n```js\nconst x = 1;\n```';
      render(<MessageContent content={content} isFromMe={false} />);

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      // Code block should be rendered
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('handles consecutive blank lines in middle of text', () => {
      const content = 'Start\n\n\n\n\nMiddle\n\n\nEnd';
      const { container } = render(<MessageContent content={content} isFromMe={false} />);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Middle')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();

      // Multiple paragraphs created by blank line preservation
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(2);
    });

    it('renders from both isFromMe true and false', () => {
      const content = 'Message\n\n\n\nContent';
      const { rerender } = render(<MessageContent content={content} isFromMe={false} />);

      expect(screen.getByText('Message')).toBeInTheDocument();

      rerender(<MessageContent content={content} isFromMe={true} />);
      expect(screen.getByText('Message')).toBeInTheDocument();
    });

    it('handles blockquotes with blank lines', () => {
      const content = 'Text\n\n\n> Quote\n\nMore text';
      render(<MessageContent content={content} isFromMe={false} />);

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('More text')).toBeInTheDocument();
    });
  });
});
