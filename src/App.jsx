// src/App.jsx
import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import ExportButton from './components/ExportButton.jsx';
import Overview from './pages/Overview.jsx';
import Properties from './pages/Properties.jsx';
import Assets from './pages/Assets.jsx';
import AirCon from './pages/AirCon.jsx';
import Settings from './pages/Settings.jsx';
import { Maintenance, Depreciation, Staff, Inventory } from './pages/OtherPages.jsx';
import {
  getProperties, getAssets, getMaintenance, getStaff, getInventory,
  saveProperties, saveAssets, saveMaintenance, saveStaff, saveInventory
} from './data/store.js';
import { useTranslation } from './i18n/useTranslation.jsx';

export default function App() {
  const [page, setPage]               = useState('overview');
  const [initPropId, setInitPropId]   = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar
  const { t } = useTranslation();

  const [properties, setPropertiesState] = useState(getProperties);
  const [assets,     setAssetsState]     = useState(getAssets);
  const [maintenance,setMaintenanceState]= useState(getMaintenance);
  const [staff,      setStaffState]      = useState(getStaff);
  const [inventory,  setInventoryState]  = useState(getInventory);

  const setProperties = d => { setPropertiesState(d); saveProperties(d); };
  const setAssets     = d => { setAssetsState(d);     saveAssets(d); };
  const setMaintenance= d => { setMaintenanceState(d);saveMaintenance(d); };
  const setStaff      = d => { setStaffState(d);      saveStaff(d); };
  const setInventory  = d => { setInventoryState(d);  saveInventory(d); };

  const urgentAlerts = maintenance.filter(m =>
    (m.urgency==='Khẩn'||m.urgency==='Urgent') &&
    m.status!=='Hoàn thành' && m.status!=='Completed'
  ).length;

  const navigate = (p, propId=null) => {
    setPage(p); setInitPropId(propId);
    setSidebarOpen(false); // tự đóng sidebar khi chọn trang
  };

  const pageInfo = t(`pages.${page}`) || { title: page, sub: '' };

  const renderPage = () => {
    switch (page) {
      case 'overview':     return <Overview     properties={properties} assets={assets} maintenance={maintenance}/>;
      case 'properties':   return <Properties   properties={properties} setProperties={setProperties} assets={assets}/>;
      case 'assets':       return <Assets       properties={properties} assets={assets} setAssets={setAssets} initialPropId={initPropId}/>;
      case 'aircon':       return <AirCon       properties={properties}/>;
      case 'maintenance':  return <Maintenance  properties={properties} assets={assets} maintenance={maintenance} setMaintenance={setMaintenance}/>;
      case 'depreciation': return <Depreciation properties={properties} assets={assets}/>;
      case 'inventory':    return <Inventory    properties={properties} inventory={inventory} setInventory={setInventory}/>;
      case 'staff':        return <Staff        properties={properties} staff={staff} setStaff={setStaff}/>;
      case 'settings':     return <Settings     maintenance={maintenance} properties={properties} staff={staff}/>;
      default: return null;
    }
  };

  return (
    <div className="app-layout">
      {/* Overlay khi sidebar mobile mở */}
      <div className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}/>

      {/* Sidebar (desktop + mobile slide-in) */}
      <Sidebar
        page={page}
        onNavigate={navigate}
        properties={properties}
        alerts={urgentAlerts}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="main">
        <div className="topbar">
          {/* Hamburger — chỉ hiện trên mobile */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={18}/>
            </button>
            <div>
              <div className="topbar-title">{pageInfo.title}</div>
              <div className="topbar-sub">{pageInfo.sub}</div>
            </div>
          </div>

          <div className="topbar-actions">
            <ExportButton
              properties={properties} assets={assets}
              maintenance={maintenance} inventory={inventory} staff={staff}
            />
            <span style={{ fontSize:12, color:'var(--text3)', background:'var(--bg)', padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', whiteSpace:'nowrap' }}>
              {new Date().toLocaleDateString('vi-VN', { day:'numeric', month:'numeric', year:'numeric' })}
            </span>
          </div>
        </div>

        <div className="content">{renderPage()}</div>
      </div>
    </div>
  );
}
