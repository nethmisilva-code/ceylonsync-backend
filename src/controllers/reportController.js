import User from "../models/User.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import RawMaterial from "../models/RawMaterial.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

const getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalStaff = await User.countDocuments({ role: "staff" });
    const totalEmployeesUsers = await User.countDocuments({ role: "employee" });

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });
    const inStockProducts = await Product.countDocuments({ inStock: true });
    const outOfStockProducts = await Product.countDocuments({ inStock: false });

    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
    }).select("name productCode stockQuantity reorderLevel category teaType");

    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });

    const totalRawMaterials = await RawMaterial.countDocuments();
    const lowStockRawMaterials = await RawMaterial.find({
      isActive: true,
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
    }).select("name materialCode stockQuantity reorderLevel category unit");

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });
    const confirmedOrders = await Order.countDocuments({ orderStatus: "confirmed" });
    const processingOrders = await Order.countDocuments({ orderStatus: "processing" });
    const shippedOrders = await Order.countDocuments({ orderStatus: "shipped" });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "delivered" });
    const cancelledOrders = await Order.countDocuments({ orderStatus: "cancelled" });

    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ paymentStatus: "pending" });
    const paidPayments = await Payment.countDocuments({ paymentStatus: "paid" });
    const failedPayments = await Payment.countDocuments({ paymentStatus: "failed" });

    const totalInvoices = await Invoice.countDocuments();

    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ isActive: true });

    const totalPayrolls = await Payroll.countDocuments();
    const paidPayrolls = await Payroll.countDocuments({ paymentStatus: "paid" });
    const pendingPayrolls = await Payroll.countDocuments({ paymentStatus: "pending" });

    const paidPaymentsData = await Payment.find({ paymentStatus: "paid" }).select("amount");
    const totalRevenue = paidPaymentsData.reduce((sum, payment) => sum + payment.amount, 0);

    const paidPayrollsData = await Payroll.find({ paymentStatus: "paid" }).select("netSalary");
    const totalPayrollCost = paidPayrollsData.reduce(
      (sum, payroll) => sum + payroll.netSalary,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: {
        users: {
          totalUsers,
          totalCustomers,
          totalStaff,
          totalEmployeesUsers,
        },
        products: {
          totalProducts,
          activeProducts,
          inactiveProducts,
          inStockProducts,
          outOfStockProducts,
          lowStockCount: lowStockProducts.length,
          lowStockProducts,
        },
        suppliers: {
          totalSuppliers,
          activeSuppliers,
        },
        rawMaterials: {
          totalRawMaterials,
          lowStockCount: lowStockRawMaterials.length,
          lowStockRawMaterials,
        },
        orders: {
          totalOrders,
          pendingOrders,
          confirmedOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
        },
        payments: {
          totalPayments,
          pendingPayments,
          paidPayments,
          failedPayments,
          totalRevenue,
        },
        invoices: {
          totalInvoices,
        },
        employees: {
          totalEmployees,
          activeEmployees,
        },
        payrolls: {
          totalPayrolls,
          paidPayrolls,
          pendingPayrolls,
          totalPayrollCost,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.query;

    const filter = {};

    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(filter)
      .populate("customer", "firstName lastName email username")
      .populate("items.product", "name productCode")
      .sort({ createdAt: -1 });

    const totalSalesAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return res.status(200).json({
      success: true,
      message: "Sales report fetched successfully",
      data: {
        totalOrders: orders.length,
        totalSalesAmount,
        orders,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const rawMaterials = await RawMaterial.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Inventory report fetched successfully",
      data: {
        products,
        rawMaterials,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLowStockReport = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
    }).sort({ stockQuantity: 1 });

    const lowStockRawMaterials = await RawMaterial.find({
      isActive: true,
      $expr: { $lte: ["$stockQuantity", "$reorderLevel"] },
    }).sort({ stockQuantity: 1 });

    return res.status(200).json({
      success: true,
      message: "Low stock report fetched successfully",
      data: {
        lowStockProducts,
        lowStockRawMaterials,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPaymentReport = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.query;

    const filter = {};

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    const payments = await Payment.find(filter)
      .populate("customer", "firstName lastName email username")
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .sort({ createdAt: -1 });

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return res.status(200).json({
      success: true,
      message: "Payment report fetched successfully",
      data: {
        totalPayments: payments.length,
        totalAmount,
        payments,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPayrollReport = async (req, res) => {
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

    const totalGrossSalary = payrolls.reduce(
      (sum, payroll) => sum + payroll.grossSalary,
      0
    );

    const totalNetSalary = payrolls.reduce(
      (sum, payroll) => sum + payroll.netSalary,
      0
    );

    return res.status(200).json({
      success: true,
      message: "Payroll report fetched successfully",
      data: {
        totalPayrolls: payrolls.length,
        totalGrossSalary,
        totalNetSalary,
        payrolls,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getDashboardSummary,
  getSalesReport,
  getInventoryReport,
  getLowStockReport,
  getPaymentReport,
  getPayrollReport,
};