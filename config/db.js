const mongoose = require("mongoose"); // import mongoose để kết nối MongoDB

// hàm async (để đử dụng await) kết nối DB
const connectDB = async () => {
  try {
    // kết nối tới MongoDB Atlas, URI lấy từ file .env
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB kết nối thành công");
  } catch (error) {
    console.error("MongoDB kết nối thất bại:", error.message);
    process.exit(1); // thoát app nếu lỗi
  }
};

module.exports = connectDB; // export để dùng ở server.js
