const mongoose = require("mongoose"); // import mongoose để tạo schema và model

// Định nghĩa schema cho User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,   // bắt buộc nhập
    unique: true,     // không được trùng username
  },
  email: {
    type: String,
    required: true,
    unique: true,     // email cũng không được trùng
  },
  password: {
    type: String,
    required: true,   // bắt buộc nhập
  },
  role: {
    type: String,
    enum: ["user", "admin"], // chỉ cho phép 2 giá trị này
    default: "user",         // mặc định là user
    required: true,
  },
  refreshToken: {
    type: String,
    default: null,
  },
}, { timestamps: true }); // tự động thêm createdAt và updatedAt

// Tạo model User dựa trên schema
const User = mongoose.model("User", userSchema);

// Export model để dùng ở controller
module.exports = User;
