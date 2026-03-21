import InventoryTransaction from "../models/InventoryTransaction.js";
import RawMaterial from "../models/RawMaterial.js";
import Supplier from "../models/Supplier.js";

const stockInRawMaterial = async (req, res) => {
  try {
    const { rawMaterialId, supplierId, quantity, unitCost, note } = req.body;

    if (!rawMaterialId || !supplierId || !quantity || unitCost === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (quantity <= 0 || unitCost < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0 and unit cost cannot be negative",
      });
    }

    const material = await RawMaterial.findById(rawMaterialId);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const totalCost = quantity * unitCost;

    const transaction = await InventoryTransaction.create({
      transactionType: "stock-in",
      rawMaterial: material._id,
      supplier: supplier._id,
      quantity,
      unitCost,
      totalCost,
      note,
      recordedBy: req.user._id,
    });

    material.stockQuantity += quantity;
    material.inStock = material.stockQuantity > 0;
    material.updatedBy = req.user._id;
    await material.save();

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate("rawMaterial", "name materialCode category")
      .populate("supplier", "companyName supplierCode contactPerson")
      .populate("recordedBy", "firstName lastName email role");

    return res.status(201).json({
      success: true,
      message: "Stock-in recorded successfully",
      data: populatedTransaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventoryTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate("rawMaterial", "name materialCode category")
      .populate("supplier", "companyName supplierCode contactPerson")
      .populate("recordedBy", "firstName lastName email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Inventory transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { stockInRawMaterial, getInventoryTransactions };