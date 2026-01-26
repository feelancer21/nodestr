import { useState } from 'react';
import { NRelay1 } from '@nostrify/nostrify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RelayTest() {
  const [results, setResults] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    eventCount?: number;
    duration?: number;
    relayResults?: Array<{ relay: string; status: 'ok' | 'failed'; message: string; duration?: number }>;
  }>({
    status: 'idle',
    message: 'Click "Test Relays" to verify connections',
  });

  const testRelays = async () => {
    setResults({ status: 'testing', message: 'Testing relay connections...' });
    const startTime = Date.now();

    const relays = ['wss://relay.damus.io', 'wss://nos.lol'];
    const relayResults: Array<{ relay: string; status: 'ok' | 'failed'; message: string; duration?: number }> = [];

    let totalEvents = 0;

    for (const relayUrl of relays) {
      const relayStartTime = Date.now();
      try {
        console.log('[RelayTest] Testing relay:', relayUrl);

        const relay = new NRelay1(relayUrl);

        // Create timeout for this specific relay
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            relay.close();
            reject(new Error('Connection timeout'));
          }, 5000)
        );

        const queryPromise = relay.query([
          {
            kinds: [1],
            limit: 5,
          },
        ]);

        const events = await Promise.race([queryPromise, timeoutPromise]) as any[];

        const relayDuration = Date.now() - relayStartTime;

        console.log('[RelayTest] Relay OK:', relayUrl, 'Got', events.length, 'events');

        relayResults.push({
          relay: relayUrl,
          status: 'ok',
          message: `✅ Connected, ${events.length} events`,
          duration: relayDuration,
        });

        totalEvents += events.length;
      } catch (error) {
        const relayDuration = Date.now() - relayStartTime;

        console.error('[RelayTest] Relay failed:', relayUrl, error);

        relayResults.push({
          relay: relayUrl,
          status: 'failed',
          message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: relayDuration,
        });
      }
    }

    const totalDuration = Date.now() - startTime;

    // Check if at least one relay worked
    const successCount = relayResults.filter(r => r.status === 'ok').length;

    if (successCount > 0) {
      setResults({
        status: 'success',
        message: `✅ ${successCount} of ${relays.length} relays working! Retrieved ${totalEvents} total events`,
        eventCount: totalEvents,
        duration: totalDuration,
        relayResults,
      });
    } else {
      setResults({
        status: 'error',
        message: `❌ All relays failed. See details below.`,
        duration: totalDuration,
        relayResults,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relay Diagnostic Tool</h1>
          <p className="text-slate-400 mt-2">
            Test if relays are properly connected and responding
          </p>
        </div>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testRelays} disabled={results.status === 'testing'} className="w-full">
              {results.status === 'testing' ? 'Testing...' : 'Test Relays'}
            </Button>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Status:</p>
                <Badge
                  className={
                    results.status === 'idle'
                      ? 'bg-slate-600'
                      : results.status === 'testing'
                        ? 'bg-blue-600'
                        : results.status === 'success'
                          ? 'bg-green-600'
                          : 'bg-red-600'
                  }
                >
                  {results.status === 'idle'
                    ? 'Ready'
                    : results.status === 'testing'
                      ? 'Testing...'
                      : results.status === 'success'
                        ? 'Success'
                        : 'Error'}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-semibold mb-1">Message:</p>
                <p className="text-sm text-slate-300">{results.message}</p>
              </div>

               {results.relayResults && results.relayResults.length > 0 && (
                 <div>
                   <p className="text-sm font-semibold mb-2">Per-Relay Results:</p>
                   <div className="space-y-2">
                     {results.relayResults.map((result) => (
                       <div key={result.relay} className="bg-slate-800 rounded p-3 border border-white/10">
                         <p className="text-xs font-mono text-slate-200 mb-1">{result.relay}</p>
                         <p className="text-sm text-slate-50 font-medium">{result.message}</p>
                         {result.duration !== undefined && (
                           <p className="text-xs text-slate-200 mt-1">{result.duration}ms</p>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {results.eventCount !== undefined && (
                <div>
                  <p className="text-sm font-semibold mb-1">Total Events Retrieved:</p>
                  <p className="text-sm text-slate-300">{results.eventCount} events</p>
                </div>
              )}

              {results.duration !== undefined && (
                <div>
                  <p className="text-sm font-semibold mb-1">Total Response Time:</p>
                  <p className="text-sm text-slate-300">{results.duration}ms</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm">What This Tests</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-slate-300">
            <p>✓ Relay connectivity</p>
            <p>✓ WebSocket communication</p>
            <p>✓ Query response times</p>
            <p>✓ Event retrieval</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-sm">If Test Fails</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-slate-300">
            <p>1. Check browser console for detailed error messages</p>
            <p>2. Go to Settings and verify relay URLs are correct</p>
            <p>3. Try adding different relays</p>
            <p>4. Check browser Network tab for WebSocket connections</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RelayTest;
