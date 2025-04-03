import express from "express";
import { 
  getCafeInfo, 
  createCafeInfo, 
  updateCafeInfo 
} from "../controllers/info.controller.js";

const router = express.Router();

// Get cafe info
router.get("/", getCafeInfo);

// Create cafe info
router.post("/", createCafeInfo);

// Update cafe info
router.put("/", updateCafeInfo);

export default router;