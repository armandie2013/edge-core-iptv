import { Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env";

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
  try {
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

    const finalStreamUrl = await resolveOriginStreamUrl(channelId);

    return res.redirect(finalStreamUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno en edge";

    return res.status(500).json({
      ok: false,
      message,
    });
  }
}