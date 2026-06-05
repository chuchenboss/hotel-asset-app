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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>AssetHub</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            {isSuperAdmin ? "Super Admin Platform" : "Asset Management System"}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 32px 32px" }}>
          {step === "email" ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  style={{ width: "100%" }}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleContinue()}
                  placeholder="you@company.com"
                  autoFocus
                />
              </div>

              {!isSuperAdmin && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Company ID
                  </label>
                  <input
                    className="input"
                    style={{ width: "100%" }}
                    value={companyId}
                    onChange={e => { setCompanyId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleContinue()}
                    placeholder="e.g. phan-hospitality"
                  />
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                    Provided by your company administrator
                  </div>
                </div>
              )}

              {isSuperAdmin && (
                <div style={{ background: "#E6F1FB", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: "#185FA5" }}>
                  Super Admin detected — full platform access
                </div>
              )}

              {error && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 12 }}>{error}</div>}

              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "11px", fontSize: 14 }}
                onClick={handleContinue}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "8px 12px", background: "#F3F4F6", borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Signing in as</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{email}</div>
                  {!isSuperAdmin && <div style={{ fontSize: 11, color: "#9CA3AF" }}>Company: {companyId}</div>}
                </div>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#6B7280", padding: "4px 8px", borderRadius: 4 }}
                  onClick={() => { setStep("email"); setPassword(""); setError(""); }}
                >
                  Change
                </button>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  style={{ width: "100%" }}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>

              {error && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 12 }}>{error}</div>}

              <button
                className="btn btn-primary"
                style={{ width: "100%", padding: "11px", fontSize: 14 }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
