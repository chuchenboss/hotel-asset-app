import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./data/firebase.js";
import Login from "./Login.jsx";

import "./App.css";

// import các function Firebase
import {
  getProperties,
  saveProperties
} from "./data/firebase.js";

export default function App() {
  // ===== AUTH =====
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ===== DATA =====
  const [properties, setPropertiesState] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== CHECK LOGIN =====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsub();
  }, []);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      const data = await getProperties();
      setPropertiesState(data);
      setLoading(false);
    }

    load();
  }, [user]);

  // ===== SAVE DATA =====
  const saveProperty = async (item) => {
    await saveProperties([item]);
    const data = await getProperties();
    setPropertiesState(data);
  };

  // ===== UI CONTROL =====
  if (checkingAuth) return <div>Đang kiểm tra đăng nhập...</div>;

  if (!user) return <Login />;

  if (loading) return <div>Đang tải dữ liệu...</div>;

  // ===== UI =====
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Quản lý cơ sở</h2>

        <div>
          <span style={{ marginRight: 12 }}>{user.email}</span>
          <button onClick={() => signOut(auth)}>Đăng xuất</button>
        </div>
      </div>

      <button
        onClick={() =>
          saveProperty({
            name: "Hotel " + Date.now(),
            city: "Hồ Chí Minh"
          })
        }
      >
        + Thêm cơ sở test
      </button>

      <div style={{ marginTop: 20 }}>
        {properties.map((p) => (
          <div
            key={p.id}
            style={{
              padding: 12,
              border: "1px solid #ddd",
              marginBottom: 10,
              borderRadius: 8
            }}
          >
            <b>{p.name}</b>
            <div>{p.city}</div>
          </div>
        ))}
      </div>
    </div>
  );
}