const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { register, login, requestReset, verifyAndReset } = require("../controllers/authController");
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng (JWT)
 */

// ================== REGISTER ==================
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Lỗi tạo tài khoản
 */
router.post("/register", register);

// ================== LOGIN ==================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập và nhận JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post("/login", login);

// ================== GET PROFILE ==================
// Route test middleware: chỉ ai có token mới truy cập được
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Lấy thông tin user (yêu cầu JWT)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */

// ================== REQUEST RESET (OTP) ==================
/**
 * @swagger
 * /auth/request-reset:
 *   post:
 *     summary: Gửi OTP reset mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nếu email tồn tại, OTP đã được gửi
 */
router.post("/request-reset", requestReset);

// ================== VERIFY & RESET ==================
/**
 * @swagger
 * /auth/verify-reset:
 *   post:
 *     summary: Xác thực OTP và đặt lại mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: OTP không hợp lệ
 */
router.post("/verify-reset", verifyAndReset);

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
