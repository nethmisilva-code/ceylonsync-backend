import express from "express";
import {
  stockInRawMaterial,
  getInventoryTransactions,
} from "../controllers/inventoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/transactions", protect, authorize("admin", "staff"), getInventoryTransactions);
router.post("/stock-in", protect, authorize("admin", "staff"), stockInRawMaterial);

export default router;