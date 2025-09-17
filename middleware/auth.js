// middleware/auth.js
const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer token"
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // أو أي بيانات أخرى مخزنة في التوكن
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};
