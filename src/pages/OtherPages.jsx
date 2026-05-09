// src/pages/OtherPages.jsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, PropFilterBar, UrgencyChip, StatusChip } from '../components/UI.jsx';
import { URGENCIES, MAINT_STATUSES, ROLES } from '../data/store.js';
import { useTranslation } from '../i18n/useTranslation.jsx';

const PERMISSION_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin - Chủ nền tảng' },
  { value: 'company_admin', label: 'Admin tổng công ty' },
  { value: 'admin', label: 'Quản trị hệ thống công ty' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'viewer', label: 'Chỉ xem' },
];

function isSuperAdmin(user) {
  return user?.isSuperAdmin === true || user?.permission === 'super_admin';
}

function isCompanyAdmin(user) {
  return user?.permission === 'company_admin' || user?.permission === 'admin';
}

function canManageStaff(user) {
  return isSuperAdmin(user) || isCompanyAdmin(user);
}

// ---- MAINTENANCE ----
function MaintForm({ initial, properties, assets, onSave, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    assetId: '',
    assetName: '',
    type: '',
    date: new Date().toISOString().slice(0, 10),
    tech: '',
    cost: '',
    status: 'Lên lịch',
    urgency: 'Thường'
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const propAssets = assets.filter(a => Number(a.pid) === Number(form.pid));

  return (
    <Modal
      title={initial?.id ? t('maintenance.edit') : t('maintenance.create')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!form.assetName) return alert(t('maintenance.selectAsset'));
              onSave(form);
            }}
          >
            {t('common.save')}
          </button>
        </>
      }
    >
      <Field label={t('common.branch')}>
        <select className="select" value={form.pid} onChange={e => set('pid', parseInt(e.target.value))}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <Field label={t('maintenance.asset')}>
        <select
          className="select"
          value={form.assetId}
          onChange={e => {
            const a = assets.find(x => String(x.id) === String(e.target.value));
            set('assetId', e.target.value);
            set('assetName', a?.name || '');
          }}
        >
          <option value="">{t('maintenance.selectAsset')}</option>
          {propAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>

      <Field label={t('maintenance.content')}>
        <input className="input" value={form.type} onChange={e => set('type', e.target.value)} placeholder={t('maintenance.contentPlaceholder')} />
      </Field>

      <div className="form-row">
        <Field label={t('common.date')}>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>

        <Field label={t('maintenance.technician')}>
          <input className="input" value={form.tech} onChange={e => set('tech', e.target.value)} placeholder={t('maintenance.techPlaceholder')} />
        </Field>
      </div>

      <div className="form-row">
        <Field label={t('common.cost') + ' (VNĐ)'}>
          <input className="input" type="number" value={form.cost} onChange={e => set('cost', parseInt(e.target.value) || 0)} />
        </Field>

        <Field label={t('maintenance.urgency')}>
          <select className="select" value={form.urgency} onChange={e => set('urgency', e.target.value)}>
            {URGENCIES.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      <Field label={t('common.status')}>
        <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
          {MAINT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
    </Modal>
  );
}

export function Maintenance({ properties, assets, maintenance, setMaintenance }) {
  const { t } = useTranslation();
  const [selProp, setSelProp] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = selProp === 'all'
    ? maintenance
    : maintenance.filter(m => Number(m.pid) === Number(selProp));

  const urgent = filtered.filter(m =>
    (m.urgency === 'Khẩn' || m.urgency === 'Urgent') &&
    m.status !== 'Hoàn thành' &&
    m.status !== 'Completed'
  ).length;

  const handleSave = (form) => {
    if (editing) {
      setMaintenance(maintenance.map(m => m.id === editing.id ? { ...editing, ...form } : m));
    } else {
      setMaintenance([...maintenance, { ...form, id: String(Date.now()) }]);
    }

    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">{t('maintenance.totalSchedules')}</div><div className="stat-value">{filtered.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('maintenance.urgent')}</div><div className="stat-value" style={{ color: 'var(--red)' }}>{urgent}</div></div>
        <div className="stat-card"><div className="stat-label">{t('maintenance.inProgress')}</div><div className="stat-value">{filtered.filter(m => m.status === 'Đang thực hiện' || m.status === 'In Progress').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('maintenance.completed')}</div><div className="stat-value" style={{ color: 'var(--green)' }}>{filtered.filter(m => m.status === 'Hoàn thành' || m.status === 'Completed').length}</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('nav.maintenance')}</span>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14} /> {t('maintenance.add')}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.branch')}</th>
                <th>{t('maintenance.asset')}</th>
                <th>{t('maintenance.content')}</th>
                <th>{t('common.date')}</th>
                <th>{t('maintenance.technician')}</th>
                <th>{t('common.cost')}</th>
                <th>{t('maintenance.urgency')}</th>
                <th>{t('common.status')}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
                    {t('common.noData')}
                  </td>
                </tr>
              ) : filtered.map(m => {
                const p = properties.find(x => Number(x.id) === Number(m.pid));

                return (
                  <tr key={m.id}>
                    <td>{p && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: p.color + '22', color: p.color, fontWeight: 500 }}>{p.city}</span>}</td>
                    <td style={{ fontWeight: 500 }}>{m.assetName}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{m.type}</td>
                    <td style={{ fontSize: 12 }}>{m.date ? new Date(m.date).toLocaleDateString('vi-VN') : '—'}</td>
                    <td style={{ fontSize: 12 }}>{m.tech}</td>
                    <td style={{ fontSize: 12 }}>{m.cost ? parseInt(m.cost).toLocaleString('vi-VN') : '—'}</td>
                    <td><UrgencyChip urgency={m.urgency} /></td>
                    <td><StatusChip status={m.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-icon" onClick={() => { setEditing(m); setShowForm(true); }}>
                          <Pencil size={12} />
                        </button>

                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => {
                            if (confirm(t('maintenance.deleteConfirm'))) {
                              setMaintenance(maintenance.filter(x => x.id !== m.id));
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <MaintForm
          initial={editing}
          properties={properties}
          assets={assets}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ---- DEPRECIATION ----
export function Depreciation({ properties, assets }) {
  const { t } = useTranslation();
  const [selProp, setSelProp] = useState('all');

  const currentYear = new Date().getFullYear();

  const filtered = selProp === 'all'
    ? assets
    : assets.filter(a => Number(a.pid) === Number(selProp));

  const expired = filtered.filter(a => (currentYear - Number(a.year || currentYear)) >= Number(a.lifespan || 1)).length;
  const near = filtered.filter(a => {
    const r = Number(a.lifespan || 1) - (currentYear - Number(a.year || currentYear));
    return r > 0 && r <= 2;
  }).length;

  return (
    <div>
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">{t('depreciation.tracking')}</div><div className="stat-value">{filtered.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('depreciation.expired')}</div><div className="stat-value" style={{ color: 'var(--red)' }}>{expired}</div></div>
        <div className="stat-card"><div className="stat-label">{t('depreciation.nearExpiry')}</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{near}</div></div>
        <div className="stat-card"><div className="stat-label">{t('depreciation.stillValid')}</div><div className="stat-value" style={{ color: 'var(--green)' }}>{filtered.length - expired - near}</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('nav.depreciation')}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.branch')}</th>
                <th>{t('common.name')}</th>
                <th>{t('depreciation.originalCost')}</th>
                <th>{t('depreciation.usedYears')}</th>
                <th>{t('depreciation.remaining')}</th>
                <th style={{ width: 150 }}>{t('depreciation.progress')}</th>
                <th>{t('depreciation.condition')}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(a => {
                const p = properties.find(x => Number(x.id) === Number(a.pid));
                const used = currentYear - Number(a.year || currentYear);
                const lifespan = Number(a.lifespan || 1);
                const pct = Math.min(100, Math.round(used / lifespan * 100));
                const rem = Math.max(0, lifespan - used);
                const color = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75';
                const chipType = pct >= 100 ? 'red' : pct >= 80 ? 'amber' : 'green';
                const chipLabel = pct >= 100 ? t('depreciation.statuses.expired') : pct >= 80 ? t('depreciation.statuses.nearEnd') : t('depreciation.statuses.valid');

                return (
                  <tr key={a.id}>
                    <td>{p && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: p.color + '22', color: p.color, fontWeight: 500 }}>{p.city}</span>}</td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td style={{ fontSize: 12 }}>{a.value ? (a.value / 1e6).toFixed(0) + ' tr' : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{used}/{lifespan} {t('depreciation.years')}</td>
                    <td style={{ fontSize: 12 }}>{rem} {t('depreciation.years')}</td>
                    <td>
                      <div className="progress-wrap">
                        <div className="progress-bar" style={{ width: pct + '%', background: color }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}%</span>
                    </td>
                    <td><span className={`chip chip-${chipType}`}>{chipLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- STAFF FORM ----
function StaffForm({
  initial,
  properties,
  onSave,
  onClose,
  currentUser
}) {
  const { t } = useTranslation();

  const superAdmin = isSuperAdmin(currentUser);
  const companyAdmin = isCompanyAdmin(currentUser);

  const allowedPermissions = superAdmin
    ? PERMISSION_OPTIONS
    : PERMISSION_OPTIONS.filter(p =>
        ['admin', 'manager', 'staff', 'viewer'].includes(p.value)
      );

  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    name: '',
    role: 'Nhân viên',
    dept: '',
    email: '',
    status: 'Hoạt động',
    permission: companyAdmin ? 'staff' : 'company_admin',
    companyId: currentUser?.companyId || '',
    isSuperAdmin: false
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) return alert(t('staff.fullName'));
    if (!form.email.trim()) return alert('Email?');

    if (!superAdmin && !currentUser?.companyId) {
      return alert('Tài khoản của bạn chưa có companyId');
    }

    const clean = {
      ...form,
      email: form.email.trim().toLowerCase(),
      companyId: superAdmin
        ? String(form.companyId || '').trim()
        : currentUser.companyId,
      isSuperAdmin: form.permission === 'super_admin'
    };

    if (!clean.companyId) return alert('Nhập Company ID');

    if (!superAdmin && ['super_admin', 'company_admin'].includes(clean.permission)) {
      return alert('Bạn không được cấp quyền super_admin hoặc company_admin');
    }

    onSave(clean);
  };

  return (
    <div>
      {superAdmin && (
        <Field label="Company ID">
          <input
            className="input"
            value={form.companyId || ''}
            onChange={e => set('companyId', e.target.value)}
            placeholder="vd: phan-hospitality"
          />
        </Field>
      )}

      {!superAdmin && (
        <Field label="Company ID">
          <input
            className="input"
            value={currentUser?.companyId || ''}
            disabled
          />
        </Field>
      )}

      <Field label={t('common.branch')}>
        <select className="select" value={form.pid} onChange={e => set('pid', parseInt(e.target.value))}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <Field label={t('staff.fullName')}>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('staff.namePlaceholder')} />
      </Field>

      <div className="form-row">
        <Field label={t('staff.role')}>
          <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
            <option>CEO</option>
            <option>Admin tổng công ty</option>
            <option>Quản lý khách sạn</option>
            <option>Quản lý tài sản</option>
            <option>Kỹ thuật</option>
            <option>Nhân viên</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>

        <Field label={t('staff.department')}>
          <select className="select" value={form.dept} onChange={e => set('dept', e.target.value)}>
            <option value="">Chọn bộ phận</option>
            <option>Ban Giám Đốc</option>
            <option>Quản lý tài sản</option>
            <option>Kỹ thuật</option>
            <option>Buồng phòng</option>
            <option>Lễ tân</option>
            <option>Kế toán</option>
            <option>Vận hành</option>
          </select>
        </Field>
      </div>

      <Field label={t('common.email')}>
        <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={t('staff.emailPlaceholder')} />
      </Field>

      <div className="form-row">
        <Field label={t('staff.permission')}>
          <select className="select" value={form.permission} onChange={e => set('permission', e.target.value)}>
            {allowedPermissions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>

        <Field label={t('common.status')}>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="Hoạt động">{t('staff.statuses.active')}</option>
            <option value="Nghỉ phép">{t('staff.statuses.onLeave')}</option>
            <option value="Tạm nghỉ">{t('staff.statuses.inactive')}</option>
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" onClick={save}>{t('common.save')}</button>
      </div>
    </div>
  );
}

// ---- STAFF ----
export function Staff({ properties, staff, setStaff, currentUser }) {
  const { t } = useTranslation();

  const [selProp, setSelProp] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const superAdmin = isSuperAdmin(currentUser);
  const manager = canManageStaff(currentUser);

  const visibleStaff = superAdmin
    ? staff
    : staff.filter(s => s.companyId === currentUser?.companyId);

  const filtered = selProp === 'all'
    ? visibleStaff
    : visibleStaff.filter(s => Number(s.pid) === Number(selProp));

  const handleSave = (form) => {
    const clean = {
      ...form,
      id: editing?.id || String(Date.now()),
      companyId: superAdmin ? form.companyId : currentUser?.companyId,
      isSuperAdmin: form.permission === 'super_admin'
    };

    if (editing) {
      setStaff(staff.map(s => s.id === editing.id ? { ...editing, ...clean } : s));
    } else {
      setStaff([...staff, clean]);
    }

    setShowForm(false);
    setEditing(null);
  };

  const PERM_CHIP = {
    super_admin: <span className="chip chip-red">Super Admin</span>,
    company_admin: <span className="chip chip-blue">Admin tổng công ty</span>,
    admin: <span className="chip chip-blue">{t('staff.permissions.admin')}</span>,
    manager: <span className="chip chip-purple">{t('staff.permissions.manager')}</span>,
    staff: <span className="chip chip-green">{t('staff.permissions.staff')}</span>,
    viewer: <span className="chip chip-gray">{t('staff.permissions.viewer')}</span>,
  };

  return (
    <div>
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">{t('staff.totalStaff')}</div><div className="stat-value">{filtered.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('staff.working')}</div><div className="stat-value" style={{ color: 'var(--green)' }}>{filtered.filter(s => s.status === 'Hoạt động' || s.status === 'Active').length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('staff.onLeave')}</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{filtered.filter(s => s.status !== 'Hoạt động' && s.status !== 'Active').length}</div></div>
        <div className="stat-card"><div className="stat-label">Công ty</div><div className="stat-value" style={{ fontSize: 18 }}>{superAdmin ? 'All' : currentUser?.companyId || '—'}</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('nav.staff')}</span>

          {manager && (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={14} /> {t('staff.add')}
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company ID</th>
                <th>{t('common.branch')}</th>
                <th>{t('common.name')}</th>
                <th>{t('staff.role')}</th>
                <th>{t('staff.department')}</th>
                <th>{t('common.email')}</th>
                <th>{t('staff.permission')}</th>
                <th>{t('common.status')}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
                    {t('staff.noStaff')}
                  </td>
                </tr>
              ) : filtered.map(s => {
                const p = properties.find(x => Number(x.id) === Number(s.pid));
                const initials = s.name ? s.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() : '?';
                const propColor = p?.color || '#1D9E75';

                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: 11, color: 'var(--text3)' }}>{s.companyId || '—'}</td>

                    <td>{p && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: propColor + '22', color: propColor, fontWeight: 500 }}>{p.city}</span>}</td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: propColor + '22', color: propColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>

                    <td style={{ fontSize: 12 }}>{s.role}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{s.dept}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{s.email}</td>
                    <td>{PERM_CHIP[s.permission] || <span className="chip chip-gray">{s.permission}</span>}</td>
                    <td><span className={`chip ${s.status === 'Hoạt động' || s.status === 'Active' ? 'chip-green' : 'chip-gray'}`}>{s.status}</span></td>

                    <td>
                      {manager && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-icon" onClick={() => { setEditing(s); setShowForm(true); }}>
                            <Pencil size={12} />
                          </button>

                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              if (s.permission === 'super_admin' && !superAdmin) return alert('Không được xoá super admin');
                              if (confirm(t('staff.deleteConfirm') + ' ' + s.name + '?')) {
                                setStaff(staff.filter(x => x.id !== s.id));
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal
          title={editing?.id ? t('staff.edit') : t('staff.addNew')}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          footer={null}
        >
          <StaffForm
            initial={editing}
            properties={properties}
            currentUser={currentUser}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// ---- INVENTORY FORM ----
function InventoryForm({ initial, properties, onSave, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    code: '',
    name: '',
    category: 'Buồng phòng',
    qty: 0,
    minQty: 0,
    unit: 'Cái',
    price: 0
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const INV_CATS = ['Buồng phòng', 'Kỹ thuật', 'F&B', 'Vệ sinh', 'Văn phòng'];

  return (
    <div>
      <Field label={t('common.branch')}>
        <select className="select" value={form.pid} onChange={e => set('pid', parseInt(e.target.value))}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <div className="form-row">
        <Field label={t('inventory.itemCode')}>
          <input className="input" value={form.code} onChange={e => set('code', e.target.value)} placeholder={t('inventory.codePlaceholder')} />
        </Field>

        <Field label={t('inventory.category')}>
          <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
            {INV_CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <Field label={t('common.name') + ' *'}>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('inventory.namePlaceholder')} />
      </Field>

      <div className="form-row">
        <Field label={t('inventory.stockQty')}>
          <input className="input" type="number" value={form.qty} onChange={e => set('qty', parseInt(e.target.value) || 0)} />
        </Field>

        <Field label={t('inventory.minQtyLabel')}>
          <input className="input" type="number" value={form.minQty} onChange={e => set('minQty', parseInt(e.target.value) || 0)} />
        </Field>
      </div>

      <div className="form-row">
        <Field label={t('inventory.unit')}>
          <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder={t('inventory.unitPlaceholder')} />
        </Field>

        <Field label={t('inventory.unitPrice')}>
          <input className="input" type="number" value={form.price} onChange={e => set('price', parseInt(e.target.value) || 0)} />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.name) return alert(t('common.name'));
            onSave(form);
          }}
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

// ---- INVENTORY ----
export function Inventory({ properties, inventory, setInventory }) {
  const { t } = useTranslation();
  const [selProp, setSelProp] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = selProp === 'all'
    ? inventory
    : inventory.filter(i => Number(i.pid) === Number(selProp));

  const low = filtered.filter(i => Number(i.qty || 0) < Number(i.minQty || 0)).length;

  const handleSave = (form) => {
    if (editing) {
      setInventory(inventory.map(i => i.id === editing.id ? { ...editing, ...form } : i));
    } else {
      setInventory([...inventory, { ...form, id: String(Date.now()) }]);
    }

    setShowForm(false);
    setEditing(null);
  };

  const totalVal = filtered.reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0);
  const fmtVal = v => v >= 1e9 ? (v / 1e9).toFixed(1) + ' tỷ' : v >= 1e6 ? (v / 1e6).toFixed(0) + ' tr' : v.toLocaleString();

  return (
    <div>
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">{t('inventory.totalItems')}</div><div className="stat-value">{filtered.length}</div></div>
        <div className="stat-card"><div className="stat-label">{t('inventory.lowStock')}</div><div className="stat-value" style={{ color: low > 0 ? 'var(--red)' : 'inherit' }}>{low}</div></div>
        <div className="stat-card"><div className="stat-label">{t('inventory.inStock')}</div><div className="stat-value" style={{ color: 'var(--green)' }}>{filtered.length - low}</div></div>
        <div className="stat-card"><div className="stat-label">{t('inventory.totalValue')}</div><div className="stat-value" style={{ fontSize: 18 }}>{fmtVal(totalVal)}</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('nav.inventory')}</span>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14} /> {t('inventory.add')}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.branch')}</th>
                <th>{t('inventory.itemCode')}</th>
                <th>{t('common.name')}</th>
                <th>{t('inventory.category')}</th>
                <th>{t('inventory.stockQty')}</th>
                <th>{t('inventory.minQty')}</th>
                <th style={{ width: 140 }}>{t('inventory.stockLevel')}</th>
                <th>{t('inventory.unit')}</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
                    {t('inventory.noItems')}
                  </td>
                </tr>
              ) : filtered.map(item => {
                const p = properties.find(x => Number(x.id) === Number(item.pid));
                const pct = Number(item.minQty || 0) > 0 ? Math.min(100, Math.round(Number(item.qty || 0) / Number(item.minQty || 1) * 100)) : 100;
                const color = pct >= 100 ? '#1D9E75' : pct >= 60 ? '#EF9F27' : '#E24B4A';

                return (
                  <tr key={item.id}>
                    <td>{p && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: p.color + '22', color: p.color, fontWeight: 500 }}>{p.city}</span>}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)' }}>{item.code}</td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td><span className="chip chip-gray">{item.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{Number(item.qty || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{item.minQty}</td>
                    <td>
                      <div className="progress-wrap">
                        <div className="progress-bar" style={{ width: Math.min(100, pct) + '%', background: color }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}%</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{item.unit}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-icon" onClick={() => { setEditing(item); setShowForm(true); }}>
                          <Pencil size={12} />
                        </button>

                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => {
                            if (confirm(t('inventory.delete'))) {
                              setInventory(inventory.filter(x => x.id !== item.id));
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <Modal
          title={editing?.id ? t('inventory.edit') : t('inventory.addNew')}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          footer={null}
        >
          <InventoryForm
            initial={editing}
            properties={properties}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}