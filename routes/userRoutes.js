const User = require("../models/User");
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { signup, login } = require("../controllers/authController");

// ✅ ADD THESE 👇

// 🔹 SIGNUP
router.post("/signup", signup);

// 🔹 LOGIN
router.post("/login", login);


// 🔹 GET profile
router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// 🔹 UPDATE profile
router.put("/profile", authMiddleware, async (req, res) => {
  const { name, dateOfBirth, timeOfBirth, placeOfBirth } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { name, dateOfBirth, timeOfBirth, placeOfBirth },
    { new: true }
  ).select("-password");

  res.json(updatedUser);
});

module.exports = router;