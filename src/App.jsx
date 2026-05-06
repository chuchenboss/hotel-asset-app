import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Sidebar from './components/Sidebar.jsx';
import ExportButton from './components/ExportButton.jsx';
import Overview from './pages/Overview.jsx';
import Properties from './pages/Properties.jsx';
import Assets from './pages/Assets.jsx';
import AirCon from './pages/AirCon.jsx';
import Settings from './pages/Settings.jsx';
import { Maintenance, Depreciation, Staff, Inventory } from './pages/OtherPages.jsx';

import Login from './Login.jsx';

import {
  auth,
  getProperties, saveProperties,
  getAssets, saveAssets,
  getMaintenance, saveMaintenance,
  getStaff, saveStaff,
  getInventory, saveInventory,
  migrateLocalToFirebase,
} from './data/firebase.js';

import { useTranslation } from './i18n/useTranslation.jsx';

export default function App() {
  const [page, setPage] = useState('overview');
  const [initPropId, setInitPropId] = useState(null);

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  const [properties, setPropertiesState] = useState([]);
  const [assets, setAssetsState] = useState([]);
  const [maintenance, setMaintenanceState] = useState([]);
  const [staff, setStaffState] = useState([]);
  const [inventory, setInventoryState] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
        const [p, a, m, s, i] = await Promise.all([
          getProperties(),
          getAssets(),
          getMaintenance(),
          getStaff(),
          getInventory(),
        ]);

        setPropertiesState(p || []);

        setAssetsState((a || []).map(x => ({
          ...x,
          pid: x.pid ? Number(x.pid) : x.pid,
        })));

        setMaintenanceState(m || []);
        setStaffState((s || []).map(x => ({
          ...x,
          pid: x.pid ? Number(x.pid) : x.pid,
        })));
        setInventoryState((i || []).map(x => ({
          ...x,
          pid: x.pid ? Number(x.pid) : x.pid,
        })));
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
      console.error('Lỗi lưu properties:', err);
      alert('Lỗi lưu cơ sở: ' + err.message);
    }
  };

  const setAssets = async (d) => {
    const cleanData = d.map(x => ({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    setAssetsState(cleanData);

    try {
      await saveAssets(cleanData);
    } catch (err) {
      console.error('Lỗi lưu assets:', err);
      alert('Lỗi lưu tài sản: ' + err.message);
    }
  };

  const setMaintenance = async (d) => {
    setMaintenanceState(d);
    try {
      await saveMaintenance(d);
    } catch (err) {
      console.error('Lỗi lưu maintenance:', err);
      alert('Lỗi lưu bảo trì: ' + err.message);
    }
  };

  const setStaff = async (d) => {
    const cleanData = d.map(x => ({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    setStaffState(cleanData);

    try {
      await saveStaff(cleanData);
    } catch (err) {
      console.error('Lỗi lưu staff:', err);
      alert('Lỗi lưu nhân viên: ' + err.message);
    }
  };

  const setInventory = async (d) => {
    const cleanData = d.map(x => ({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    setInventoryState(cleanData);

    try {
      await saveInventory(cleanData);
    } catch (err) {
      console.error('Lỗi lưu inventory:', err);
      alert('Lỗi lưu kho vật tư: ' + err.message);
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
  };

  const pageInfo = t(`pages.${page}`) || { title: page, sub: '' };

  const renderPage = () => {
    switch (page) {
      case 'overview':
        return (
          <Overview
            properties={properties}
            assets={assets}
            maintenance={maintenance}
          />
        );

      case 'properties':
        return (
          <Properties
            properties={properties}
            setProperties={setProperties}
            assets={assets}
          />
        );

      case 'assets':
        return (
          <Assets
            properties={properties}
            assets={assets}
            setAssets={setAssets}
            initialPropId={initPropId}
          />
        );

      case 'aircon':
        return (
          <AirCon
            properties={properties}
          />
        );

      case 'maintenance':
        return (
          <Maintenance
            properties={properties}
            assets={assets}
            maintenance={maintenance}
            setMaintenance={setMaintenance}
          />
        );

      case 'depreciation':
        return (
          <Depreciation
            properties={properties}
            assets={assets}
          />
        );

      case 'inventory':
        return (
          <Inventory
            properties={properties}
            inventory={inventory}
            setInventory={setInventory}
          />
        );

      case 'staff':
        return (
          <Staff
            properties={properties}
            staff={staff}
            setStaff={setStaff}
            currentUser={currentUser}
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

  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)'
      }}>
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (!user) return <Login />;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg)'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #1D9E75',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ fontSize: 14, color: 'var(--text2)' }}>
          Đang tải dữ liệu từ Firebase...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        page={page}
        onNavigate={navigate}
        properties={properties}
        alerts={urgentAlerts}
      />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-title">{pageInfo.title}</div>
            <div className="topbar-sub">{pageInfo.sub}</div>
          </div>

          <div className="topbar-actions">
            <span style={{
              fontSize: 12,
              color: 'var(--text3)',
              background: 'var(--bg)',
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid var(--border)'
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
              border: '1px solid var(--border)'
            }}>
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>

            <button className="btn" onClick={() => signOut(auth)}>
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}