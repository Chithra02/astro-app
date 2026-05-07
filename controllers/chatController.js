const Chat = require("../models/Chat");
const User = require("../models/User");
const axios = require("axios");

/* ================= GET OR CREATE CHAT ================= */
const getOrCreateChat = async (userId) => {
  let chat = await Chat.findOne({ user: userId });

  if (!chat) {
    chat = new Chat({
      user: userId,
      messages: [],
    });
    await chat.save();
  }

  return chat;
};

/* ================= SAVE MESSAGE ================= */
const saveMessage = async (req, res) => {
  try {
    const { text, sender } = req.body;

    if (!text || !sender) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const chat = await getOrCreateChat(req.user.id);

    chat.messages.push({
      sender,
      text: text.trim(),
    });

    // limit memory
    if (chat.messages.length > 20) {
      chat.messages = chat.messages.slice(-20);
    }

    await chat.save();

    res.json({ success: true });

  } catch (err) {
    console.log("SAVE ERROR:", err);
    res.status(500).json({ error: "Save failed" });
  }
};

/* ================= AI RESPONSE ================= */
const chatAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const user = await User.findById(req.user.id);
    const chat = await getOrCreateChat(req.user.id);

    // last messages for context
    const recentMessages = chat.messages.slice(-6);

    const conversation = [
      {
        role: "system",
        content: `You are a mystical astrology expert.
User zodiac: ${user?.zodiac || "unknown"}

Give deep, emotional, intuitive guidance in 2-3 lines.`,
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

    console.log("AI RAW:", response.data); // 🔥 debug

    const reply =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      `✨ The stars are quiet... try again.`;

    res.json({ reply });

  } catch (err) {
    console.log("AI ERROR:", err.response?.data || err.message);

    res.json({
      reply: "✨ The universe is unclear right now. Try again later.",
    });
  }
};

/* ================= GET CHAT HISTORY ================= */
const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id });

    res.json(chat ? [chat] : []);

  } catch (err) {
    console.log("HISTORY ERROR:", err);
    res.status(500).json({ error: "Failed to load chats" });
  }
};

module.exports = {
  saveMessage,
  chatAI,
  getChatHistory,
};