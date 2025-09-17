const mongoose = require("mongoose"); 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,   
    unique: true,    
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, 
    trim: true
  },
  password: {
    type: String,
    required: true,   
  },
  role: {
    type: String,
    enum: ["user", "admin"], 
    default: "user",         
    required: true,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true }); 

const User = mongoose.model("User", userSchema);

module.exports = User;
