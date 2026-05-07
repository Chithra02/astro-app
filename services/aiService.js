const OpenAI = require("openai");
const Chat = require("../models/Chat");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.askAI = async (user, message) => {
  const history = await Chat.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  const messages = [];

  history.reverse().forEach(h => {
    messages.push({ role: "user", content: h.message });
    messages.push({ role: "assistant", content: h.reply });
  });

  messages.push({
    role: "user",
    content: `
You are a calm AI astrologer.

User zodiac: ${user.zodiac}
DOB: ${user.dob}

Question: ${message}

Rules:
- Do NOT give exact real-world predictions
- You may suggest directions softly (east/west etc)
- Be supportive and human-like
`
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages
  });

  return response.choices[0].message.content;
};