import express from "express";
import {
  createRawMaterial,
  getAllRawMaterials,
  getRawMaterialById,
  updateRawMaterial,
  deactivateRawMaterial,
} from "../controllers/rawMaterialController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllRawMaterials);
router.get("/:id", getRawMaterialById);

router.post("/", protect, authorize("admin", "staff"), createRawMaterial);
router.put("/:id", protect, authorize("admin", "staff"), updateRawMaterial);
router.patch("/:id/deactivate", protect, authorize("admin", "staff"), deactivateRawMaterial);

export default router;