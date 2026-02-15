import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AboutPage() {
  useSeoMeta({
    title: 'About - nodestr',
    description: 'Learn about nodestr, a Nostr client for Lightning node operators using the CLIP protocol.',
  });

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">About nodestr</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verifiable Lightning node information on Nostr
        </p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-md border border-amber-500/50 bg-amber-500/10 text-sm text-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p>
          nodestr is alpha software, built entirely through vibe coding. Everything
          here is experimental and under active development. Expect rough edges,
          breaking changes, and missing features.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Lightning beyond gossip
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground space-y-3 leading-relaxed">
          <p>
            The Lightning Network's gossip protocol handles the fundamentals well. Channel
            policies, fee structures, and node addresses are broadcast with cryptographic
            signatures — secure, decentralized, and verifiable by design.
          </p>
          <p>
            Some operators want to share more than what gossip covers — contact
            information, support channels, service descriptions, or acceptance policies.
            Today, this kind of data is found on websites, directories, or social
            platforms like Nostr itself.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Why this matters as Lightning grows
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground space-y-3 leading-relaxed">
          <p>
            As the Lightning ecosystem grows, so does the number of routing nodes
            and services built on top of it. Some of these operate trustlessly,
            others require trust by design. Either way, when something goes wrong,
            users need to find the right support contact for a service, or the right
            operator to coordinate with.
          </p>
          <p>
            Regardless of where this information is published, profiles can be
            impersonated and websites can be mimicked with lookalike domains. Without a
            cryptographic link to the node's identity, there's no built-in way to check
            whether the information actually comes from the operator it claims to
            represent.
          </p>
          <p>
            Bots make this harder. Automated accounts can create convincing operator
            profiles and impersonate support channels. As their numbers grow, finding
            authentic information becomes increasingly difficult.
          </p>
          <p>
            If AI agents begin to operate Lightning nodes, they would face the same
            challenge — but without any social intuition to fall back on, verifiable
            operator data becomes essential rather than optional.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            How nodestr and CLIP address this
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground space-y-3 leading-relaxed">
          <p>
            nodestr uses the{' '}
            <Link to="/about/protocol" className="text-link hover:underline font-medium">
              CLIP protocol
            </Link>{' '}
            (Common Lightning-node Information Payload) to publish operator information
            over Nostr. Every node announcement is signed with the Lightning node's own
            identity key — the same key that identifies the node on the network. This
            creates a cryptographic proof that the information comes from the node operator.
          </p>
          <p>
            CLIP-aware clients can verify these signatures locally and show users which
            Lightning node stands behind a piece of information. Users who run their own
            Lightning node can go further and check the capacity and channels behind that
            key. This doesn't eliminate all risks — a fake client could still show wrong
            data — but it gives users tools to verify for themselves rather than relying
            on trust alone.
          </p>
          <p>
            The data is stored on Nostr relays, distributed and redundant. A centrally
            hosted client is still subject to the same risks as any website, but the
            protocol is open — anyone can run their own client, host it locally, or simply
            verify the signatures independently. The information is portable and not locked
            into any single service.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Getting started
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground space-y-3 leading-relaxed">
          <p>
            If you operate a Lightning node and want to publish verifiable information
            about it:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Log in with Nostr</strong> — Use a signer extension (like nos2x or
              Alby) or create a new Nostr identity directly in the app.
            </li>
            <li>
              <strong>Find your node</strong> — Use the{' '}
              <Link to="/search" className="text-link hover:underline">search</Link>{' '}
              to look up your node by alias or public key.
            </li>
            <li>
              <strong>Claim it</strong> — Sign a message with your Lightning node's
              identity key to prove you control it. This creates the trust anchor linking
              your node to your Nostr identity.
            </li>
            <li>
              <strong>Publish node info</strong> — Add contact details, service
              descriptions, channel policies, or anything else you want to share. This
              information will be signed with your Nostr key and distributed to relays.
            </li>
          </ol>
          <p>
            You'll need access to your Lightning node's CLI (or equivalent) to sign the
            initial announcement.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default AboutPage;
