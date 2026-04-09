import { Router } from "express";
import { streamController } from "../controllers/stream.controller";

const router = Router();

router.get("/stream/:channelId", streamController);

export default router;