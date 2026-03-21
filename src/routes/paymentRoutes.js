import express from "express";
import {
  createPayment,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
} from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("customer"), createPayment);
router.get("/my-payments", protect, authorize("customer"), getMyPayments);

router.get("/", protect, authorize("admin", "staff"), getAllPayments);
router.patch("/:id/status", protect, authorize("admin", "staff"), updatePaymentStatus);

export default router;