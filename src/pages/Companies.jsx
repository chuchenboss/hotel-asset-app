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
import { useTranslation } from "../i18n/useTranslation.jsx";

/* ── PLAN CONFIG ─────────────────────────────── */
const PLANS = {
  free:       { label: "Free",       color: "#5F5E5A", bg: "#F1EFE8", icon: Star,  maxProp: 1,   maxAssets: 50,   maxStaff: 5   },
  pro:        { label: "Pro",        color: "#185FA5", bg: "#E6F1FB", icon: Zap,   maxProp: 5,   maxAssets: 500,  maxStaff: 20  },
  enterprise: { label: "Enterprise", color: "#534AB7", bg: "#EEEDFE", icon: Crown, maxProp: 999, maxAssets: 9999, maxStaff: 999 },
};

const STATUS_CFG = {
  active:  { labelVI: "Hoạt động", labelEN: "Active",  color: "#0F6E56", bg: "#E1F5EE", icon: CheckCircle },
  paused:  { labelVI: "Tạm ngưng", labelEN: "Paused",  color: "#854F0B", bg: "#FAEEDA", icon: PauseCircle },
  blocked: { labelVI: "Đã khoá",   labelEN: "Blocked", color: "#A32D2D", bg: "#FCEBEB", icon: XCircle    },
};

const sl = (cfg, lang) => lang === "en" ? cfg.labelEN : cfg.labelVI;

/* ── COMPANY FORM ────────────────────────────── */
function CompanyForm({ initial, onSave, onClose }) {
  const { lang } = useTranslation();
  const en = lang === "en";
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
    if (!form.id.trim())   return en ? "Please enter Company ID" : "Vui lòng nhập Company ID";
    if (!/^[a-z0-9-]+$/.test(form.id.trim())) return en ? "Company ID: lowercase, numbers, hyphens only" : "Company ID chỉ dùng chữ thường, số, dấu -";
    if (!form.name.trim()) return en ? "Please enter company name" : "Vui lòng nhập tên công ty";
    if (!form.ownerEmail.trim()) return en ? "Please enter owner email" : "Vui lòng nhập Owner Email";
    if (!initial) {
      if (!form.adminName.trim())  return en ? "Please enter admin name" : "Vui lòng nhập tên Admin";
      if (!form.adminEmail.trim()) return en ? "Please enter admin email" : "Vui lòng nhập email Admin";
      if (!form.adminPassword || form.adminPassword.length < 6) return en ? "Password must be ≥ 6 chars" : "Mật khẩu phải ≥ 6 ký tự";
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) return toast.error(err);
    const clean = {
      id: form.id.trim(), name: form.name.trim(),
      ownerEmail: form.ownerEmail.trim().toLowerCase(),
      plan: form.plan, status: form.status,
      phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim(),
      createdAt: initial?.createdAt || Date.now(), updatedAt: Date.now(),
    };
    try {
      setSaving(true);
      await onSave(clean, !initial ? {
        name: form.adminName.trim(),
        email: form.adminEmail.trim().toLowerCase(),
        password: form.adminPassword,
      } : null);
    } catch (e) {
      toast.error((en ? "Error: " : "Lỗi: ") + e.message);
    } finally { setSaving(false); }
  };

  const sec = (vi, enLabel) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
      {en ? enLabel : vi}
    </div>
  );

  return (
    <Modal
      title={initial ? `${en ? "Edit" : "Sửa"}: ${initial.name}` : (en ? "Add New Company" : "Thêm công ty mới")}
      onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>{en ? "Cancel" : "Huỷ"}</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? (en ? "Saving..." : "Đang lưu...") : initial ? (en ? "Update" : "Cập nhật") : (en ? "Create Company" : "Tạo công ty")}
        </button>
      </>}
    >
      {sec("Thông tin công ty", "Company Information")}

      <Field label="Company ID *">
        <input className="input" value={form.id} disabled={!!initial}
          onChange={e => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="e.g. phan-hospitality"
          style={{ width: "100%", background: initial ? "var(--bg)" : undefined }} />
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
          {en ? "Lowercase letters, numbers, hyphens only" : "Chỉ dùng chữ thường, số, dấu gạch ngang"}
        </div>
      </Field>

      <Field label={en ? "Company Name *" : "Tên công ty *"}>
        <input className="input" style={{ width: "100%" }} value={form.name}
          onChange={e => set("name", e.target.value)} placeholder="e.g. Phan Hospitality JSC" />
      </Field>

      <Field label="Owner Email *">
        <input className="input" style={{ width: "100%" }} type="email" value={form.ownerEmail}
          onChange={e => set("ownerEmail", e.target.value)} placeholder="owner@company.com" />
      </Field>

      <div className="form-row">
        <Field label={en ? "Phone" : "Điện thoại"}>
          <input className="input" style={{ width: "100%" }} value={form.phone}
            onChange={e => set("phone", e.target.value)} placeholder="0909 xxx xxx" />
        </Field>
        <Field label={en ? "Address" : "Địa chỉ"}>
          <input className="input" style={{ width: "100%" }} value={form.address}
            onChange={e => set("address", e.target.value)} placeholder="Ho Chi Minh City" />
        </Field>
      </div>

      <div style={{ marginBottom: 14 }}>
        {sec("Gói dịch vụ", "Subscription Plan")}
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
                  {p.maxProp === 999 ? "∞" : p.maxProp} {en ? "prop" : "cơ sở"} · {p.maxAssets === 9999 ? "∞" : p.maxAssets} {en ? "assets" : "TS"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        {sec("Trạng thái", "Status")}
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
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: cfg.color }}>{sl(cfg, lang)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!initial && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 14 }}>
          {sec("Tài khoản Admin tổng công ty", "Company Admin Account")}
          <div style={{ background: "#E6F1FB", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#185FA5" }}>
            ℹ {en
              ? <><strong>Company Admin</strong> account will be created in Firebase Auth</>
              : <>Tài khoản <strong>Company Admin</strong> được tạo trong Firebase Auth</>}
          </div>
          <Field label={en ? "Admin Full Name *" : "Họ tên Admin *"}>
            <input className="input" style={{ width: "100%" }} value={form.adminName}
              onChange={e => set("adminName", e.target.value)} placeholder="Nguyen Van A" />
          </Field>
          <div className="form-row">
            <Field label="Admin Email *">
              <input className="input" style={{ width: "100%" }} type="email" value={form.adminEmail}
                onChange={e => set("adminEmail", e.target.value)} placeholder="admin@company.com" />
            </Field>
            <Field label={en ? "Temp Password *" : "Mật khẩu tạm *"}>
              <input className="input" style={{ width: "100%" }} type="password" value={form.adminPassword}
                onChange={e => set("adminPassword", e.target.value)} placeholder="≥ 6 chars" />
            </Field>
          </div>
        </div>
      )}

      <Field label={en ? "Internal Notes" : "Ghi chú nội bộ"}>
        <textarea className="input" style={{ width: "100%", minHeight: 56, resize: "vertical" }}
          value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder={en ? "Additional info..." : "Thông tin thêm..."} />
      </Field>
    </Modal>
  );
}

/* ── COMPANY CARD ────────────────────────────── */
function CompanyCard({ company, stats, onEnter, onEdit, onDelete, onToggleStatus }) {
  const { lang } = useTranslation();
  const en = lang === "en";
  const plan      = PLANS[company.plan]        || PLANS.pro;
  const status    = STATUS_CFG[company.status] || STATUS_CFG.active;
  const PlanIcon   = plan.icon;
  const StatusIcon = status.icon;
  const isBlocked  = company.status === "blocked";

  const createdDate = company.createdAt
    ? new Date(company.createdAt).toLocaleDateString(en ? "en-US" : "vi-VN", { day: "numeric", month: "numeric", year: "numeric" })
    : "—";

  return (
    <div style={{
      background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14,
      overflow: "hidden", display: "flex", flexDirection: "column",
      opacity: isBlocked ? 0.65 : 1, transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text1)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {company.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>{company.id}</div>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: plan.color, background: plan.bg, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
              <PlanIcon size={9} /> {plan.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: status.color, background: status.bg, padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
              <StatusIcon size={9} /> {sl(status, lang)}
            </span>
          </div>
        </div>
        {company.ownerEmail && (
          <div style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={10} /> {company.ownerEmail}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
        {[
          { icon: Building2, val: stats.props,  label: en ? "Properties" : "Cơ sở"    },
          { icon: Package,   val: stats.assets, label: en ? "Assets"     : "Tài sản"  },
          { icon: Users,     val: stats.staff,  label: en ? "Staff"      : "Nhân viên" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "10px 0", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text1)" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 2 }}>
              <s.icon size={10} /> {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, color: "var(--text3)" }}>
          {en ? "Created" : "Tạo"} {createdDate}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn btn-sm btn-icon" onClick={onEdit}><Pencil size={12} /></button>
          <button className="btn btn-sm btn-icon" onClick={onToggleStatus}
            style={{ color: isBlocked ? "var(--green)" : "var(--amber)" }}>
            {isBlocked ? <CheckCircle size={12} /> : <PauseCircle size={12} />}
          </button>
          <button className="btn btn-sm btn-icon btn-danger" onClick={onDelete}><Trash2 size={12} /></button>
        </div>
      </div>

      <button onClick={onEnter} style={{
        margin: "0 18px 14px", padding: "9px", borderRadius: 9,
        background: "var(--green)", border: "none", color: "white",
        fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        transition: "background 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#0F6E56"}
        onMouseLeave={e => e.currentTarget.style.background = "var(--green)"}
      >
        {en ? "View Company" : "Vào xem"} <ArrowRight size={13} />
      </button>
    </div>
  );
}

/* ── MAIN PAGE ───────────────────────────────── */
export default function Companies({ companies, setCompanies, allProperties, allAssets, allStaff, onEnterCompany }) {
  const { lang } = useTranslation();
  const en = lang === "en";
  const toast   = useToast();
  const confirm = useConfirm();

  const [search, setSearch]             = useState("");
  const [filterPlan, setFilterPlan]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState(null);

  const filtered = companies.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlan   && c.plan   !== filterPlan)   return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const getStats = (c) => ({
    props:  allProperties.filter(p => String(p.companyId) === String(c.id)).length,
    assets: allAssets.filter(a => String(a.companyId) === String(c.id)).length,
    staff:  allStaff.filter(s => String(s.companyId) === String(c.id)).length,
  });

  const activeCount = companies.filter(c => c.status === "active").length;
  const mrr = companies.reduce((s, c) => {
    if (c.status === "blocked") return s;
    if (c.plan === "pro")        return s + 299;
    if (c.plan === "enterprise") return s + 999;
    return s;
  }, 0);
  const proCount = companies.filter(c => c.plan === "pro").length;
  const entCount = companies.filter(c => c.plan === "enterprise").length;

  const handleSave = async (company, adminCreds) => {
    if (adminCreds) {
      try {
        await createCompanyAdmin(
          company.id,
          adminCreds.email,
          adminCreds.password,
          adminCreds.name,
        );
      } catch (e) {
        if (!e.message.includes("already")) throw e;
      }
    }
    const exists = companies.find(c => c.id === company.id);
    const updated = exists
      ? companies.map(c => c.id === company.id ? company : c)
      : [...companies, company];
    await setCompanies(updated);
    toast.success(en ? "Company saved!" : "Đã lưu công ty!");
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (company) => {
    const ok = await confirm({
      message: en ? `Delete "${company.name}"? This cannot be undone.` : `Xoá công ty "${company.name}"? Không thể hoàn tác.`,
      title: en ? 'Confirm Delete' : 'Xác nhận xoá',
      danger: true,
    });
    if (!ok) return;
    await setCompanies(companies.filter(c => c.id !== company.id));
    toast.success(en ? "Company deleted" : "Đã xoá công ty");
  };

  const handleToggle = async (company) => {
    const next = company.status === "blocked" ? "active" : "blocked";
    await setCompanies(companies.map(c => c.id === company.id ? { ...c, status: next } : c));
    toast.info(en ? `Status changed to ${next}` : `Đã đổi trạng thái thành ${next}`);
  };

  const kpis = [
    { label: en ? "TOTAL COMPANIES" : "TONG CONG TY", value: companies.length, sub: activeCount + (en ? " active" : " hoat dong") },
    { label: en ? "PRO PLAN"        : "GOI PRO",       value: proCount,         sub: en ? "companies" : "cong ty" },
    { label: "ENTERPRISE",                              value: entCount,         sub: en ? "companies" : "cong ty" },
    { label: en ? "EST. MRR"        : "DOANH THU/THANG", value: "$" + mrr.toLocaleString(), sub: "Pro $299 - Enterprise $999" },
  ];

  return (
    <div>
      {/* KPI strip */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} className="stat-card">
            <div className="stat-label">{k.label}</div>
            <div className="stat-value">{k.value}</div>
            <div className="stat-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="panel">
        <div className="panel-header" style={{ flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <input
              className="input" style={{ maxWidth: 220 }}
              placeholder={en ? "Search..." : "Tim kiem..."}
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <select className="select" style={{ maxWidth: 160 }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
              <option value="">{en ? "All Plans" : "Tat ca goi"}</option>
              {Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
            <select className="select" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{en ? "All Statuses" : "Tat ca trang thai"}</option>
              {Object.entries(STATUS_CFG).map(([k, cfg]) => <option key={k} value={k}>{sl(cfg, lang)}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            + {en ? "Add Company" : "Them cong ty"}
          </button>
        </div>

        {/* Company grid */}
        <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text3)" }}>
              {en ? "No companies found." : "Khong co cong ty nao."}
            </div>
          ) : filtered.map(c => (
            <CompanyCard
              key={c.id}
              company={c}
              stats={getStats(c)}
              onEnter={() => onEnterCompany(c)}
              onEdit={() => { setEditing(c); setShowForm(true); }}
              onDelete={() => handleDelete(c)}
              onToggleStatus={() => handleToggle(c)}
            />
          ))}
        </div>
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
