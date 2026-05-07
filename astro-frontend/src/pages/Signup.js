import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: ""
  });

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const { name, email, password, dateOfBirth, timeOfBirth, placeOfBirth } = form;

    // ✅ validation
    if (!name || !email || !password || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
      alert("All fields are required ⚠️");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/user/signup", form);

      alert("Signup successful 🎉");

      // go to login
      navigate("/login");

    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.message || "Signup failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>✨ Create Account</h2>

        <input
          style={styles.input}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <input
          style={styles.input}
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
        />

        <input
          style={styles.input}
          type="time"
          value={form.timeOfBirth}
          onChange={(e) => setForm({ ...form, timeOfBirth: e.target.value })}
        />

        <input
          style={styles.input}
          placeholder="Place of Birth"
          value={form.placeOfBirth}
          onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
        />

        <button style={styles.button} onClick={handleSignup}>
          {loading ? "Creating..." : "Signup"}
        </button>

        <p style={styles.link} onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

// 🎨 Styles (same theme as login)
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  },
  card: {
    background: "#1e1e2f",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    color: "#fff",
    width: "320px",
  },
  title: {
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "5px",
    border: "none",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  link: {
    marginTop: "15px",
    cursor: "pointer",
    color: "#aaa",
  }
};