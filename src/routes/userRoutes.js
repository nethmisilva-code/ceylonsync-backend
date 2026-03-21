import express from "express";
import {
  getAllUsers,
  createUserByAdmin,
  updateMyProfile,
  updateUserByAdmin,
  deactivateUser,
  resetUserPasswordByAdmin,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile", protect, updateMyProfile);

router.get("/", protect, authorize("admin"), getAllUsers);
router.post("/", protect, authorize("admin"), createUserByAdmin);
router.put("/:id", protect, authorize("admin"), updateUserByAdmin);
router.patch("/:id/deactivate", protect, authorize("admin"), deactivateUser);
router.patch("/:id/reset-password", protect, authorize("admin"), resetUserPasswordByAdmin);

export default router;