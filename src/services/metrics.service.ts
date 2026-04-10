type ChannelMetric = {
  channelId: string;
  streamRequests: number;
  playlistRequests: number;
  segmentRequests: number;
  lastActivityAt: number;
};

const startedAt = Date.now();

let totalStreamRequests = 0;
let totalPlaylistRequests = 0;
let totalSegmentRequests = 0;

// ✅ métricas de cache de playlist
let playlistCacheHits = 0;
let playlistCacheMisses = 0;

const channelMetrics = new Map<string, ChannelMetric>();

const recentChannels: {
  channelId: string;
  type: "stream" | "playlist" | "segment";
  at: number;
}[] = [];

function getOrCreateChannelMetric(channelId: string): ChannelMetric {
  const existing = channelMetrics.get(channelId);

  if (existing) {
    return existing;
  }

  const created: ChannelMetric = {
    channelId,
    streamRequests: 0,
    playlistRequests: 0,
    segmentRequests: 0,
    lastActivityAt: Date.now(),
  };

  channelMetrics.set(channelId, created);
  return created;
}

function pushRecent(
  channelId: string,
  type: "stream" | "playlist" | "segment"
) {
  recentChannels.unshift({
    channelId,
    type,
    at: Date.now(),
  });

  if (recentChannels.length > 20) {
    recentChannels.length = 20;
  }
}

export function trackStreamRequest(channelId: string) {
  totalStreamRequests += 1;

  const metric = getOrCreateChannelMetric(channelId);
  metric.streamRequests += 1;
  metric.lastActivityAt = Date.now();

  pushRecent(channelId, "stream");
}

export function trackPlaylistRequest(channelId: string) {
  totalPlaylistRequests += 1;

  const metric = getOrCreateChannelMetric(channelId);
  metric.playlistRequests += 1;
  metric.lastActivityAt = Date.now();

  pushRecent(channelId, "playlist");
}

export function trackSegmentRequest(channelId: string) {
  totalSegmentRequests += 1;

  const metric = getOrCreateChannelMetric(channelId);
  metric.segmentRequests += 1;
  metric.lastActivityAt = Date.now();

  pushRecent(channelId, "segment");
}

// ✅ métricas hit / miss del cache de playlists
export function trackPlaylistCacheHit() {
  playlistCacheHits += 1;
}

export function trackPlaylistCacheMiss() {
  playlistCacheMisses += 1;
}

export function getMetricsSnapshot() {
  const now = Date.now();

  const channels = Array.from(channelMetrics.values())
    .map((item) => ({
      channelId: item.channelId,
      streamRequests: item.streamRequests,
      playlistRequests: item.playlistRequests,
      segmentRequests: item.segmentRequests,
      totalRequests:
        item.streamRequests + item.playlistRequests + item.segmentRequests,
      lastActivityAt: new Date(item.lastActivityAt).toISOString(),
      idleSeconds: Math.floor((now - item.lastActivityAt) / 1000),
    }))
    .sort((a, b) => b.totalRequests - a.totalRequests);

  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.floor((now - startedAt) / 1000),

    totalStreamRequests,
    totalPlaylistRequests,
    totalSegmentRequests,
    totalRequests:
      totalStreamRequests + totalPlaylistRequests + totalSegmentRequests,

    // ✅ nuevas métricas
    playlistCacheHits,
    playlistCacheMisses,

    channels,
    recentChannels: recentChannels.map((item) => ({
      channelId: item.channelId,
      type: item.type,
      at: new Date(item.at).toISOString(),
    })),
  };
}