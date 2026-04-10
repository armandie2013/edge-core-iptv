import { Router } from "express";
import { getMetricsController } from "../controllers/metrics.controller";

const router = Router();

router.get("/metrics", getMetricsController);

export default router;