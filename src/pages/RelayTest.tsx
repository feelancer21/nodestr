import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RelayTest() {
  const { nostr } = useNostr();
  const [results, setResults] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    eventCount?: number;
    duration?: number;
  }>({
    status: 'idle',
    message: 'Click "Test Relays" to verify connections',
  });

  const testRelays = async () => {
    setResults({ status: 'testing', message: 'Testing relay connections...' });
    const startTime = Date.now();

    try {
      console.log('[RelayTest] Starting relay test...');

      // Simple query - try to get any recent events
      const events = await nostr.query([
        {
          kinds: [1], // Text notes (most common)
          limit: 10,
        },
      ]);

      const duration = Date.now() - startTime;

      console.log('[RelayTest] Query succeeded! Got', events.length, 'events in', duration, 'ms');

      setResults({
        status: 'success',
        message: `✅ Relays are working! Retrieved ${events.length} events`,
        eventCount: events.length,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error('[RelayTest] Query failed:', error);

      setResults({
        status: 'error',
        message: `❌ Relay test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration,
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

            <div className="space-y-3">
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

              {results.eventCount !== undefined && (
                <div>
                  <p className="text-sm font-semibold mb-1">Events Retrieved:</p>
                  <p className="text-sm text-slate-300">{results.eventCount} events</p>
                </div>
              )}

              {results.duration !== undefined && (
                <div>
                  <p className="text-sm font-semibold mb-1">Response Time:</p>
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
