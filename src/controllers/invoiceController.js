import Invoice from "../models/Invoice.js";

const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.user._id })
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("payment", "paymentNumber paymentMethod paymentStatus paidAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customer invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("customer", "firstName lastName email username")
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("payment", "paymentNumber paymentMethod paymentStatus paidAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
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
      .populate("order", "orderNumber totalAmount orderStatus paymentStatus")
      .populate("payment", "paymentNumber paymentMethod paymentStatus paidAt")
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { getMyInvoices, getAllInvoices, getInvoiceById };