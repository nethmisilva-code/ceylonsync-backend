import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import apiResponse from "../utils/apiResponse.js";

const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, phone, password, role } =
      req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return apiResponse(res, 400, false, "Please fill all required fields");
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return apiResponse(res, 400, false, "Email or username already exists");
    }

    const allowedSelfRegisterRoles = ["customer", "employee", "supplier"];
    const safeRole = allowedSelfRegisterRoles.includes(role) ? role : "customer";

    const user = await User.create({
      firstName,
      lastName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone,
      password,
      role: safeRole,
    });

    const token = generateToken({ id: user._id, role: user.role });

    return apiResponse(res, 201, true, "Account registered successfully", {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return apiResponse(res, 400, false, "Login and password are required");
    }

    const user = await User.findOne({
      $or: [{ email: login.toLowerCase() }, { username: login.toLowerCase() }],
    }).select("+password");

    if (!user) {
      return apiResponse(res, 401, false, "Invalid credentials");
    }

    if (!user.isActive) {
      return apiResponse(res, 403, false, "Account is inactive");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return apiResponse(res, 401, false, "Invalid credentials");
    }

    const token = generateToken({ id: user._id, role: user.role });

    return apiResponse(res, 200, true, "Login successful", {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return apiResponse(res, 500, false, error.message);
  }
};

const getMe = async (req, res, next) => {
  return apiResponse(res, 200, true, "Current user fetched successfully", req.user);
};

export { registerUser, loginUser, getMe };