// src/App.jsx
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Menu, LogOut, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from './components/Toast.jsx';

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
  getAircons,
  getAcHistory,
  saveCompanies,
  saveProperties,
  saveAssets,
  saveMaintenance,
  saveStaff,
  saveInventory,
  saveAircons,
  saveAcHistory,
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
  const toast = useToast();

  const [allProperties, setAllProperties] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [allMaintenance, setAllMaintenance] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [allInventory, setAllInventory] = useState([]);
  const [companies, setCompaniesState] = useState([]);
  const [allAircons, setAllAircons] = useState([]);
  const [allAcHistory, setAllAcHistory] = useState([]);

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
        const [p, a, m, s, i, c, ac, ach] = await Promise.all([
          getProperties(),
          getAssets(),
          getMaintenance(),
          getStaff(),
          getInventory(),
          getCompanies(),
          getAircons(),
          getAcHistory(),
        ]);

        setAllProperties(p || []);
        setAllAssets((a || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setAllMaintenance(m || []);
        setAllStaff((s || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setAllInventory((i || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        setCompaniesState(c || []);
        setAllAircons(ac || []);
        setAllAcHistory(ach || []);
      } catch (err) {
        console.error('Load Firebase lỗi:', err);
        toast.error('Không tải được dữ liệu Firebase: ' + err.message);
      }

      setLoading(false);
    }

    loadAll();
  }, [user]);

  // Super admin: which company are we currently viewing (null = platform view)
  const [viewingCompany, setViewingCompany] = useState(null);

  const currentUser = allStaff.find(s =>
    String(s.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
  );

  const superAdmin = isSuperAdminUser(user, currentUser);

  // The "active" companyId for data filtering:
  // - Regular user: their own companyId
  // - Super Admin in platform view: null (no filter yet → companies page)
  // - Super Admin viewing a company: viewingCompany.id
  const currentCompanyId = superAdmin
    ? (viewingCompany ? viewingCompany.id : null)
    : (currentUser?.companyId || localStorage.getItem('companyId'));

  const filterByCompany = (items) => {
    if (superAdmin && !viewingCompany) return items; // platform view – show all for stats
    if (superAdmin && viewingCompany) {
      return items.filter(x => String(x.companyId || '') === String(viewingCompany.id));
    }
    return items.filter(x => String(x.companyId || '') === String(currentCompanyId || ''));
  };

  const properties = filterByCompany(allProperties);
  const assets     = filterByCompany(allAssets);
  const maintenance= filterByCompany(allMaintenance);
  const staff      = filterByCompany(allStaff);
  const inventory  = filterByCompany(allInventory);

  // When super admin enters a company, auto-navigate to overview
  const handleEnterCompany = (company) => {
    setViewingCompany(company);
    setPage('overview');
    setSidebarOpen(false);
  };

  const handleExitCompany = () => {
    setViewingCompany(null);
    setPage('companies');
    setSidebarOpen(false);
  };

  const addCompanyId = (item) => {
    if (superAdmin && viewingCompany) {
      return { ...item, companyId: item.companyId || viewingCompany.id };
    }
    if (superAdmin) return item;
    return { ...item, companyId: item.companyId || currentCompanyId };
  };

  const setProperties = async (d) => {
    const scopedData = d.map(addCompanyId);
    const merged = (superAdmin && !viewingCompany)
      ? scopedData
      : [
          ...allProperties.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllProperties(merged);

    try {
      await saveProperties(merged);
    } catch (err) {
      toast.error('Lỗi lưu cơ sở: ' + err.message);
    }
  };

  const setAssets = async (d) => {
    const scopedData = d.map(x => addCompanyId({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    const merged = (superAdmin && !viewingCompany)
      ? scopedData
      : [
          ...allAssets.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllAssets(merged);

    try {
      await saveAssets(merged);
    } catch (err) {
      toast.error('Lỗi lưu tài sản: ' + err.message);
    }
  };

  const setMaintenance = async (d) => {
    const scopedData = d.map(addCompanyId);
    const merged = (superAdmin && !viewingCompany)
      ? scopedData
      : [
          ...allMaintenance.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllMaintenance(merged);

    try {
      await saveMaintenance(merged);
    } catch (err) {
      toast.error('Lỗi lưu bảo trì: ' + err.message);
    }
  };

  const setStaff = async (d) => {
    const scopedData = d.map(x => ({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
      companyId: superAdmin ? x.companyId : currentCompanyId,
    }));

    const merged = (superAdmin && !viewingCompany)
      ? scopedData
      : [
          ...allStaff.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllStaff(merged);

    try {
      await saveStaff(merged);
    } catch (err) {
      toast.error('Lỗi lưu nhân viên: ' + err.message);
    }
  };

  const setInventory = async (d) => {
    const scopedData = d.map(x => addCompanyId({
      ...x,
      pid: x.pid ? Number(x.pid) : x.pid,
    }));

    const merged = (superAdmin && !viewingCompany)
      ? scopedData
      : [
          ...allInventory.filter(x => String(x.companyId || '') !== String(currentCompanyId || '')),
          ...scopedData,
        ];

    setAllInventory(merged);

    try {
      await saveInventory(merged);
    } catch (err) {
      toast.error('Lỗi lưu kho vật tư: ' + err.message);
    }
  };

  const setCompanies = async (d) => {
    setCompaniesState(d);

    try {
      await saveCompanies(d);
    } catch (err) {
      toast.error('Lỗi lưu công ty: ' + err.message);
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
        return (
          <AirCon
            properties={properties}
            aircons={allAircons}
            acHistory={allAcHistory}
            onSaveAircons={async (d) => { setAllAircons(d); try { await saveAircons(d); } catch(e) { console.error(e); } }}
            onSaveHistory={async (d) => { setAllAcHistory(d); try { await saveAcHistory(d); } catch(e) { console.error(e); } }}
          />
        );

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
            allProperties={allProperties}
            allAssets={allAssets}
            allStaff={allStaff}
            onEnterCompany={handleEnterCompany}
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
        {t('common.loading')}
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
        viewingCompany={viewingCompany}
        onExitCompany={handleExitCompany}
      />

      {/* ── MAIN CONTENT ── */}
      <div className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <button
            className="btn btn-sm btn-icon"
            style={{ display: 'none' }}
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }}>
            <div className="topbar-title">
              {typeof pageInfo === 'object' ? pageInfo.title : page}
            </div>
            {typeof pageInfo === 'object' && pageInfo.sub && (
              <div className="topbar-sub">{pageInfo.sub}</div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExportButton
              properties={properties}
              assets={assets}
              maintenance={maintenance}
              staff={staff}
              inventory={inventory}
            />

            <button
              className="btn btn-sm"
              onClick={() => signOut(auth)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)' }}
            >
              <LogOut size={14} />
              <span style={{ fontSize: 12 }}>{t('common.logout')}</span>
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
