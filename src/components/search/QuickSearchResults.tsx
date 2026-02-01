import { Card } from '@/components/ui/card';
import { QuickSearchItem } from './QuickSearchItem';
import type { MempoolNode } from '@/types/search';

interface QuickSearchResultsProps {
  results: MempoolNode[];
  query: string;
  isError?: boolean;
  onResultClick: (node: MempoolNode) => void;
  onShowAll: () => void;
  onOperatorLookup?: () => void;
}

export function QuickSearchResults({
  results,
  query,
  isError = false,
  onResultClick,
  onShowAll,
  onOperatorLookup,
}: QuickSearchResultsProps) {
  if (isError) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md">
        <div className="p-4 text-sm text-muted-foreground text-center">
          Search failed. Please try again.
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md">
        <div className="p-4 text-sm text-muted-foreground text-center">
          No nodes found for &apos;{query}&apos;
        </div>
        {onOperatorLookup && (
          <div className="border-t border-border px-3 py-2">
            <button
              onClick={onOperatorLookup}
              className="w-full text-sm text-link hover:underline text-center"
            >
              Search for operator with this Lightning pubkey
            </button>
          </div>
        )}
      </Card>
    );
  }

  const displayResults = results.slice(0, 10);

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-border bg-popover shadow-md overflow-hidden">
      <div className="py-1">
        {displayResults.map((node) => (
          <QuickSearchItem
            key={node.public_key}
            node={node}
            onClick={() => onResultClick(node)}
          />
        ))}
      </div>
      {results.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <button
            onClick={onShowAll}
            className="w-full text-sm text-link hover:underline text-center"
          >
            Show all results
          </button>
        </div>
      )}
    </Card>
  );
}
