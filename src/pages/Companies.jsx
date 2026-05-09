// src/pages/Companies.jsx
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createCompanyAdmin } from "../data/firebase.js";

const emptyForm = {
  id: "",
  name: "",
  ownerEmail: "",
  plan: "pro",
  status: "active",
  createdAt: Date.now(),

  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function Companies({ companies, setCompanies }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      createdAt: Date.now(),
    });
    setShowForm(true);
  };

  const openEdit = (company) => {
    setEditing(company);
    setForm({
      ...emptyForm,
      ...company,
      adminPassword: "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.id.trim()) return alert("Nhập Company ID");
    if (!form.name.trim()) return alert("Nhập tên công ty");
    if (!form.ownerEmail.trim()) return alert("Nhập Owner Email");

    if (!editing) {
      if (!form.adminName.trim()) return alert("Nhập tên admin tổng");
      if (!form.adminEmail.trim()) return alert("Nhập email admin tổng");
      if (!form.adminPassword || form.adminPassword.length < 6) {
        return alert("Mật khẩu tạm phải từ 6 ký tự");
      }
    }

    const cleanCompany = {
      id: form.id.trim(),
      name: form.name.trim(),
      ownerEmail: form.ownerEmail.trim().toLowerCase(),
      plan: form.plan || "pro",
      status: form.status || "active",
      createdAt: form.createdAt || Date.now(),
    };

    try {
      setSaving(true);

      if (editing) {
        await setCompanies(
          companies.map((c) =>
            c.id === editing.id ? cleanCompany : c
          )
        );
      } else {
        if (companies.some((c) => c.id === cleanCompany.id)) {
          setSaving(false);
          return alert("Company ID này đã tồn tại");
        }

        await setCompanies([...companies, cleanCompany]);

        await createCompanyAdmin(
          cleanCompany.id,
          form.adminEmail.trim().toLowerCase(),
          form.adminPassword,
          form.adminName.trim()
        );
      }

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      alert("Lỗi lưu công ty/admin: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Xoá công ty này?")) return;

    try {
      await setCompanies(companies.filter((c) => c.id !== id));
    } catch (err) {
      alert("Lỗi xoá công ty: " + err.message);
    }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Quản lý công ty</span>

          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> Thêm công ty
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Tên công ty</th>
                <th>Owner Email</th>
                <th>Gói</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--text3)",
                    }}
                  >
                    Chưa có công ty nào
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.ownerEmail}</td>
                    <td>
                      <span className="chip chip-blue">
                        {c.plan}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          c.status === "active"
                            ? "chip chip-green"
                            : "chip chip-gray"
                        }
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {new Date(c.createdAt || Date.now()).toLocaleDateString(
                        "vi-VN"
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="btn btn-sm btn-icon"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil size={12} />
                        </button>

                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => remove(c.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? "Sửa công ty" : "Thêm công ty mới"}</h3>

              <button
                className="btn btn-sm"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label className="field">
                <span>Company ID</span>
                <input
                  className="input"
                  value={form.id}
                  disabled={!!editing}
                  onChange={(e) => set("id", e.target.value)}
                  placeholder="vd: phan-hospitality"
                />
              </label>

              <label className="field">
                <span>Tên công ty</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="VD: Phan Hospitality JSC"
                />
              </label>

              <label className="field">
                <span>Owner Email</span>
                <input
                  className="input"
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => set("ownerEmail", e.target.value)}
                  placeholder="owner@company.com"
                />
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Gói</span>
                  <select
                    className="select"
                    value={form.plan}
                    onChange={(e) => set("plan", e.target.value)}
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </label>

                <label className="field">
                  <span>Trạng thái</span>
                  <select
                    className="select"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="blocked">blocked</option>
                  </select>
                </label>
              </div>

              {!editing && (
                <>
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--border)",
                      margin: "14px 0",
                    }}
                  />

                  <h4 style={{ margin: "0 0 10px 0" }}>
                    Admin tổng công ty
                  </h4>

                  <label className="field">
                    <span>Tên admin tổng</span>
                    <input
                      className="input"
                      value={form.adminName}
                      onChange={(e) => set("adminName", e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </label>

                  <label className="field">
                    <span>Email admin tổng</span>
                    <input
                      className="input"
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => set("adminEmail", e.target.value)}
                      placeholder="admin@company.com"
                    />
                  </label>

                  <label className="field">
                    <span>Mật khẩu tạm</span>
                    <input
                      className="input"
                      type="password"
                      value={form.adminPassword}
                      onChange={(e) => set("adminPassword", e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn"
                disabled={saving}
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Huỷ
              </button>

              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={save}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}