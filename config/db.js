const mongoose = require("mongoose"); // import mongoose để kết nối MongoDB

// hàm async để kết nối
const connectDB = async () => {
  try {
    // kết nối tới MongoDB Atlas, URI lấy từ file .env
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // thoát app nếu lỗi
  }
};

module.exports = connectDB; // export để dùng ở server.js
