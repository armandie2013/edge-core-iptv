type OriginPlaylistResolverCacheEntry = {
  channelId: string;
  playlistUrl: string;
  createdAt: number;
  expiresAt: number;
};

const cache = new Map<string, OriginPlaylistResolverCacheEntry>();

const DEFAULT_TTL_MS = 30_000;

export function getCachedOriginPlaylistUrl(channelId: string) {
  const entry = cache.get(channelId);

  if (!entry) {
    return null;
  }

  const now = Date.now();

  if (now >= entry.expiresAt) {
    cache.delete(channelId);
    return null;
  }

  return entry.playlistUrl;
}

export function setCachedOriginPlaylistUrl(
  channelId: string,
  playlistUrl: string,
  ttlMs = DEFAULT_TTL_MS
) {
  const now = Date.now();

  cache.set(channelId, {
    channelId,
    playlistUrl,
    createdAt: now,
    expiresAt: now + ttlMs,
  });

  return playlistUrl;
}

export function clearCachedOriginPlaylistUrl(channelId: string) {
  cache.delete(channelId);
}

export function getOriginPlaylistResolverCacheSnapshot() {
  const now = Date.now();

  return Array.from(cache.values()).map((entry) => ({
    channelId: entry.channelId,
    playlistUrl: entry.playlistUrl,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    remainingMs: Math.max(0, entry.expiresAt - now),
  }));
}