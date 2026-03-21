import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const calculateCartTotals = (items) => {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    let cart = await Cart.findOne({
      customer: req.user._id,
      status: "active",
    });

    if (!cart) {
      cart = await Cart.create({
        customer: req.user._id,
        items: [],
        totalAmount: 0,
        status: "active",
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product._id.toString()
    );

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (product.stockQuantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].subtotal =
        cart.items[existingItemIndex].price * newQuantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        productCode: product.productCode,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
      });
    }

    cart.totalAmount = calculateCartTotals(cart.items);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name productCode price stockQuantity inStock isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: populatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      customer: req.user._id,
      status: "active",
    }).populate("items.product", "name productCode price stockQuantity inStock isActive");

    if (!cart) {
      cart = await Cart.create({
        customer: req.user._id,
        items: [],
        totalAmount: 0,
        status: "active",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCartItemQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({
      customer: req.user._id,
      status: "active",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const product = await Product.findById(item.product);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    cart.totalAmount = calculateCartTotals(cart.items);

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product",
      "name productCode price stockQuantity inStock isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: populatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({
      customer: req.user._id,
      status: "active",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    item.deleteOne();
    cart.totalAmount = calculateCartTotals(cart.items);

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      customer: req.user._id,
      status: "active",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Active cart not found",
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  addToCart,
  getMyCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};