const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const swaggerDocs = require("./swagger"); // import swagger
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// import routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
  res.send("API đang chạy! Mở Swagger UI tại /docs");
});

// kết nối DB
connectDB();

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Máy chủ chạy trên port ${PORT}`);
  // bật swagger
  swaggerDocs(app, PORT);
});
