import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deactivateProduct,
  restockProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { createProductValidator } from "../validators/productValidators.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  authorize("admin", "staff"),
  createProductValidator,
  validate,
  createProduct
);

router.put("/:id", protect, authorize("admin", "staff"), updateProduct);
router.patch("/:id/deactivate", protect, authorize("admin", "staff"), deactivateProduct);
router.patch("/:id/restock", protect, authorize("admin", "staff"), restockProduct);

export default router;