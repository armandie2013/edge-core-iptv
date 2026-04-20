// import { Request, Response } from "express";
// import axios from "axios";
// import { env } from "../config/env";
// import {
//   trackPlaylistRequest,
//   trackSegmentRequest,
//   trackPlaylistCacheHit,
//   trackPlaylistCacheMiss,
// } from "../services/metrics.service";
// import {
//   getCachedPlaylist,
//   setCachedPlaylist,
//   clearCachedPlaylist,
// } from "../services/playlist-cache.service";

// type ResolvedPlaylistEntry = {
//   channelId: string;
//   playlistUrl: string;
//   createdAt: number;
// };

// const resolvedPlaylistCache = new Map<string, ResolvedPlaylistEntry>();

// function isAbsoluteUrl(url: string) {
//   return /^https?:\/\//i.test(url);
// }

// function buildAbsoluteUrl(baseUrl: string, relativeOrAbsolute: string) {
//   if (isAbsoluteUrl(relativeOrAbsolute)) {
//     return relativeOrAbsolute;
//   }

//   return new URL(relativeOrAbsolute, baseUrl).toString();
// }

// function getCachedResolvedPlaylistUrl(channelId: string) {
//   const entry = resolvedPlaylistCache.get(channelId);
//   if (!entry) return null;
//   return entry.playlistUrl;
// }

// function setCachedResolvedPlaylistUrl(channelId: string, playlistUrl: string) {
//   resolvedPlaylistCache.set(channelId, {
//     channelId,
//     playlistUrl,
//     createdAt: Date.now(),
//   });

//   return playlistUrl;
// }

// function clearCachedResolvedPlaylistUrl(channelId: string) {
//   resolvedPlaylistCache.delete(channelId);
// }

// async function resolveOriginPlaylistUrl(channelId: string) {
//   const cached = getCachedResolvedPlaylistUrl(channelId);
//   if (cached) {
//     return cached;
//   }

//   const originStreamUrl = `${env.ORIGIN_BASE_URL}/stream/${channelId}`;

//   const response = await axios.get(originStreamUrl, {
//     maxRedirects: 0,
//     timeout: 15000,
//     validateStatus: (status) => status >= 200 && status < 400,
//     headers: {
//       "Cache-Control": "no-cache",
//       Pragma: "no-cache",
//       "User-Agent": "edge-core-iptv/1.0",
//       Accept: "*/*",
//     },
//   });

//   const redirectUrl = response.headers.location;

//   if (!redirectUrl) {
//     throw new Error("Origin no devolvió redirect para playlist");
//   }

//   const absoluteRedirectUrl =
//     redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")
//       ? redirectUrl
//       : `${env.ORIGIN_BASE_URL}${redirectUrl}`;

//   setCachedResolvedPlaylistUrl(channelId, absoluteRedirectUrl);

//   return absoluteRedirectUrl;
// }

// export async function playlistProxyController(req: Request, res: Response) {
//   const rawChannelId = req.params.channelId;
//   const channelId = Array.isArray(rawChannelId)
//     ? rawChannelId[0]
//     : rawChannelId;

//   try {
//     if (!channelId) {
//       return res.status(400).json({
//         ok: false,
//         message: "Canal inválido",
//       });
//     }

//     trackPlaylistRequest(channelId);

//     const cacheEnabled = env.PLAYLIST_CACHE_TTL_MS > 0;

//     if (cacheEnabled) {
//       const cached = getCachedPlaylist(channelId);

//       if (cached) {
//         trackPlaylistCacheHit();

//         res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
//         res.setHeader(
//           "Cache-Control",
//           "no-store, no-cache, must-revalidate, max-age=0"
//         );
//         res.setHeader("Pragma", "no-cache");
//         res.setHeader("Expires", "0");

//         return res.send(cached.content);
//       }

//       trackPlaylistCacheMiss();
//     }

//     const originPlaylistUrl = await resolveOriginPlaylistUrl(channelId);

//     const response = await axios.get<string>(originPlaylistUrl, {
//       responseType: "text",
//       timeout: 20000,
//       validateStatus: (status) => status >= 200 && status < 400,
//       headers: {
//         "Cache-Control": "no-cache",
//         Pragma: "no-cache",
//         "User-Agent": "edge-core-iptv/1.0",
//         Accept: "*/*",
//       },
//     });

//     const originalContent = response.data;
//     const lines = originalContent.split(/\r?\n/);

//     const rewrittenLines = lines.map((line) => {
//       const trimmed = line.trim();

//       if (!trimmed || trimmed.startsWith("#")) {
//         return line;
//       }

//       const absoluteUrl = buildAbsoluteUrl(originPlaylistUrl, trimmed);

//       return `/hls/${channelId}/segment?url=${encodeURIComponent(absoluteUrl)}`;
//     });

//     const content = rewrittenLines.join("\n");

//     if (cacheEnabled) {
//       setCachedPlaylist(channelId, content);
//     }

//     res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
//     res.setHeader(
//       "Cache-Control",
//       "no-store, no-cache, must-revalidate, max-age=0"
//     );
//     res.setHeader("Pragma", "no-cache");
//     res.setHeader("Expires", "0");

//     return res.send(content);
//   } catch (error) {
//     if (channelId) {
//       clearCachedResolvedPlaylistUrl(channelId);
//       clearCachedPlaylist(channelId);
//     }

//     const message =
//       error instanceof Error ? error.message : "Error proxy playlist";

//     return res.status(500).json({
//       ok: false,
//       message,
//     });
//   }
// }

// export async function segmentProxyController(req: Request, res: Response) {
//   const rawChannelId = req.params.channelId;
//   const channelId = Array.isArray(rawChannelId)
//     ? rawChannelId[0]
//     : rawChannelId;

//   try {
//     if (!channelId) {
//       return res.status(400).json({
//         ok: false,
//         message: "Canal inválido",
//       });
//     }

//     trackSegmentRequest(channelId);

//     const rawUrl = req.query.url;
//     const targetUrl = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

//     if (!targetUrl || typeof targetUrl !== "string") {
//       return res.status(400).json({
//         ok: false,
//         message: "URL de segmento inválida",
//       });
//     }

//     const response = await axios.get(targetUrl, {
//       responseType: "stream",
//       timeout: 45000,
//       validateStatus: (status) => status >= 200 && status < 400,
//       headers: {
//         "Cache-Control": "no-cache",
//         Pragma: "no-cache",
//         "User-Agent": "edge-core-iptv/1.0",
//         Accept: "*/*",
//       },
//     });

//     const contentType =
//       response.headers["content-type"] || "application/octet-stream";

//     res.setHeader("Content-Type", contentType);
//     res.setHeader(
//       "Cache-Control",
//       "no-store, no-cache, must-revalidate, max-age=0"
//     );
//     res.setHeader("Pragma", "no-cache");
//     res.setHeader("Expires", "0");

//     response.data.on("error", () => {
//       if (!res.headersSent) {
//         res.status(502).end();
//       } else {
//         res.end();
//       }
//     });

//     response.data.pipe(res);
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : "Error proxy segmento";

//     return res.status(500).json({
//       ok: false,
//       message,
//     });
//   }
// }

import { Request, Response } from "express";
import axios from "axios";
import http from "http";
import https from "https";
import { env } from "../config/env";
import {
  trackPlaylistRequest,
  trackSegmentRequest,
  trackPlaylistCacheHit,
  trackPlaylistCacheMiss,
} from "../services/metrics.service";
import {
  getCachedPlaylist,
  setCachedPlaylist,
  clearCachedPlaylist,
} from "../services/playlist-cache.service";

type ResolvedPlaylistEntry = {
  channelId: string;
  playlistUrl: string;
  createdAt: number;
};

const resolvedPlaylistCache = new Map<string, ResolvedPlaylistEntry>();

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 200,
  maxFreeSockets: 50,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 200,
  maxFreeSockets: 50,
});

const httpClient = axios.create({
  timeout: 20000,
  httpAgent,
  httpsAgent,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 400,
  headers: {
    "User-Agent": "edge-core-iptv/1.0",
    Accept: "*/*",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function buildAbsoluteUrl(baseUrl: string, relativeOrAbsolute: string) {
  if (isAbsoluteUrl(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }

  return new URL(relativeOrAbsolute, baseUrl).toString();
}

function getCachedResolvedPlaylistUrl(channelId: string) {
  const entry = resolvedPlaylistCache.get(channelId);
  if (!entry) return null;
  return entry.playlistUrl;
}

function setCachedResolvedPlaylistUrl(channelId: string, playlistUrl: string) {
  resolvedPlaylistCache.set(channelId, {
    channelId,
    playlistUrl,
    createdAt: Date.now(),
  });

  return playlistUrl;
}

function clearCachedResolvedPlaylistUrl(channelId: string) {
  resolvedPlaylistCache.delete(channelId);
}

async function resolveOriginPlaylistUrl(channelId: string) {
  const cached = getCachedResolvedPlaylistUrl(channelId);
  if (cached) {
    return cached;
  }

  const originStreamUrl = `${env.ORIGIN_BASE_URL}/stream/${channelId}`;

  const response = await httpClient.get(originStreamUrl, {
    maxRedirects: 0,
  });

  const redirectUrl = response.headers.location;

  if (!redirectUrl) {
    throw new Error("Origin no devolvió redirect para playlist");
  }

  const absoluteRedirectUrl =
    redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")
      ? redirectUrl
      : `${env.ORIGIN_BASE_URL}${redirectUrl}`;

  setCachedResolvedPlaylistUrl(channelId, absoluteRedirectUrl);

  return absoluteRedirectUrl;
}

export async function playlistProxyController(req: Request, res: Response) {
  const rawChannelId = req.params.channelId;
  const channelId = Array.isArray(rawChannelId)
    ? rawChannelId[0]
    : rawChannelId;

  try {
    if (!channelId) {
      return res.status(400).json({
        ok: false,
        message: "Canal inválido",
      });
    }

    trackPlaylistRequest(channelId);

    const cacheEnabled = env.PLAYLIST_CACHE_TTL_MS > 0;

    if (cacheEnabled) {
      const cached = getCachedPlaylist(channelId);

      if (cached) {
        trackPlaylistCacheHit();

        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, max-age=0"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        return res.send(cached.content);
      }

      trackPlaylistCacheMiss();
    }

    const originPlaylistUrl = await resolveOriginPlaylistUrl(channelId);

    const response = await httpClient.get<string>(originPlaylistUrl, {
      responseType: "text",
    });

    const originalContent = response.data;
    const lines = originalContent.split(/\r?\n/);

    const rewrittenLines = lines.map((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      const absoluteUrl = buildAbsoluteUrl(originPlaylistUrl, trimmed);

      return `/hls/${channelId}/segment?url=${encodeURIComponent(absoluteUrl)}`;
    });

    const content = rewrittenLines.join("\n");

    if (cacheEnabled) {
      setCachedPlaylist(channelId, content);
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.send(content);
  } catch (error) {
    if (channelId) {
      clearCachedResolvedPlaylistUrl(channelId);
      clearCachedPlaylist(channelId);
    }

    const message =
      error instanceof Error ? error.message : "Error proxy playlist";

    return res.status(500).json({
      ok: false,
      message,
    });
  }
}

export async function segmentProxyController(req: Request, res: Response) {
  const rawChannelId = req.params.channelId;
  const channelId = Array.isArray(rawChannelId)
    ? rawChannelId[0]
    : rawChannelId;

  try {
    if (!channelId) {
      return res.status(400).json({
        ok: false,
        message: "Canal inválido",
      });
    }

    trackSegmentRequest(channelId);

    const rawUrl = req.query.url;
    const targetUrl = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).json({
        ok: false,
        message: "URL de segmento inválida",
      });
    }

    const response = await httpClient.get(targetUrl, {
      responseType: "stream",
      timeout: 60000,
    });

    const contentType =
      response.headers["content-type"] || "application/octet-stream";
    const contentLength = response.headers["content-length"];

    res.setHeader("Content-Type", contentType);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Connection", "keep-alive");

    response.data.on("error", () => {
      if (!res.headersSent) {
        res.status(502).end();
      } else {
        res.end();
      }
    });

    req.on("close", () => {
      if (!res.writableEnded) {
        response.data.destroy();
      }
    });

    response.data.pipe(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error proxy segmento";

    return res.status(500).json({
      ok: false,
      message,
    });
  }
}