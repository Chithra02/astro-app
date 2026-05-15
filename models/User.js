const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  dob: Date,
  zodiac: String,
  isPremium: { type: Boolean, default: false },
  dailyUsage: { type: Number, default: 0 },
  lastUsedDate: { type: Date, default: Date.now }
}, { timestamps: true });

// ✅ IMPORTANT FIX
module.exports = mongoose.models.User || mongoose.model("User", userSchema);