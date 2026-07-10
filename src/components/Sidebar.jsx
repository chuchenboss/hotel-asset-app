// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import {
  Building2, Package, Wrench, TrendingDown, Users,
  LayoutDashboard, Archive, PlusCircle, Settings, Wind,
  X, Building, ArrowLeft, ChevronRight, Shield,
} from 'lucide-react';
import { useTranslation, LanguageSwitcher } from '../i18n/useTranslation.jsx';

/* ── NAV DEFINITIONS ──────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',     icon: LayoutDashboard, key: 'nav.overview' },
  { id: 'properties',   icon: Building2,       key: 'nav.properties' },
  { id: 'assets',       icon: Package,         key: 'nav.assets' },
  { id: 'aircon',       icon: Wind,            key: 'nav.aircon' },
  { id: 'maintenance',  icon: Wrench,          key: 'nav.maintenance', badge: true },
  { id: 'depreciation', icon: TrendingDown,    key: 'nav.depreciation' },
  { id: 'inventory',    icon: Archive,         key: 'nav.inventory' },
  { id: 'staff',        icon: Users,           key: 'nav.staff' },
];

const BOTTOM_NAV = [
  { id: 'overview',    icon: LayoutDashboard, key: 'nav.overview' },
  { id: 'assets',      icon: Package,         key: 'nav.assets' },
  { id: 'aircon',      icon: Wind,            key: 'nav.aircon' },
  { id: 'maintenance', icon: Wrench,          key: 'nav.maintenance', badge: true },
  { id: 'inventory',   icon: Archive,         key: 'nav.inventory' },
];

/* ── PERMISSION HELPER ────────────────────────── */
function canAccess(pageId, currentUser) {
  if (!currentUser) return false;
  const p = currentUser.permission;
  if (currentUser.isSuperAdmin || p === 'super_admin') return true;

  const byPerm = {
    viewer:       ['overview', 'assets', 'properties', 'aircon', 'depreciation'],
    staff:        ['overview', 'assets', 'properties', 'aircon', 'depreciation', 'maintenance', 'inventory'],
    manager:      ['overview', 'assets', 'properties', 'aircon', 'depreciation', 'maintenance', 'inventory', 'staff'],
    admin:        ['overview', 'assets', 'properties', 'aircon', 'depreciation', 'maintenance', 'inventory', 'staff', 'settings'],
    company_admin:['overview', 'assets', 'properties', 'aircon', 'depreciation', 'maintenance', 'inventory', 'staff', 'settings'],
  };
  return (byPerm[p] || []).includes(pageId);
}

const PERM_LABELS = {
  super_admin:   'Super Admin',
  company_admin: 'Company Admin',
  admin:         'Admin',
  manager:       'Manager',
  staff:         'Staff',
  viewer:        'Viewer',
};

/* ── MAIN COMPONENT ───────────────────────────── */
export default function Sidebar({
  page, onNavigate, properties, alerts,
  mobileOpen, onCloseMobile, currentUser,
  viewingCompany, onExitCompany,
}) {
  const { t } = useTranslation();

  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('app_settings') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    const h = e => setSettings(e.detail);
    window.addEventListener('settingsChanged', h);
    return () => window.removeEventListener('settingsChanged', h);
  }, []);

  const isSuperAdmin   = currentUser?.isSuperAdmin || currentUser?.permission === 'super_admin';
  const isCompanyAdmin = ['company_admin', 'admin'].includes(currentUser?.permission);
  const inCompanyView  = isSuperAdmin && !!viewingCompany;

  const logoColor  = settings.logoColor || '#1D9E75';
  const brandName  = inCompanyView ? viewingCompany.name : (isSuperAdmin ? 'AssetHub' : (settings.companyName || 'AssetHub'));
  const brandSub   = inCompanyView ? viewingCompany.id   : (isSuperAdmin ? 'Platform Admin' : (settings.companyTagline || 'Asset Management SaaS'));
  const brandLetter= (brandName || 'A').slice(0, 1).toUpperCase();

  const handleNav = (id, propId = null) => { onNavigate(id, propId); onCloseMobile?.(); };

  // Platform view: Super Admin not yet entered a company → CMS only
  const isPlatformView = isSuperAdmin && !inCompanyView;

  const visibleNav = isPlatformView
    ? [] // No asset management nav in platform view
    : NAV_ITEMS.filter(item => isSuperAdmin ? true : canAccess(item.id, currentUser));

  return (
    <>
      {/* ════ SIDEBAR ════ */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>

        {/* Super Admin – Platform View banner */}
        {isSuperAdmin && !inCompanyView && (
          <div style={{
            background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
            padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Shield size={12} color='rgba(255,255,255,0.9)' />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
              Super Admin — Platform
            </span>
          </div>
        )}

        {/* Viewing Company banner */}
        {inCompanyView && (
          <div style={{ background: 'linear-gradient(135deg,#185FA5,#1e72c8)', padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 5 }}>
              {t('common.viewingCompany')}
            </div>
            <button onClick={onExitCompany} style={{
              width: '100%', background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 7,
              cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 700,
              padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font)', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <ArrowLeft size={11} /> {t('common.exitPlatform')}
            </button>
          </div>
        )}

        {/* Logo block */}
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-logo-icon" style={{ background: inCompanyView ? '#185FA5' : logoColor }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{brandLetter}</span>
            </div>
            <div className="sidebar-brand" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {brandName}
            </div>
            <div className="sidebar-tagline">{brandSub}</div>

            {/* Company ID chip for non-super-admin */}
            {!isSuperAdmin && currentUser?.companyId && (
              <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text3)', background: 'var(--bg2)', padding: '2px 8px', borderRadius: 20, display: 'inline-block' }}>
                {currentUser.companyId}
              </div>
            )}

            {/* Role chip */}
            {currentUser?.permission && !isSuperAdmin && (
              <div style={{ marginTop: 3, fontSize: 10, fontWeight: 700, color: isCompanyAdmin ? '#185FA5' : '#534AB7', background: isCompanyAdmin ? '#E6F1FB' : '#EEEDFE', padding: '2px 8px', borderRadius: 20, display: 'inline-block' }}>
                {PERM_LABELS[currentUser.permission] || currentUser.permission}
              </div>
            )}
          </div>

          <button onClick={onCloseMobile} className="sidebar-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {/* Main nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">
            {isPlatformView ? 'PLATFORM' : t('nav.mainMenu')}
          </div>

          {/* Platform CMS nav: Dashboard + Companies only */}
          {isPlatformView && (
            <>
              <div className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => handleNav('overview')}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </div>
              <div className={`nav-item ${page === 'companies' ? 'active' : ''}`} onClick={() => handleNav('companies')}>
                <Building size={16} />
                <span>{t('common.manageCompanies')}</span>
              </div>
            </>
          )}

          {/* Regular asset management nav */}
          {!isPlatformView && visibleNav.map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => handleNav(item.id)}>
              <item.icon size={16} />
              <span>{t(item.key)}</span>
              {item.badge && alerts > 0 && <span className="badge">{alerts}</span>}
            </div>
          ))}
        </div>

        {/* Branches — show inside company context */}
        {(inCompanyView || !isSuperAdmin) && properties.length > 0 && (
          <div className="sidebar-props">
            <div className="sidebar-props-label">{t('nav.branches')}</div>
            {properties.map(p => (
              <div key={p.id} className="prop-nav-item" onClick={() => handleNav('assets', p.id)}>
                <div className="prop-dot" style={{ background: p.color }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {p.name || p.city}
                </span>
                <ChevronRight size={10} style={{ color: 'var(--text3)', flexShrink: 0 }} />
              </div>
            ))}
            {(isSuperAdmin || isCompanyAdmin) && (
              <div className="prop-nav-item" style={{ color: 'var(--text3)', marginTop: 4 }} onClick={() => handleNav('properties')}>
                <PlusCircle size={13} />
                <span>{t('nav.addProperty')}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 8 }}><LanguageSwitcher /></div>
          {canAccess('settings', currentUser) && (
            <div className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => handleNav('settings')}>
              <Settings size={16} />
              <span>{t('nav.settings')}</span>
            </div>
          )}
        </div>
      </aside>

      {/* ════ MOBILE BOTTOM NAV ════ */}
      <nav className="bottom-nav">
        {isPlatformView ? (
          <>
            <div className={`bottom-nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => onNavigate('overview')}>
              <LayoutDashboard /><span>Dashboard</span>
            </div>
            <div className={`bottom-nav-item ${page === 'companies' ? 'active' : ''}`} onClick={() => onNavigate('companies')}>
              <Building /><span>Companies</span>
            </div>
          </>
        ) : (
          <>
            {BOTTOM_NAV.filter(item => isSuperAdmin || canAccess(item.id, currentUser)).map(item => (
              <div key={item.id} className={`bottom-nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}>
                {item.badge && alerts > 0 && <span className="nav-badge">{alerts}</span>}
                <item.icon />
                <span>{t(item.key)}</span>
              </div>
            ))}
            <div className="bottom-nav-item" onClick={() => onNavigate('settings')}>
              <Settings /><span>{t('nav.settings')}</span>
            </div>
          </>
        )}
      </nav>
    </>
  );
}
