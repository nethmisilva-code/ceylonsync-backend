import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

const generatePayrollNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PRL-${Date.now()}-${random}`;
};

const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      payrollMonth,
      payrollYear,
      overtimeAmount,
      bonusAmount,
      deductionAmount,
      note,
    } = req.body;

    if (!employeeId || !payrollMonth || !payrollYear) {
      return res.status(400).json({
        success: false,
        message: "Employee, payroll month and payroll year are required",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      payrollMonth,
      payrollYear,
    });

    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: "Payroll already exists for this employee and month",
      });
    }

    const basicSalary = employee.basicSalary;
    const allowance = employee.allowance || 0;
    const overtime = overtimeAmount ?? 0;
    const bonus = bonusAmount ?? 0;
    const deduction = deductionAmount ?? 0;

    const grossSalary = basicSalary + allowance + overtime + bonus;
    const netSalary = grossSalary - deduction;

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Net salary cannot be negative",
      });
    }

    const payroll = await Payroll.create({
      payrollNumber: generatePayrollNumber(),
      employee: employee._id,
      payrollMonth,
      payrollYear,
      basicSalary,
      allowance,
      overtimeAmount: overtime,
      bonusAmount: bonus,
      deductionAmount: deduction,
      grossSalary,
      netSalary,
      paymentStatus: "pending",
      note: note ?? "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const populatedPayroll = await Payroll.findById(payroll._id).populate(
      "employee",
      "employeeCode firstName lastName email department designation"
    );

    return res.status(201).json({
      success: true,
      message: "Payroll created successfully",
      data: populatedPayroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPayrolls = async (req, res) => {
  try {
    const { payrollMonth, payrollYear, paymentStatus } = req.query;

    const filter = {};

    if (payrollMonth) {
      filter.payrollMonth = payrollMonth;
    }

    if (payrollYear) {
      filter.payrollYear = Number(payrollYear);
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const payrolls = await Payroll.find(filter)
      .populate("employee", "employeeCode firstName lastName email department designation")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Payrolls fetched successfully",
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "employeeCode firstName lastName email department designation"
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payroll fetched successfully",
      data: payroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPayrollsByEmployee = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employee: req.params.employeeId })
      .populate("employee", "employeeCode firstName lastName email department designation")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Employee payrolls fetched successfully",
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePayrollStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (!paymentStatus || !["pending", "paid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    payroll.paymentStatus = paymentStatus;
    payroll.updatedBy = req.user._id;

    if (paymentStatus === "paid") {
      payroll.paidAt = new Date();
    }

    await payroll.save();

    return res.status(200).json({
      success: true,
      message: "Payroll status updated successfully",
      data: payroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createPayroll,
  getAllPayrolls,
  getPayrollById,
  getPayrollsByEmployee,
  updatePayrollStatus,
};