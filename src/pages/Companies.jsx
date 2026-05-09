import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Companies({ companies, setCompanies }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    id: "",
    name: "",
    ownerEmail: "",
    plan: "pro",
    status: "active",
    createdAt: Date.now(),
  };

  const [form, setForm] = useState(emptyForm);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (company) => {
    setEditing(company);
    setForm(company);
    setShowForm(true);
  };

  const save = () => {
    if (!form.id.trim()) return alert("Nhập companyId");
    if (!form.name.trim()) return alert("Nhập tên công ty");
    if (!form.ownerEmail.trim()) return alert("Nhập email chủ tài khoản");

    const clean = {
      ...form,
      id: form.id.trim(),
      name: form.name.trim(),
      ownerEmail: form.ownerEmail.trim(),
      createdAt: form.createdAt || Date.now(),
    };

    if (editing) {
      setCompanies(companies.map((c) => (c.id === editing.id ? clean : c)));
    } else {
      if (companies.some((c) => c.id === clean.id)) {
        return alert("companyId này đã tồn tại");
      }

      setCompanies([...companies, clean]);
    }

    setShowForm(false);
    setEditing(null);
  };

  const remove = (id) => {
    if (!confirm("Xoá công ty này?")) return;
    setCompanies(companies.filter((c) => c.id !== id));
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
                  <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
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
                      <span className="chip chip-blue">{c.plan}</span>
                    </td>
                    <td>
                      <span className={c.status === "active" ? "chip chip-green" : "chip chip-gray"}>
                        {c.status}
                      </span>
                    </td>
                    <td>{new Date(c.createdAt || Date.now()).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm btn-icon" onClick={() => openEdit(c)}>
                          <Pencil size={12} />
                        </button>

                        <button className="btn btn-sm btn-icon btn-danger" onClick={() => remove(c.id)}>
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
              <button className="btn btn-sm" onClick={() => setShowForm(false)}>×</button>
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
                  placeholder="Phan Hospitality JSC"
                />
              </label>

              <label className="field">
                <span>Owner Email</span>
                <input
                  className="input"
                  value={form.ownerEmail}
                  onChange={(e) => set("ownerEmail", e.target.value)}
                  placeholder="email chủ tài khoản"
                />
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Gói</span>
                  <select className="select" value={form.plan} onChange={(e) => set("plan", e.target.value)}>
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="enterprise">enterprise</option>
                  </select>
                </label>

                <label className="field">
                  <span>Trạng thái</span>
                  <select className="select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="blocked">blocked</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowForm(false)}>Huỷ</button>
              <button className="btn btn-primary" onClick={save}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}