// src/pages/Settings.jsx
import { useState } from 'react';
import { Save, Shield, Check } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.jsx';

const DEFAULT_SETTINGS = {
  companyName: 'Palace Group', companyTagline: 'Quản lý tài sản đa cơ sở',
  address: '', phone: '', email: '', website: '', taxCode: '',
  logoText: 'P', logoColor: '#1D9E75',
};

const MODULE_KEYS = ['view_assets','edit_assets','delete_assets','maintenance','aircon','inventory','staff_view','staff_edit','reports','settings_mod'];

const ROLE_KEYS = ['admin','manager','technician','staff','viewer'];
const ROLE_STYLES = {
  admin:      { color:'#185FA5', bg:'#E6F1FB' },
  manager:    { color:'#534AB7', bg:'#EEEDFE' },
  technician: { color:'#854F0B', bg:'#FAEEDA' },
  staff:      { color:'#0F6E56', bg:'#E1F5EE' },
  viewer:     { color:'#5F5E5A', bg:'#F1EFE8' },
};

const DEFAULT_PERMISSIONS = {
  admin:      MODULE_KEYS,
  manager:    ['view_assets','edit_assets','maintenance','aircon','inventory','staff_view','reports'],
  technician: ['view_assets','edit_assets','maintenance','aircon','inventory'],
  staff:      ['view_assets','inventory'],
  viewer:     ['view_assets'],
};

const LOGO_COLORS = ['#1D9E75','#185FA5','#854F0B','#534AB7','#993C1D','#3B6D11','#A32D2D','#993556'];

export default function Settings() {
  const { t, lang, changeLang, SUPPORTED_LANGS } = useTranslation();

  const [settings, setSettings] = useState(() => {
    try { const r = localStorage.getItem('app_settings'); return r ? { ...DEFAULT_SETTINGS, ...JSON.parse(r) } : DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [permissions, setPermissions] = useState(() => {
    try { const r = localStorage.getItem('permissions'); return r ? JSON.parse(r) : DEFAULT_PERMISSIONS; }
    catch { return DEFAULT_PERMISSIONS; }
  });
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const handleSave = () => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
  };

  const togglePerm = (role, mod) => {
    if (role === 'admin' && mod === 'settings_mod') return;
    setPermissions(prev => {
      const cur  = prev[role] || [];
      const next = { ...prev, [role]: cur.includes(mod) ? cur.filter(m=>m!==mod) : [...cur,mod] };
      localStorage.setItem('permissions', JSON.stringify(next));
      return next;
    });
  };

  const hasPerm = (role, mod) => (permissions[role] || []).includes(mod);

  const TABS = [
    { id:'company',     label:'🏢 ' + t('settings.companyInfo') },
    { id:'permissions', label:'🔐 ' + t('settings.permissionsTab') },
    { id:'language',    label:'🌐 ' + t('settings.language') },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--white)', border:'1px solid var(--border)', borderRadius:10, padding:4, width:'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'7px 18px', borderRadius:7, border:'none', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)', background: activeTab===tab.id ? '#1D9E75':'transparent', color: activeTab===tab.id ? 'white':'var(--text2)', transition:'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company info */}
      {activeTab === 'company' && (
        <div>
          <div className="two-col">
            <div className="panel">
              <div className="panel-header"><span className="panel-title">{t('settings.companyInfo')}</span></div>
              <div style={{ padding:16 }}>
                {[
                  [t('settings.companyName'),   'companyName',   'text',  t('settings.companyNamePlaceholder')],
                  [t('settings.tagline'),        'companyTagline','text',  t('settings.taglinePlaceholder')],
                  [t('common.address'),          'address',       'text',  t('settings.addrPlaceholder')],
                ].map(([label, key, type, placeholder]) => (
                  <div key={key} className="form-field">
                    <label className="form-label">{label}</label>
                    <input className="input" style={{ width:'100%' }} type={type} value={settings[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">{t('common.phone')}</label>
                    <input className="input" value={settings.phone||''} onChange={e=>set('phone',e.target.value)} placeholder={t('settings.phonePlaceholder')} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t('common.email')}</label>
                    <input className="input" value={settings.email||''} onChange={e=>set('email',e.target.value)} placeholder={t('settings.emailPlaceholder')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">{t('common.website')}</label>
                    <input className="input" value={settings.website||''} onChange={e=>set('website',e.target.value)} placeholder={t('settings.webPlaceholder')} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t('settings.taxCode')}</label>
                    <input className="input" value={settings.taxCode||''} onChange={e=>set('taxCode',e.target.value)} placeholder={t('settings.taxPlaceholder')} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="panel" style={{ marginBottom:16 }}>
                <div className="panel-header"><span className="panel-title">{t('settings.logoAndColor')}</span></div>
                <div style={{ padding:16 }}>
                  <div className="form-field">
                    <label className="form-label">{t('settings.logoChar')}</label>
                    <input className="input" style={{ width:'100%' }} maxLength={2} value={settings.logoText||''} onChange={e=>set('logoText',e.target.value.toUpperCase())} placeholder={t('settings.logoPlaceholder')} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t('settings.logoColor')}</label>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                      {LOGO_COLORS.map(c => (
                        <div key={c} onClick={() => set('logoColor',c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border: settings.logoColor===c?'3px solid white':'3px solid transparent', outline: settings.logoColor===c?`2px solid ${c}`:'none', transition:'all 0.15s' }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="panel">
                <div className="panel-header"><span className="panel-title">{t('settings.preview')}</span></div>
                <div style={{ padding:16 }}>
                  <div style={{ background:'var(--bg)', borderRadius:10, padding:'14px 16px', border:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, background:settings.logoColor||'#1D9E75', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:15 }}>
                        {settings.logoText || 'P'}
                      </div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:600 }}>{settings.companyName || t('settings.companyNamePlaceholder')}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{settings.companyTagline || t('settings.taglinePlaceholder')}</div>
                      </div>
                    </div>
                    {settings.address && <div style={{ marginTop:10, fontSize:11, color:'var(--text3)', borderTop:'0.5px solid var(--border)', paddingTop:8 }}>📍 {settings.address}</div>}
                    {settings.phone   && <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>📞 {settings.phone}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? <><Check size={14}/> {t('settings.saved')}</> : <><Save size={14}/> {t('settings.saveInfo')}</>}
            </button>
          </div>
        </div>
      )}

      {/* Permissions */}
      {activeTab === 'permissions' && (
        <div>
          <div style={{ background:'#E6F1FB', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#185FA5', marginBottom:16, display:'flex', gap:8 }}>
            <Shield size={14} style={{ flexShrink:0, marginTop:1 }}/> {t('settings.permNote')}
          </div>
          <div className="panel">
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', background:'var(--bg)', borderBottom:'1px solid var(--border)', minWidth:180 }}>
                      {lang==='en'?'Module / Feature':'Module / Chức năng'}
                    </th>
                    {ROLE_KEYS.map(r => {
                      const style = ROLE_STYLES[r];
                      return (
                        <th key={r} style={{ padding:'12px 10px', textAlign:'center', fontSize:12, fontWeight:500, background:'var(--bg)', borderBottom:'1px solid var(--border)', minWidth:100 }}>
                          <div style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, background:style.bg, color:style.color, fontSize:11, fontWeight:600 }}>{t(`settings.roles.${r}`)}</div>
                          <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{(permissions[r]||[]).length}/{MODULE_KEYS.length} {t('settings.permissions')}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MODULE_KEYS.map((mod, idx) => (
                    <tr key={mod} style={{ background: idx%2===0?'var(--white)':'var(--bg)' }}>
                      <td style={{ padding:'10px 16px', fontSize:13, fontWeight:500, borderBottom:'0.5px solid var(--border)' }}>{t(`settings.modules.${mod}`)}</td>
                      {ROLE_KEYS.map(r => {
                        const on    = hasPerm(r, mod);
                        const style = ROLE_STYLES[r];
                        const locked= r==='admin' && mod==='settings_mod';
                        return (
                          <td key={r} style={{ padding:'10px', textAlign:'center', borderBottom:'0.5px solid var(--border)' }}>
                            <div onClick={() => togglePerm(r, mod)} style={{ width:22, height:22, borderRadius:'50%', margin:'0 auto', cursor:locked?'not-allowed':'pointer', background:on?style.color:'var(--bg2)', border:`1.5px solid ${on?style.color:'var(--border)'}`, transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {on && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginTop:4 }}>
            {ROLE_KEYS.map(r => {
              const style = ROLE_STYLES[r];
              return (
                <div key={r} style={{ background:style.bg, border:`0.5px solid ${style.color}33`, borderRadius:9, padding:'10px 12px' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:style.color, marginBottom:4 }}>{t(`settings.roles.${r}`)}</div>
                  <div style={{ fontSize:11, color:'var(--text2)' }}>{(permissions[r]||[]).length} / {MODULE_KEYS.length} {t('settings.permissions')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Language */}
      {activeTab === 'language' && (
        <div className="panel" style={{ maxWidth:480 }}>
          <div className="panel-header"><span className="panel-title">{t('settings.languageLabel')}</span></div>
          <div style={{ padding:16 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {SUPPORTED_LANGS.map(l => (
                <div key={l.code} onClick={() => changeLang(l.code)}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:10, border:`2px solid ${lang===l.code?'#1D9E75':'var(--border)'}`, background:lang===l.code?'#E1F5EE':'var(--white)', cursor:'pointer', transition:'all 0.15s' }}>
                  <span style={{ fontSize:28 }}>{l.flag}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:lang===l.code?'#0F6E56':'var(--text)' }}>{l.label}</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{l.code.toUpperCase()}</div>
                  </div>
                  {lang===l.code && (
                    <div style={{ marginLeft:'auto', width:20, height:20, borderRadius:'50%', background:'#1D9E75', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              ))}
              {/* Hint to add more */}
              <div style={{ marginTop:8, background:'var(--bg)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--text3)' }}>
                {lang==='en'
                  ? '💡 To add more languages, create a new file in src/i18n/ (e.g. zh.js) and register it in index.js'
                  : '💡 Để thêm ngôn ngữ mới, tạo file mới trong src/i18n/ (ví dụ zh.js) và đăng ký trong index.js'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
