const express = require("express");
const { register, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Route test middleware: chỉ ai có token mới truy cập được
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Xin chào, bạn đã đăng nhập thành công!",
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username
    },
  });
});


module.exports = router;
