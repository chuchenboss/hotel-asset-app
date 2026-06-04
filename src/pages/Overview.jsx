// src/pages/Overview.jsx
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTranslation } from '../i18n/useTranslation.jsx';
import { formatVND, UrgencyChip } from '../components/UI.jsx';

const PIE_COLORS = ['#1D9E75','#185FA5','#854F0B','#534AB7','#993C1D','#3B6D11','#A32D2D','#993556'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {p.name === 'Giá trị (tr)' ? p.value + ' tr' : p.value}
        </div>
      ))}
    </div>
  );
}

export default function Overview({ properties, assets, maintenance }) {
  const { t } = useTranslation();

  const totalAssets   = assets.length;
  const totalValue    = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const needAttention = assets.filter(a => a.status !== 'Đang dùng' && a.status !== 'In Use').length;
  const urgentMaint   = maintenance.filter(m =>
    (m.urgency === 'Khẩn' || m.urgency === 'Urgent') &&
    m.status !== 'Hoàn thành' && m.status !== 'Completed'
  ).length;

  const propStats = useMemo(() => properties.map(p => {
    const pa     = assets.filter(a => String(a.pid) === String(p.id));
    const val    = pa.reduce((s, a) => s + (Number(a.value) || 0), 0);
    const issues = pa.filter(a => a.status !== 'Đang dùng' && a.status !== 'In Use').length;
    const dep    = pa.filter(a => (2026 - a.year) >= a.lifespan).length;
    return { ...p, count: pa.length, val, issues, dep };
  }), [properties, assets]);

  const barData = useMemo(() => propStats.map(p => ({
    name: p.city || p.name,
    'Tài sản': p.count,
    'Giá trị (tr)': Math.round(p.val / 1_000_000),
    fill: p.color,
  })), [propStats]);

  const categoryData = useMemo(() => {
    const map = {};
    assets.forEach(a => { const c = a.category || 'Khác'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [assets]);

  const recentMaint = useMemo(() => [...maintenance]
    .filter(m => m.status !== 'Hoàn thành' && m.status !== 'Completed')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6), [maintenance]);

  const expiredAssets = useMemo(() =>
    assets.filter(a => (2026 - (a.year || 2026)) >= (a.lifespan || 99)),
    [assets]);

  return (
    <div>
      {/* Stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('overview.totalBranches')}</div>
          <div className="stat-value">{properties.length}</div>
          <div className="stat-sub">{properties.map(p => p.city).join(' · ')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('overview.totalAssets')}</div>
          <div className="stat-value">{totalAssets}</div>
          <div className="stat-sub">{t('overview.totalValue')}: {formatVND(totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('overview.needAttention')}</div>
          <div className="stat-value" style={{ color: needAttention > 0 ? 'var(--amber)' : 'inherit' }}>{needAttention}</div>
          <div className="stat-sub">{t('overview.maintRepair')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('overview.urgentMaint')}</div>
          <div className="stat-value" style={{ color: urgentMaint > 0 ? 'var(--red)' : 'inherit' }}>{urgentMaint}</div>
          <div className="stat-sub">{t('overview.needSoonMsg')}</div>
        </div>
      </div>

      {/* Charts */}
      {properties.length > 0 && assets.length > 0 && (
        <div className="two-col" style={{ marginBottom: 18 }}>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Tài sản theo cơ sở</span>
            </div>
            <div style={{ padding: '16px 4px 8px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="40%">
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg)' }} />
                  <Bar dataKey="Tài sản" radius={[5, 5, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Phân loại tài sản</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [val + ' tài sản', name]}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="two-col">
        {/* Property table */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">{t('overview.byBranch')}</span></div>
          <table>
            <thead>
              <tr>
                <th>{t('common.branch')}</th>
                <th>{t('overview.totalAssets')}</th>
                <th>{t('common.value')}</th>
                <th style={{ textAlign: 'center' }}>{t('maintenance.urgent')}</th>
                <th style={{ textAlign: 'center' }}>{t('depreciation.expired')}</th>
              </tr>
            </thead>
            <tbody>
              {propStats.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.count}</td>
                  <td style={{ fontSize: 12 }}>{formatVND(p.val)}</td>
                  <td style={{ textAlign: 'center' }}>{p.issues > 0 ? <span className="chip chip-amber">{p.issues}</span> : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{p.dep    > 0 ? <span className="chip chip-red">{p.dep}</span>    : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming maintenance */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('overview.upcomingMaint')}</span>
            {urgentMaint > 0 && <span className="chip chip-red">{urgentMaint} khẩn</span>}
          </div>
          {recentMaint.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              {t('overview.noUpcoming')}
            </div>
          ) : recentMaint.map(m => {
            const p = properties.find(x => String(x.id) === String(m.pid));
            const daysLeft = Math.ceil((new Date(m.date) - new Date()) / 86400000);
            return (
              <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {p && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: p.color + '22', color: p.color, fontWeight: 500 }}>{p.city}</span>}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.assetName}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {m.type} · {new Date(m.date).toLocaleDateString('vi-VN')}
                    {daysLeft <= 3 && (
                      <span style={{ color: 'var(--red)', marginLeft: 6, fontWeight: 600 }}>
                        {daysLeft <= 0 ? '• Quá hạn!' : `• Còn ${daysLeft} ngày`}
                      </span>
                    )}
                  </div>
                </div>
                <UrgencyChip urgency={m.urgency} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Expired assets warning */}
      {expiredAssets.length > 0 && (
        <div className="panel" style={{ border: '1px solid #F7C1C1' }}>
          <div className="panel-header" style={{ background: '#FCEBEB' }}>
            <span className="panel-title" style={{ color: 'var(--red)' }}>
              ⚠ {expiredAssets.length} tài sản đã hết khấu hao — cần xem xét thanh lý
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
            {expiredAssets.slice(0, 8).map(a => {
              const p = properties.find(x => String(x.id) === String(a.pid));
              return (
                <span key={a.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#FCEBEB', color: 'var(--red)', border: '1px solid #F7C1C1' }}>
                  {p?.city && `[${p.city}] `}{a.name}
                </span>
              );
            })}
            {expiredAssets.length > 8 && (
              <span style={{ fontSize: 12, color: 'var(--text3)', padding: '3px 0' }}>
                +{expiredAssets.length - 8} tài sản khác
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
