const mongoose = require("mongoose");

/* 🧩 Message Schema */
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* 💬 Chat Schema */
const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxlength: 100,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    lastMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/* ✅ FIXED MIDDLEWARE (no next needed) */
chatSchema.pre("save", function () {
  if (this.messages && this.messages.length > 0) {
    this.lastMessage =
      this.messages[this.messages.length - 1].text || "";
  }
});

/* ⚡ Index for sorting */
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);