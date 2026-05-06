import { useEffect, useState } from "react";
import "./index.css";

import Login from "./Login";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import { auth } from "./data/firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [properties, setProperties] = useState(() => {
    const saved = localStorage.getItem("properties");
    return saved ? JSON.parse(saved) : [];
  });

  const [newProperty, setNewProperty] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "properties",
      JSON.stringify(properties)
    );
  }, [properties]);

  const addProperty = () => {
    if (!newProperty.trim()) return;

    setProperties([
      ...properties,
      {
        id: Date.now().toString(),
        name: newProperty,
        city: "Hồ Chí Minh",
        type: "5 sao",
      },
    ]);

    setNewProperty("");
  };

  const deleteProperty = (id) => {
    if (!confirm("Xóa cơ sở này?")) return;

    setProperties(
      properties.filter((p) => p.id !== id)
    );
  };

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f3ef",
        fontFamily: "Arial",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 260,
          background: "#fff",
          borderRight: "1px solid #ddd",
          padding: 20,
        }}
      >
        <h2
          style={{
            marginBottom: 30,
            color: "#009688",
          }}
        >
          Palace Group
        </h2>

        <div style={{ marginBottom: 12 }}>
          🏨 Cơ sở
        </div>

        <div style={{ marginBottom: 12 }}>
          🧰 Tài sản
        </div>

        <div style={{ marginBottom: 12 }}>
          🔧 Bảo trì
        </div>

        <div style={{ marginBottom: 12 }}>
          👨‍💼 Nhân viên
        </div>

        <div style={{ marginTop: 40 }}>
          <div
            style={{
              fontSize: 13,
              color: "#666",
              marginBottom: 10,
            }}
          >
            Đăng nhập:
          </div>

          <div
            style={{
              fontSize: 14,
              marginBottom: 15,
            }}
          >
            {user.email}
          </div>

          <button
            onClick={() => signOut(auth)}
            style={{
              width: "100%",
              padding: 10,
              border: "none",
              borderRadius: 10,
              background: "#e53935",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main */}
      <div
        style={{
          flex: 1,
          padding: 30,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
              }}
            >
              Cơ sở
            </h1>

            <div
              style={{
                color: "#666",
              }}
            >
              Quản lý khách sạn
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <input
              value={newProperty}
              onChange={(e) =>
                setNewProperty(e.target.value)
              }
              placeholder="Tên cơ sở"
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ccc",
                width: 220,
              }}
            />

            <button
              onClick={addProperty}
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: 10,
                background: "#009688",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              + Thêm cơ sở
            </button>
          </div>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(320px,1fr))",
            gap: 20,
          }}
        >
          {properties.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: 20,
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    {item.name}
                  </h3>

                  <div
                    style={{
                      color: "#666",
                      marginTop: 5,
                    }}
                  >
                    {item.city} • {item.type}
                  </div>
                </div>

                <button
                  onClick={() =>
                    deleteProperty(item.id)
                  }
                  style={{
                    border: "none",
                    background: "#ffebee",
                    color: "#e53935",
                    borderRadius: 10,
                    width: 40,
                    height: 40,
                    cursor: "pointer",
                  }}
                >
                  🗑
                </button>
              </div>

              <div
                style={{
                  color: "#777",
                  lineHeight: 1.8,
                }}
              >
                <div>Địa chỉ: —</div>
                <div>Quản lý: —</div>
                <div>Điện thoại: —</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}