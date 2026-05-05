// src/App.jsx — phiên bản Firebase
// Dữ liệu lưu trên đám mây, không mất khi tắt máy hay xoá cache

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ExportButton from './components/ExportButton.jsx';
import Overview from './pages/Overview.jsx';
import Properties from './pages/Properties.jsx';
import Assets from './pages/Assets.jsx';
import AirCon from './pages/AirCon.jsx';
import Settings from './pages/Settings.jsx';
import { Maintenance, Depreciation, Staff, Inventory } from './pages/OtherPages.jsx';

// *** DÙNG FIREBASE thay vì store.js ***
import {
  getProperties, saveProperties,
  getAssets,     saveAssets,
  getMaintenance,saveMaintenance,
  getStaff,      saveStaff,
  getInventory,  saveInventory,
  migrateLocalToFirebase,
} from './data/firebase.js';

import { useTranslation } from './i18n/useTranslation.jsx';

export default function App() {
  const [page, setPage]           = useState('overview');
  const [initPropId, setInitPropId] = useState(null);
  const [loading, setLoading]     = useState(true); // chờ load từ Firebase
  const { t } = useTranslation();

  const [properties, setPropertiesState] = useState([]);
  const [assets,     setAssetsState]     = useState([]);
  const [maintenance,setMaintenanceState]= useState([]);
  const [staff,      setStaffState]      = useState([]);
  const [inventory,  setInventoryState]  = useState([]);

  // ---- Load dữ liệu từ Firebase khi mở app ----
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [p, a, m, s, i] = await Promise.all([
          getProperties(), getAssets(), getMaintenance(), getStaff(), getInventory()
        ]);
        setPropertiesState(p);
       setAssetsState(a.map(x => ({
  ...x,
  pid: Number(x.pid) // ép về number
})));
        setMaintenanceState(m);
        setStaffState(s);
        setInventoryState(i);
      } catch (err) {
        console.error('Load Firebase lỗi, dùng localStorage:', err);
        // Fallback: dùng dữ liệu local nếu Firebase lỗi
        const { getProperties: lP, getAssets: lA, getMaintenance: lM, getStaff: lS, getInventory: lI } = await import('./data/store.js');
        setPropertiesState(lP()); setAssetsState(lA()); setMaintenanceState(lM()); setStaffState(lS()); setInventoryState(lI());
      }
      setLoading(false);
    }
    loadAll();
  }, []);

  // ---- Lưu lên Firebase mỗi khi dữ liệu thay đổi ----
  const setProperties = d => { setPropertiesState(d); saveProperties(d); };
  const setAssets     = d => { setAssetsState(d);     saveAssets(d); };
  const setMaintenance= d => { setMaintenanceState(d);saveMaintenance(d); };
  const setStaff      = d => { setStaffState(d);      saveStaff(d); };
  const setInventory  = d => { setInventoryState(d);  saveInventory(d); };

  const urgentAlerts = maintenance.filter(m =>
    (m.urgency==='Khẩn'||m.urgency==='Urgent') &&
    m.status!=='Hoàn thành' && m.status!=='Completed'
  ).length;

  const navigate = (p, propId=null) => { setPage(p); setInitPropId(propId); };
  const pageInfo = t(`pages.${page}`) || { title: page, sub: '' };

  const renderPage = () => {
    switch (page) {
      case 'overview':     return <Overview     properties={properties} assets={assets} maintenance={maintenance} />;
      case 'properties':   return <Properties   properties={properties} setProperties={setProperties} assets={assets} />;
      case 'assets':       return <Assets       properties={properties} assets={assets} setAssets={setAssets} initialPropId={initPropId} />;
      case 'aircon':       return <AirCon       properties={properties} />;
      case 'maintenance':  return <Maintenance  properties={properties} assets={assets} maintenance={maintenance} setMaintenance={setMaintenance} />;
      case 'depreciation': return <Depreciation properties={properties} assets={assets} />;
      case 'inventory':    return <Inventory    properties={properties} inventory={inventory} setInventory={setInventory} />;
      case 'staff':        return <Staff        properties={properties} staff={staff} setStaff={setStaff} />;
      case 'settings':     return <Settings     maintenance={maintenance} properties={properties} staff={staff} onMigrate={migrateLocalToFirebase} />;
      default:             return null;
    }
  };

  // ---- Loading screen ----
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16, background:'var(--bg)' }}>
      <div style={{ width:40, height:40, border:'3px solid #1D9E75', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <div style={{ fontSize:14, color:'var(--text2)' }}>Đang tải dữ liệu từ Firebase...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar page={page} onNavigate={navigate} properties={properties} alerts={urgentAlerts} />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{pageInfo.title}</div>
            <div className="topbar-sub">{pageInfo.sub}</div>
          </div>
          <div className="topbar-actions">
            <ExportButton properties={properties} assets={assets} maintenance={maintenance} inventory={inventory} staff={staff} />
            <span style={{ fontSize:12, color:'var(--text3)', background:'var(--bg)', padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)' }}>
              {new Date().toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </span>
          </div>
        </div>
        <div className="content">{renderPage()}</div>
      </div>
    </div>
  );
}
