import { Router } from "express";

import {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  convertToWorkItem,
} from "../controllers/requestController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getRequests);

router.get("/:id", authMiddleware, getRequestById);

router.post("/", authMiddleware, createRequest);

router.put("/:id", authMiddleware, updateRequest);

router.post("/:id/convert", authMiddleware, convertToWorkItem);

export default router;
