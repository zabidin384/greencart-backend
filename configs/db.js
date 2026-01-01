import mongoose from "mongoose";

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		mongoose.connection.on("connected", () => console.log("Database connected!"));
		mongoose.connection.off("disconnected", () => console.log("Database off!"));
	} catch (error) {
		console.log(error.message);
		process.exit(1);
	}
};

export default connectDB;
