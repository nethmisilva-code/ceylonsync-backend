import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";

const generatePaymentNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${Date.now()}-${random}`;
};

const generateInvoiceNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${Date.now()}-${random}`;
};

const createInvoiceForOrder = async ({ order, payment, userId, note = "" }) => {
  const existingInvoice = await Invoice.findOne({ order: order._id });

  if (existingInvoice) {
    existingInvoice.payment = payment._id;
    existingInvoice.invoiceStatus = "paid";
    existingInvoice.issuedAt = payment.paidAt || new Date();
    existingInvoice.note = note || existingInvoice.note;
    existingInvoice.updatedBy = userId;
    await existingInvoice.save();
    return existingInvoice;
  }

  if (
    !order.customer ||
    !order.items ||
    order.items.length === 0 ||
    !order.shippingAddress ||
    !order.contactPhone
  ) {
    throw new Error("Cannot generate invoice because order data is incomplete");
  }

  const invoice = await Invoice.create({
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
    note,
    createdBy: userId,
    updatedBy: userId,
  });

  return invoice;
};

const createPayment = async (req, res) => {
  try {
    const {
      orderId,
      paymentMethod,
      transactionReference = "",
      note = "",
    } = req.body;

    const receiptImage = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : "";

    if (!orderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment method are required",
      });
    }

    const allowedMethods = ["cash", "bank-transfer"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Only cash and bank-transfer are allowed",
      });
    }

    if (paymentMethod === "bank-transfer" && !receiptImage) {
      return res.status(400).json({
        success: false,
        message: "Bank transfer receipt is required",
      });
    }

    const order = await Order.findById(orderId).populate("customer");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only create payments for your own orders",
      });
    }

    const existingPayment = await Payment.findOne({ order: order._id });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order",
      });
    }

    const payment = await Payment.create({
      paymentNumber: generatePaymentNumber(),
      order: order._id,
      customer: req.user._id,
      amount: order.totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      transactionReference: transactionReference ?? "",
      receiptImage: paymentMethod === "bank-transfer" ? receiptImage : "",
      note: note ?? "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    order.paymentStatus = "pending";
    order.updatedBy = req.user._id;
    await order.save();

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "bank-transfer"
          ? "Payment submitted successfully. Waiting for admin approval"
          : "Cash payment request created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("createPayment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.query;

    const filter = { customer: req.user._id };

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const payments = await Payment.find(filter)
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer payment history fetched successfully",
      data: payments,
    });
  } catch (error) {
    console.error("getMyPayments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.query;

    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const payments = await Payment.find(filter)
      .populate("customer", "firstName lastName email username")
      .populate(
        "order",
        "orderNumber totalAmount orderStatus paymentStatus shippingAddress contactPhone"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All payment history fetched successfully",
      data: payments,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, transactionReference, note, adminReviewNote } =
      req.body;

    const allowedStatuses = ["pending", "paid", "failed"];

    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await Payment.findById(req.params.id).populate("order");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const order = await Order.findById(payment.order._id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Related order not found",
      });
    }

    if (
      payment.paymentMethod === "bank-transfer" &&
      paymentStatus === "paid" &&
      !payment.receiptImage
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve bank transfer without a receipt",
      });
    }

    payment.paymentStatus = paymentStatus;
    payment.transactionReference =
      transactionReference ?? payment.transactionReference;
    payment.note = note ?? payment.note;
    payment.adminReviewNote = adminReviewNote ?? payment.adminReviewNote;
    payment.updatedBy = req.user._id;
    payment.reviewedAt = new Date();
    payment.paidAt = paymentStatus === "paid" ? new Date() : null;

    await payment.save();

    order.paymentStatus = paymentStatus;
    order.updatedBy = req.user._id;

    if (paymentStatus === "failed") {
      if (!["cancelled", "delivered"].includes(order.orderStatus)) {
        order.orderStatus = "pending";
      }
    }

    if (paymentStatus === "pending") {
      if (!["cancelled", "delivered"].includes(order.orderStatus)) {
        order.orderStatus = "pending";
      }
    }

    if (paymentStatus === "paid") {
      if (payment.paymentMethod === "bank-transfer") {
        if (order.orderStatus === "pending") {
          order.orderStatus = "processing";
        }
      }

      if (payment.paymentMethod === "cash") {
        if (order.orderStatus === "pending") {
          order.orderStatus = "confirmed";
        }
      }
    }

    await order.save();

    if (paymentStatus === "paid" && payment.paymentMethod === "bank-transfer") {
      await createInvoiceForOrder({
        order,
        payment,
        userId: req.user._id,
        note: "Generated after bank transfer approval",
      });
    }

    const updatedPayment = await Payment.findById(payment._id)
      .populate("customer", "firstName lastName email username")
      .populate(
        "order",
        "orderNumber totalAmount orderStatus paymentStatus shippingAddress contactPhone"
      );

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("updatePaymentStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createPayment,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
  createInvoiceForOrder,
};