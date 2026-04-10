import { Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env";
import {
  trackPlaylistRequest,
  trackSegmentRequest,
  trackPlaylistCacheHit, trackPlaylistCacheMiss
} from "../services/metrics.service";
import { getCachedPlaylist, setCachedPlaylist } from "../services/playlist-cache.service";

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function buildAbsoluteUrl(baseUrl: string, relativeOrAbsolute: string) {
  if (isAbsoluteUrl(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }

  return new URL(relativeOrAbsolute, baseUrl).toString();
}

async function resolveOriginPlaylistUrl(channelId: string) {
  const originStreamUrl = `${env.ORIGIN_BASE_URL}/stream/${channelId}`;

  const response = await axios.get(originStreamUrl, {
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const redirectUrl = response.headers.location;

  if (!redirectUrl) {
    throw new Error("Origin no devolvió redirect para playlist");
  }

  if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
    return redirectUrl;
  }

  return `${env.ORIGIN_BASE_URL}${redirectUrl}`;
}

// Proxy del playlist live (.m3u8)
export async function playlistProxyController(req: Request, res: Response) {
  try {
    const rawChannelId = req.params.channelId;
    const channelId = Array.isArray(rawChannelId)
      ? rawChannelId[0]
      : rawChannelId;

    if (!channelId) {
      return res.status(400).json({
        ok: false,
        message: "Canal inválido",
      });
    }

    trackPlaylistRequest(channelId);

    // ✅ buscar en cache
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

    const originPlaylistUrl = await resolveOriginPlaylistUrl(channelId);

    const response = await axios.get<string>(originPlaylistUrl, {
      responseType: "text",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
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

    // ✅ guardar en cache
    setCachedPlaylist(channelId, content);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.send(content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error proxy playlist";

    return res.status(500).json({
      ok: false,
      message,
    });
  }
}

// Proxy genérico de segmentos / recursos HLS
export async function segmentProxyController(req: Request, res: Response) {
  try {
    const rawChannelId = req.params.channelId;
    const channelId = Array.isArray(rawChannelId)
      ? rawChannelId[0]
      : rawChannelId;

    if (!channelId) {
      return res.status(400).json({
        ok: false,
        message: "Canal inválido",
      });
    }

    // ✅ métricas segmento
    trackSegmentRequest(channelId);

    const rawUrl = req.query.url;
    const targetUrl = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).json({
        ok: false,
        message: "URL de segmento inválida",
      });
    }

    const response = await axios.get(targetUrl, {
      responseType: "stream",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const contentType =
      response.headers["content-type"] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

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