import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    payrollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    payrollMonth: {
      type: String,
      required: true,
      trim: true,
    },
    payrollYear: {
      type: Number,
      required: true,
      min: 2000,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowance: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: "",
      trim: true,
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

payrollSchema.index(
  { employee: 1, payrollMonth: 1, payrollYear: 1 },
  { unique: true }
);

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;