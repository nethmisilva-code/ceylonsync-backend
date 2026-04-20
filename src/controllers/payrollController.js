import PDFDocument from "pdfkit";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

const generatePayrollNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PRL-${Date.now()}-${random}`;
};

const calculatePayrollValues = ({
  basicSalary = 0,
  allowance = 0,
  overtimeAmount = 0,
  bonusAmount = 0,
  deductionAmount = 0,
}) => {
  const grossSalary =
    Number(basicSalary) +
    Number(allowance) +
    Number(overtimeAmount) +
    Number(bonusAmount);

  const netSalary = grossSalary - Number(deductionAmount);

  return {
    grossSalary,
    netSalary,
  };
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

    const basicSalary = Number(employee.basicSalary || 0);
    const allowance = Number(employee.allowance || 0);
    const overtime = Number(overtimeAmount ?? 0);
    const bonus = Number(bonusAmount ?? 0);
    const deduction = Number(deductionAmount ?? 0);

    const { grossSalary, netSalary } = calculatePayrollValues({
      basicSalary,
      allowance,
      overtimeAmount: overtime,
      bonusAmount: bonus,
      deductionAmount: deduction,
    });

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
      "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber"
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
      .populate(
        "employee",
        "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber isActive employmentStatus joinedDate"
      )
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
      "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber isActive employmentStatus joinedDate"
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
      .populate(
        "employee",
        "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber isActive employmentStatus joinedDate"
      )
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

const getMyPayrolls = async (req, res) => {
  try {
    const employee = await Employee.findOne({ linkedUser: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found for this user",
      });
    }

    const payrolls = await Payroll.find({ employee: employee._id })
      .populate(
        "employee",
        "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber isActive employmentStatus joinedDate"
      )
      .sort({ payrollYear: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "My payrolls fetched successfully",
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber"
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    const {
      basicSalary,
      allowance,
      overtimeAmount,
      bonusAmount,
      deductionAmount,
      paymentStatus,
      note,
    } = req.body;

    const nextBasicSalary =
      basicSalary !== undefined ? Number(basicSalary) : Number(payroll.basicSalary);

    const nextAllowance =
      allowance !== undefined ? Number(allowance) : Number(payroll.allowance);

    const nextOvertime =
      overtimeAmount !== undefined
        ? Number(overtimeAmount)
        : Number(payroll.overtimeAmount);

    const nextBonus =
      bonusAmount !== undefined ? Number(bonusAmount) : Number(payroll.bonusAmount);

    const nextDeduction =
      deductionAmount !== undefined
        ? Number(deductionAmount)
        : Number(payroll.deductionAmount);

    const { grossSalary, netSalary } = calculatePayrollValues({
      basicSalary: nextBasicSalary,
      allowance: nextAllowance,
      overtimeAmount: nextOvertime,
      bonusAmount: nextBonus,
      deductionAmount: nextDeduction,
    });

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Net salary cannot be negative",
      });
    }

    payroll.basicSalary = nextBasicSalary;
    payroll.allowance = nextAllowance;
    payroll.overtimeAmount = nextOvertime;
    payroll.bonusAmount = nextBonus;
    payroll.deductionAmount = nextDeduction;
    payroll.grossSalary = grossSalary;
    payroll.netSalary = netSalary;

    if (note !== undefined) {
      payroll.note = note;
    }

    if (paymentStatus !== undefined) {
      if (!["pending", "paid"].includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      payroll.paymentStatus = paymentStatus;
      payroll.paidAt = paymentStatus === "paid" ? new Date() : null;
    }

    payroll.updatedBy = req.user._id;

    await payroll.save();

    const updatedPayroll = await Payroll.findById(payroll._id).populate(
      "employee",
      "employeeCode firstName lastName email department designation linkedUser phone bankName bankAccountNumber epfNumber isActive employmentStatus joinedDate"
    );

    return res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: updatedPayroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const downloadPayrollPdf = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "employeeCode firstName lastName email department designation phone bankName bankAccountNumber epfNumber"
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    const employeeName = `${payroll.employee.firstName} ${payroll.employee.lastName}`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="paysheet-${payroll.employee.employeeCode}-${payroll.payrollMonth}-${payroll.payrollYear}.pdf"`
    );

    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(res);

    doc.fontSize(20).text("Tea Factory Management System", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(16).text("Employee Paysheet", { align: "center" });
    doc.moveDown(1.2);

    doc.fontSize(12).text(`Payroll Number: ${payroll.payrollNumber}`);
    doc.text(`Payroll Month: ${payroll.payrollMonth}`);
    doc.text(`Payroll Year: ${payroll.payrollYear}`);
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Employee Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Employee Code: ${payroll.employee.employeeCode}`);
    doc.text(`Employee Name: ${employeeName}`);
    doc.text(`Email: ${payroll.employee.email || "-"}`);
    doc.text(`Phone: ${payroll.employee.phone || "-"}`);
    doc.text(`Department: ${payroll.employee.department || "-"}`);
    doc.text(`Designation: ${payroll.employee.designation || "-"}`);
    doc.text(`EPF Number: ${payroll.employee.epfNumber || "-"}`);
    doc.text(`Bank Name: ${payroll.employee.bankName || "-"}`);
    doc.text(`Bank Account Number: ${payroll.employee.bankAccountNumber || "-"}`);
    doc.moveDown();

    doc.fontSize(14).text("Salary Breakdown", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Basic Salary: Rs. ${Number(payroll.basicSalary).toLocaleString()}`);
    doc.text(`Allowance: Rs. ${Number(payroll.allowance).toLocaleString()}`);
    doc.text(`Overtime Amount: Rs. ${Number(payroll.overtimeAmount).toLocaleString()}`);
    doc.text(`Bonus Amount: Rs. ${Number(payroll.bonusAmount).toLocaleString()}`);
    doc.text(`Deduction Amount: Rs. ${Number(payroll.deductionAmount).toLocaleString()}`);
    doc.moveDown(0.6);
    doc.text(`Gross Salary: Rs. ${Number(payroll.grossSalary).toLocaleString()}`);
    doc.text(`Net Salary: Rs. ${Number(payroll.netSalary).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Payment Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Payment Status: ${payroll.paymentStatus}`);
    doc.text(
      `Paid At: ${
        payroll.paidAt ? new Date(payroll.paidAt).toLocaleString() : "Not paid yet"
      }`
    );
    doc.text(`Note: ${payroll.note || "-"}`);

    doc.moveDown(2);
    doc.text("Authorized Signature: __________________________");
    doc.moveDown(1.5);
    doc.text("This is a system generated paysheet.", { align: "center" });

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

const downloadMyPayslip = async (req, res) => {
  try {
    const employee = await Employee.findOne({ linkedUser: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found for this user",
      });
    }

    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "employeeCode firstName lastName email department designation phone bankName bankAccountNumber epfNumber"
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    if (payroll.employee._id.toString() !== employee._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this payslip",
      });
    }

    req.params.id = payroll._id.toString();
    return downloadPayrollPdf(req, res);
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
    payroll.paidAt = paymentStatus === "paid" ? new Date() : null;

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
  getMyPayrolls,
  updatePayroll,
  downloadPayrollPdf,
  downloadMyPayslip,
  updatePayrollStatus,
};