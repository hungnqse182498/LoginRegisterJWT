// Lưu thông tin đăng ký tạm thời
const pendingRegister = {};

// Gửi OTP đăng ký
const sendRegisterOtp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    const otp = generateOTP(6);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = Date.now() + 10 * 60 * 1000;
    pendingRegister[email] = { username, email, password, otpHash, expiresAt };
    await sendEmail({
      to: email,
      subject: "Mã OTP đăng ký tài khoản",
      text: `OTP đăng ký của bạn: ${otp} (hết hạn trong 10 phút)`
    });
    res.json({ message: "OTP đăng ký đã được gửi đến email" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

// Xác thực OTP đăng ký, trả về token tạm
const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }
    const record = pendingRegister[email];
    if (!record || Date.now() > record.expiresAt) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      return res.status(400).json({ message: "OTP không đúng" });
    }
    // Tạo token tạm thời cho đăng ký
    const tempToken = jwt.sign({ email, type: "register" }, process.env.JWT_SECRET || "secret", { expiresIn: "5m" });
    res.json({ token: tempToken, message: "Xác thực OTP thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

// Hoàn tất đăng ký bằng token tạm
const completeRegister = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Thiếu token" });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (err) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    if (payload.type !== "register" || !payload.email) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }
    const record = pendingRegister[payload.email];
    if (!record) {
      return res.status(400).json({ message: "Thông tin đăng ký không tồn tại hoặc đã hết hạn" });
    }
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    const hashedPassword = await bcrypt.hash(record.password, 10);
    const newUser = new User({
      username: record.username,
      email: record.email,
      password: hashedPassword,
    });
    await newUser.save();
    delete pendingRegister[payload.email];
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {sendEmail } = require("../config/mail"); // cấu hình nodemailer

// Lưu OTP tạm (production thì nên dùng Redis)
const otpStore = {};

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

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1m" }
    );
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    user.refreshToken = refreshToken;
    await user.save();
    const { password: _, ...userData } = user.toObject();
    res.json({ message: "Đăng nhập thành công", profile: userData, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error }); 
  }
};

// Refresh token API
const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Thiếu refresh token" });
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
    const user = await User.findOne({ _id: payload.id, refreshToken });
    if (!user) return res.status(403).json({ message: "Refresh token không hợp lệ" });
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1m" }
    );
    res.json({ accessToken: newAccessToken });
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


// Gửi OTP
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
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore[email] = { otpHash, expiresAt };

    await sendEmail({
      to: email,
      subject: "Mã OTP reset mật khẩu",
  text: `OTP của bạn: ${otp} (hết hạn trong 2 phút)`,
    });

    res.json({ message: "Nếu email tồn tại, OTP đã được gửi" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

// Xác thực OTP, trả về token tạm thời
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
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
    // Tạo token tạm thời (chỉ dùng cho reset password)
    const tempToken = jwt.sign({ email, type: "reset" }, process.env.JWT_SECRET || "secret", { expiresIn: "5m" });
    // Xoá OTP sau khi xác thực thành công (hoặc tuỳ chọn giữ lại)
    delete otpStore[email];
    res.json({ token: tempToken, message: "Xác thực OTP thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

// Đổi mật khẩu bằng token tạm thời
const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    } catch (err) {
      return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    if (payload.type !== "reset" || !payload.email) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }
    const user = await User.findOne({ email: payload.email });
    if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi", error });
  }
};

const verifyAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
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
module.exports = {
  login,
  requestReset,
  verifyOtp,
  resetPasswordWithToken,
  sendRegisterOtp,
  verifyRegisterOtp,
  completeRegister,
  refreshTokenController
};
