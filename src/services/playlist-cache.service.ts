import { env } from "../config/env";

type PlaylistCacheEntry = {
  channelId: string;
  content: string;
  createdAt: number;
  expiresAt: number;
};

const playlistCache = new Map<string, PlaylistCacheEntry>();

export function getCachedPlaylist(channelId: string) {
  const entry = playlistCache.get(channelId);

  if (!entry) {
    return null;
  }

  const now = Date.now();

  if (now > entry.expiresAt) {
    playlistCache.delete(channelId);
    return null;
  }

  return entry;
}

export function setCachedPlaylist(channelId: string, content: string) {
  const now = Date.now();

  const entry: PlaylistCacheEntry = {
    channelId,
    content,
    createdAt: now,
    expiresAt: now + env.PLAYLIST_CACHE_TTL_MS,
  };

  playlistCache.set(channelId, entry);

  return entry;
}

export function clearCachedPlaylist(channelId: string) {
  playlistCache.delete(channelId);
}

export function getPlaylistCacheSnapshot() {
  const now = Date.now();

  return Array.from(playlistCache.values()).map((entry) => ({
    channelId: entry.channelId,
    createdAt: new Date(entry.createdAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    remainingMs: Math.max(0, entry.expiresAt - now),
  }));
}