const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(cors());

// import routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// kết nối DB
connectDB();

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
