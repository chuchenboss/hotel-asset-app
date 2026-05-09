// src/App.jsx
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar.jsx';
import ExportButton from './components/ExportButton.jsx';
import Overview from './pages/Overview.jsx';
import Properties from './pages/Properties.jsx';
import Assets from './pages/Assets.jsx';
import AirCon from './pages/AirCon.jsx';
import Settings from './pages/Settings.jsx';
import Companies from './pages/Companies.jsx';
import { Maintenance, Depreciation, Staff, Inventory } from './pages/OtherPages.jsx';
import Login from './Login.jsx';

import {
  auth,
  getProperties,
  getAssets,
  getMaintenance,
  getStaff,
  getInventory,
  getCompanies,
  saveCompanies,
  saveProperties,
  saveAssets,
  saveMaintenance,
  saveStaff,
  saveInventory,
  migrateLocalToFirebase,
} from './data/firebase.js';

import { useTranslation } from './i18n/useTranslation.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState('overview');
  const [initPropId, setInitPropId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { t } = useTranslation();

  const [properties, setPropertiesState] = useState([]);
  const [assets, setAssetsState] = useState([]);
  const [maintenance, setMaintenanceState] = useState([]);
  const [staff, setStaffState] = useState([]);
  const [inventory, setInventoryState] = useState([]);
  const [companies, setCompaniesState] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckingAuth(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadAll() {
      setLoading(true);

      try {
        const [p, a, m, s, i, c] = await Promise.all([
          getProperties(),
          getAssets(),
          getMaintenance(),
          getStaff(),
          getInventory(),
          getCompanies(),
        ]);

        setPropertiesState(p || []);
        setAssetsState((a || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setMaintenanceState(m || []);
        setStaffState((s || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setInventoryState((i || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setCompaniesState(c || []);
      } catch (err) {
        console.error('Load Firebase lỗi:', err);
        alert('Không tải được dữ liệu Firebase: ' + err.message);
      }

      setLoading(false);
    }

    loadAll();
  }, [user]);

  const currentUser = staff.find(s =>
    String(s.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
  );

  const setProperties = async (d) => {
    setPropertiesState(d);
    try {
      await saveProperties(d);
    } catch (err) {
      alert('Lỗi lưu cơ sở: ' + err.message);
    }
  };

  const setAssets = async (d) => {
    const cleanData = d.map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid }));
    setAssetsState(cleanData);

    try {
      await saveAssets(cleanData);
    } catch (err) {
      alert('Lỗi lưu tài sản: ' + err.message);
    }
  };

  const setMaintenance = async (d) => {
    setMaintenanceState(d);
    try {
      await saveMaintenance(d);
    } catch (err) {
      alert('Lỗi lưu bảo trì: ' + err.message);
    }
  };

  const setStaff = async (d) => {
    const cleanData = d.map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid }));
    setStaffState(cleanData);

    try {
      await saveStaff(cleanData);
    } catch (err) {
      alert('Lỗi lưu nhân viên: ' + err.message);
    }
  };

  const setInventory = async (d) => {
    const cleanData = d.map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid }));
    setInventoryState(cleanData);

    try {
      await saveInventory(cleanData);
    } catch (err) {
      alert('Lỗi lưu kho vật tư: ' + err.message);
    }
  };

  const setCompanies = async (d) => {
    setCompaniesState(d);

    try {
      await saveCompanies(d);
    } catch (err) {
      alert('Lỗi lưu công ty: ' + err.message);
    }
  };

  const urgentAlerts = maintenance.filter(m =>
    (m.urgency === 'Khẩn' || m.urgency === 'Urgent') &&
    m.status !== 'Hoàn thành' &&
    m.status !== 'Completed'
  ).length;

  const navigate = (p, propId = null) => {
    setPage(p);
    setInitPropId(propId);
    setSidebarOpen(false);
  };

  const pageInfo = t(`pages.${page}`) || { title: page, sub: '' };

  const renderPage = () => {
    switch (page) {
      case 'overview':
        return <Overview properties={properties} assets={assets} maintenance={maintenance} />;

      case 'properties':
        return <Properties properties={properties} setProperties={setProperties} assets={assets} />;

      case 'assets':
        return <Assets properties={properties} assets={assets} setAssets={setAssets} initialPropId={initPropId} />;

      case 'aircon':
        return <AirCon properties={properties} />;

      case 'maintenance':
        return <Maintenance properties={properties} assets={assets} maintenance={maintenance} setMaintenance={setMaintenance} />;

      case 'depreciation':
        return <Depreciation properties={properties} assets={assets} />;

      case 'inventory':
        return <Inventory properties={properties} inventory={inventory} setInventory={setInventory} />;

      case 'staff':
        return (
          <Staff
            properties={properties}
            staff={staff}
            setStaff={setStaff}
            currentUser={currentUser}
          />
        );

      case 'companies':
        if (!currentUser?.isSuperAdmin) return null;

        return (
          <Companies
            companies={companies}
            setCompanies={setCompanies}
          />
        );

      case 'settings':
        return (
          <Settings
            maintenance={maintenance}
            properties={properties}
            staff={staff}
            onMigrate={migrateLocalToFirebase}
          />
        );

      default:
        return null;
    }
  };

  if (checkingAuth || loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
      }}>
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-layout">
      <div
        className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        page={page}
        onNavigate={navigate}
        properties={properties}
        alerts={urgentAlerts}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        currentUser={currentUser}
      />

      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>

            <div>
              <div className="topbar-title">{pageInfo.title}</div>
              <div className="topbar-sub">{pageInfo.sub}</div>
            </div>
          </div>

          <div className="topbar-actions">
            <span style={{
              fontSize: 12,
              color: 'var(--text3)',
              background: 'var(--bg)',
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
            }}>
              {user.email}
            </span>

            <ExportButton
              properties={properties}
              assets={assets}
              maintenance={maintenance}
              inventory={inventory}
              staff={staff}
            />

            <span style={{
              fontSize: 12,
              color: 'var(--text3)',
              background: 'var(--bg)',
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
            }}>
              {new Date().toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
              })}
            </span>

            <button className="btn" onClick={() => signOut(auth)}>
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="content">{renderPage()}</div>
      </div>
    </div>
  );
}