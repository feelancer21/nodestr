# Relay Connection Debugging Guide

If the app loads but doesn't fetch information from relays, follow these steps:

## 0. Quick Test (NEW)

**First, test relays directly:**
1. Go to: `http://192.168.2.161:5173/debug/relays`
2. Click **"Test Relays"** button
3. Wait for results (should show within 5 seconds per relay)
4. Check:
   - ✅ Each relay shows "✅ Connected" or "❌ Connection timeout"
   - ✅ Event counts for working relays
   - ✅ Response times

**If all relays show "Connection timeout":**
- Relays are not responding
- Try different relay URLs in Settings
- Check firewall/network connectivity

**If at least one relay shows "✅ Connected":**
- Relay connectivity is working
- The issue might be with how the app queries for CLIP events
- Check browser console logs (see Step 1 below)

## 1. Check Browser Console

Open DevTools (F12) and check the Console tab for messages starting with:
- `[NostrProvider]` - Relay initialization
- `[RelayTest]` - Relay test messages
- `[useClipFeed]` - Feed fetch attempts

Expected logs:
```
[NostrProvider] Initializing NPool with relays: ['wss://relay.damus.io', 'wss://nos.lol']
[NostrProvider] Opening relay connection: wss://relay.damus.io
[NostrProvider] Opening relay connection: wss://nos.lol
[RelayTest] Testing relay: wss://relay.damus.io
[RelayTest] Relay OK: wss://relay.damus.io Got X events
```

## 2. Common Issues & Solutions

### A. Relays Not Connecting
**Symptoms:** See `[NostrProvider] Opening relay connection` but then no data

**Solutions:**
1. **Check if relays are online:**
   ```
   # From terminal on your VM:
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" wss://relay.damus.io
   ```

2. **Try different relays:**
   - Go to Settings tab in the app
   - Remove current relays
   - Add one of these alternatives:
     - `wss://relay.nostr.band`
     - `wss://nos.lol` (Nostr Operating System)
     - `wss://relay.snort.social`

3. **Check firewall/network:**
   - WSS (WebSocket Secure) on port 443 might be blocked
   - You said no firewall, but check:
     ```
     # Can you reach the relay?
     curl -v wss://relay.damus.io
     ```

### B. Browser Storage Issue
**Symptoms:** Relay settings not persisting or showing defaults

**Solutions:**
1. **Clear localStorage:**
   - Open DevTools
   - Application → Storage → Local Storage
   - Find `nostr:app-config`
   - Delete it
   - Refresh page

2. **Manually set relays:**
   - Go to Settings tab
   - Add relays manually
   - Check that they save

### C. NIP-07 Signer Not Connected
**Symptoms:** Can't log in, can't fetch data

**Solutions:**
1. **Install a Nostr extension:**
   - Alby (Browser wallet)
   - nos2x
   - Nostr Connect
   
2. **Grant permission:**
   - When you first interact with the app, the extension should ask for permission
   - Click "Allow" or "Connect"

## 3. Network Inspection

### In Firefox DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "wss" (WebSocket)
4. Refresh page
5. You should see connections to:
   - `relay.damus.io`
   - `nos.lol`

Look for:
- **Status 101** = WebSocket connection successful ✅
- **Hanging connection** = Connection established, waiting for data
- **Failed/closed** = Connection failed ❌

### In Chrome DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter type "WS" (WebSocket)
4. Refresh page
5. Check connection status

## 4. Relay Status Check

Test if relays are working with a simple query. Open browser console and run:

```javascript
// This tests if nostr library can connect
const pool = new NPool();
const relay = pool.relay('wss://relay.damus.io');

relay.query([{ kinds: [1], limit: 1 }])
  .then(events => {
    console.log('✅ Relay working! Got events:', events.length);
  })
  .catch(error => {
    console.error('❌ Relay error:', error);
  });
```

## 5. Actual Error Messages

If you see errors, share them in the console. Look for:
- `WebSocket connection failed`
- `ECONNREFUSED`
- `CORS error`
- `Timeout`
- Network connectivity errors

## 6. Check Relay Configuration

In Settings tab:
1. Click Settings in sidebar
2. Look at "Relay Settings" section
3. Verify:
   - At least one relay is listed
   - Both `read` and `write` are checked ✓
   - URLs start with `wss://` (not `ws://`)

## 7. DNS Resolution

If relays aren't connecting at all, check DNS:

```bash
# From your terminal:
nslookup relay.damus.io
# Should return an IP address

# Also try:
ping relay.damus.io
curl -v wss://relay.damus.io --limit-output
```

## 8. Try Localhost First

To verify your setup works, you could run a local relay:

```bash
# Using strfry (if available)
docker run -it strfry/strfry:v0.10.31 start
# Then connect to: ws://localhost:7777
```

But since you said no firewall issues, this is probably not needed.

## 9. Browser Compatibility

Make sure your browser supports:
- ✅ WebSocket
- ✅ WebSocket Secure (WSS)
- ✅ ES2020+ JavaScript

Modern versions of Firefox, Chrome, Safari, and Edge all support this.

## Next Steps

1. **Check browser console** first - what do you see?
2. **Verify relay connections** in Network tab
3. **Try different relays** in Settings
4. **Check relay status** manually with curl
5. **Share any error messages** from console

Once you identify the specific error, the fix will be clear.

---

## Quick Checklist

- [ ] Browser console shows `[NostrProvider] Initializing NPool`
- [ ] Network tab shows WSS connections to relays
- [ ] Relays show status 101 (Connected)
- [ ] Settings tab shows relays configured
- [ ] No JavaScript errors in console
- [ ] Browser supports WebSocket
- [ ] Relay URLs are valid (wss://...)

If all checkboxes are ✓ but still no data, the relays might be temporarily down or there might be no CLIP events published yet.
