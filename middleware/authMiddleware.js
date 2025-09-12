const jwt = require("jsonwebtoken");

// Middleware để xác thực token
const authMiddleware = (req, res, next) => {
  // lấy token từ header: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không có token, truy cập bị từ chối" });
  }

  try {
    // kiểm tra token có hợp lệ không
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // gắn thông tin user vào request để các route khác dùng
    req.user = decoded;
    next(); // cho phép đi tiếp sang route
  } catch (error) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

module.exports = authMiddleware;
