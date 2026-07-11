// src/components/UI.jsx
import { X } from 'lucide-react';

export function Chip({ type = 'gray', children }) {
  return <span className={`chip chip-${type}`}>{children}</span>;
}

export function StatusChip({ status }) {
  const map = { 'Đang dùng': 'green', 'Bảo trì': 'amber', 'Hỏng hóc': 'red', 'Thanh lý': 'gray', 'Hoàn thành': 'green', 'Đang thực hiện': 'blue', 'Lên lịch': 'gray', 'Chờ thực hiện': 'amber' };
  return <Chip type={map[status] || 'gray'}>{status}</Chip>;
}

export function UrgencyChip({ urgency }) {
  const map = { 'Khẩn': 'red', 'Trung bình': 'amber', 'Thường': 'green' };
  return <Chip type={map[urgency] || 'gray'}>{urgency}</Chip>;
}

export function PermChip({ perm }) {
  const map = { admin: ['blue', 'Quản trị'], manager: ['purple', 'Quản lý'], staff: ['green', 'Nhân viên'], viewer: ['gray', 'Chỉ xem'] };
  const [type, label] = map[perm] || ['gray', perm];
  return <Chip type={type}>{label}</Chip>;
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return <div className="form-field"><label className="form-label">{label}</label>{children}</div>;
}

export function PropFilterBar({ props, selected, onSelect }) {
  return (
    <div className="prop-filter-bar">
      <button
        className={`prop-filter-btn ${selected === 'all' ? 'active' : ''}`}
        style={selected === 'all' ? { background: '#1D9E75' } : {}}
        onClick={() => onSelect('all')}
      >Tất cả</button>
      {props.map((p, i) => (
        <button
          key={p.id}
          className={`prop-filter-btn ${selected === p.id ? 'active' : ''}`}
          style={selected === p.id ? { background: p.color } : {}}
          onClick={() => onSelect(p.id)}
        >{p.name || p.city}</button>
      ))}
    </div>
  );
}

export function formatVND(val) {
  if (!val && val !== 0) return '—';
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + ' tỷ';
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(0) + ' tr';
  return val.toLocaleString('vi-VN');
}

export function Avatar({ name, color = '#1D9E75', size = 30 }) {
  const initials = name ? name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  return (
    <div className="avatar" style={{ width: size, height: size, background: color + '22', color, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

export function DepreciationBar({ year, lifespan }) {
  const used = new Date().getFullYear() - year;
  const pct = Math.min(100, Math.round(used / lifespan * 100));
  const color = pct >= 100 ? '#E24B4A' : pct >= 80 ? '#EF9F27' : '#1D9E75';
  const label = pct >= 100 ? 'Đã hết' : pct >= 80 ? 'Sắp hết' : 'Còn hạn';
  const chipType = pct >= 100 ? 'red' : pct >= 80 ? 'amber' : 'green';
  return { pct, color, label, chipType, remaining: Math.max(0, lifespan - used) };
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="empty-state">
      {Icon && <Icon />}
      <p>{message}</p>
    </div>
  );
}
