// src/pages/PlatformDashboard.jsx
// Super Admin – Platform CMS Dashboard
// Chỉ hiển thị khi Super Admin ở platform view (chưa vào company nào)

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, Users, DollarSign, TrendingUp, ShieldCheck, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const PLAN_COLORS = { Pro: '#1D9E75', Enterprise: '#185FA5', Free: '#9CA3AF', Trial: '#F59E0B' };
const PIE_COLORS  = ['#1D9E75', '#185FA5', '#F59E0B', '#9CA3AF'];
const PLAN_PRICE  = { Pro: 299, Enterprise: 999, Free: 0, Trial: 0 };

function KpiCard({ icon: Icon, label, value, sub, color = 'var(--green)' }) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    'Active':   { bg: '#E1F5EE', color: '#0F6E56', label: 'Active' },
    'Blocked':  { bg: '#FEECEC', color: '#B91C1C', label: 'Blocked' },
    'Trial':    { bg: '#FEF3C7', color: '#92400E', label: 'Trial' },
    'Inactive': { bg: '#F3F4F6', color: '#6B7280', label: 'Inactive' },
  };
  const s = map[status] || map['Inactive'];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PlanBadge({ plan }) {
  const color = PLAN_COLORS[plan] || '#6B7280';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: color + '18', color }}>
      {plan || 'Free'}
    </span>
  );
}

export default function PlatformDashboard({ companies, allProperties, allAssets, allStaff, onEnterCompany }) {
  const activeCompanies   = companies.filter(c => c.status === 'Active');
  const blockedCompanies  = companies.filter(c => c.status === 'Blocked');
  const trialCompanies    = companies.filter(c => c.status === 'Trial');

  const mrr = useMemo(() =>
    activeCompanies.reduce((s, c) => s + (PLAN_PRICE[c.plan] || 0), 0),
    [activeCompanies]
  );

  const planDist = useMemo(() => {
    const map = {};
    companies.forEach(c => { const p = c.plan || 'Free'; map[p] = (map[p] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [companies]);

  const recentCompanies = useMemo(() =>
    [...companies]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8),
    [companies]
  );

  const getStats = (c) => ({
    properties: allProperties.filter(p => String(p.companyId) === String(c.id)).length,
    assets:     allAssets.filter(a => String(a.companyId) === String(c.id)).length,
    staff:      allStaff.filter(s => String(s.companyId) === String(c.id)).length,
  });

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
  };

  return (
    <div>
      {/* ── KPI Strip ── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <KpiCard
          icon={Building2}
          label="Total Companies"
          value={companies.length}
          sub={`${activeCompanies.length} active · ${blockedCompanies.length} blocked`}
          color="#1D9E75"
        />
        <KpiCard
          icon={DollarSign}
          label="Est. MRR"
          value={`$${mrr.toLocaleString()}`}
          sub={`Pro $${PLAN_PRICE.Pro} · Enterprise $${PLAN_PRICE.Enterprise}`}
          color="#185FA5"
        />
        <KpiCard
          icon={TrendingUp}
          label="Pro Plan"
          value={companies.filter(c => c.plan === 'Pro').length}
          sub="companies"
          color="#1D9E75"
        />
        <KpiCard
          icon={ShieldCheck}
          label="Enterprise"
          value={companies.filter(c => c.plan === 'Enterprise').length}
          sub="companies"
          color="#534AB7"
        />
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        {/* ── Plan Distribution Chart ── */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Plan Distribution</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planDist} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {planDist.map((entry, i) => (
                    <Cell key={i} fill={PLAN_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [v + ' companies', n]}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Status Summary ── */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Account Status</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: CheckCircle, label: 'Active', count: activeCompanies.length, color: '#1D9E75' },
              { icon: Clock,       label: 'Trial',  count: trialCompanies.length,  color: '#F59E0B' },
              { icon: AlertCircle, label: 'Blocked',count: blockedCompanies.length, color: '#DC2626' },
              { icon: Users,       label: 'Total Staff (all companies)', count: allStaff.length, color: '#534AB7' },
            ].map(({ icon: Icon, label, count, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Companies Table ── */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Companies</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{companies.length} registered</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Plan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Properties</th>
                <th style={{ textAlign: 'center' }}>Assets</th>
                <th style={{ textAlign: 'center' }}>Staff</th>
                <th>Admin Email</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentCompanies.map(c => {
                const stats = getStats(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: (c.color || '#1D9E75') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: c.color || '#1D9E75', flexShrink: 0 }}>
                          {(c.name || c.id || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><PlanBadge plan={c.plan} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{stats.properties}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{stats.assets}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{stats.staff}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.adminEmail || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDate(c.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: 11, padding: '3px 10px', whiteSpace: 'nowrap' }}
                        onClick={() => onEnterCompany(c)}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>
                    No companies registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
