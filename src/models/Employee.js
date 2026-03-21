import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, "Employee code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    nic: {
      type: String,
      required: [true, "NIC is required"],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: [
        "production",
        "packing",
        "quality-control",
        "inventory",
        "sales",
        "hr",
        "finance",
        "other"
      ],
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    joinedDate: {
      type: Date,
      required: [true, "Joined date is required"],
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    allowance: {
      type: Number,
      default: 0,
      min: [0, "Allowance cannot be negative"],
    },
    epfNumber: {
      type: String,
      default: "",
      trim: true,
    },
    bankName: {
      type: String,
      default: "",
      trim: true,
    },
    bankAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    employmentStatus: {
      type: String,
      enum: ["active", "inactive", "resigned"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;