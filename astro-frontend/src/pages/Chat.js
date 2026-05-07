import { useState, useEffect, useRef } from "react";
import API from "../services/api";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // 🔽 Load chats
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await API.get("/chat", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setChats(res.data);
      if (res.data.length > 0) {
        setCurrentChatId(res.data[0]._id);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const currentChat = chats.find((c) => c._id === currentChatId);

  // 🔽 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, typingText]);

  // ➕ Create new chat
  const createNewChat = async () => {
    try {
      const res = await API.post(
        "/chat/new",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setChats((prev) => [res.data, ...prev]);
      setCurrentChatId(res.data._id);
    } catch (err) {
      console.log(err);
    }
  };

  // ❌ Delete chat
  const deleteChat = async (id) => {
    try {
      await API.delete(`/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const updated = chats.filter((c) => c._id !== id);
      setChats(updated);
      setCurrentChatId(updated[0]?._id || null);
    } catch (err) {
      console.log(err);
    }
  };

  // ✏️ Rename chat
  const renameChat = async (id) => {
    const title = prompt("Rename chat:");
    if (!title) return;

    try {
      const res = await API.put(
        `/chat/${id}/rename`,
        { title },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setChats((prev) =>
        prev.map((c) => (c._id === id ? res.data : c))
      );
    } catch (err) {
      console.log(err);
    }
  };
const typeText = (text) => {
  let i = 0;
  setTypingText("");

  const interval = setInterval(() => {
    setTypingText((prev) => prev + text[i]);
    i++;

    if (i >= text.length) {
      clearInterval(interval);
    }
  }, 10);
};
  // 🚀 Send message
 const sendMessage = async () => {
  if (!message.trim()) return;

  let chatId = currentChatId;

  // 🔥 ensure chat exists
  if (!chatId) {
    try {
      const res = await API.post(
        "/chat/new",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      chatId = res.data._id;
      setChats((prev) => [res.data, ...prev]);
      setCurrentChatId(chatId);
    } catch (err) {
      console.log(err);
      return;
    }
  }

  const userMsg = message;

  // reset input
  setMessage("");
  if (textareaRef.current) textareaRef.current.style.height = "auto";

  // ✅ optimistic UI
  setChats((prev) =>
    prev.map((chat) =>
      chat._id === chatId
        ? {
            ...chat,
            messages: [
              ...(chat.messages || []),
              { sender: "user", text: userMsg },
            ],
            title:
              chat.messages.length === 0
                ? userMsg.slice(0, 25)
                : chat.title,
          }
        : chat
    )
  );

  setLoading(true);

  try {
    // save user msg
    await API.post(
      `/chat/${chatId}/message`,
      { text: userMsg, sender: "user" },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // 🔥 get AI reply
    const res = await API.post(
      "/chat/chat-ai",
      { message: userMsg },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const aiReply = res.data.reply;

    // ✨ typing animation
    typeText(aiReply);

    // ⏳ wait then add final message (FIX OVERLAY)
    setTimeout(async () => {
      setTypingText(""); // remove typing

      // save AI msg
      await API.post(
        `/chat/${chatId}/message`,
        { text: aiReply, sender: "ai" },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // update UI
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === chatId
            ? {
                ...chat,
                messages: [
                  ...(chat.messages || []),
                  { sender: "ai", text: aiReply },
                ],
              }
            : chat
        )
      );
    }, aiReply.length * 10);

  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={styles.appContainer}>
      
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <button style={styles.newChatBtn} onClick={createNewChat}>
          + New Chat
        </button>

        {chats.map((chat) => (
          <div key={chat._id} style={{ marginBottom: 8 }}>
            <div
              onClick={() => setCurrentChatId(chat._id)}
              style={{
                ...styles.chatItem,
                background:
                  chat._id === currentChatId ? "#334155" : "transparent",
              }}
            >
              {chat.title}
            </div>

            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => renameChat(chat._id)}>✏️</button>
              <button onClick={() => deleteChat(chat._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div style={styles.container}>
        <div style={styles.chatBox}>
          {currentChat?.messages?.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.message,
                alignSelf:
                  msg.sender === "user" ? "flex-end" : "flex-start",
                background:
                  msg.sender === "user" ? "#6c63ff" : "#333",
              }}
            >
              {msg.text}
            </div>
          ))}

          {typingText && <div style={{ color: "#aaa" }}>{typingText}</div>}

          {loading && !typingText && (
            <div style={{ color: "#aaa" }}>
              ✨ Interpreting your stars...
            </div>
          )}

          <div ref={bottomRef}></div>
        </div>

        {/* INPUT */}
        <div style={styles.inputArea}>
          <textarea
            ref={textareaRef}
            style={styles.input}
            value={message}
            placeholder="Ask the universe..."
            rows={1}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) return;
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button style={styles.button} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
/* styles unchanged */
const styles = {
  appContainer: { display: "flex", height: "100vh" },
  sidebar: {
    width: "260px",
    background: "#0f172a",
    color: "#fff",
    padding: "10px",
  },
  newChatBtn: {
    padding: "10px",
    background: "#6c63ff",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    marginBottom: "10px",
  },
  chatItem: {
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  message: {
    padding: "10px 15px",
    borderRadius: "15px",
    color: "#fff",
    maxWidth: "70%",
  },
  inputArea: {
    display: "flex",
    padding: "10px",
    background: "#1e1e2f",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    resize: "none",
  },
  button: {
    padding: "10px 15px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  },
};