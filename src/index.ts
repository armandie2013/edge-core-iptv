import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import streamRoutes from "./routes/stream.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "edge",
    nodeKey: env.NODE_KEY,
    nodeName: env.NODE_NAME,
    type: env.NODE_TYPE,
    timestamp: new Date().toISOString(),
  });
});

app.use("/", streamRoutes);

app.listen(env.PORT, () => {
  logger.info("EDGE iniciado", {
    port: env.PORT,
    node: env.NODE_KEY,
    url: env.PUBLIC_BASE_URL,
    origin: env.ORIGIN_BASE_URL,
  });
});