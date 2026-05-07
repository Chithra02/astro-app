const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const limitMiddleware = require("../middleware/limitMiddleware");

const Chat = require("../models/Chat");
const axios = require("axios");
const User = require("../models/User");

/* ================= GET ALL CHATS ================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.log("GET CHATS ERROR:", err);
    res.status(500).json({ message: "Error fetching chats" });
  }
});

/* ================= CREATE NEW CHAT ================= */
router.post("/new", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.create({
      user: req.user.id,
      title: "New Chat",
      messages: [],
    });

    res.json(chat);
  } catch (err) {
    console.log("CREATE CHAT ERROR:", err);
    res.status(500).json({ message: "Error creating chat" });
  }
});

/* ================= GET SINGLE CHAT ================= */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json(chat);
  } catch (err) {
    console.log("GET CHAT ERROR:", err);
    res.status(500).json({ message: "Error fetching chat" });
  }
});

/* ================= ADD MESSAGE ================= */
router.post(
  "/:id/message",
  authMiddleware,
  limitMiddleware,
  async (req, res) => {
    try {
      const { text, sender } = req.body;

      if (!text || !sender) {
        return res.status(400).json({ message: "Invalid message" });
      }

      const chat = await Chat.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const newMessage = {
        sender,
        text: text.trim(),
      };

      chat.messages.push(newMessage);

      // ✅ Auto title (first message)
      if (chat.messages.length === 1) {
        chat.title = text.slice(0, 25);
      }

      // ✅ Limit memory
      if (chat.messages.length > 20) {
        chat.messages = chat.messages.slice(-20);
      }

      await chat.save();

      res.json(chat);

    } catch (err) {
      console.log("ADD MESSAGE ERROR:", err);
      res.status(500).json({ message: "Error adding message" });
    }
  }
);

/* ================= AI RESPONSE ================= */
/* ================= AI RESPONSE ================= */
router.post(
  "/chat-ai",
  authMiddleware,
  limitMiddleware,
  async (req, res) => {
    console.log("✅ /chat-ai HIT");

    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message required" });
      }

      const user = await User.findById(req.user.id);
      const chat = await Chat.findOne({ user: req.user.id });

      const recentMessages = chat?.messages.slice(-6) || [];

      const conversation = [
        {
          role: "system",
          content: `You are a mystical astrology expert.
User zodiac: ${user?.zodiac || "unknown"}

Give short, deep, emotional guidance.`,
        },
        ...recentMessages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
        {
          role: "user",
          content: message,
        },
      ];

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages: conversation,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "astro-app",
          },
        }
      );

      console.log("🔥 AI RAW:", response.data);

      const reply =
        response.data?.choices?.[0]?.message?.content?.trim() ||
        response.data?.choices?.[0]?.text ||
        "✨ The stars are silent right now...";

      res.json({ reply });

    } catch (err) {
      console.log("❌ AI ERROR:", err.response?.data || err.message);

      res.json({
        reply: "✨ The universe is unclear right now. Try again later.",
      });
    }
  }
);
     
/* ================= RENAME CHAT ================= */
router.put("/:id/rename", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title },
      { new: true }
    );

    res.json(chat);
  } catch (err) {
    console.log("RENAME ERROR:", err);
    res.status(500).json({ message: "Error renaming chat" });
  }
});

/* ================= DELETE CHAT ================= */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Chat.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    res.json({ message: "Chat deleted" });
  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting chat" });
  }
});

module.exports = router;