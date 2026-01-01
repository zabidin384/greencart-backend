import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		cartItems: { type: Object, default: {} },
	},
	{ minimize: false, timestamps: true }
);

export default mongoose.models.user || mongoose.model("user", userSchema);
