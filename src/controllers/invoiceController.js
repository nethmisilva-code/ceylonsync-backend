import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";

const generateInvoiceNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${Date.now()}-${random}`;
};

const getMyInvoices = async (req, res) => {
  try {
    const { invoiceStatus } = req.query;

    const filter = { customer: req.user._id };

    if (invoiceStatus) {
      filter.invoiceStatus = invoiceStatus;
    }

    const invoices = await Invoice.find(filter)
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("payment", "paymentNumber paymentMethod paymentStatus paidAt")
      .populate("items.product", "name productCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("getMyInvoices error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const { invoiceStatus } = req.query;

    const filter = {};

    if (invoiceStatus) {
      filter.invoiceStatus = invoiceStatus;
    }

    const invoices = await Invoice.find(filter)
      .populate("customer", "firstName lastName email username")
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("payment", "paymentNumber paymentMethod paymentStatus paidAt")
      .populate("items.product", "name productCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("getAllInvoices error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer", "firstName lastName email username")
      .populate(
        "order",
        "orderNumber totalAmount orderStatus paymentStatus shippingAddress contactPhone"
      )
      .populate(
        "payment",
        "paymentNumber paymentMethod paymentStatus paidAt transactionReference"
      )
      .populate("items.product", "name productCode");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const isOwner = invoice.customer._id.toString() === req.user._id.toString();
    const isAdminOrStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("getInvoiceById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { invoiceStatus, note } = req.body;

    const allowedStatuses = ["issued", "paid", "void", "archived"];

    if (!invoiceStatus || !allowedStatuses.includes(invoiceStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice status",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    invoice.invoiceStatus = invoiceStatus;
    invoice.note = note ?? invoice.note;
    invoice.updatedBy = req.user._id;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("updateInvoiceStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("payment")
      .populate("order");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const payment = invoice.payment;
    const order = invoice.order;

    if (payment && payment.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Paid invoices cannot be removed",
      });
    }

    if (order && order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Invoices linked to paid orders cannot be removed",
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Invoice removed successfully",
    });
  } catch (error) {
    console.error("deleteInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const generateMissingInvoicesForPaidOrders = async (req, res) => {
  try {
    const paidOrders = await Order.find({ paymentStatus: "paid" });

    let createdCount = 0;

    for (const order of paidOrders) {
      const existingInvoice = await Invoice.findOne({ order: order._id });

      if (existingInvoice) {
        continue;
      }

      const payment = await Payment.findOne({
        order: order._id,
        paymentStatus: "paid",
      });

      if (!payment) {
        continue;
      }

      if (
        !order.customer ||
        !order.items ||
        order.items.length === 0 ||
        !order.shippingAddress ||
        !order.contactPhone
      ) {
        continue;
      }

      await Invoice.create({
        invoiceNumber: generateInvoiceNumber(),
        order: order._id,
        payment: payment._id,
        customer: order.customer,
        items: order.items.map((item) => ({
          product: item.product,
          name: item.name,
          productCode: item.productCode,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        totalAmount: order.totalAmount,
        billingAddress: order.shippingAddress,
        contactPhone: order.contactPhone,
        invoiceStatus: "paid",
        issuedAt: payment.paidAt || new Date(),
        createdBy: req.user._id,
        updatedBy: req.user._id,
      });

      createdCount += 1;
    }

    return res.status(200).json({
      success: true,
      message: `${createdCount} missing invoice(s) generated successfully`,
      data: { createdCount },
    });
  } catch (error) {
    console.error("generateMissingInvoicesForPaidOrders error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  getMyInvoices,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  generateMissingInvoicesForPaidOrders,
};