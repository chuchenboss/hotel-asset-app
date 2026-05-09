import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, findStaffByEmailAndCompany } from "./data/firebase.js";

export default function Login() {
  const [companyId, setCompanyId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!companyId.trim()) return alert("Vui lòng nhập Company ID");
    if (!email.trim()) return alert("Vui lòng nhập email");
    if (!password) return alert("Vui lòng nhập mật khẩu");

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email.trim(), password);

      const staff = await findStaffByEmailAndCompany(
        email.trim(),
        companyId.trim()
      );

      if (!staff) {
        await signOut(auth);
        alert("Tài khoản không thuộc công ty này hoặc chưa được phân quyền.");
        return;
      }

      localStorage.setItem("companyId", companyId.trim());
    } catch (err) {
      alert("Đăng nhập lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f6f3ee",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: 390,
        background: "#fff",
        padding: 30,
        borderRadius: 20,
        boxShadow: "0 15px 45px rgba(0,0,0,0.08)"
      }}>
        <h2 style={{ marginBottom: 6 }}>Đăng nhập AssetHub</h2>

        <div style={{ marginBottom: 20, color: "#777" }}>
          Nhập Company ID, email và mật khẩu
        </div>

        <input
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          placeholder="Company ID, ví dụ: phan-hospitality"
          style={{
            width: "100%",
            padding: 13,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #ddd"
          }}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          style={{
            width: "100%",
            padding: 13,
            marginBottom: 12,
            borderRadius: 10,
            border: "1px solid #ddd"
          }}
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          type="password"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          style={{
            width: "100%",
            padding: 13,
            marginBottom: 16,
            borderRadius: 10,
            border: "1px solid #ddd"
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 13,
            borderRadius: 10,
            border: "none",
            background: "#009b87",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  );
}