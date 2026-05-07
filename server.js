require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express(); // ✅ MUST come first

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// DB + Server start
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("DB connected");
  app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
  });
})
.catch(err => console.log("DB error:", err));
