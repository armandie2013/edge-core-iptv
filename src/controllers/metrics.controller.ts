import { Request, Response } from "express";
import { getMetricsSnapshot } from "../services/metrics.service";

export function getMetricsController(_req: Request, res: Response) {
  return res.json({
    ok: true,
    metrics: getMetricsSnapshot(),
  });
}