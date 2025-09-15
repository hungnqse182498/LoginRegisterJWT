const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {sendEmail } = require("../config/mail"); // cấu hình nodemailer

// Lưu OTP tạm (production thì nên dùng Redis)
const otpStore = {};

// ================== REGISTER ==================
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// ================== LOGIN ==================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1m" }
    );

    const { password: _, ...userData } = user.toObject();

    res.json({ message: "Đăng nhập thành công", profile: userData, token });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error }); 
  }
};

// ================== FORGOT PASSWORD (OTP) ==================
function generateOTP(len = 6) {
  let otp = "";
  for (let i = 0; i < len; i++) otp += Math.floor(Math.random() * 10);
  return otp;
}

const requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "Nếu email tồn tại, OTP đã được gửi" });
    }

    const otp = generateOTP(6);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + 60 * 1000;

    otpStore[email] = { otpHash, expiresAt };

    await sendEmail({
      to: email,
      subject: "Mã OTP reset mật khẩu",
      text: `OTP của bạn: ${otp} (hết hạn trong 60 giây)`,
    });


    res.json({ message: "Nếu email tồn tại, OTP đã được gửi" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

const verifyAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const record = otpStore[email];
    if (!record || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      return res.status(400).json({ message: "OTP không đúng" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete otpStore[email];

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

// Export
module.exports = { register, login, requestReset, verifyAndReset };
