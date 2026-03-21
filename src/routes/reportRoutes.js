import express from "express";
import {
  getDashboardSummary,
  getSalesReport,
  getInventoryReport,
  getLowStockReport,
  getPaymentReport,
  getPayrollReport,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin", "staff"));

router.get("/dashboard-summary", getDashboardSummary);
router.get("/sales", getSalesReport);
router.get("/inventory", getInventoryReport);
router.get("/low-stock", getLowStockReport);
router.get("/payments", getPaymentReport);
router.get("/payrolls", getPayrollReport);

export default router;