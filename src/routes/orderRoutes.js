import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/place", protect, authorize("customer", "employee"), placeOrder);
router.get("/my-orders", protect, authorize("customer", "employee"), getMyOrders);
router.get("/:id", protect, getOrderById);

router.get("/", protect, authorize("admin", "staff"), getAllOrders);
router.patch("/:id/status", protect, authorize("admin", "staff"), updateOrderStatus);

export default router;