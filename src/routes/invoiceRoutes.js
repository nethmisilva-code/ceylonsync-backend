import express from "express";
import {
  getMyInvoices,
  getAllInvoices,
  getInvoiceById,
} from "../controllers/invoiceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-invoices", protect, authorize("customer"), getMyInvoices);
router.get("/", protect, authorize("admin", "staff"), getAllInvoices);
router.get("/:id", protect, getInvoiceById);

export default router;