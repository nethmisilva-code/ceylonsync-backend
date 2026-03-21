import express from "express";
import {
  addToCart,
  getMyCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("customer"));

router.post("/add", addToCart);
router.get("/my-cart", getMyCart);
router.put("/item/:itemId", updateCartItemQuantity);
router.delete("/item/:itemId", removeCartItem);
router.delete("/clear", clearCart);

export default router;