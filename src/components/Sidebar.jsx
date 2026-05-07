// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';
import { Building2, Package, Wrench, TrendingDown, Users,
         LayoutDashboard, Archive, PlusCircle, Settings, Wind, X } from 'lucide-react';
import { useTranslation, LanguageSwitcher } from '../i18n/useTranslation.jsx';

const NAV_ITEMS = [
  { id: 'overview',     icon: LayoutDashboard, key: 'nav.overview' },
  { id: 'properties',   icon: Building2,        key: 'nav.properties' },
  { id: 'assets',       icon: Package,          key: 'nav.assets' },
  { id: 'aircon',       icon: Wind,             key: 'nav.aircon' },
  { id: 'maintenance',  icon: Wrench,           key: 'nav.maintenance', badge: true },
  { id: 'depreciation', icon: TrendingDown,     key: 'nav.depreciation' },
  { id: 'inventory',    icon: Archive,          key: 'nav.inventory' },
  { id: 'staff',        icon: Users,            key: 'nav.staff' },
];

// Bottom nav chỉ hiện 5 mục quan trọng nhất trên mobile
const BOTTOM_NAV = [
  { id: 'overview',    icon: LayoutDashboard, key: 'nav.overview' },
  { id: 'assets',      icon: Package,         key: 'nav.assets' },
  { id: 'aircon',      icon: Wind,            key: 'nav.aircon' },
  { id: 'maintenance', icon: Wrench,          key: 'nav.maintenance', badge: true },
  { id: 'inventory',   icon: Archive,         key: 'nav.inventory' },
];

export default function Sidebar({ page, onNavigate, properties, alerts, mobileOpen, onCloseMobile }) {
  const { t } = useTranslation();

  const [settings, setSettings] = useState(() => {
    try { const r = localStorage.getItem('app_settings'); return r ? JSON.parse(r) : {}; } catch { return {}; }
  });

  useEffect(() => {
    const handler = (e) => setSettings(e.detail);
    window.addEventListener('settingsChanged', handler);
    return () => window.removeEventListener('settingsChanged', handler);
  }, []);

  const companyName = settings.companyName || 'Palace Group';
  const tagline     = settings.companyTagline || 'Quản lý tài sản đa cơ sở';
  const logoText    = settings.logoText || companyName.slice(0, 1).toUpperCase();
  const logoColor   = settings.logoColor || '#1D9E75';

  const handleNav = (id) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile(); // đóng sidebar mobile sau khi chọn
  };

  return (
    <>
      {/* ---- SIDEBAR (desktop luôn hiện, mobile slide-in) ---- */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div className="sidebar-logo-icon" style={{ background: logoColor }}>
              <span style={{ color:'white', fontWeight:700, fontSize:16 }}>{logoText}</span>
            </div>
            <div className="sidebar-brand">{companyName}</div>
            <div className="sidebar-tagline">{tagline}</div>
          </div>
          {/* Nút đóng trên mobile */}
          <button onClick={onCloseMobile} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text3)', display:'none' }} className="sidebar-close-btn">
            <X size={18}/>
          </button>
        </div>

        {/* Nav chính */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">{t('nav.mainMenu')}</div>
          {NAV_ITEMS.map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => handleNav(item.id)}>
              <item.icon size={16}/>
              <span>{t(item.key)}</span>
              {item.badge && alerts > 0 && <span className="badge">{alerts}</span>}
            </div>
          ))}
        </div>

        {/* Cơ sở */}
        <div className="sidebar-props">
          <div className="sidebar-props-label">{t('nav.branches')}</div>
          {properties.map(p => (
            <div key={p.id} className="prop-nav-item" onClick={() => handleNav('assets')}>
              <div className="prop-dot" style={{ background: p.color }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.city || p.name}</span>
            </div>
          ))}
          <div className="prop-nav-item" style={{ color:'var(--text3)', marginTop:4 }} onClick={() => handleNav('properties')}>
            <PlusCircle size={13}/>
            <span>{t('nav.addProperty')}</span>
          </div>
        </div>

        {/* Ngôn ngữ + Cài đặt */}
        <div style={{ marginTop:'auto', padding:'12px', borderTop:'1px solid var(--border)' }}>
          <div style={{ marginBottom:8 }}><LanguageSwitcher/></div>
          <div className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => handleNav('settings')}>
            <Settings size={16}/>
            <span>{t('nav.settings')}</span>
          </div>
        </div>
      </aside>

      {/* ---- BOTTOM NAV (chỉ hiện trên mobile) ---- */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => (
          <div key={item.id} className={`bottom-nav-item ${page === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}>
            {item.badge && alerts > 0 && <span className="nav-badge">{alerts}</span>}
            <item.icon/>
            <span>{t(item.key)}</span>
          </div>
        ))}
        {/* Nút "More" mở sidebar */}
        <div className="bottom-nav-item" onClick={() => onNavigate('settings')}>
          <Settings/>
          <span>{t('nav.settings')}</span>
        </div>
      </nav>
    </>
  );
}
