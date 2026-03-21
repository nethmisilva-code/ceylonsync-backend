import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const generateOrderNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${Date.now()}-${random}`;
};

const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, contactPhone, note } = req.body;

    if (!shippingAddress || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and contact phone are required",
      });
    }

    const cart = await Cart.findOne({
      customer: req.user._id,
      status: "active",
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product unavailable: ${item.name}`,
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${item.name}`,
        });
      }
    }

    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      product.stockQuantity -= item.quantity;
      product.inStock = product.stockQuantity > 0;
      await product.save();

      orderItems.push({
        product: product._id,
        name: item.name,
        productCode: item.productCode,
        unitPrice: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customer: req.user._id,
      items: orderItems,
      totalAmount: cart.totalAmount,
      shippingAddress,
      contactPhone,
      note: note ?? "",
      orderStatus: "pending",
      paymentStatus: "pending",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    cart.items = [];
    cart.totalAmount = 0;
    cart.status = "converted";
    await cart.save();

    await Cart.create({
      customer: req.user._id,
      items: [],
      totalAmount: 0,
      status: "active",
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "firstName lastName email username")
      .populate("items.product", "name productCode");

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: populatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("items.product", "name productCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "firstName lastName email username")
      .populate("items.product", "name productCode");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isOwner = order.customer._id.toString() === req.user._id.toString();
    const isAdminOrStaff = ["admin", "staff"].includes(req.user.role);

    if (!isOwner && !isAdminOrStaff) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
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

    return res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (orderStatus) {
      const allowedOrderStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

      if (!allowedOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      const allowedPaymentStatuses = ["pending", "paid", "failed"];

      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      order.paymentStatus = paymentStatus;
    }

    order.updatedBy = req.user._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};