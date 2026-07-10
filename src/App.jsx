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
import PlatformDashboard from './pages/PlatformDashboard.jsx';
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

  // Super admin: which company are we currently viewing (null = platform view)
  const [viewingCompany, setViewingCompany] = useState(null);

  // loadData — scoped by companyId (null = load all, for super admin)
  const loadData = async (scopedCompanyId) => {
    setLoading(true);
    try {
      const isScoped = !!scopedCompanyId;

      if (isScoped) {
        // Regular user or super admin in company view — only load that company's data
        const [p, a, m, s, i, ac, ach] = await Promise.all([
          getProperties(scopedCompanyId),
          getAssets(scopedCompanyId),
          getMaintenance(scopedCompanyId),
          getStaff(scopedCompanyId),
          getInventory(scopedCompanyId),
          getAircons(scopedCompanyId),
          getAcHistory(scopedCompanyId),
        ]);
        setAllProperties(p || []);
        setAllAssets((a || []).map(x => ({ ...x, ...(x.pid != null ? { pid: Number(x.pid) } : {}) })));
        setAllMaintenance(m || []);
        setAllStaff(s || []);
        setAllInventory((i || []).map(x => ({ ...x, ...(x.pid != null ? { pid: Number(x.pid) } : {}) })));
        setAllAircons(ac || []);
        setAllAcHistory(ach || []);
      } else {
        // Super admin platform view — load companies + all staff for platform stats
        const [c, s] = await Promise.all([
          getCompanies(),
          getStaff(null), // all staff for platform-level stats
        ]);
        setCompaniesState(c || []);
        setAllStaff((s || []).map(x => ({ ...x, pid: x.pid ? Number(x.pid) : x.pid })));
        // Clear asset data — not needed in platform view
        setAllProperties([]);
        setAllAssets([]);
        setAllMaintenance([]);
        setAllInventory([]);
        setAllAircons([]);
        setAllAcHistory([]);
      }
    } catch (err) {
      console.error('Load Firebase lỗi:', err);
      toast.error('Không tải được dữ liệu Firebase: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Determine scope from localStorage (set at login for non-super-admin)
    const storedCompanyId = localStorage.getItem('companyId');
    const isSA = String(user.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;

    if (isSA) {
      // Super admin starts in platform view — load companies only
      loadData(null);
    } else if (storedCompanyId) {
      // Regular user — load only their company's data
      loadData(storedCompanyId);
    } else {
      setLoading(false);
    }
  }, [user]);

  const superAdmin = isSuperAdminUser(user, null);

  const currentCompanyId = superAdmin
    ? (viewingCompany ? viewingCompany.id : null)
    : (localStorage.getItem('companyId'));

  // currentUser — from loaded staff
  const currentUser = allStaff.find(s =>
    String(s.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
  );

  // Branch-level visibility: admin/manager see all; staff/viewer only see assigned branches
  const userAllowedPids = (() => {
    if (superAdmin || !currentUser) return null; // see all
    const highPerm = ['company_admin', 'admin', 'manager'].includes(currentUser.permission);
    if (highPerm) return null; // see all within company
    // Normalize: new `pids[]` or legacy `pid`
    if (currentUser.pids?.length) return currentUser.pids.map(Number);
    if (currentUser.pid != null) return [Number(currentUser.pid)];
    return []; // staff with no assignment sees nothing
  })();

  const properties  = userAllowedPids
    ? allProperties.filter(p => userAllowedPids.includes(Number(p.id)))
    : allProperties;
  const assets      = userAllowedPids
    ? allAssets.filter(a => a.pid != null && userAllowedPids.includes(Number(a.pid)))
    : allAssets;
  const maintenance = userAllowedPids
    ? allMaintenance.filter(m => m.pid != null && userAllowedPids.includes(Number(m.pid)))
    : allMaintenance;
  const staff       = allStaff;
  const inventory   = userAllowedPids
    ? allInventory.filter(i => i.pid != null && userAllowedPids.includes(Number(i.pid)))
    : allInventory;

  // When super admin enters a company: load that company's data
  const handleEnterCompany = async (company) => {
    setViewingCompany(company);
    setPage('overview');
    setSidebarOpen(false);
    await loadData(company.id);
  };

  // When super admin exits back to platform: reload companies + all staff
  const handleExitCompany = async () => {
    setViewingCompany(null);
    setPage('companies');
    setSidebarOpen(false);
    await loadData(null);
  };

  const addCompanyId = (item) => {
    if (!item.companyId) {
      return { ...item, companyId: currentCompanyId || '' };
    }
    return item;
  };

  // Generic scoped save: tags each item with companyId, saves only this company's data
  // numericPid: convert pid to Number, but only if pid is not null/undefined (avoids Firestore undefined error)
  const scopeSave = (items, numericPid = false) =>
    items.map(x => addCompanyId(
      numericPid
        ? { ...x, ...(x.pid != null ? { pid: Number(x.pid) } : {}) }
        : x
    ));

  const setProperties = async (d) => {
    const scoped = scopeSave(d);
    setAllProperties(scoped);
    try { await saveProperties(scoped, currentCompanyId); }
    catch (err) { toast.error('Lỗi lưu cơ sở: ' + err.message); }
  };

  const setAssets = async (d) => {
    const scoped = scopeSave(d, true);
    setAllAssets(scoped);
    try { await saveAssets(scoped, currentCompanyId); }
    catch (err) { toast.error('Lỗi lưu tài sản: ' + err.message); }
  };

  const setMaintenance = async (d) => {
    const scoped = scopeSave(d);
    setAllMaintenance(scoped);
    try { await saveMaintenance(scoped, currentCompanyId); }
    catch (err) { toast.error('Lỗi lưu bảo trì: ' + err.message); }
  };

  const setStaff = async (d) => {
    const scoped = scopeSave(d, false); // staff has no pid field
    setAllStaff(scoped);
    try { await saveStaff(scoped, currentCompanyId); }
    catch (err) { toast.error('Lỗi lưu nhân viên: ' + err.message); }
  };

  const setInventory = async (d) => {
    const scoped = scopeSave(d, true);
    setAllInventory(scoped);
    try { await saveInventory(scoped, currentCompanyId);
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

  const isPlatformView = superAdmin && !viewingCompany;

  const PLATFORM_PAGES = ['overview', 'companies'];
  const ASSET_PAGES = ['properties', 'assets', 'aircon', 'maintenance', 'depreciation', 'inventory', 'staff'];

  const navigate = (p, propId = null) => {
    // Platform view: block asset management pages
    if (isPlatformView && ASSET_PAGES.includes(p)) return;
    setPage(p);
    setInitPropId(propId);
    setSidebarOpen(false);
  };

  // Auto-redirect if somehow on an asset page while in platform view
  const effectivePage = isPlatformView && ASSET_PAGES.includes(page) ? 'companies' : page;

  const pageInfo = isPlatformView
    ? (effectivePage === 'overview'
        ? { title: 'Platform Dashboard', sub: 'Account & company management' }
        : { title: 'Manage Companies', sub: 'All registered companies' })
    : (t(`pages.${effectivePage}`) || { title: effectivePage, sub: '' });

  const renderPage = () => {
    // Platform view — CMS only
    if (isPlatformView) {
      if (effectivePage === 'overview') {
        return (
          <PlatformDashboard
            companies={companies}
            allProperties={allProperties}
            allAssets={allAssets}
            allStaff={allStaff}
            onEnterCompany={handleEnterCompany}
          />
        );
      }
      // Fall through to companies case
    }

    switch (effectivePage) {
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
            onSaveAircons={async (d) => { setAllAircons(d); try { await saveAircons(d, currentCompanyId); } catch(e) { toast.error('Lỗi lưu máy lạnh: ' + e.message); } }}
            onSaveHistory={async (d) => { setAllAcHistory(d); try { await saveAcHistory(d, currentCompanyId); } catch(e) { toast.error('Lỗi lưu lịch sử bảo trì: ' + e.message); } }}
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
              {typeof pageInfo === 'object' ? pageInfo.title : effectivePage}
            </div>
            {typeof pageInfo === 'object' && pageInfo.sub && (
              <div className="topbar-sub">{pageInfo.sub}</div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isPlatformView && (
              <ExportButton
                properties={properties}
                assets={assets}
                maintenance={maintenance}
                staff={staff}
                inventory={inventory}
              />
            )}

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
