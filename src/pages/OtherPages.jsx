// src/pages/OtherPages.jsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, PropFilterBar, UrgencyChip, StatusChip, formatVND } from '../components/UI.jsx';
import { URGENCIES, MAINT_STATUSES, ROLES } from '../data/store.js';
import { createStaffAccount } from '../data/firebase.js';
import { useTranslation } from '../i18n/useTranslation.jsx';
import { useToast, useConfirm } from '../components/Toast.jsx';

const PERMISSION_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin - Chủ nền tảng' },
  { value: 'company_admin', label: 'Admin tổng công ty' },
  { value: 'admin', label: 'Quản trị hệ thống công ty' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'viewer', label: 'Chỉ xem' },
];

function checkSuperAdmin(user) {
  return user?.isSuperAdmin === true || user?.permission === 'super_admin';
}

function checkCompanyAdmin(user) {
  return user?.permission === 'company_admin' || user?.permission === 'admin';
}

function checkCanManageStaff(user) {
  return checkSuperAdmin(user) || checkCompanyAdmin(user);
}

/* ================= MAINTENANCE ================= */

function MaintForm({ initial, properties, assets, onSave, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    assetId: '',
    assetName: '',
    type: '',
    date: new Date().toISOString().slice(0, 10),
    tech: '',
    cost: '',
    status: 'Lên lịch',
    urgency: 'Thường',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const propAssets = assets.filter(a =>
    Number(a.pid) === Number(form.pid)
  );

  const save = () => {
    if (!form.assetName) return toast.error(t('maintenance.selectAsset'));

    onSave({
      ...form,
      ...(form.pid ? { pid: Number(form.pid) } : {}),
    });
  };

  return (
    <Modal
      title={initial?.id ? t('maintenance.edit') : t('maintenance.create')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>

          <button className="btn btn-primary" onClick={save}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <Field label={t('common.branch')}>
        <select
          className="select"
          value={form.pid || ''}
          onChange={e => set('pid', e.target.value)}
        >
          <option value="">{t('common.selectBranch')}</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('maintenance.asset')}>
        <select
          className="select"
          value={form.assetId || ''}
          onChange={e => {
            const a = assets.find(x => String(x.id) === String(e.target.value));
            set('assetId', e.target.value);
            set('assetName', a?.name || '');
          }}
        >
          <option value="">{t('maintenance.selectAsset')}</option>
          {propAssets.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('maintenance.content')}>
        <input
          className="input"
          value={form.type}
          onChange={e => set('type', e.target.value)}
        />
      </Field>

      <div className="form-row">
        <Field label={t('common.date')}>
          <input
            className="input"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
          />
        </Field>

        <Field label={t('maintenance.technician')}>
          <input
            className="input"
            value={form.tech}
            onChange={e => set('tech', e.target.value)}
          />
        </Field>
      </div>

      <div className="form-row">
        <Field label={t('common.cost') + ' (VNĐ)'}>
          <input
            className="input"
            type="number"
            value={form.cost}
            onChange={e => set('cost', parseInt(e.target.value) || 0)}
          />
        </Field>

        <Field label={t('maintenance.urgency')}>
          <select
            className="select"
            value={form.urgency}
            onChange={e => set('urgency', e.target.value)}
          >
            {URGENCIES.map(u => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('common.status')}>
        <select
          className="select"
          value={form.status}
          onChange={e => set('status', e.target.value)}
        >
          {MAINT_STATUSES.map(s => (
            <option key={s}>{s}</option>
          ))}
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

  const handleSave = (form) => {
    if (editing) {
      setMaintenance(
        maintenance.map(m =>
          m.id === editing.id ? { ...editing, ...form } : m
        )
      );
    } else {
      setMaintenance([
        ...maintenance,
        {
          ...form,
          id: String(Date.now()),
        },
      ]);
    }

    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <PropFilterBar
        props={properties}
        selected={selProp}
        onSelect={setSelProp}
      />

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            {t('nav.maintenance')}
          </span>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
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
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      padding: 32,
                      color: 'var(--text3)',
                    }}
                  >
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filtered.map(m => {
                  const p = properties.find(x => Number(x.id) === Number(m.pid));

                  return (
                    <tr key={m.id}>
                      <td>{p?.city || p?.name || '—'}</td>
                      <td>{m.assetName}</td>
                      <td>{m.type}</td>
                      <td>{m.date}</td>
                      <td>{m.tech}</td>
                      <td>
                        {m.cost ? Number(m.cost).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td><UrgencyChip urgency={m.urgency} /></td>
                      <td><StatusChip status={m.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-sm btn-icon"
                            onClick={() => {
                              setEditing(m);
                              setShowForm(true);
                            }}
                          >
                            <Pencil size={12} />
                          </button>

                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              if (confirm(t('maintenance.deleteConfirm'))) {
                                setMaintenance(
                                  maintenance.filter(x => x.id !== m.id)
                                );
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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

/* ================= DEPRECIATION ================= */

export function Depreciation({ properties, assets }) {
  const { t } = useTranslation();
  const [selProp, setSelProp] = useState('all');
  const [sortBy, setSortBy] = useState('pct_desc');

  const currentYear = new Date().getFullYear();

  const filtered = (selProp === 'all' ? assets : assets.filter(a => Number(a.pid) === Number(selProp)))
    .map(a => {
      const used     = currentYear - Number(a.year || currentYear);
      const lifespan = Number(a.lifespan || 1);
      const pct      = Math.min(100, Math.round((used / lifespan) * 100));
      const rem      = Math.max(0, lifespan - used);
      const remValue = Math.max(0, Math.round((rem / lifespan) * (a.value || 0)));
      return { ...a, used, lifespan, pct, rem, remValue };
    })
    .sort((a, b) => {
      if (sortBy === 'pct_desc') return b.pct - a.pct;
      if (sortBy === 'pct_asc')  return a.pct - b.pct;
      if (sortBy === 'value')    return b.value - a.value;
      return 0;
    });

  const expired  = filtered.filter(a => a.pct >= 100).length;
  const nearEnd  = filtered.filter(a => a.pct >= 80 && a.pct < 100).length;
  const totalVal = filtered.reduce((s, a) => s + (a.value || 0), 0);
  const remTotalVal = filtered.reduce((s, a) => s + a.remValue, 0);

  function fmtVND(v) {
    if (!v && v !== 0) return '—';
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + ' tr';
    return v.toLocaleString('vi-VN');
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-label">Tổng tài sản</div>
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-sub">Nguyên giá: {fmtVND(totalVal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Còn giá trị</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{fmtVND(remTotalVal)}</div>
          <div className="stat-sub">{filtered.length > 0 ? Math.round(remTotalVal / totalVal * 100) : 0}% nguyên giá</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã hết khấu hao</div>
          <div className="stat-value" style={{ color: expired > 0 ? 'var(--red)' : 'inherit' }}>{expired}</div>
          <div className="stat-sub">Cần xem xét thanh lý</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sắp hết hạn (≤2 năm)</div>
          <div className="stat-value" style={{ color: nearEnd > 0 ? 'var(--amber)' : 'inherit' }}>{nearEnd}</div>
          <div className="stat-sub">Cần lên kế hoạch thay thế</div>
        </div>
      </div>

      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('nav.depreciation')}</span>
          <select className="select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ fontSize: 12 }}>
            <option value="pct_desc">Khấu hao cao → thấp</option>
            <option value="pct_asc">Khấu hao thấp → cao</option>
            <option value="value">Giá trị cao nhất</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.branch')}</th>
                <th>{t('common.name')}</th>
                <th>{t('depreciation.originalCost')}</th>
                <th style={{ minWidth: 160 }}>Mức khấu hao</th>
                <th>{t('depreciation.usedYears')}</th>
                <th>Còn giá trị</th>
                <th>{t('depreciation.condition')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const p = properties.find(x => Number(x.id) === Number(a.pid));
                const barColor = a.pct >= 100 ? '#A32D2D' : a.pct >= 80 ? '#854F0B' : a.pct >= 50 ? '#D97706' : '#1D9E75';

                return (
                  <tr key={a.id} style={a.pct >= 100 ? { background: '#fff8f8' } : {}}>
                    <td>
                      {p && (
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: p.color + '22', color: p.color, fontWeight: 500 }}>
                          {p.name || p.city}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td style={{ fontSize: 12 }}>{fmtVND(a.value)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--bg2)', borderRadius: 4, height: 6, minWidth: 80 }}>
                          <div style={{
                            width: `${a.pct}%`, height: 6, borderRadius: 4,
                            background: barColor,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: barColor, minWidth: 34 }}>
                          {a.pct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {a.used}/{a.lifespan} năm
                    </td>
                    <td style={{ fontSize: 12 }}>{fmtVND(a.remValue)}</td>
                    <td>
                      {a.pct >= 100 ? (
                        <span className="chip chip-red">Hết khấu hao</span>
                      ) : a.rem <= 2 ? (
                        <span className="chip chip-amber">Sắp hết ({a.rem}n)</span>
                      ) : (
                        <span className="chip chip-green">Còn {a.rem} năm</span>
                      )}
                    </td>
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

/* ================= STAFF ================= */

function StaffForm({ initial, properties, onSave, onClose, currentUser }) {
  const { t } = useTranslation();
  const toast = useToast();

  const isSuperAdmin = checkSuperAdmin(currentUser);
  const isCompanyAdmin = checkCompanyAdmin(currentUser);

  const allowedPermissions = isSuperAdmin
    ? PERMISSION_OPTIONS
    : PERMISSION_OPTIONS.filter(p =>
        ['manager', 'staff', 'viewer'].includes(p.value)
      );

  // Normalize: old `pid` → `pids` array for backward compat
  const normalizePids = (s) => {
    if (!s) return [];
    if (s.pids?.length) return s.pids.map(Number);
    if (s.pid != null) return [Number(s.pid)];
    return [];
  };

  const [form, setForm] = useState(initial ? {
    ...initial,
    pids: normalizePids(initial),
  } : {
    pids: [],
    name: '',
    role: 'Nhân viên',
    dept: '',
    email: '',
    status: 'Hoạt động',
    permission: isSuperAdmin ? 'company_admin' : 'staff',
    companyId: currentUser?.companyId || '',
    isSuperAdmin: false,
  });

  const togglePid = (id) => {
    const num = Number(id);
    setForm(f => ({
      ...f,
      pids: f.pids?.includes(num) ? f.pids.filter(p => p !== num) : [...(f.pids || []), num],
    }));
  };

  const [password, setPassword] = useState('');

  const set = (k, v) => {
    setForm(f => ({
      ...f,
      [k]: v,
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Nhập họ tên');
    if (!form.email.trim()) return toast.error('Nhập email');

    if (!initial?.id && (!password || password.length < 6)) {
      return toast.error('Mật khẩu đăng nhập phải từ 6 ký tự');
    }

    if (!isSuperAdmin && !isCompanyAdmin) {
      return toast.error('Bạn không có quyền phân quyền nhân viên');
    }

    const clean = {
      ...form,
      email: form.email.trim().toLowerCase(),
      companyId: isSuperAdmin
        ? String(form.companyId || '').trim()
        : currentUser?.companyId,
      isSuperAdmin: form.permission === 'super_admin',
    };

    // Save pids array; remove legacy pid field
    clean.pids = (form.pids || []).map(Number);
    delete clean.pid;

    if (!clean.companyId) {
      return toast.error('Thiếu Company ID');
    }

    if (
      !isSuperAdmin &&
      ['super_admin', 'company_admin', 'admin'].includes(clean.permission)
    ) {
      return toast.error('Bạn không được cấp quyền này');
    }

    await onSave(clean, password);
  };

  return (
    <div>
      <Field label="Company ID">
        <input
          className="input"
          value={isSuperAdmin ? form.companyId : currentUser?.companyId || ''}
          disabled={!isSuperAdmin}
          onChange={e => set('companyId', e.target.value)}
          placeholder="vd: phan-hospitality"
        />
      </Field>

      <Field label="Cơ sở được phân công">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
          {properties.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Chưa có cơ sở nào</span>
          )}
          {properties.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.pids?.includes(Number(p.id)) || false}
                onChange={() => togglePid(p.id)}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#ccc', flexShrink: 0 }} />
              {p.name || p.city}
            </label>
          ))}
          {form.pids?.length === 0 && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              ⚠ Không chọn = Admin/Manager xem tất cả; Staff/Viewer không thấy data nào
            </span>
          )}
        </div>
      </Field>

      <Field label="Họ tên">
        <input
          className="input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </Field>

      <div className="form-row">
        <Field label="Vai trò">
          <select
            className="select"
            value={form.role}
            onChange={e => set('role', e.target.value)}
          >
            <option>CEO</option>
            <option>Admin tổng công ty</option>
            <option>Quản lý khách sạn</option>
            <option>Quản lý tài sản</option>
            <option>Kỹ thuật</option>
            <option>Nhân viên</option>
            {ROLES.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>

        <Field label="Bộ phận">
          <select
            className="select"
            value={form.dept}
            onChange={e => set('dept', e.target.value)}
          >
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

      <Field label="Email đăng nhập">
        <input
          className="input"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
        />
      </Field>

      {!initial?.id && (
        <Field label="Mật khẩu đăng nhập">
          <input
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
          />
        </Field>
      )}

      <div className="form-row">
        <Field label="Phân quyền">
          <select
            className="select"
            value={form.permission}
            onChange={e => set('permission', e.target.value)}
          >
            {allowedPermissions.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Trạng thái">
          <select
            className="select"
            value={form.status}
            onChange={e => set('status', e.target.value)}
          >
            <option value="Hoạt động">Hoạt động</option>
            <option value="Nghỉ phép">Nghỉ phép</option>
            <option value="Tạm nghỉ">Tạm nghỉ</option>
          </select>
        </Field>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 16,
      }}>
        <button className="btn" onClick={onClose}>
          {t('common.cancel')}
        </button>

        <button className="btn btn-primary" onClick={save}>
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

export function Staff({ properties, staff, setStaff, currentUser }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();

  const [selProp, setSelProp] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const isSuperAdmin = checkSuperAdmin(currentUser);
  const canManageStaff = checkCanManageStaff(currentUser);

  const visibleStaff = isSuperAdmin
    ? staff
    : staff.filter(s => s.companyId === currentUser?.companyId);

  // Normalize pids for backward compat (old records may have single `pid`)
  const getStaffPids = (s) => {
    if (s.pids?.length) return s.pids.map(Number);
    if (s.pid != null) return [Number(s.pid)];
    return [];
  };

  const filtered = selProp === 'all'
    ? visibleStaff
    : visibleStaff.filter(s => getStaffPids(s).includes(Number(selProp)));

  const handleSave = async (form, password) => {
    try {
      if (editing) {
        const clean = {
          ...form,
          id: editing.id,
          companyId: isSuperAdmin
            ? form.companyId
            : currentUser?.companyId,
          isSuperAdmin: form.permission === 'super_admin',
        };

        clean.pids = (form.pids || []).map(Number);
        delete clean.pid;

        await setStaff(
          staff.map(s =>
            s.id === editing.id ? { ...editing, ...clean } : s
          )
        );
      } else {
        const clean = {
          ...form,
          companyId: isSuperAdmin
            ? form.companyId
            : currentUser?.companyId,
          isSuperAdmin: form.permission === 'super_admin',
        };

        clean.pids = (form.pids || []).map(Number);
        delete clean.pid;

        const uid = await createStaffAccount(clean, password);

        await setStaff([
          ...staff,
          {
            ...clean,
            id: uid,
            createdAt: Date.now(),
          },
        ]);
      }

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error('Lỗi lưu nhân viên: ' + err.message);
    }
  };

  const permissionLabel = {
    super_admin: 'Super Admin',
    company_admin: 'Admin tổng công ty',
    admin: 'Quản trị hệ thống',
    manager: 'Quản lý',
    staff: 'Nhân viên',
    viewer: 'Chỉ xem',
  };

  return (
    <div>
      <PropFilterBar
        props={properties}
        selected={selProp}
        onSelect={setSelProp}
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng nhân viên</div>
          <div className="stat-value">{filtered.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Đang làm việc</div>
          <div className="stat-value">
            {filtered.filter(s => s.status === 'Hoạt động').length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Công ty</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {isSuperAdmin ? 'All' : currentUser?.companyId || '—'}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            {t('nav.staff')}
          </span>

          {canManageStaff && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus size={14} /> {t('staff.add')}
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Cơ sở</th>
                <th>Tên</th>
                <th>Vai trò</th>
                <th>Bộ phận</th>
                <th>Email</th>
                <th>Phân quyền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      padding: 40,
                      color: 'var(--text3)',
                    }}
                  >
                    {t('staff.noStaff')}
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const staffPids = getStaffPids(s);
                  const branches = staffPids.map(pid => properties.find(x => Number(x.id) === pid)).filter(Boolean);

                  return (
                    <tr key={s.id}>
                      <td style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {s.companyId || '—'}
                      </td>

                      <td>
                        {branches.length === 0 ? (
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {branches.map(b => (
                              <span key={b.id} style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: (b.color || '#ccc') + '22', color: b.color || '#666', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {b.name || b.city}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{s.name}</td>
                      <td>{s.role}</td>
                      <td>{s.dept}</td>
                      <td>{s.email}</td>

                      <td>
                        <span className="chip chip-blue">
                          {permissionLabel[s.permission] || s.permission}
                        </span>
                      </td>

                      <td>
                        <span className="chip chip-green">
                          {s.status}
                        </span>
                      </td>

                      <td>
                        {canManageStaff && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="btn btn-sm btn-icon"
                              onClick={() => {
                                setEditing(s);
                                setShowForm(true);
                              }}
                            >
                              <Pencil size={12} />
                            </button>

                            <button
                              className="btn btn-sm btn-icon btn-danger"
                              onClick={async () => {
                                if (s.permission === 'super_admin' && !isSuperAdmin) {
                                  return toast.error('Không được xoá Super Admin');
                                }
                                const ok = await confirm(`Xoá nhân viên "${s.name}"? Không thể hoàn tác.`);
                                if (ok) {
                                  try {
                                    await setStaff(staff.filter(x => x.id !== s.id));
                                    toast.success('Đã xoá nhân viên');
                                  } catch(err) {
                                    toast.error('Lỗi xoá nhân viên: ' + err.message);
                                  }
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
                })
              )}
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

/* ================= INVENTORY ================= */

function InventoryForm({ initial, properties, onSave, onClose }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    code: '',
    name: '',
    category: 'Buồng phòng',
    qty: 0,
    minQty: 0,
    unit: 'Cái',
    price: 0,
  });

  const set = (k, v) => {
    setForm(f => ({
      ...f,
      [k]: v,
    }));
  };

  const INV_CATS = [
    'Buồng phòng',
    'Kỹ thuật',
    'F&B',
    'Vệ sinh',
    'Văn phòng',
  ];

  const save = () => {
    if (!form.name) return toast.error('Nhập tên vật tư');

    const clean = {
      ...form,
    };

    if (form.pid) {
      clean.pid = Number(form.pid);
    } else {
      delete clean.pid;
    }

    onSave(clean);
  };

  return (
    <div>
      <Field label={t('common.branch')}>
        <select
          className="select"
          value={form.pid || ''}
          onChange={e => set('pid', e.target.value)}
        >
          <option value="">Không chọn cơ sở</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mã vật tư">
        <input
          className="input"
          value={form.code}
          onChange={e => set('code', e.target.value)}
        />
      </Field>

      <Field label="Tên vật tư">
        <input
          className="input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </Field>

      <Field label="Danh mục">
        <select
          className="select"
          value={form.category}
          onChange={e => set('category', e.target.value)}
        >
          {INV_CATS.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>

      <div className="form-row">
        <Field label="Tồn kho">
          <input className="input" type="number" value={form.qty} onChange={e => set('qty', parseInt(e.target.value) || 0)} />
        </Field>
        <Field label="Tồn tối thiểu">
          <input className="input" type="number" value={form.minQty} onChange={e => set('minQty', parseInt(e.target.value) || 0)} />
        </Field>
      </div>

      <div className="form-row">
        <Field label="Đơn vị">
          <select className="select" value={form.unit || 'Cái'} onChange={e => set('unit', e.target.value)}>
            {['Cái','Bộ','Chai','Hộp','Gói','Thùng','Kg','Lít','Cuộn','Tờ'].map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Đơn giá (VNĐ)">
              <input className="input" type="number" value={form.price || 0} onChange={e => set('price', parseInt(e.target.value) || 0)} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>{t('common.save')}</button>
        <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
      </div>
    </div>
  );
}

export function Inventory({ properties, inventory, setInventory }) {
  const { t } = useTranslation();
  const [modal, setModal] = useState(null);
  const [filterPid, setFilterPid] = useState('');
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const filtered = inventory.filter(item => {
    const matchProp = !filterPid || String(item.pid) === String(filterPid);
    const q = search.toLowerCase();
    const matchSearch = !q || (item.name || '').toLowerCase().includes(q) || (item.code || '').toLowerCase().includes(q);
    return matchProp && matchSearch;
  });

  const totalItems = inventory.length;
  const lowStock   = inventory.filter(i => i.qty <= i.minQty).length;
  const inStock    = inventory.filter(i => i.qty > i.minQty).length;
  const totalValue = inventory.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);

  const save = (item) => {
    if (modal === 'add') {
      setInventory([...inventory, { ...item, id: Date.now() }]);
    } else {
      setInventory(inventory.map(x => x.id === item.id ? item : x));
    }
    setModal(null);
  };

  const remove = (id) => {
    setInventory(inventory.filter(x => x.id !== id));
    setConfirmId(null);
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('inventory.totalItems')}</div>
          <div className="stat-value">{totalItems}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('inventory.lowStock')}</div>
          <div className="stat-value" style={{ color: lowStock > 0 ? 'var(--amber)' : 'inherit' }}>{lowStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('inventory.inStock')}</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{inStock}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('inventory.totalValue')}</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatVND(totalValue)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ maxWidth: 220 }}
              placeholder={t('common.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="select" style={{ maxWidth: 180 }} value={filterPid} onChange={e => setFilterPid(e.target.value)}>
              <option value="">{t('common.all')}</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name || p.city}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ {t('inventory.add')}</button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>{t('inventory.noItems')}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('inventory.itemCode')}</th>
                <th>{t('common.name')}</th>
                <th>{t('common.branch')}</th>
                <th>{t('inventory.category')}</th>
                <th style={{ textAlign: 'right' }}>{t('inventory.stockQty')}</th>
                <th style={{ textAlign: 'right' }}>{t('inventory.minQty')}</th>
                <th>{t('inventory.stockLevel')}</th>
                <th>{t('inventory.unit')}</th>
                <th style={{ textAlign: 'right' }}>{t('inventory.unitPrice')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const prop = properties.find(p => String(p.id) === String(item.pid));
                const low = item.qty <= item.minQty;
                return (
                  <tr key={item.id} style={{ background: low ? '#FFFBEB' : undefined }}>
                    <td><code style={{ fontSize: 11 }}>{item.code || '—'}</code></td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{prop ? <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: (prop.color || '#ccc') + '22', color: prop.color || '#666' }}>{prop.name || prop.city}</span> : '—'}</td>
                    <td><span className="chip">{item.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: low ? 'var(--amber)' : undefined }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text3)' }}>{item.minQty}</td>
                    <td>
                      {low
                        ? <span className="chip chip-amber">⚠ {t('inventory.lowStock')}</span>
                        : <span className="chip chip-green">{t('inventory.inStock')}</span>}
                    </td>
                    <td>{item.unit || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{item.price ? formatVND(Number(item.price)) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm" onClick={() => setModal(item)}>{t('common.edit')}</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmId(item.id)}>{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(modal === 'add' || (modal && typeof modal === 'object')) && (
        <Modal
          title={modal === 'add' ? t('inventory.addNew') : t('inventory.edit')}
          onClose={() => setModal(null)}
        >
          <InventoryForm
            initial={modal === 'add' ? null : modal}
            properties