import express from "express";
import {
  createPayroll,
  getAllPayrolls,
  getPayrollById,
  getPayrollsByEmployee,
  updatePayrollStatus,
} from "../controllers/payrollController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin", "staff"), getAllPayrolls);
router.get("/:id", protect, authorize("admin", "staff"), getPayrollById);
router.get("/employee/:employeeId", protect, authorize("admin", "staff"), getPayrollsByEmployee);
router.post("/", protect, authorize("admin", "staff"), createPayroll);
router.patch("/:id/status", protect, authorize("admin", "staff"), updatePayrollStatus);

export default router;