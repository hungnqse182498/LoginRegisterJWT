const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { register, login, requestReset, verifyOtp, resetPasswordWithToken, sendRegisterOtp, verifyRegisterOtp, completeRegister, refreshTokenController } = require("../controllers/authController");
// ================== REFRESH TOKEN ==================
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Cấp mới access token bằng refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token mới
 *       401:
 *         description: Thiếu refresh token
 *       403:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
router.post("/refresh-token", refreshTokenController);

// ================== REGISTER WITH OTP ==================
/**
 * @swagger
 * /auth/register-send-otp:
 *   post:
 *     summary: Gửi OTP đăng ký tài khoản
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
 *       200:
 *         description: OTP đăng ký đã được gửi đến email
 *       400:
 *         description: Lỗi gửi OTP
 */
router.post("/register-send-otp", sendRegisterOtp);

/**
 * @swagger
 * /auth/register-verify-otp:
 *   post:
 *     summary: Xác thực OTP đăng ký, trả về token tạm
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
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác thực OTP thành công, trả về token
 *       400:
 *         description: OTP không hợp lệ
 */
router.post("/register-verify-otp", verifyRegisterOtp);

/**
 * @swagger
 * /auth/register-complete:
 *   post:
 *     summary: Hoàn tất đăng ký bằng token tạm
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Token không hợp lệ hoặc thông tin đăng ký không tồn tại
 */
router.post("/register-complete", completeRegister);
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực người dùng (JWT)
 */


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


// ================== VERIFY OTP ==================
/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Xác thực OTP và nhận token đổi mật khẩu
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
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác thực OTP thành công, trả về token
 *       400:
 *         description: OTP không hợp lệ
 */
router.post("/verify-otp", verifyOtp);

// ================== RESET PASSWORD WITH TOKEN ==================
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Đổi mật khẩu mới bằng token xác thực OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Token không hợp lệ hoặc mật khẩu không khớp
 */
router.post("/reset-password", resetPasswordWithToken);

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
