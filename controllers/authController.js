const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getZodiac } = require("../utils/zodiac");

// ======================= SIGNUP =======================
const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth
    } = req.body;

    // ✅ Validate all fields
    if (!name || !email || !password || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // ✅ Parse date
    const parsedDob = new Date(dateOfBirth);
    if (isNaN(parsedDob)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth"
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Get zodiac
    const zodiac = getZodiac(parsedDob);

    // ✅ Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      dateOfBirth: parsedDob,
      timeOfBirth,
      placeOfBirth,
      zodiac
    });

    // ✅ Remove password from response
    const { password: _, ...userData } = user.toObject();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Signup failed"
    });
  }
};

// ======================= LOGIN =======================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Get user
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // ✅ Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        zodiac: user.zodiac
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

module.exports = {
  signup,
  login
};