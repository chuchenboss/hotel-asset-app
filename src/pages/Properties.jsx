// src/pages/Properties.jsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, formatVND } from '../components/UI.jsx';
import { HOTEL_TYPES, PROP_COLORS } from '../data/store.js';
import { useTranslation } from '../i18n/useTranslation.jsx';

function PropForm({ initial, onSave, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial || { name: '', city: '', type: '5 sao', addr: '', manager: '', phone: '', color: PROP_COLORS[0] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title={initial?.id ? t('properties.edit') : t('properties.add')} onClose={onClose} footer={<>
      <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
      <button className="btn btn-primary" onClick={() => { if (!form.name || !form.city) return alert(t('properties.namePlaceholder')); onSave(form); }}>{t('common.save')}</button>
    </>}>
      <Field label="Tên cơ sở *"><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Grand Palace Đà Nẵng" /></Field>
      <div className="form-row">
        <Field label="Thành phố *"><input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Đà Nẵng" /></Field>
        <Field label="Loại hình">
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            {HOTEL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Địa chỉ"><input className="input" value={form.addr} onChange={e => set('addr', e.target.value)} placeholder="123 Đường ABC..." /></Field>
      <div className="form-row">
        <Field label="Người quản lý"><input className="input" value={form.manager} onChange={e => set('manager', e.target.value)} placeholder="Nguyễn Văn A" /></Field>
        <Field label="Điện thoại"><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0xx xxxx xxxx" /></Field>
      </div>
      <Field label="Màu nhận diện">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PROP_COLORS.map(c => (
            <div key={c} onClick={() => set('color', c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', transition: 'all 0.15s' }} />
          ))}
        </div>
      </Field>
    </Modal>
  );
}

export default function Properties({ properties, setProperties, assets }) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = (form) => {
    if (editing) {
      setProperties(properties.map(p => p.id === editing.id ? { ...editing, ...form } : p));
    } else {
      const id = Date.now();
      setProperties([...properties, { ...form, id }]);
    }
    setShowForm(false); setEditing(null);
  };

  const handleDelete = (id) => {
    if (confirm(t('properties.deleteConfirm'))) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={14} /> {t('properties.add')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {properties.map(p => {
          const pa = assets.filter(a => Number(a.pid) === Number(p.id));
          const val = pa.reduce((s, a) => s + (a.value || 0), 0);
          const issues = pa.filter(a => a.status !== 'Đang dùng').length;
          return (
            <div key={p.id} className="panel" style={{ marginBottom: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: p.color }}>
                    {String(p.city || '').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.city} · {p.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn btn-sm btn-icon" onClick={() => { setEditing(p); setShowForm(true); }}><Pencil size={13} /></button>
                  <button className="btn btn-sm btn-icon btn-danger" onClick={() => handleDelete(p.id)}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {[['Địa chỉ', p.addr || '—'], ['Người quản lý', p.manager || '—'], ['Điện thoại', p.phone || '—'], ['Số tài sản', `${pa.length} mục`], ['Tổng giá trị', formatVND(val)], ['Cần xử lý', issues > 0 ? `${issues} tài sản` : 'Không có']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <PropForm initial={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}