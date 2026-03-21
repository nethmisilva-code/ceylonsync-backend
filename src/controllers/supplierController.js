import Supplier from "../models/Supplier.js";

const createSupplier = async (req, res) => {
  try {
    const {
      supplierCode,
      companyName,
      contactPerson,
      email,
      phone,
      address,
      suppliedItems,
    } = req.body;

    if (!supplierCode || !companyName || !contactPerson || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingSupplier = await Supplier.findOne({
      supplierCode: supplierCode.toUpperCase(),
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier code already exists",
      });
    }

    const supplier = await Supplier.create({
      supplierCode: supplierCode.toUpperCase(),
      companyName,
      contactPerson,
      email: email.toLowerCase(),
      phone,
      address,
      suppliedItems: suppliedItems ?? [],
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Suppliers fetched successfully",
      data: suppliers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Supplier fetched successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      suppliedItems,
      isActive,
    } = req.body;

    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    supplier.companyName = companyName ?? supplier.companyName;
    supplier.contactPerson = contactPerson ?? supplier.contactPerson;
    supplier.email = email ? email.toLowerCase() : supplier.email;
    supplier.phone = phone ?? supplier.phone;
    supplier.address = address ?? supplier.address;
    supplier.suppliedItems = suppliedItems ?? supplier.suppliedItems;

    if (typeof isActive === "boolean") {
      supplier.isActive = isActive;
    }

    supplier.updatedBy = req.user._id;

    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    supplier.isActive = false;
    supplier.updatedBy = req.user._id;

    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier deactivated successfully",
      data: supplier,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deactivateSupplier,
};