import Buffer from 'buffer';

/**
 * Polyfill for Buffer in browser environment
 *
 * Many Node.js libraries like isomorphic-git and bitcoinjs-lib expect Buffer to be globally available.
 * This polyfill makes the buffer package's Buffer available globally.
 */
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer.Buffer;
}

/**
 * Polyfill for AbortSignal.any()
 * 
 * AbortSignal.any() creates an AbortSignal that will be aborted when any of the
 * provided signals are aborted. This is useful for combining multiple abort signals.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static
 */

// Check if AbortSignal.any is already available
if (!AbortSignal.any) {
  AbortSignal.any = function(signals: AbortSignal[]): AbortSignal {
    // If no signals provided, return a signal that never aborts
    if (signals.length === 0) {
      return new AbortController().signal;
    }

    // If only one signal, return it directly for efficiency
    if (signals.length === 1) {
      return signals[0];
    }

    // Check if any signal is already aborted
    for (const signal of signals) {
      if (signal.aborted) {
        // Create an already-aborted signal with the same reason
        const controller = new AbortController();
        controller.abort(signal.reason);
        return controller.signal;
      }
    }

    // Create a new controller for the combined signal
    const controller = new AbortController();

    // Function to abort the combined signal
    const onAbort = (event: Event) => {
      const target = event.target as AbortSignal;
      controller.abort(target.reason);
    };

    // Listen for abort events on all input signals
    for (const signal of signals) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    // Clean up listeners when the combined signal is aborted
    controller.signal.addEventListener('abort', () => {
      for (const signal of signals) {
        signal.removeEventListener('abort', onAbort);
      }
    }, { once: true });

    return controller.signal;
  };
}

/**
 * Polyfill for AbortSignal.timeout()
 * 
 * AbortSignal.timeout() creates an AbortSignal that will be aborted after a
 * specified number of milliseconds.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
 */

// Check if AbortSignal.timeout is already available
if (!AbortSignal.timeout) {
  AbortSignal.timeout = function(milliseconds: number): AbortSignal {
    const controller = new AbortController();
    
    setTimeout(() => {
      controller.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    }, milliseconds);
    
    return controller.signal;
  };
}

/**
 * Polyfill for crypto.randomUUID()
 * 
 * crypto.randomUUID() generates a random UUID (v4) string.
 * This polyfill provides a fallback for browsers that don't support it.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
 */

// Check if crypto.randomUUID is already available
if (!crypto.randomUUID) {
  crypto.randomUUID = function(): `${string}-${string}-${string}-${string}-${string}` {
    // RFC 4122 v4 UUID format
    // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hex digit and y is one of 8, 9, A, or B
    
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    let result = '';
    
    for (let i = 0; i < template.length; i++) {
      const char = template[i];
      
      if (char === 'x') {
        // Generate random hex digit (0-f)
        result += Math.floor(Math.random() * 16).toString(16);
      } else if (char === 'y') {
        // Generate random hex digit with bits 6 and 7 set to 10
        const randomByte = Math.floor(Math.random() * 256);
        const byte = (randomByte & 0x3f) | 0x80; // Ensure bits 6-7 are 10xxxxxx
        result += byte.toString(16).padStart(2, '0').slice(-1);
      } else if (char === '-' || char === '4') {
        result += char;
      }
    }

    return result as `${string}-${string}-${string}-${string}-${string}`;
  };
}