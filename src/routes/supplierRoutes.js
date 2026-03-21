import express from "express";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deactivateSupplier,
} from "../controllers/supplierController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);

router.post("/", protect, authorize("admin", "staff"), createSupplier);
router.put("/:id", protect, authorize("admin", "staff"), updateSupplier);
router.patch("/:id/deactivate", protect, authorize("admin", "staff"), deactivateSupplier);

export default router;