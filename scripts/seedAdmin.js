import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    await User.create({
      firstName: "System",
      lastName: "Admin",
      username: "admin",
      email: "admin@ceylonsync.com",
      phone: "0700000000",
      password: "Admin@123",
      role: "admin",
      isActive: true,
    });

    console.log("Admin seeded successfully");
    process.exit();
  } catch (error) {
    console.error("Seed admin failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();