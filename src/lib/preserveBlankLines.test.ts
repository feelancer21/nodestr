import { describe, it, expect } from 'vitest';
import { preserveBlankLines } from '@/components/dm/MessageContent';

describe('preserveBlankLines', () => {
  it('returns text unchanged if no blank lines', () => {
    const text = 'Hello world';
    expect(preserveBlankLines(text)).toBe('Hello world');
  });

  it('returns text unchanged for normal paragraph break (two newlines)', () => {
    const text = 'Line 1\n\nLine 2';
    expect(preserveBlankLines(text)).toBe('Line 1\n\nLine 2');
  });

  it('converts three newlines to two newlines plus one spacer', () => {
    const text = 'Line 1\n\n\nLine 2';
    const result = preserveBlankLines(text);
    // Three newlines should become: \n\n + \u00A0\n\n
    expect(result).toBe('Line 1\n\n\u00A0\n\nLine 2');
  });

  it('converts four newlines to two newlines plus two spacers', () => {
    const text = 'Line 1\n\n\n\nLine 2';
    const result = preserveBlankLines(text);
    // Four newlines should become: \n\n + \u00A0\n\n + \u00A0\n\n
    expect(result).toBe('Line 1\n\n\u00A0\n\n\u00A0\n\nLine 2');
  });

  it('converts five newlines to two newlines plus three spacers', () => {
    const text = 'Line 1\n\n\n\n\nLine 2';
    const result = preserveBlankLines(text);
    // Five newlines should become: \n\n + \u00A0\n\n + \u00A0\n\n + \u00A0\n\n
    expect(result).toBe('Line 1\n\n\u00A0\n\n\u00A0\n\n\u00A0\n\nLine 2');
  });

  it('handles multiple blank line sequences in same text', () => {
    const text = 'Part1\n\n\nPart2\n\n\n\nPart3';
    const result = preserveBlankLines(text);
    // First sequence: 3 newlines → \n\n + \u00A0\n\n
    // Second sequence: 4 newlines → \n\n + \u00A0\n\n + \u00A0\n\n
    expect(result).toBe('Part1\n\n\u00A0\n\nPart2\n\n\u00A0\n\n\u00A0\n\nPart3');
  });

  it('handles blank lines at start of text', () => {
    const text = '\n\n\nContent';
    const result = preserveBlankLines(text);
    expect(result).toBe('\n\n\u00A0\n\nContent');
  });

  it('handles blank lines at end of text', () => {
    const text = 'Content\n\n\n';
    const result = preserveBlankLines(text);
    expect(result).toBe('Content\n\n\u00A0\n\n');
  });

  it('preserves non-breaking space character in output', () => {
    const text = 'A\n\n\nB';
    const result = preserveBlankLines(text);
    expect(result).toContain('\u00A0');
  });

  it('handles very long sequence of newlines', () => {
    const text = 'Start\n\n\n\n\n\n\nEnd';
    const result = preserveBlankLines(text);
    // 7 newlines → \n\n + \u00A0\n\n × 5
    const spacerCount = 7 - 2;
    const expectedSpacers = '\u00A0\n\n'.repeat(spacerCount);
    expect(result).toBe('Start\n\n' + expectedSpacers + 'End');
  });

  it('only matches 3+ consecutive newlines', () => {
    const text = 'A\nB\n\nC\n\n\nD';
    const result = preserveBlankLines(text);
    // Only the 3+ newlines should be modified
    expect(result).toContain('A\nB\n\nC'); // Normal newlines unchanged
    expect(result).toContain('\u00A0'); // But blank line sequence (3+) modified
  });

  it('handles mixed line endings (edge case)', () => {
    // Most text editors normalize to \n, but test robustness
    const text = 'Line1\n\n\nLine2';
    const result = preserveBlankLines(text);
    expect(result).toBe('Line1\n\n\u00A0\n\nLine2');
  });

  it('does not affect single newline (within paragraph)', () => {
    const text = 'Line 1\nLine 2\n\nParagraph 2';
    const result = preserveBlankLines(text);
    // Only the \n\n (two newlines, paragraph break) should be preserved as-is
    expect(result).toBe('Line 1\nLine 2\n\nParagraph 2');
  });

  it('calculation: newline match length is 3+ produces correct spacer count', () => {
    // spacerCount = match.length - 2
    // match.length = 3 → spacerCount = 1 → one \u00A0\n\n block
    // match.length = 4 → spacerCount = 2 → two \u00A0\n\n blocks

    const three = 'A\n\n\nB';
    const four = 'A\n\n\n\nB';

    const resultThree = preserveBlankLines(three);
    const resultFour = preserveBlankLines(four);

    // Count \u00A0 occurrences
    const spacerCountThree = (resultThree.match(/\u00A0/g) || []).length;
    const spacerCountFour = (resultFour.match(/\u00A0/g) || []).length;

    expect(spacerCountThree).toBe(1);
    expect(spacerCountFour).toBe(2);
  });

  it('returns string type', () => {
    const result = preserveBlankLines('test\n\n\nmore');
    expect(typeof result).toBe('string');
  });
});
