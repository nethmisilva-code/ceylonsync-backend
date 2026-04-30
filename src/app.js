import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import rawMaterialRoutes from "./routes/rawMaterialRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

/* Security middleware */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* CORS middleware - fixed for Render + Expo + localhost */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8081",
      "http://localhost:19006",
      "https://ceylonsync-backend.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Static uploads */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* Root route */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CeylonSync API",
  });
});

/* Health route */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CeylonSync API is healthy",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

/* API routes */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payrolls", payrollRoutes);
app.use("/api/reports", reportRoutes);

/* Error handlers */
app.use(notFound);
app.use(errorHandler);

export default app;