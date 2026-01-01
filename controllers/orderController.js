import stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const orderCOD = async (req, res) => {
	try {
		const { userId, items, address } = req.body;

		if (!address || items.length === 0) return res.json({ success: false, message: "Invalid data!" });

		let amount = await items.reduce(async (acc, item) => {
			const product = await Product.findById(item.product);
			return (await acc) + product.offerPrice * item.quantity;
		}, 0);

		amount += Math.round(amount * 0.02);

		await Order.create({
			userId,
			items,
			amount,
			address,
			paymentType: "COD",
		});

		return res.status(201).json({ success: true, message: "Order placed successfully!" });
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ success: false, message: error.message });
	}
};

export const orderStripe = async (req, res) => {
	try {
		const { userId, items, address } = req.body;
		const { origin } = req.headers;

		if (!address || items.length === 0) return res.json({ success: false, message: "Invalid data!" });

		let productData = [];

		let amount = await items.reduce(async (acc, item) => {
			const product = await Product.findById(item.product);

			productData.push({
				name: product.name,
				price: product.offerPrice,
				quantity: item.quantity,
			});

			return (await acc) + product.offerPrice * item.quantity;
		}, 0);

		amount += Math.round(amount * 0.02);

		const order = await Order.create({
			userId,
			items,
			amount,
			address,
			paymentType: "online",
		});

		const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

		const line_items = productData.map((item) => {
			return {
				price_data: {
					currency: "sgd",
					product_data: {
						name: item.name,
					},
					unit_amount: Math.floor(item.price + item.price * 0.02) * 100,
				},
				quantity: item.quantity,
			};
		});

		// Create session
		const session = await stripeInstance.checkout.sessions.create({
			line_items,
			mode: "payment",
			success_url: `${origin}/loader?next=my-orders`,
			cancel_url: `${origin}/cart`,
			metadata: {
				orderId: order._id.toString(),
				userId,
			},
		});

		return res.status(201).json({ success: true, url: session.url });
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Stripe Webhook to verify payments action
export const stripeWebhooks = async (req, res) => {
	const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

	const signature = req.headers["stripe-signature"];
	let event;

	try {
		event = stripeInstance.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (error) {
		response.status(400).send(`Webhook error: ${error.message}`);
	}

	const payment_intent = event.data.object;
	const paymentIntentId = payment_intent.id;

	// Getting session metadata
	const session = await stripeInstance.checkout.sessions.list({
		payment_intent: paymentIntentId,
	});

	const { orderId, userId } = session.data[0].metadata;

	switch (event.type) {
		case "payment_intent.succeeded": {
			// Mark payment as paid
			await Order.findByIdAndUpdate(orderId, { isPaid: true });

			// Clear user cart
			await User.findByIdAndUpdate(userId, { cartItems: {} });
			break;
		}
		case "payment_intent.payment_failed": {
			await Order.findByIdAndDelete(orderId);
			break;
		}

		default:
			console.error(`Unhandled event type: ${event.type}`);
			break;
	}
	res.json({ received: true });
};

export const getUserOrders = async (req, res) => {
	try {
		const { userId } = req.body;
		const orders = await Order.find({
			userId,
			$or: [{ paymentType: "COD" }, { isPaid: true }],
		})
			.populate("items.product address")
			.sort({ createdAt: -1 });

		if (!orders) return res.status(404).json({ success: false, message: "Order is not found!" });

		return res.json({ success: true, orders });
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getAllOrders = async (req, res) => {
	try {
		const orders = await Order.find({
			$or: [{ paymentType: "COD" }, { isPaid: true }],
		})
			.populate("items.product address")
			.sort({ createdAt: -1 });

		if (!orders) return res.status(404).json({ success: false, message: "Order is not found!" });

		return res.json({ success: true, orders });
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ success: false, message: error.message });
	}
};
