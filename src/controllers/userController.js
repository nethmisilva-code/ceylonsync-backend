import bcrypt from "bcryptjs";
import User from "../models/User.js";
import apiResponse from "../utils/apiResponse.js";

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return apiResponse(res, 200, true, "Users fetched successfully", users);
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { firstName, lastName, username, email, phone, password, role } =
      req.body;

    if (!firstName || !lastName || !username || !email || !password || !role) {
      return apiResponse(res, 400, false, "Please fill all required fields");
    }

    const allowedAdminRoles = ["staff", "customer", "employee", "supplier"];
    if (!allowedAdminRoles.includes(role)) {
      return apiResponse(res, 400, false, "Invalid role selected");
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return apiResponse(res, 400, false, "Email or username already exists");
    }

    const user = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone,
      password,
      role,
      createdBy: req.user._id,
    });

    return apiResponse(res, 201, true, "User created successfully", {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return apiResponse(res, 404, false, "User not found");
    }

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phone = phone ?? user.phone;
    user.address = address ?? user.address;
    user.profileImage = profileImage ?? user.profileImage;

    await user.save();

    return apiResponse(res, 200, true, "Profile updated successfully", {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      profileImage: user.profileImage,
      isActive: user.isActive,
    });
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role, isActive, address } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return apiResponse(res, 404, false, "User not found");
    }

    if (role) {
      const allowedRoles = ["admin", "staff", "customer", "employee", "supplier"];
      if (!allowedRoles.includes(role)) {
        return apiResponse(res, 400, false, "Invalid role");
      }
      user.role = role;
    }

    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.phone = phone ?? user.phone;
    user.address = address ?? user.address;

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();

    return apiResponse(res, 200, true, "User updated successfully", {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isActive: user.isActive,
    });
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return apiResponse(res, 404, false, "User not found");
    }

    user.isActive = false;
    await user.save();

    return apiResponse(res, 200, true, "User deactivated successfully");
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const resetUserPasswordByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return apiResponse(
        res,
        400,
        false,
        "New password must be at least 6 characters"
      );
    }

    const user = await User.findById(id).select("+password");

    if (!user) {
      return apiResponse(res, 404, false, "User not found");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return apiResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

export {
  getAllUsers,
  createUserByAdmin,
  updateMyProfile,
  updateUserByAdmin,
  deactivateUser,
  resetUserPasswordByAdmin,
};