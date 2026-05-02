import RawMaterial from "../models/RawMaterial.js";

const createRawMaterial = async (req, res) => {
  try {
    const {
      materialCode,
      name,
      category,
      description,
      stockQuantity,
      reorderLevel,
      unit,
    } = req.body;

    if (!materialCode || !name || !category) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingMaterial = await RawMaterial.findOne({
      materialCode: materialCode.toUpperCase(),
    });

    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: "Material code already exists",
      });
    }

    const material = await RawMaterial.create({
      materialCode: materialCode.toUpperCase(),
      name,
      category,
      description,
      stockQuantity: stockQuantity ?? 0,
      reorderLevel: reorderLevel ?? 10,
      unit,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Raw material created successfully",
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllRawMaterials = async (req, res) => {
  try {
    const { search, category, inStock, isActive } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { materialCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (inStock !== undefined) {
      filter.inStock = inStock === true;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === true;
    }

    const materials = await RawMaterial.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Raw materials fetched successfully",
      data: materials,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRawMaterialById = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Raw material fetched successfully",
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRawMaterial = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      stockQuantity,
      reorderLevel,
      unit,
      isActive,
    } = req.body;

    const material = await RawMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    if (stockQuantity !== undefined && stockQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    material.name = name ?? material.name;
    material.category = category ?? material.category;
    material.description = description ?? material.description;
    material.stockQuantity = stockQuantity ?? material.stockQuantity;
    material.reorderLevel = reorderLevel ?? material.reorderLevel;
    material.unit = unit ?? material.unit;

    if (typeof isActive === "boolean") {
      material.isActive = isActive;
    }

    material.updatedBy = req.user._id;
    material.inStock = material.stockQuantity > 0;

    await material.save();

    return res.status(200).json({
      success: true,
      message: "Raw material updated successfully",
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivateRawMaterial = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found",
      });
    }

    material.isActive = false;
    material.updatedBy = req.user._id;

    await material.save();

    return res.status(200).json({
      success: true,
      message: "Raw material deactivated successfully",
      data: material,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createRawMaterial,
  getAllRawMaterials,
  getRawMaterialById,
  updateRawMaterial,
  deactivateRawMaterial,
};