// src/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, findStaffByEmailAndCompany } from "./data/firebase.js";

const SUPER_ADMIN_EMAIL = "chuchen.boss@gmail.com";

export default function Login() {
  const [step, setStep] = useState("email"); // "email" | "password"
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSuperAdmin = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const handleContinue = () => {
    setError("");
    if (!email.trim()) return setError("Vui lòng nhập email");
    if (!isSuperAdmin && !companyId.trim()) return setError("Vui lòng nhập Company ID");
    setStep("password");
  };

  const handleLogin = async () => {
    setError("");
    if (!password) return setError("Vui lòng nhập mật khẩu");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!isSuperAdmin) {
        const staff = await findStaffByEmailAndCompany(email.trim(), companyId.trim());
        if (!staff) {
          await signOut(auth);
          setError("Tài khoản không thuộc công ty này hoặc chưa được cấp quyền.");
          setStep("email");
          return;
        }
        if (staff.status === "Vô hiệu hóa" || staff.status === "Disabled") {
          await signOut(auth);
          setError("Tài khoản của bạn đã bị vô hiệu hóa.");
          setStep("email");
          return;
        }
        localStorage.setItem("companyId", companyId.trim());
      }
    } catch (err) {
      const msgs = {
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
        "auth/user-not-found":     "Email không tồn tại trong hệ thống.",
        "auth/wrong-password":     "Mật khẩu không đúng.",
        "auth/too-many-requests":  "Quá nhiều lần thử. Vui lòng thử lại sau.",
      };
      setError(msgs[err.code] || "Đăng nhập lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d5c47 0%, #1D9E75 50%, #185FA5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'Be Vietnam Pro', sans-serif",
    }}>
      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #0F6E56, #1D9E75)",
          padding: "28px 32px 24px",
          textAlign: "center",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: 24, fontWeight: 800, color: "#fff",
            backdropFilter: "blur(4px)",
          }}>A</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            AssetHub
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            Hệ thống quản lý tài sản chuyên nghiệp
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "28px 32px 32px" }}>
          {step === "email" ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1917", marginBottom: 6 }}>
                Đăng nhập
              </div>
              <div style={{ fontSize: 13, color: "#9B9890", marginBottom: 20 }}>
                Nhập email để xác định tài khoản
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5F5E5A", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleContinue()}
                  placeholder="email@congty.com"
                  style={{ width: "100%", fontSize: 14, padding: "10px 13px" }}
                  autoFocus
                />
              </div>

              {/* Company ID – only shown for non-super-admin */}
              {email && !isSuperAdmin && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5F5E5A", marginBottom: 6 }}>
                    Company ID
                  </label>
                  <input
                    className="input"
                    value={companyId}
                    onChange={e => { setCompanyId(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleContinue()}
                    placeholder="vd: phan-hospitality"
                    style={{ width: "100%", fontSize: 14, padding: "10px 13px" }}
                  />
                  <div style={{ fontSize: 11, color: "#9B9890", marginTop: 5 }}>
                    Company ID được cung cấp bởi quản trị viên của bạn
                  </div>
                </div>
              )}

              {isSuperAdmin && email && (
                <div style={{
                  background: "#E1F5EE", border: "1px solid #9FE1CB",
                  borderRadius: 8, padding: "8px 12px", marginBottom: 14,
                  fontSize: 12, color: "#0F6E56", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: 14 }}>🔐</span>
                  Tài khoản Super Admin — không cần Company ID
                </div>
              )}

              {error && (
                <div style={{ background: "#FCEBEB", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#A32D2D" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleContinue}
                style={{
                  width: "100%", padding: "11px", borderRadius: 10, border: "none",
                  background: "#1D9E75", color: "#fff", fontWeight: 600,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.target.style.background = "#0F6E56"}
                onMouseLeave={e => e.target.style.background = "#1D9E75"}
              >
                Tiếp tục →
              </button>
            </>
          ) : (
            <>
              {/* Back button + email summary */}
              <button
                onClick={() => { setStep("email"); setPassword(""); setError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, color: "#5F5E5A", padding: "0 0 16px", display: "flex",
                  alignItems: "center", gap: 5, fontFamily: "inherit",
                }}
              >
                ← Quay lại
              </button>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1917", marginBottom: 4 }}>
                  Nhập mật khẩu
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#F7F6F2", borderRadius: 20, padding: "4px 12px",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75" }} />
                  <span style={{ fontSize: 13, color: "#5F5E5A" }}>
                    {email}{!isSuperAdmin && ` · ${companyId}`}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5F5E5A", marginBottom: 6 }}>
                  Mật khẩu
                </label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && !loading && handleLogin()}
                  placeholder="••••••••"
                  style={{ width: "100%", fontSize: 14, padding: "10px 13px" }}
                  autoFocus
                />
              </div>

              {error && (
                <div style={{ background: "#FCEBEB", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#A32D2D" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: "100%", padding: "11px", borderRadius: 10, border: "none",
                  background: loading ? "#9FE1CB" : "#1D9E75",
                  color: "#fff", fontWeight: 600, fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "background 0.15s",
                }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 32px", borderTop: "1px solid #e2e0d8",
          textAlign: "center", fontSize: 11, color: "#9B9890",
        }}>
          AssetHub © 2026 — Phần mềm quản lý tài sản khách sạn
        </div>
      </div>
    </div>
  );
}
