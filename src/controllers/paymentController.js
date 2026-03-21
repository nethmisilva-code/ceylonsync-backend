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

const createPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionReference, note } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment method are required",
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
      note: note ?? "",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customer: req.user._id })
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer payments fetched successfully",
      data: payments,
    });
  } catch (error) {
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

    return res.status(200).json({
      success: true,
      message: "All payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, transactionReference } = req.body;

    const payment = await Payment.findById(req.params.id).populate("order");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const allowedStatuses = ["pending", "paid", "failed"];

    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    payment.paymentStatus = paymentStatus;
    payment.transactionReference =
      transactionReference ?? payment.transactionReference;
    payment.updatedBy = req.user._id;

    if (paymentStatus === "paid") {
      payment.paidAt = new Date();
    }

    await payment.save();

    const order = await Order.findById(payment.order._id);

    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedBy = req.user._id;
      await order.save();
    }

    if (paymentStatus === "paid") {
      const existingInvoice = await Invoice.findOne({ payment: payment._id });

      if (!existingInvoice && order) {
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
          invoiceStatus: "issued",
          issuedAt: new Date(),
          createdBy: req.user._id,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
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
};