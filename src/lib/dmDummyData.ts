/**
 * Dummy data for the DM Design Prototype.
 * All pubkeys are realistic 64-char hex strings.
 * genUserName() will generate fun animal names from these.
 */

// 12 fake conversation partner pubkeys (64-char hex each)
const PK1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
const PK2 = 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';
const PK3 = 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4';
const PK4 = 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5';
const PK5 = 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6';
const PK6 = 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7';
const PK7 = '17a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8';
const PK8 = '28b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9';
const PK9 = '39c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0';
const PK10 = '40d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1';
const PK11 = '51e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2';
const PK12 = '62f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3';

// "My" pubkey for isFromMe markers
const MY_PK = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff';

// Timestamps (seconds since epoch)
const NOW = Math.floor(Date.now() / 1000);
const HOUR = 3600;
const DAY = 86400;

export interface DummyConversation {
  pubkey: string;
  lastMessage: string;
  lastActivity: number;
  unreadCount: number;
}

export interface DummyMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  isFromMe: boolean;
}

export const DUMMY_CONVERSATIONS: DummyConversation[] = [
  {
    pubkey: PK1,
    lastMessage: 'Hey, can we open a channel?',
    lastActivity: NOW - 2 * HOUR,
    unreadCount: 2,
  },
  {
    pubkey: PK2,
    lastMessage: 'Try running `lncli getinfo` to check',
    lastActivity: NOW - 8 * HOUR,
    unreadCount: 1,
  },
  {
    pubkey: PK3,
    lastMessage: 'Sounds good, I will set it up tonight.',
    lastActivity: NOW - 1 * DAY - 3 * HOUR,
    unreadCount: 0,
  },
  {
    pubkey: PK4,
    lastMessage: 'Check the docs at https://lightning.engineering',
    lastActivity: NOW - 3 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK5,
    lastMessage: 'My node is back online!',
    lastActivity: NOW - 6 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK6,
    lastMessage: 'Thanks for the help with the config.',
    lastActivity: NOW - 14 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK7,
    lastMessage: 'Will check the routing tables tomorrow.',
    lastActivity: NOW - 16 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK8,
    lastMessage: 'Rebalancing complete. 500k sats moved.',
    lastActivity: NOW - 20 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK9,
    lastMessage: 'Let me know when the watchtower is ready.',
    lastActivity: NOW - 25 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK10,
    lastMessage: 'Good call on the fee adjustment.',
    lastActivity: NOW - 30 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK11,
    lastMessage: 'I will open a channel from my end too.',
    lastActivity: NOW - 40 * DAY,
    unreadCount: 0,
  },
  {
    pubkey: PK12,
    lastMessage: 'Happy new year! Node is running smoothly.',
    lastActivity: NOW - 50 * DAY,
    unreadCount: 0,
  },
];

// --- Messages per conversation ---
// PK1: Long conversation (many messages for scroll testing)
function generateLongConversation(): DummyMessage[] {
  const msgs: DummyMessage[] = [];
  const baseTime = NOW - 5 * DAY;
  let idx = 0;

  const exchanges: Array<[boolean, string]> = [
    [false, 'Hi! I saw your node on the network. Impressive routing capacity!'],
    [true, 'Thanks! Been running it for about a year now.'],
    [false, 'What hardware are you running? I am looking to set up something similar.'],
    [true, 'Raspberry Pi 4 with 8GB RAM and a 1TB SSD. Works great for a routing node.'],
    [false, 'Nice! I was thinking about going with a more powerful setup. Maybe a NUC.'],
    [true, 'A NUC would be overkill for most setups, but it gives you headroom for future growth.'],
    [false, 'What about the channel management? Do you use any automation?'],
    [true, 'I use a combination of `charge-lnd` for fee management and `rebalance-lnd` for keeping channels balanced.'],
    [false, 'Can you share your charge-lnd config?'],
    [true, 'Sure! Here is my basic setup:\n\n```yaml\n[default]\nstrategy = proportional\nmin_fee_ppm = 10\nmax_fee_ppm = 500\nsum_peer_channel_capacity_sat = 1000000\n```'],
    [false, 'That is really helpful. What about the base fee?'],
    [true, 'I keep the base fee at 0 sats. Most routing algorithms prefer low base fees.'],
    [false, 'Makes sense. How often do you rebalance?'],
    [true, 'I run rebalance-lnd every 6 hours via cron. Usually targets channels below 30% local balance.'],
    [false, 'What is your success rate on rebalances?'],
    [true, 'About 60-70% depending on the route. I cap the fee at 50 ppm for rebalances.'],
    [false, 'That is pretty good. I have been struggling with some channels that never route anything.'],
    [true, 'Those are usually dead-end channels. Check if the peer has good connectivity to the rest of the network.'],
    [false, 'How do I check that?'],
    [true, 'Try `lncli describegraph` and look at the peer\'s channel count and total capacity. Or use tools like **1ML** or **Amboss**.'],
    [false, 'Got it. One more question: do you use keysend or regular invoices for most payments?'],
    [true, 'Both. Keysend is great for tips and spontaneous payments. Regular invoices for everything else.'],
    [false, 'What about MPP (multi-path payments)?'],
    [true, 'MPP is enabled by default in recent LND versions. It helps with larger payments by splitting them across multiple channels.'],
    [false, 'I have been seeing some failed HTLCs lately. Any debugging tips?'],
    [true, 'Check `lncli listchannels` for any channels with high `unsettled_balance`. Also look at `lncli pendingchannels` for stuck force-closes.'],
    [false, 'Found a few stuck ones. Is it safe to force close them?'],
    [true, 'Only if they have been stuck for a long time (weeks). Otherwise, try bumping the fee first with `lncli wallet bumpfee`.'],
    [false, 'Thanks, I will try that first.'],
    [true, 'Good luck! Let me know how it goes.'],
    [false, 'Will do. By the way, are you planning to upgrade to LND 0.18?'],
    [true, 'Yes, waiting for a few more patch releases to iron out any bugs. The taproot channel support looks promising.'],
    [false, 'Agreed. Taproot channels should improve privacy significantly.'],
    [true, 'Definitely. Plus the potential for channel splicing in future versions.'],
    [false, 'Can not wait for that. Splicing would make channel management so much easier.'],
    [true, 'For sure. No more close-and-reopen just to resize a channel.'],
    [false, 'Hey, can we open a channel?'],
  ];

  for (const [isFromMe, content] of exchanges) {
    msgs.push({
      id: `m1-${idx}`,
      pubkey: isFromMe ? MY_PK : PK1,
      content,
      created_at: baseTime + idx * 300,
      isFromMe,
    });
    idx++;
  }

  return msgs;
}

export const DUMMY_MESSAGES: Map<string, DummyMessage[]> = new Map([
  [PK1, generateLongConversation()],
  [PK2, [
    { id: 'm2-1', pubkey: MY_PK, content: 'My channels keep closing unexpectedly. Any ideas?', created_at: NOW - 10 * HOUR, isFromMe: true },
    { id: 'm2-2', pubkey: PK2, content: 'That sounds like a force-close issue. Can you check your logs?', created_at: NOW - 9 * HOUR, isFromMe: false },
    { id: 'm2-3', pubkey: MY_PK, content: 'Where do I find the logs?', created_at: NOW - 9 * HOUR + 300, isFromMe: true },
    { id: 'm2-4', pubkey: PK2, content: 'Try running `lncli getinfo` to check', created_at: NOW - 8 * HOUR, isFromMe: false },
  ]],
  [PK3, [
    { id: 'm3-1', pubkey: PK3, content: 'Would you be interested in a **dual-funded** channel?', created_at: NOW - 2 * DAY, isFromMe: false },
    { id: 'm3-2', pubkey: MY_PK, content: 'Definitely! I have been looking into *liquidity ads* as well.', created_at: NOW - 2 * DAY + 600, isFromMe: true },
    { id: 'm3-3', pubkey: PK3, content: 'Here is what I usually do:\n\n- Open with 2M sats each side\n- Set fees to 100 ppm\n- Keep the channel balanced monthly', created_at: NOW - 1 * DAY - 5 * HOUR, isFromMe: false },
    { id: 'm3-4', pubkey: MY_PK, content: 'Sounds good, I will set it up tonight.', created_at: NOW - 1 * DAY - 3 * HOUR, isFromMe: true },
  ]],
  [PK4, [
    { id: 'm4-1', pubkey: PK4, content: 'Here is the connection string for my node:\n\n```\nlncli connect 03abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab@mynode.example.com:9735\n```\n\nLet me know once you are connected!', created_at: NOW - 4 * DAY, isFromMe: false },
    { id: 'm4-2', pubkey: MY_PK, content: 'Got it, connecting now...', created_at: NOW - 4 * DAY + 300, isFromMe: true },
    { id: 'm4-3', pubkey: MY_PK, content: 'Connected! Opening a 1M sat channel.', created_at: NOW - 3 * DAY - 2 * HOUR, isFromMe: true },
    { id: 'm4-4', pubkey: PK4, content: 'Check the docs at https://lightning.engineering', created_at: NOW - 3 * DAY, isFromMe: false },
  ]],
  [PK5, [
    { id: 'm5-1', pubkey: PK5, content: 'Sorry about the downtime, had a power outage.', created_at: NOW - 7 * DAY, isFromMe: false },
    { id: 'm5-2', pubkey: MY_PK, content: 'No worries! Is everything back up?', created_at: NOW - 7 * DAY + 600, isFromMe: true },
    { id: 'm5-3', pubkey: PK5, content: 'My node is back online!', created_at: NOW - 6 * DAY, isFromMe: false },
  ]],
  [PK6, [
    { id: 'm6-1', pubkey: MY_PK, content: 'I noticed my `channel.db` is growing quite large. Is that normal?', created_at: NOW - 15 * DAY, isFromMe: true },
    { id: 'm6-2', pubkey: PK6, content: 'Yes, that is expected. You can compact it with:\n\n```bash\nlncli stop\ncp ~/.lnd/data/graph/mainnet/channel.db channel.db.bak\nlncli start\n```\n\nMake sure to **back up first** though!', created_at: NOW - 15 * DAY + 1800, isFromMe: false },
    { id: 'm6-3', pubkey: MY_PK, content: 'Perfect, that worked. Database went from 2GB to 500MB.', created_at: NOW - 14 * DAY - 2 * HOUR, isFromMe: true },
    { id: 'm6-4', pubkey: PK6, content: 'Thanks for the help with the config.', created_at: NOW - 14 * DAY, isFromMe: false },
  ]],
  [PK7, [
    { id: 'm7-1', pubkey: PK7, content: 'Have you looked at the latest routing gossip? Some big nodes went offline.', created_at: NOW - 17 * DAY, isFromMe: false },
    { id: 'm7-2', pubkey: MY_PK, content: 'Yeah, noticed a few of my routes stopped working. Need to find alternatives.', created_at: NOW - 17 * DAY + 600, isFromMe: true },
    { id: 'm7-3', pubkey: PK7, content: 'Will check the routing tables tomorrow.', created_at: NOW - 16 * DAY, isFromMe: false },
  ]],
  [PK8, [
    { id: 'm8-1', pubkey: MY_PK, content: 'Can you help me rebalance through your node?', created_at: NOW - 21 * DAY, isFromMe: true },
    { id: 'm8-2', pubkey: PK8, content: 'Sure, which channel pair?', created_at: NOW - 21 * DAY + 300, isFromMe: false },
    { id: 'm8-3', pubkey: MY_PK, content: 'From my ACINQ channel to the LNBig one. About 500k sats.', created_at: NOW - 20 * DAY - 2 * HOUR, isFromMe: true },
    { id: 'm8-4', pubkey: PK8, content: 'Rebalancing complete. 500k sats moved.', created_at: NOW - 20 * DAY, isFromMe: false },
  ]],
  [PK9, [
    { id: 'm9-1', pubkey: PK9, content: 'Are you running a watchtower?', created_at: NOW - 26 * DAY, isFromMe: false },
    { id: 'm9-2', pubkey: MY_PK, content: 'Not yet, but I plan to set one up this weekend.', created_at: NOW - 26 * DAY + 600, isFromMe: true },
    { id: 'm9-3', pubkey: PK9, content: 'Let me know when the watchtower is ready.', created_at: NOW - 25 * DAY, isFromMe: false },
  ]],
  [PK10, [
    { id: 'm10-1', pubkey: MY_PK, content: 'I just lowered my fees to 25 ppm. Routing volume increased 3x!', created_at: NOW - 31 * DAY, isFromMe: true },
    { id: 'm10-2', pubkey: PK10, content: 'Good call on the fee adjustment.', created_at: NOW - 30 * DAY, isFromMe: false },
  ]],
  [PK11, [
    { id: 'm11-1', pubkey: PK11, content: 'Want to set up a triangle with me and a third node?', created_at: NOW - 42 * DAY, isFromMe: false },
    { id: 'm11-2', pubkey: MY_PK, content: 'Sounds great! Who is the third node?', created_at: NOW - 42 * DAY + 600, isFromMe: true },
    { id: 'm11-3', pubkey: PK11, content: 'A friend of mine. 10M sats capacity each. I will open first.', created_at: NOW - 41 * DAY, isFromMe: false },
    { id: 'm11-4', pubkey: MY_PK, content: 'Perfect, ready when you are.', created_at: NOW - 41 * DAY + 300, isFromMe: true },
    { id: 'm11-5', pubkey: PK11, content: 'I will open a channel from my end too.', created_at: NOW - 40 * DAY, isFromMe: false },
  ]],
  [PK12, [
    { id: 'm12-1', pubkey: PK12, content: 'Happy new year! How is your node doing?', created_at: NOW - 51 * DAY, isFromMe: false },
    { id: 'm12-2', pubkey: MY_PK, content: 'Happy new year! Running great, hit 100 channels last month.', created_at: NOW - 51 * DAY + 600, isFromMe: true },
    { id: 'm12-3', pubkey: PK12, content: 'Happy new year! Node is running smoothly.', created_at: NOW - 50 * DAY, isFromMe: false },
  ]],
]);

export const DUMMY_UNREAD_COUNTS: Map<string, number> = new Map([
  [PK1, 2],
  [PK2, 1],
]);

export const DUMMY_TOTAL_UNREAD = 3;
