import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import OperatorProfile from './OperatorProfile';
import NotFound from './NotFound';

/**
 * ProfilePage handles NIP-19 routing and delegates to OperatorProfile.
 *
 * Canonical route: /profile/:nip19Identifier
 * Where nip19Identifier is: npub1... or nprofile1...
 *
 * Also handles legacy /operator/:hex redirects by converting hex to npub.
 */
export function ProfilePage() {
  const { nip19Identifier } = useParams<{ nip19Identifier?: string }>();
  const navigate = useNavigate();

  // Decode and validate the NIP-19 identifier
  const decodedPubkey = useMemo(() => {
    if (!nip19Identifier) return null;

    try {
      // Try to decode as NIP-19
      const decoded = nip19.decode(nip19Identifier);

      // Only accept npub or nprofile types
      if (decoded.type === 'npub') {
        return decoded.data;
      } else if (decoded.type === 'nprofile') {
        return decoded.data.pubkey;
      } else {
        // Unsupported NIP-19 type
        return null;
      }
    } catch {
      // Not a valid NIP-19 identifier
      // Could be legacy hex pubkey - try to treat it as one
      if (/^[0-9a-f]{64}$/i.test(nip19Identifier)) {
        // It's a valid hex pubkey - convert to npub and redirect
        try {
          const npub = nip19.npubEncode(nip19Identifier);
          navigate(`/profile/${npub}`, { replace: true });
          return nip19Identifier; // Return the pubkey for now before redirect
        } catch {
          return null;
        }
      }
      return null;
    }
  }, [nip19Identifier, navigate]);

  // If we couldn't decode, show error
  if (!decodedPubkey) {
    return <NotFound />;
  }

  // Delegate to OperatorProfile component with decoded pubkey
  return <OperatorProfile pubkey={decodedPubkey} />;
}

export default ProfilePage;
