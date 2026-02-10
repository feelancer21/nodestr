// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import NostrProvider from '@/components/NostrProvider';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { RelayHealthProvider } from '@/components/RelayHealthProvider';
import { NostrSync } from '@/components/NostrSync';
import { NWCProvider } from '@/contexts/NWCContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { AppConfig } from '@/contexts/AppContext';
import { DMProvider } from '@/components/DMProvider';
import { UnreadProvider } from '@/contexts/UnreadContext';
import AppRouter from './AppRouter';

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

  const defaultConfig: AppConfig = {
  theme: "light",
  relayMetadata: {
    relays: [
      { url: 'wss://relay.damus.io', read: true, write: true },
      { url: 'wss://nos.lol', read: true, write: true },
      { url: 'wss://relay.primal.net', read: true, write: true },
    ],
    updatedAt: 0,
  },
};


export function App() {
  return (
    <UnheadProvider head={head}>
      <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig}>
        <QueryClientProvider client={queryClient}>
          <SearchProvider>
            <NostrLoginProvider storageKey='nostr:login'>
              <NostrProvider>
                <RelayHealthProvider>
                  <NostrSync />
                  <NWCProvider>
                    <DMProvider config={{ enabled: true }}>
                      <UnreadProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Suspense>
                            <AppRouter />
                          </Suspense>
                        </TooltipProvider>
                      </UnreadProvider>
                    </DMProvider>
                  </NWCProvider>
                </RelayHealthProvider>
              </NostrProvider>
            </NostrLoginProvider>
          </SearchProvider>
        </QueryClientProvider>
      </AppProvider>
    </UnheadProvider>
  );
}

export default App;
