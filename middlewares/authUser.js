import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
	const { token } = req.cookies;
	if (!token) return res.status(401).json({ success: false, message: "Not authorized!" });

	try {
		const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET);

		if (tokenDecoded.id) {
			if (!req.body) req.body = {};
			req.body.userId = tokenDecoded.id;
		} else return res.status(401).json({ success: false, message: "Not authorized!" });
		next();
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

export default authUser;
