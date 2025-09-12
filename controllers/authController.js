const User = require("../models/User"); // import model User
const bcrypt = require("bcryptjs");     // để mã hoá mật khẩu
const jwt = require("jsonwebtoken");    // để tạo JWT

// Đăng ký
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // kiểm tra có đủ dữ liệu không
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    // kiểm tra email có tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // mã hoá mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(password, 10);

    // tạo user mới
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

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // so sánh mật khẩu nhập vào với mật khẩu đã hash trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // tạo JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Export để routes dùng
module.exports = { register, login };
