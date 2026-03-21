import { body } from "express-validator";

const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("productCode").trim().notEmpty().withMessage("Product code is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("teaType").trim().notEmpty().withMessage("Tea type is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("stockQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Stock quantity must be a non-negative number"),
];

export { createProductValidator };