// src/pages/Overview.jsx
import { useTranslation } from '../i18n/useTranslation.jsx';
import { formatVND, UrgencyChip } from '../components/UI.jsx';

export default function Overview({ properties, assets, maintenance }) {
  const { t } = useTranslation();

  const totalAssets = assets.length;
  const totalValue  = assets.reduce((s, a) => s + (a.value || 0), 0);
  const needAttention = assets.filter(a => a.status !== 'Đang dùng' && a.status !== 'In Use').length;
  const urgentMaint   = maintenance.filter(m =>
    (m.urgency === 'Khẩn' || m.urgency === 'Urgent') &&
    m.status !== 'Hoàn thành' && m.status !== 'Completed'
  ).length;

  const propStats = properties.map(p => {
    const pa  = assets.filter(a => a.pid === p.id);
    const val = pa.reduce((s, a) => s + (a.value || 0), 0);
    const issues = pa.filter(a => a.status !== 'Đang dùng' && a.status !== 'In Use').length;
    const dep    = pa.filter(a => (2026 - a.year) >= a.lifespan).length;
    return { ...p, count: pa.length, val, issues, dep };
  });

  const recentMaint = [...maintenance]
    .filter(m => m.status !== 'Hoàn thành' && m.status !== 'Completed')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  return (
    <div>
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

      <div className="two-col">
        <div className="panel">
          <div className="panel-header"><span className="panel-title">{t('overview.byBranch')}</span></div>
          <table>
            <thead><tr>
              <th>{t('common.branch')}</th>
              <th>{t('overview.totalAssets')}</th>
              <th>{t('common.value')}</th>
              <th>{t('maintenance.urgent')}</th>
              <th>{t('depreciation.expired')}</th>
            </tr></thead>
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
                  <td>{p.issues > 0 ? <span className="chip chip-amber">{p.issues}</span> : '—'}</td>
                  <td>{p.dep    > 0 ? <span className="chip chip-red">{p.dep}</span>    : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-header"><span className="panel-title">{t('overview.upcomingMaint')}</span></div>
          {recentMaint.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              {t('overview.noUpcoming')}
            </div>
          ) : recentMaint.map(m => {
            const p = properties.find(x => x.id === m.pid);
            return (
              <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {p && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: p.color + '22', color: p.color, fontWeight: 500 }}>{p.city}</span>}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.assetName}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {m.type} · {new Date(m.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <UrgencyChip urgency={m.urgency} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
