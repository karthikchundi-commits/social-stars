import Pusher from 'pusher';

const globalForPusher = globalThis as unknown as { pusher: Pusher | undefined };

function createPusher() {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    throw new Error(
      'Missing Pusher environment variables. Add PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER to your .env / Vercel settings.'
    );
  }
  return new Pusher({ appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER, useTLS: true });
}

export const pusher = globalForPusher.pusher ?? createPusher();

if (process.env.NODE_ENV !== 'production') globalForPusher.pusher = pusher;
