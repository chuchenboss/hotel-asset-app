import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, PropFilterBar, StatusChip, formatVND } from '../components/UI.jsx';
import { CATEGORIES, STATUSES } from '../data/store.js';
import { uploadAssetImage } from '../data/firebase.js';
import { useTranslation } from '../i18n/useTranslation.jsx';

function ImagePreview({ images = [] }) {
  if (!images || images.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {images.map((url, index) => (
        <a key={index} href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt="asset"
            style={{
              width: 46,
              height: 46,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}
          />
        </a>
      ))}
    </div>
  );
}

function AssetForm({ initial, properties, onSave, onClose }) {
  const { t } = useTranslation();

  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    code: '',
    name: '',
    category: CATEGORIES[0],
    value: '',
    year: new Date().getFullYear(),
    lifespan: 10,
    status: 'Đang dùng',
    location: '',
    note: '',
    invoiceImages: [],
    assetImages: []
  });

  const [invoiceFiles, setInvoiceFiles] = useState([]);
  const [assetFiles, setAssetFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name) return alert(t('common.name') + '?');

    try {
      setSaving(true);

      const assetId = String(form.id || Date.now());

      const invoiceImages = [];
      for (const file of invoiceFiles) {
        const url = await uploadAssetImage(file, assetId, 'invoice');
        invoiceImages.push(url);
      }

      const assetImages = [];
      for (const file of assetFiles) {
        const url = await uploadAssetImage(file, assetId, 'actual');
        assetImages.push(url);
      }

      onSave({
        ...form,
        id: assetId,
        invoiceImages: [
          ...(form.invoiceImages || []),
          ...invoiceImages
        ],
        assetImages: [
          ...(form.assetImages || []),
          ...assetImages
        ]
      });
    } catch (err) {
      console.error('Upload image error:', err);
      alert('Lỗi upload hình: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={initial?.id ? t('assets.edit') : t('assets.add')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>

          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Đang lưu...' : t('common.save')}
          </button>
        </>
      }
    >
      <Field label={t('common.branch')}>
        <select
          className="select"
          value={form.pid}
          onChange={e => set('pid', parseInt(e.target.value))}
        >
          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('common.name') + ' *'}>
        <input
          className="input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="VD: Điều hòa Daikin 2HP"
        />
      </Field>

      <div className="form-row">
        <Field label={t('assets.code')}>
          <input
            className="input"
            value={form.code}
            onChange={e => set('code', e.target.value)}
            placeholder="HN-001"
          />
        </Field>

        <Field label={t('assets.category')}>
          <select
            className="select"
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="form-row">
        <Field label={t('common.value') + ' (VNĐ)'}>
          <input
            className="input"
            type="number"
            value={form.value}
            onChange={e => set('value', parseInt(e.target.value) || 0)}
            placeholder="45000000"
          />
        </Field>

        <Field label={t('common.status')}>
          <select
            className="select"
            value={form.status}
            onChange={e => set('status', e.target.value)}
          >
            {STATUSES.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="form-row">
        <Field label={t('assets.installYear')}>
          <input
            className="input"
            type="number"
            value={form.year}
            onChange={e => set('year', parseInt(e.target.value))}
          />
        </Field>

        <Field label={t('assets.lifespan')}>
          <input
            className="input"
            type="number"
            value={form.lifespan}
            onChange={e => set('lifespan', parseInt(e.target.value))}
          />
        </Field>
      </div>

      <Field label={t('common.location')}>
        <input
          className="input"
          value={form.location}
          onChange={e => set('location', e.target.value)}
          placeholder="Tầng 3, Phòng 301..."
        />
      </Field>

      <Field label={t('common.note')}>
        <textarea
          className="input"
          value={form.note}
          onChange={e => set('note', e.target.value)}
          style={{ resize: 'vertical', minHeight: 60 }}
        />
      </Field>

      <Field label="Hình ảnh hoá đơn">
        <input
          className="input"
          type="file"
          multiple
          accept="image/*"
          onChange={e => setInvoiceFiles(Array.from(e.target.files || []))}
        />

        <ImagePreview images={form.invoiceImages} />
      </Field>

      <Field label="Hình ảnh thực tế / hiện trạng tài sản">
        <input
          className="input"
          type="file"
          multiple
          accept="image/*"
          onChange={e => setAssetFiles(Array.from(e.target.files || []))}
        />

        <ImagePreview images={form.assetImages} />
      </Field>
    </Modal>
  );
}

export default function Assets({ properties, assets, setAssets, initialPropId }) {
  const { t } = useTranslation();

  const [selProp, setSelProp] = useState(initialPropId || 'all');
  const [search, setSearch] = useState('');
  const [selCat, setSelCat] = useState('');
  const [selStatus, setSelStatus] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = assets
    .filter(a => {
      if (selProp !== 'all' && Number(a.pid) !== Number(selProp)) return false;
      if (selCat && a.category !== selCat) return false;
      if (selStatus && a.status !== selStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          String(a.name || '').toLowerCase().includes(q) ||
          String(a.code || '').toLowerCase().includes(q) ||
          String(a.location || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'value_desc') return (Number(b.value) || 0) - (Number(a.value) || 0);
      if (sortBy === 'value_asc')  return (Number(a.value) || 0) - (Number(b.value) || 0);
      if (sortBy === 'year_desc')  return (b.year || 0) - (a.year || 0);
      if (sortBy === 'year_asc')   return (a.year || 0) - (b.year || 0);
      if (sortBy === 'name')       return String(a.name).localeCompare(String(b.name), 'vi');
      return 0;
    });

  const totalVal = filtered.reduce((s, a) => s + (Number(a.value) || 0), 0);

  const handleSave = (form) => {
    if (editing) {
      setAssets(
        assets.map(a =>
          a.id === editing.id
            ? { ...editing, ...form }
            : a
        )
      );
    } else {
      setAssets([
        ...assets,
        {
          ...form,
          id: String(form.id || Date.now())
        }
      ]);
    }

    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('assets.deleteConfirm'))) {
      setAssets(assets.filter(a => a.id !== id));
    }
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
          <div className="stat-label">{t('assets.showing')}</div>
          <div className="stat-value">{filtered.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('overview.totalValue')}</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {formatVND(totalVal)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('assets.inUse')}</div>
          <div className="stat-value">
            {filtered.filter(a => a.status === 'Đang dùng' || a.status === 'In Use').length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('assets.needAction')}</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>
            {filtered.filter(a => a.status !== 'Đang dùng' && a.status !== 'In Use').length}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t('nav.assets')}</span>

          <div className="panel-actions">
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text3)'
                }}
              />

              <input
                className="input"
                style={{ paddingLeft: 28, width: 180 }}
                placeholder={t('assets.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="select"
              value={selCat}
              onChange={e => setSelCat(e.target.value)}
            >
              <option value="">{t('assets.allCategories')}</option>
              {CATEGORIES.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              className="select"
              value={selStatus}
              onChange={e => setSelStatus(e.target.value)}
            >
              <option value="">{t('assets.allStatuses')}</option>
              {STATUSES.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              className="select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="">Sắp xếp...</option>
              <option value="value_desc">Giá trị ↓</option>
              <option value="value_asc">Giá trị ↑</option>
              <option value="year_desc">Mới nhất</option>
              <option value="year_asc">Cũ nhất</option>
              <option value="name">Tên A→Z</option>
            </select>

            <button
              className="btn btn-primary"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              <Plus size={14} /> {t('assets.add')}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>{t('common.branch')}</th>
                <th style={{ width: 80 }}>{t('assets.code')}</th>
                <th>{t('common.name')}</th>
                <th style={{ width: 110 }}>{t('assets.category')}</th>
                <th style={{ width: 110 }}>{t('common.value')}</th>
                <th style={{ width: 80 }}>{t('assets.installYear')}</th>
                <th style={{ width: 100 }}>{t('common.status')}</th>
                <th style={{ width: 90 }}>Hình ảnh</th>
                <th style={{ width: 80 }}></th>
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
                      color: 'var(--text3)'
                    }}
                  >
                    {t('common.noData')}
                  </td>
                </tr>
              ) : filtered.map(a => {
                const p = properties.find(x => Number(x.id) === Number(a.pid));

                return (
                  <tr key={a.id}>
                    <td>
                      {p && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: p.color + '22',
                            color: p.color,
                            fontWeight: 500
                          }}
                        >
                          {p.city}
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: 'var(--text3)'
                      }}
                    >
                      {a.code}
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>

                      {a.location && (
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {a.location}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="chip chip-gray">
                        {a.category}
                      </span>
                    </td>

                    <td style={{ fontSize: 12 }}>
                      {formatVND(a.value)}
                    </td>

                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                      {a.year}
                    </td>

                    <td>
                      <StatusChip status={a.status} />
                    </td>

                    <td>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        HĐ: {(a.invoiceImages || []).length}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        TT: {(a.assetImages || []).length}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-sm btn-icon"
                          onClick={() => {
                            setEditing(a);
                            setShowForm(true);
                          }}
                        >
                          <Pencil size={12} />
                        </button>

                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          onClick={() => handleDelete(a.id)}
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
        <AssetForm
          initial={editing}
          properties={properties}
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
