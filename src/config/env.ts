import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 5001),

  NODE_KEY: process.env.NODE_KEY || "edge-unknown",
  NODE_TYPE: process.env.NODE_TYPE || "edge",
  NODE_NAME: process.env.NODE_NAME || "Edge",

  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || "",
  ORIGIN_BASE_URL: process.env.ORIGIN_BASE_URL || "",

  HLS_ROOT: process.env.HLS_ROOT || "./storage/hls",
  FFMPEG_PATH: process.env.FFMPEG_PATH || "ffmpeg",

  CHANNEL_IDLE_TIMEOUT_MS: Number(
    process.env.CHANNEL_IDLE_TIMEOUT_MS || 0
  ),
};