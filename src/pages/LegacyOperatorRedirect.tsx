import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';

interface LegacyOperatorRedirectParams {
  hexPubkey: string;
}

/**
 * LegacyOperatorRedirect handles the old /operator/:hex route.
 * 
 * It converts hex pubkeys to npub1... and redirects to the canonical /profile/:npub route.
 * This ensures backward compatibility while enforcing the canonical route structure.
 */
export function LegacyOperatorRedirect() {
  const { hexPubkey } = useParams<LegacyOperatorRedirectParams>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hexPubkey) {
      navigate('/', { replace: true });
      return;
    }

    // Validate hex format (64 hex characters)
    if (!/^[0-9a-f]{64}$/i.test(hexPubkey)) {
      navigate('/', { replace: true });
      return;
    }

    try {
      // Convert hex pubkey to npub format
      const npub = nip19.npubEncode(hexPubkey);
      // Redirect to canonical profile route
      navigate(`/profile/${npub}`, { replace: true });
    } catch {
      // If encoding fails, go home
      navigate('/', { replace: true });
    }
  }, [hexPubkey, navigate]);

  // Render nothing while redirecting
  return null;
}

export default LegacyOperatorRedirect;
