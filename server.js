import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "dotenv/config";
// Files
import { stripeWebhooks } from "./controllers/orderController.js";
import connectCloudinary from "./configs/cloudinary.js";
import connectDB from "./configs/db.js";
// Router
import addressRouter from "./routes/addressRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import productRouter from "./routes/productRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import userRouter from "./routes/userRoute.js";

const app = express();
const port = process.env.PORT || 5000;

await connectDB();
await connectCloudinary();

// Allow multiple origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/", (req, res) => res.send("API is working!"));
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
