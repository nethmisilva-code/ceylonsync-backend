import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import apiResponse from "../utils/apiResponse.js";
import { getPagination } from "../utils/queryFeatures.js";

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    productCode,
    category,
    teaType,
    description,
    price,
    stockQuantity,
    reorderLevel,
    unit,
    image,
  } = req.body;

  if (!name || !productCode || !category || !teaType || price === undefined) {
    return apiResponse(res, 400, false, "Please fill all required fields");
  }

  if (price < 0) {
    return apiResponse(res, 400, false, "Price cannot be negative");
  }

  if (stockQuantity !== undefined && stockQuantity < 0) {
    return apiResponse(res, 400, false, "Stock cannot be negative");
  }

  const existingProduct = await Product.findOne({
    productCode: productCode.toUpperCase(),
  });

  if (existingProduct) {
    return apiResponse(res, 400, false, "Product code already exists");
  }

  const product = await Product.create({
    name,
    productCode: productCode.toUpperCase(),
    category,
    teaType,
    description,
    price,
    stockQuantity: stockQuantity ?? 0,
    reorderLevel: reorderLevel ?? 10,
    unit,
    image,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return apiResponse(res, 201, true, "Product created successfully", product);
});

const getAllProducts = asyncHandler(async (req, res) => {
  const { search, category, teaType, isActive, inStock } = req.query;
  const { page, limit, skip } = getPagination(req);

  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { productCode: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (teaType) {
    filter.teaType = teaType;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (inStock !== undefined) {
    filter.inStock = inStock === "true";
  }

  const total = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return apiResponse(res, 404, false, "Product not found");
  }

  return apiResponse(res, 200, true, "Product fetched successfully", product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    productCode,
    category,
    teaType,
    description,
    price,
    stockQuantity,
    reorderLevel,
    unit,
    image,
    isActive,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return apiResponse(res, 404, false, "Product not found");
  }

  if (productCode && productCode.toUpperCase() !== product.productCode) {
    const codeExists = await Product.findOne({
      productCode: productCode.toUpperCase(),
      _id: { $ne: product._id },
    });

    if (codeExists) {
      return apiResponse(res, 400, false, "Product code already exists");
    }
  }

  if (price !== undefined && price < 0) {
    return apiResponse(res, 400, false, "Price cannot be negative");
  }

  if (stockQuantity !== undefined && stockQuantity < 0) {
    return apiResponse(res, 400, false, "Stock cannot be negative");
  }

  product.name = name ?? product.name;
  product.productCode = productCode ? productCode.toUpperCase() : product.productCode;
  product.category = category ?? product.category;
  product.teaType = teaType ?? product.teaType;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.stockQuantity = stockQuantity ?? product.stockQuantity;
  product.reorderLevel = reorderLevel ?? product.reorderLevel;
  product.unit = unit ?? product.unit;
  product.image = image ?? product.image;

  if (typeof isActive === "boolean") {
    product.isActive = isActive;
  }

  product.updatedBy = req.user._id;
  product.inStock = product.stockQuantity > 0;

  await product.save();

  return apiResponse(res, 200, true, "Product updated successfully", product);
});

const deactivateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return apiResponse(res, 404, false, "Product not found");
  }

  product.isActive = false;
  product.updatedBy = req.user._id;

  await product.save();

  return apiResponse(res, 200, true, "Product deactivated successfully", product);
});

const restockProduct = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  if (quantity === undefined || quantity <= 0) {
    return apiResponse(res, 400, false, "Restock quantity must be greater than 0");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return apiResponse(res, 404, false, "Product not found");
  }

  product.stockQuantity += quantity;
  product.inStock = product.stockQuantity > 0;
  product.updatedBy = req.user._id;

  await product.save();

  return apiResponse(res, 200, true, "Product restocked successfully", product);
});

export {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deactivateProduct,
  restockProduct,
};