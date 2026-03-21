import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
} from "../controllers/employeeController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("admin", "staff"), getAllEmployees);
router.get("/:id", protect, authorize("admin", "staff"), getEmployeeById);
router.post("/", protect, authorize("admin", "staff"), createEmployee);
router.put("/:id", protect, authorize("admin", "staff"), updateEmployee);
router.patch("/:id/deactivate", protect, authorize("admin", "staff"), deactivateEmployee);

export default router;