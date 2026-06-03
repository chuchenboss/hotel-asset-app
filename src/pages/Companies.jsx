// src/pages/Companies.jsx
import { useState } from "react";
import {
  Plus, Pencil, Trash2, ArrowRight, Building2,
  Package, Users, CheckCircle, PauseCircle, XCircle,
  Crown, Zap, Star,
} from "lucide-react";
import { Modal, Field } from "../components/UI.jsx";
import { createCompanyAdmin } from "../data/firebase.js";
import { useToast, useConfirm } from "../components/Toast.jsx";

/* ── PLAN CONFIG ─────────────────────────────── */
const PLANS = {
  free:       { label: "Free",       color: "#5F5E5A", bg: "#F1EFE8", icon: Star,  maxProp: 1,   maxAssets: 50,   maxStaff: 5   },
  pro:        { label: "Pro",        color: "#185FA5", bg: "#E6F1FB", icon: Zap,   maxProp: 5,   maxAssets: 500,  maxStaff: 20  },
  enterprise: { label: "Enterprise", color: "#534AB7", bg: "#EEEDFE", icon: Crown, maxProp: 999, maxAssets: 9999, maxStaff: 999 },
};

const STATUS_CFG = {
  active:  { label: "Hoạt động", color: "#0F6E56", bg: "#E1F5EE", icon: CheckCircle },
  paused:  { label: "Tạm ngưng", color: "#854F0B", bg: "#FAEEDA", icon: PauseCircle },
  blocked: { label: "Đã khoá",   color: "#A32D2D", bg: "#FCEBEB", icon: XCircle   },
};

/* ── COMPANY FORM ────────────────────────────── */
function CompanyForm({ initial, onSave, onClose }) {
  const empty = {
    id: "", name: "", ownerEmail: "", plan: "pro", status: "active",
    phone: "", address: "", notes: "",
    adminName: "", adminEmail: "", adminPassword: "",
  };
  const [form, setForm] = useState(initial ? { ...empty, ...initial, adminPassword: "" } : empty);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.id.trim())         return "Vui lòng nhập Company ID";
    if (!/^[a-z0-9-]+$/.test(form.id.trim())) return "Company ID chỉ dùng chữ thường, số, dấu -";
    if (!form.name.trim())       return "Vui lòng nhập tên công ty";
    if (!form.ownerEmail.trim()) return "Vui lòng nhập Owner Email";
    if (!initial) {
      if (!form.adminName.trim())  return "Vui lòng nhập tên Admin tổng";
      if (!form.adminEmail.trim()) return "Vui lòng nhập email Admin";
      if (!form.adminPassword || form.adminPassword.length < 6) return "Mật khẩu phải ≥ 6 ký tự";
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return toast.error(err);
    const cleanCompany = {
      id: form.id.trim(), name: form.name.trim(),
      ownerEmail: form.ownerEmail.trim().toLowerCase(),
      plan: form.plan, status: form.status,
      phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim(),
      createdAt: initial?.createdAt || Date.now(), updatedAt: Date.now(),
    };
    try {
      setSaving(true);
      await onSave(cleanCompany, !initial ? {
        name: form.adminName.trim(),
        email: form.adminEmail.trim().toLowerCase(),
        password: form.adminPassword,
      } : null);
    } catch (e) {
      toast.error("Lỗi: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial ? `Sửa: ${initial.name}` : "Thêm công ty mới"}
      onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Huỷ</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? "Đang lưu..." : initial ? "Cập nhật" : "Tạo công ty"}
        </button>
      </>}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
        Thông tin công ty
      </div>

      <Field label="Company ID *">
        <input className="input" style={{ width: "100%" }} value={form.id}
          disabled={!!initial}
          onChange={e => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="vd: phan-hospitality"
          style={{ width: "100%", background: initial ? "var(--bg)" : undefined }}
        />
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>Chỉ dùng chữ thường, số, dấu gạch ngang</div>
      </Field>

      <Field label="Tên công ty *">
        <input className="input" style={{ width: "100%" }} value={form.name}
          onChange={e => set("name", e.target.value)} placeholder="VD: Phan Hospitality JSC" />
      </Field>

      <Field label="Owner Email *">
        <input className="input" style={{ width: "100%" }} type="email" value={form.ownerEmail}
          onChange={e => set("ownerEmail", e.target.value)} placeholder="owner@company.com" />
      </Field>

      <div className="form-row">
        <Field label="Điện thoại">
          <input className="input" style={{ width: "100%" }} value={form.phone}
            onChange={e => set("phone", e.target.value)} placeholder="0909 xxx xxx" />
        </Field>
        <Field label="Địa chỉ">
          <input className="input" style={{ width: "100%" }} value={form.address}
            onChange={e => set("address", e.target.value)} placeholder="TP.HCM" />
        </Field>
      </div>

      {/* Plan */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
          Gói dịch vụ
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {Object.entries(PLANS).map(([key, p]) => {
            const PIcon = p.icon;
            const active = form.plan === key;
            return (
              <div key={key} onClick={() => set("plan", key)} style={{
                border: `2px solid ${active ? p.color : "var(--border)"}`,
                borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                background: active ? p.bg : "var(--white)", transition: "all 0.15s", textAlign: "center",
              }}>
                <PIcon size={14} color={p.color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.5 }}>
                  {p.maxProp === 999 ? "∞" : p.maxProp} cơ sở · {p.maxAssets === 9999 ? "∞" : p.maxAssets} TS
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
          Trạng thái
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(STATUS_CFG).map(([key, cfg]) => {
            const SIcon = cfg.icon;
            const active = form.status === key;
            return (
              <div key={key} onClick={() => set("status", key)} style={{
                flex: 1, border: `2px solid ${active ? cfg.color : "var(--border)"}`,
                borderRadius: 8, padding: "7px 8px", cursor: "pointer",
                background: active ? cfg.bg : "var(--white)", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <SIcon size={12} color={cfg.color} />
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: cfg.color }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin account – create only */}
      {!initial && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
            Tài khoản Admin tổng công ty
          </div>
          <div style={{ background: "#E6F1FB", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#185FA5" }}>
            ℹ Tài khoản này được tạo trong Firebase Auth với quyền <strong>Company Admin</strong>
          </div>
          <Field label="Họ tên Admin *">
            <input className="input" style={{ width: "100%" }} value={form.adminName}
              onChange={e => set("adminName", e.target.value)} placeholder="Nguyễn Văn A" />
          </Field>
          <div className="form-row">
            <Field label="Email Admin *">
              <input className="input" style={{ width: "100%" }} type="email" value={form.adminEmail}
                onChange={e => set("adminEmail", e.target.value)} placeholder="admin@company.com" />
            </Field>
            <Field label="Mật khẩu tạm *">
              <input className="input" style={{ width: "100%" }} type="password" value={form.adminPassword}
                onChange={e => set("adminPassword", e.target.value)} placeholder="≥ 6 ký tự" />
            </Field>
          </div>
        </div>
      )}

      <Field label="Ghi chú nội bộ">
        <textarea className="input" style={{ width: "100%", minHeight: 56, resize: "vertical" }}
          value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Thông tin thêm..." />
      </Field>
    </Modal>
  );
}

/* ── COMPANY CARD ────────────────────────────── */
function CompanyCard({ company, stats, onEnter, onEdit, onDelete, onToggleStatus }) {
  const plan   = PLANS[company.plan]         || PLANS.pro;
  const status = STATUS_CFG[company.status]  || STATUS_CFG.active;
  const PlanIcon   = plan.icon;
  const StatusIcon = status.icon;
  const isBlocked  = company.status === "blocked";

  return (
    <div style={{
      background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14,
      overflow: "hidden", display: "flex", flexDirection: "column",
      opacity: isBlocked ? 0.65 : 1, transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Card header */}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {company.name}
            </div>
            <code style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg)", padding: "1px 6px", borderRadius: 4 }}>{company.id}</code>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: plan.bg, color: plan.color, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              <PlanIcon size={9} /> {plan.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: status.bg, color: status.color, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
              <StatusIcon size={9} /> {status.label}
            </span>
          </div>
        </div>
        {company.ownerEmail && (
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
            👤 {company.ownerEmail}
            {company.phone && ` · ${company.phone}`}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
        {[
          { label: "Cơ sở",    val: stats.properties, color: "#185FA5", Icon: Building2 },
          { label: "Tài sản",  val: stats.assets,     color: "#1D9E75", Icon: Package  },
          { label: "Nhân viên",val: stats.staff,       color: "#534AB7", Icon: Users   },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "12px 8px", textAlign: "center",
            borderRight: i < 2 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <s.Icon size={11} color={s.color} />
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div style={{ padding: "8px 16px", fontSize: 11, color: "var(--text3)", flex: 1 }}>
        {company.createdAt && `Tạo ${new Date(company.createdAt).toLocaleDateString("vi-VN")}`}
        {company.address && ` · ${company.address}`}
        {company.notes && <div style={{ marginTop: 3, color: "var(--text2)", fontStyle: "italic" }}>{company.notes}</div>}
      </div>

      {/* Action bar */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--bg)", display: "flex", gap: 6 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={onEnter}
          disabled={isBlocked}
          style={{ flex: 1, justifyContent: "center", gap: 5 }}
        >
          Vào xem <ArrowRight size={13} />
        </button>
        <button className="btn btn-sm btn-icon" onClick={onEdit} title="Sửa"><Pencil size={13} /></button>
        <button
          className="btn btn-sm btn-icon"
          title={isBlocked ? "Kích hoạt lại" : "Tạm ngưng/Khoá"}
          onClick={onToggleStatus}
          style={{ color: isBlocked ? "#1D9E75" : "#854F0B", borderColor: isBlocked ? "#9FE1CB" : "#FAC775" }}
        >
          {isBlocked ? <CheckCircle size={13} /> : <PauseCircle size={13} />}
        </button>
        <button className="btn btn-sm btn-icon btn-danger" onClick={onDelete} title="Xoá"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ──────────────────────────── */
export default function Companies({ companies, setCompanies, allProperties = [], allAssets = [], allStaff = [], onEnterCompany }) {
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [searchQ,     setSearchQ]     = useState("");
  const [filterPlan,  setFilterPlan]  = useState("all");
  const [filterStatus,setFilterStatus]= useState("all");

  const toast   = useToast();
  const confirm = useConfirm();

  const getStats = (cid) => ({
    properties: allProperties.filter(p => String(p.companyId) === String(cid)).length,
    assets:     allAssets.filter(a =>     String(a.companyId) === String(cid)).length,
    staff:      allStaff.filter(s =>      String(s.companyId) === String(cid)).length,
  });

  const filtered = companies.filter(c => {
    const q = searchQ.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
    if (filterPlan   !== "all" && c.plan   !== filterPlan)   return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  const handleSave = async (cleanCompany, adminInfo) => {
    if (editing) {
      await setCompanies(companies.map(c => c.id === editing.id ? cleanCompany : c));
      toast.success(`Đã cập nhật ${cleanCompany.name}`);
    } else {
      if (companies.some(c => c.id === cleanCompany.id)) throw new Error("Company ID đã tồn tại");
      await setCompanies([...companies, cleanCompany]);
      await createCompanyAdmin(cleanCompany.id, adminInfo.email, adminInfo.password, adminInfo.name);
      toast.success(`Đã tạo công ty và tài khoản Admin cho ${cleanCompany.name}`);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (company) => {
    const stats = getStats(company.id);
    const total = stats.properties + stats.assets + stats.staff;
    const ok = await confirm({
      title: `Xoá công ty: ${company.name}?`,
      message: total > 0
        ? `Công ty có ${stats.properties} cơ sở, ${stats.assets} tài sản, ${stats.staff} nhân viên. Xoá chỉ xoá hồ sơ công ty, không xoá dữ liệu. Tiếp tục?`
        : "Hành động này không thể hoàn tác.",
      danger: true,
    });
    if (!ok) return;
    await setCompanies(companies.filter(c => c.id !== company.id));
    toast.warning(`Đã xoá ${company.name}`);
  };

  const handleToggleStatus = async (company) => {
    const next  = company.status === "blocked" ? "active" : "blocked";
    const label = next === "blocked" ? "khoá" : "kích hoạt lại";
    const ok = await confirm({
      title: `${next === "blocked" ? "Khoá" : "Kích hoạt"} công ty?`,
      message: `Bạn sắp ${label} "${company.name}".`,
      danger: next === "blocked",
    });
    if (!ok) return;
    await setCompanies(companies.map(c => c.id === company.id ? { ...c, status: next } : c));
    toast.success(`Đã ${label} ${company.name}`);
  };

  /* Platform summary */
  const totalActive    = companies.filter(c => c.status === "active").length;
  const proCount       = companies.filter(c => c.plan === "pro").length;
  const enterpriseCount= companies.filter(c => c.plan === "enterprise").length;
  const mrrUSD         = proCount * 299 + enterpriseCount * 999;

  return (
    <div>
      {/* Platform KPIs */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Tổng công ty</div>
          <div className="stat-value">{companies.length}</div>
          <div className="stat-sub">{totalActive} đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MRR ước tính</div>
          <div className="stat-value" style={{ color: "var(--green)", fontSize: 22 }}>${mrrUSD.toLocaleString()}</div>
          <div className="stat-sub">Pro $299 · Enterprise $999</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gói Pro</div>
          <div className="stat-value" style={{ color: "#185FA5" }}>{proCount}</div>
          <div className="stat-sub">công ty</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Enterprise</div>
          <div className="stat-value" style={{ color: "#534AB7" }}>{enterpriseCount}</div>
          <div className="stat-sub">công ty</div>
        </div>
      </div>

      {/* Filters + add button */}
      <div style={{
        background: "var(--white)", border: "1px solid var(--border)",
        borderRadius: "12px 12px 0 0", padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input className="input" placeholder="Tìm tên hoặc Company ID..." value={searchQ}
            onChange={e => setSearchQ(e.target.value)} style={{ width: 220 }} />
          <select className="select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="all">Tất cả gói</option>
            {Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_CFG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{filtered.length} công ty</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={14} /> Thêm công ty
        </button>
      </div>

      {/* Company grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14,
        background: "var(--bg)", border: "1px solid var(--border)",
        borderTop: "none", borderRadius: "0 0 12px 12px", padding: 16,
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "var(--text3)", fontSize: 14 }}>
            {searchQ || filterPlan !== "all" || filterStatus !== "all"
              ? "Không tìm thấy công ty phù hợp với bộ lọc"
              : "Chưa có công ty nào — nhấn \"Thêm công ty\" để bắt đầu"}
          </div>
        ) : filtered.map(c => (
          <CompanyCard
            key={c.id}
            company={c}
            stats={getStats(c.id)}
            onEnter={() => onEnterCompany?.(c)}
            onEdit={() => { setEditing(c); setShowForm(true); }}
            onDelete={() => handleDelete(c)}
            onToggleStatus={() => handleToggleStatus(c)}
          />
        ))}
      </div>

      {showForm && (
        <CompanyForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
