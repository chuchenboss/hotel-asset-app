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

const SUPER_ADMIN_EMAIL = 'chuchen.boss@gmail.com';

function isSuperAdminUser(user, staffUser) {
  return (
    String(user?.email || '').toLowerCase() === SUPER_ADMIN_EMAIL ||
    staffUser?.isSuperAdmin === true ||
    staffUser?.permission === 'super_admin'
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState('overview');
  const [initPropId, setInitPropId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { t } = useTranslation();

  const [allProperties, setAllProperties] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [allMaintenance, setAllMaintenance] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [allInventory, setAllInventory] = useState([]);
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

        setAllProperties(p || []);
        setAllAssets((a || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setAllMaintenance(m || []);
        setAllStaff((s || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setAllInventory((i || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setCompaniesState(c || []);
      } catch (err) {
        console.error('Load Firebase lỗi:', err);
        alert('Không tải được dữ liệu Firebase: ' + err.message);
      }

      setLoading(false);
    }

    loadAll();
  }, [user]);

  const currentUser = allStaff.find(s =>
    String(s.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
  );

  const superAdmin = isSuperAdminUser(user, currentUser);
  const currentCompanyId = superAdmin
    ? 'super-admin'
    : currentUser?.companyId || localStorage.getItem('companyId');

  const filterByCompany = (items) => {
    if (superAdmin) return items;
    return items.filter(x => String(x.companyId || '') === String(currentCompanyId || ''));
  };

  const properties = filterByCompany(allProperties);
  const assets = filterByCompany(allAssets);
  const maintenance = filterByCompany(allMaintenance);
  const staff = filterByCompany(allStaff);
  const inventory = filterByCompany(allInventory);

  const addCompanyId = (item) => {
    if (superAdmin) return item;

    return {
      ...item,
      companyId: item.companyId || currentCompanyId,
    };
  };

  const setProperties = async (d) => {
    const scopedData = d.map(addCompanyId);
    const merged = superAdmin
      ? scopedData
      : [
          ...allProperties.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllProperties(merged);

    try {
      await saveProperties(merged);
    } catch (err) {
      alert('Lỗi lưu cơ sở: ' + err.message);
    }
  };

  const setAssets = async (d) => {
    const scopedData = d.map(x => addCompanyId({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    const merged = superAdmin
      ? scopedData
      : [
          ...allAssets.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllAssets(merged);

    try {
      await saveAssets(merged);
    } catch (err) {
      alert('Lỗi lưu tài sản: ' + err.message);
    }
  };

  const setMaintenance = async (d) => {
    const scopedData = d.map(addCompanyId);
    const merged = superAdmin
      ? scopedData
      : [
          ...allMaintenance.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllMaintenance(merged);

    try {
      await saveMaintenance(merged);
    } catch (err) {
      alert('Lỗi lưu bảo trì: ' + err.message);
    }
  };

  const setStaff = async (d) => {
    const scopedData = d.map(x => ({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
      companyId: superAdmin ? x.companyId : currentCompanyId,
    }));

    const merged = superAdmin
      ? scopedData
      : [
          ...allStaff.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllStaff(merged);

    try {
      await saveStaff(merged);
    } catch (err) {
      alert('Lỗi lưu nhân viên: ' + err.message);
    }
  };

  const setInventory = async (d) => {
    const scopedData = d.map(x => addCompanyId({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    const merged = superAdmin
      ? scopedData
      : [
          ...allInventory.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllInventory(merged);

    try {
      await saveInventory(merged);
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
            currentUser={{
              ...currentUser,
              email: user?.email,
              companyId: currentCompanyId,
              isSuperAdmin: superAdmin,
              permission: superAdmin ? 'super_admin' : currentUser?.permission,
            }}
          />
        );

      case 'companies':
        if (!superAdmin) return null;

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
        currentUser={{
          ...currentUser,
          email: user?.email,
          companyId: currentCompanyId,
          isSuperAdmin: superAdmin,
          permission: superAdmin ? 'super_admin' : currentUser?.permission,
        }}
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
              {new Date().toLocaleDateString('vi-VN')}
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