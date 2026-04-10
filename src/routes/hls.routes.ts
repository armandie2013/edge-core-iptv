import { Router } from "express";
import {
  playlistProxyController,
  segmentProxyController,
} from "../controllers/hls.controller";

const router = Router();

router.get("/hls/:channelId/index.m3u8", playlistProxyController);
router.get("/hls/:channelId/segment", segmentProxyController);

export default router;