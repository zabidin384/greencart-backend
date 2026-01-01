import express from "express";
import authUser from "../middlewares/authUser.js";
import authSeller from "../middlewares/authSeller.js";
import { getAllOrders, getUserOrders, orderCOD, orderStripe } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/cod", authUser, orderCOD);
orderRouter.post("/stripe", authUser, orderStripe);
orderRouter.get("/user", authUser, getUserOrders);
orderRouter.get("/seller", authSeller, getAllOrders);

export default orderRouter;
