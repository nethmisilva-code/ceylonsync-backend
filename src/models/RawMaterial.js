import mongoose from "mongoose";

const rawMaterialSchema = new mongoose.Schema(
  {
    materialCode: {
      type: String,
      required: [true, "Material code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["tea-leaf", "packaging", "label", "box", "other"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
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

rawMaterialSchema.pre("save", function () {
  this.inStock = this.stockQuantity > 0;
});

const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);

export default RawMaterial;