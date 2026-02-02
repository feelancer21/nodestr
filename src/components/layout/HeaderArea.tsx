import { SearchBanner } from '@/components/search/SearchBanner';

export function HeaderArea() {
  return (
    <header className="hidden xl:flex sticky top-0 z-30 bg-background h-14 items-center justify-end mb-4">
      <SearchBanner variant="header" className="w-full max-w-md" />
    </header>
  );
}
