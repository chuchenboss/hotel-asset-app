import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./data/firebase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Đăng nhập lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f6f3ee"
    }}>
      <div style={{
        width: 360,
        background: "white",
        padding: 28,
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>
        <h2>Đăng nhập</h2>
        <p>Palace Group - Quản lý tài sản</p>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 12 }}
        />

        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 12 }}
        />

        <button
          onClick={login}
          disabled={loading}
          style={{ width: "100%", padding: 12, marginTop: 16 }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}