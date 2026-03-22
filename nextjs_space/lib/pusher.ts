import Pusher from 'pusher';

const globalForPusher = globalThis as unknown as { pusher: Pusher | undefined };

export const pusher =
  globalForPusher.pusher ??
  new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });

if (process.env.NODE_ENV !== 'production') globalForPusher.pusher = pusher;
