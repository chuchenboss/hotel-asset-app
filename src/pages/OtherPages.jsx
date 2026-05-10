// src/pages/OtherPages.jsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, PropFilterBar, UrgencyChip, StatusChip } from '../components/UI.jsx';
import { URGENCIES, MAINT_STATUSES, ROLES } from '../data/store.js';
import { createStaffAccount } from '../data/firebase.js';
import { useTranslation } from '../i18n/useTranslation.jsx';

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
        <input className="input" value={form.type} onChange={e => set('type', e.target.value)} />
      </Field>

      <div className="form-row">
        <Field label={t('common.date')}>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>

        <Field label={t('maintenance.technician')}>
          <input className="input" value={form.tech} onChange={e => set('tech', e.target.value)} />
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
                    <td>{p?.city || p?.name || '—'}</td>
                    <td>{m.assetName}</td>
                    <td>{m.type}</td>
                    <td>{m.date}</td>
                    <td>{m.tech}</td>
                    <td>{m.cost ? Number(m.cost).toLocaleString('vi-VN') : '—'}</td>
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

/* ================= DEPRECIATION ================= */

export function Depreciation({ properties, assets }) {
  const { t } = useTranslation();
  const [selProp, setSelProp] = useState('all');

  const currentYear = new Date().getFullYear();

  const filtered = selProp === 'all'
    ? assets
    : assets.filter(a => Number(a.pid) === Number(selProp));

  return (
    <div>
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

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
                <th>{t('depreciation.condition')}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(a => {
                const p = properties.find(x => Number(x.id) === Number(a.pid));
                const used = currentYear - Number(a.year || currentYear);
                const lifespan = Number(a.lifespan || 1);
                const rem = Math.max(0, lifespan - used);

                return (
                  <tr key={a.id}>
                    <td>{p?.city || p?.name || '—'}</td>
                    <td>{a.name}</td>
                    <td>{a.value ? Number(a.value).toLocaleString('vi-VN') : '—'}</td>
                    <td>{used}/{lifespan}</td>
                    <td>{rem}</td>
                    <td>
                      {rem <= 0 ? (
                        <span className="chip chip-red">Hết khấu hao</span>
                      ) : rem <= 2 ? (
                        <span className="chip chip-amber">Sắp hết</span>
                      ) : (
                        <span className="chip chip-green">Còn tốt</span>
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

  const isSuperAdmin = checkSuperAdmin(currentUser);
  const isCompanyAdmin = checkCompanyAdmin(currentUser);

  const allowedPermissions = isSuperAdmin
    ? PERMISSION_OPTIONS
    : PERMISSION_OPTIONS.filter(p =>
        ['manager', 'staff', 'viewer'].includes(p.value)
      );

  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    name: '',
    role: 'Nhân viên',
    dept: '',
    email: '',
    status: 'Hoạt động',
    permission: isSuperAdmin ? 'company_admin' : 'staff',
    companyId: currentUser?.companyId || '',
    isSuperAdmin: false,
  });

  const [password, setPassword] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return alert('Nhập họ tên');
    if (!form.email.trim()) return alert('Nhập email');

    if (!initial?.id && (!password || password.length < 6)) {
      return alert('Mật khẩu đăng nhập phải từ 6 ký tự');
    }

    const clean = {
      ...form,
      email: form.email.trim().toLowerCase(),
      companyId: isSuperAdmin ? String(form.companyId || '').trim() : currentUser?.companyId,
      isSuperAdmin: form.permission === 'super_admin',
    };

    if (!clean.companyId) return alert('Thiếu Company ID');

    if (!isSuperAdmin && ['super_admin', 'company_admin', 'admin'].includes(clean.permission)) {
      return alert('Bạn không được cấp quyền này');
    }

    if (!isSuperAdmin && !isCompanyAdmin) {
      return alert('Bạn không có quyền phân quyền nhân viên');
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

      <Field label={t('common.branch')}>
        <select className="select" value={form.pid} onChange={e => set('pid', parseInt(e.target.value))}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <Field label="Họ tên">
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
      </Field>

      <div className="form-row">
        <Field label="Vai trò">
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

        <Field label="Bộ phận">
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

      <Field label="Email đăng nhập">
        <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
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
          <select className="select" value={form.permission} onChange={e => set('permission', e.target.value)}>
            {allowedPermissions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>

        <Field label="Trạng thái">
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Nghỉ phép">Nghỉ phép</option>
            <option value="Tạm nghỉ">Tạm nghỉ</option>
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

export function Staff({ properties, staff, setStaff, currentUser }) {
  const { t } = useTranslation();

  const [selProp, setSelProp] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const isSuperAdmin = checkSuperAdmin(currentUser);
  const canManageStaff = checkCanManageStaff(currentUser);

  const visibleStaff = isSuperAdmin
    ? staff
    : staff.filter(s => s.companyId === currentUser?.companyId);

  const filtered = selProp === 'all'
    ? visibleStaff
    : visibleStaff.filter(s => Number(s.pid) === Number(selProp));

  const handleSave = async (form, password) => {
    try {
      if (editing) {
        const clean = {
          ...form,
          id: editing.id,
          companyId: isSuperAdmin ? form.companyId : currentUser?.companyId,
          isSuperAdmin: form.permission === 'super_admin',
        };

        await setStaff(staff.map(s => s.id === editing.id ? { ...editing, ...clean } : s));
      } else {
        const clean = {
          ...form,
          companyId: isSuperAdmin ? form.companyId : currentUser?.companyId,
          isSuperAdmin: form.permission === 'super_admin',
        };

        const uid = await createStaffAccount(clean, password);

        await setStaff([
          ...staff,
          {
            ...clean,
            id: uid,
            createdAt: Date.now(),
          }
        ]);
      }

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert('Lỗi tạo tài khoản nhân viên: ' + err.message);
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
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tổng nhân viên</div>
          <div className="stat-value">{filtered.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Đang làm việc</div>
          <div className="stat-value">{filtered.filter(s => s.status === 'Hoạt động').length}</div>
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
          <span className="panel-title">{t('nav.staff')}</span>

          {canManageStaff && (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={14} /> Thêm nhân viên
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
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
                    Chưa có nhân viên
                  </td>
                </tr>
              ) : filtered.map(s => {
                const p = properties.find(x => Number(x.id) === Number(s.pid));

                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: 11, color: 'var(--text3)' }}>{s.companyId || '—'}</td>
                    <td>{p?.city || p?.name || '—'}</td>
                    <td>{s.name}</td>
                    <td>{s.role}</td>
                    <td>{s.dept}</td>
                    <td>{s.email}</td>
                    <td><span className="chip chip-blue">{permissionLabel[s.permission] || s.permission}</span></td>
                    <td><span className="chip chip-green">{s.status}</span></td>
                    <td>
                      {canManageStaff && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-icon" onClick={() => { setEditing(s); setShowForm(true); }}>
                            <Pencil size={12} />
                          </button>

                          <button
                            className="btn btn-sm btn-icon btn-danger"
                            onClick={() => {
                              if (s.permission === 'super_admin' && !isSuperAdmin) return alert('Không được xoá super admin');
                              if (confirm('Xoá nhân viên này?')) {
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
          title={editing?.id ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const INV_CATS = ['Buồng phòng', 'Kỹ thuật', 'F&B', 'Vệ sinh', 'Văn phòng'];

  return (
    <div>
      <Field label={t('common.branch')}>
        <select className="select" value={form.pid} onChange={e => set('pid', parseInt(e.target.value))}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      <Field label="Mã vật tư">
        <input className="input" value={form.code} onChange={e => set('code', e.target.value)} />
      </Field>

      <Field label="Tên vật tư">
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
      </Field>

      <Field label="Danh mục">
        <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
          {INV_CATS.map(c => <option key={c}>{c}</option>)}
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.name) return alert('Nhập tên vật tư');
            onSave(form);
          }}
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}

export function Inventory({ properties, inventory, setInventory }) {
  const [selProp, setSelProp] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = selProp === 'all'
    ? inventory
    : inventory.filter(i => Number(i.pid) === Number(selProp));

  const handleSave = (form) => {
    if (editing) {
      setInventory(inventory.map(i => i.id === editing.id ? { ...editing, ...form } : i));
    } else {
      setInventory([...inventory, { ...form, id: String(Date.now()) }]);
    }

    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <PropFilterBar props={properties} selected={selProp} onSelect={setSelProp} />

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Kho vật tư</span>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14} /> Thêm vật tư
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cơ sở</th>
                <th>Mã</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Tồn kho</th>
                <th>Tối thiểu</th>
                <th>Đơn vị</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(item => {
                const p = properties.find(x => Number(x.id) === Number(item.pid));

                return (
                  <tr key={item.id}>
                    <td>{p?.city || p?.name || '—'}</td>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.qty}</td>
                    <td>{item.minQty}</td>
                    <td>{item.unit}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-icon" onClick={() => { setEditing(item); setShowForm(true); }}>
                          <Pencil size={12} />
                        </button>

                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => {
                            if (confirm('Xoá vật tư này?')) {
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
          title={editing?.id ? 'Sửa vật tư' : 'Thêm vật tư'}
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