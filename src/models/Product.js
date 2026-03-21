import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["black-tea", "green-tea", "herbal-tea", "white-tea", "gift-pack", "other"],
    },
    teaType: {
      type: String,
      required: [true, "Tea type is required"],
      enum: ["BOP", "BOPF", "Dust", "OP", "FBOP", "Green", "Silver Tips", "Mixed", "Other"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, "Reorder level cannot be negative"],
    },
    unit: {
      type: String,
      enum: ["kg", "g", "packet", "box", "item"],
      default: "kg",
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function () {
  this.inStock = this.stockQuantity > 0;
});

const Product = mongoose.model("Product", productSchema);

export default Product;