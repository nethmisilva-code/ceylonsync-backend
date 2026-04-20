import express from "express";
import {
  createPayroll,
  getAllPayrolls,
  getPayrollById,
  getPayrollsByEmployee,
  updatePayrollStatus,
  getMyPayrolls,
  updatePayroll,
  downloadPayrollPdf,
  downloadMyPayslip,
} from "../controllers/payrollController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/my-payrolls",
  protect,
  authorize("employee", "admin", "staff"),
  getMyPayrolls
);

router.get(
  "/my-payrolls/:id/download",
  protect,
  authorize("employee", "admin", "staff"),
  downloadMyPayslip
);

router.get("/", protect, authorize("admin", "staff"), getAllPayrolls);
router.get(
  "/employee/:employeeId",
  protect,
  authorize("admin", "staff"),
  getPayrollsByEmployee
);
router.get("/:id/download", protect, authorize("admin", "staff"), downloadPayrollPdf);
router.get("/:id", protect, authorize("admin", "staff"), getPayrollById);

router.post("/", protect, authorize("admin", "staff"), createPayroll);
router.put("/:id", protect, authorize("admin", "staff"), updatePayroll);
router.patch("/:id/status", protect, authorize("admin", "staff"), updatePayrollStatus);

export default router;