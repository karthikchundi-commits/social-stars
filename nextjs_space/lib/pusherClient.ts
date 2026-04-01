'use client';

let _client: any = null;

export async function getPusherClient() {
  if (typeof window === 'undefined') return null;
  if (_client) return _client;
  const PusherJs = (await import('pusher-js')).default;
  _client = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
  return _client;
}
