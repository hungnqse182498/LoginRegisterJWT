const User = require("../models/User");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { getNormalizedEmail } = require("./authController");

// Lấy danh sách người dùng đang hoạt động (isActive=true, chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    const usersRaw = await User.find({ isActive: true }).select("-password");
    const users = usersRaw.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.__v,
      refreshToken: user.refreshToken,
      isActive: user.isActive
    }));
    res.json({ message: "Lấy danh sách người dùng thành công", users });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy danh sách người dùng", error });
  }
};

// Lấy thông tin chi tiết một người dùng theo ID (chỉ admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.__v,
      refreshToken: user.refreshToken,
      isActive: user.isActive
    };
    res.json({ message: "Lấy thông tin người dùng thành công", user: userData });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy thông tin người dùng", error });
  }
};

// Tạo mới một người dùng (chỉ admin)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role, phone, address } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }
    const normalizedEmail = getNormalizedEmail(email);
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (phone && (!validator.isMobilePhone(phone, 'vi-VN') || phone.length < 9 || phone.length > 12)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
    }
    if (address !== undefined && address !== null && address !== "" && address.trim().length === 0) {
      return res.status(400).json({ message: "Địa chỉ không hợp lệ" });
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      phone: phone || "",
      address: address || ""
    });
    await user.save();
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.__v,
      refreshToken: user.refreshToken,
      isActive: user.isActive
    };
    res.status(201).json({ message: "Tạo người dùng mới thành công", user: userData });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi tạo người dùng mới", error });
  }
};

// Cập nhật thông tin người dùng (chỉ admin)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, phone, address } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (email) {
      const normalizedEmail = getNormalizedEmail(email);
      if (!validator.isEmail(normalizedEmail)) {
        return res.status(400).json({ message: "Email không hợp lệ" });
      }
      const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: "Email đã tồn tại trong hệ thống" });
      }
      user.email = normalizedEmail;
    }
    if (username) user.username = username;
    if (role) user.role = role;
    if (phone !== undefined) {
      if (phone && (!validator.isMobilePhone(phone, 'vi-VN') || phone.length < 9 || phone.length > 12)) {
        return res.status(400).json({ message: "Số điện thoại không hợp lệ" });
      }
      user.phone = phone;
    }
    if (address !== undefined) {
      if (address !== null && address !== undefined && address !== "" && address.trim().length === 0) {
        return res.status(400).json({ message: "Địa chỉ không hợp lệ" });
      }
      user.address = address;
    }
    await user.save();
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      __v: user.__v,
      refreshToken: user.refreshToken,
      isActive: user.isActive
    };
    res.json({ message: "Cập nhật người dùng thành công", user: userData });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật người dùng", error });
  }
};

// Vô hiệu hóa người dùng (chỉ admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    user.isActive = false;
    await user.save();
    res.json({ message: "Đã chuyển trạng thái người dùng sang không hoạt động" });
  } catch (error) {
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật trạng thái người dùng", error });
  }
};
