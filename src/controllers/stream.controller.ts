import { Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env";
import { trackStreamRequest } from "../services/metrics.service";

async function resolveOriginStreamUrl(channelId: string) {
  const originUrl = `${env.ORIGIN_BASE_URL}/stream/${channelId}`;

  const response = await axios.get(originUrl, {
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const redirectUrl = response.headers.location;

  if (!redirectUrl) {
    throw new Error("Origin no devolvió redirect");
  }

  if (redirectUrl.startsWith("http://") || redirectUrl.startsWith("https://")) {
    return redirectUrl;
  }

  return `${env.ORIGIN_BASE_URL}${redirectUrl}`;
}

export async function streamController(req: Request, res: Response) {
  const rawChannelId = req.params.channelId;
  const channelId = Array.isArray(rawChannelId)
    ? rawChannelId[0]
    : rawChannelId;

  if (!channelId || channelId.length < 5) {
    return res.status(400).json({
      ok: false,
      message: "Canal inválido",
    });
  }

  trackStreamRequest(channelId);

  return res.redirect(`/hls/${channelId}/index.m3u8`);
}