// src/pages/AirCon.jsx
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle } from 'lucide-react';
import { Modal, Field } from '../components/UI.jsx';
import { useTranslation } from '../i18n/useTranslation.jsx';

const CYCLES = [1, 2, 3, 6, 12];

const STATUS_CONFIG = {
  'Hoạt động':   { color: '#1D9E75', bg: '#E1F5EE', border: '#9FE1CB', icon: '●' },
  'Operating':   { color: '#1D9E75', bg: '#E1F5EE', border: '#9FE1CB', icon: '●' },
  'Đến hạn BT':  { color: '#854F0B', bg: '#FAEEDA', border: '#FAC775', icon: '⚠' },
  'Due Maintenance': { color: '#854F0B', bg: '#FAEEDA', border: '#FAC775', icon: '⚠' },
  'Đang bảo trì':{ color: '#185FA5', bg: '#E6F1FB', border: '#B5D4F4', icon: '🔧' },
  'In Maintenance':  { color: '#185FA5', bg: '#E6F1FB', border: '#B5D4F4', icon: '🔧' },
  'Hỏng hóc':    { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', icon: '✕' },
  'Broken':      { color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1', icon: '✕' },
};

function getCfg(status) {
  return STATUS_CONFIG[status] || { color: '#1D9E75', bg: '#E1F5EE', border: '#9FE1CB', icon: '●' };
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function daysDiff(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.round((new Date(dateStr) - today) / 86400000);
}

function fmtDate(dateStr, lang) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN');
}

// ---- AC FORM ----
function AcForm({ initial, properties, onSave, onClose }) {
  const { t, lang } = useTranslation();
  const BRANDS = ['Daikin','Mitsubishi','Panasonic','LG','Samsung','Carrier','Trane','Khác / Other'];
  const CAPS   = ['1HP','1.5HP','2HP','2.5HP','3HP','5HP','Trung tâm / Central'];

  const statusOptions = [
    { vi: 'Hoạt động',    en: 'Operating' },
    { vi: 'Đến hạn BT',  en: 'Due Maintenance' },
    { vi: 'Đang bảo trì',en: 'In Maintenance' },
    { vi: 'Hỏng hóc',    en: 'Broken' },
  ];

  const [form, setForm] = useState(initial || {
    pid: properties[0]?.id || '',
    room: '', floor: '', brand: 'Daikin', capacity: '2HP',
    serial: '', installYear: new Date().getFullYear(),
    cycle: 3, lastMaint: new Date().toISOString().slice(0,10),
    status: 'Hoạt động', note: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const nextMaint = form.lastMaint ? addMonths(form.lastMaint, form.cycle) : '—';

  return (
    <Modal title={initial?.id ? t('aircon.edit') : t('aircon.add')} onClose={onClose} footer={<>
      <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
      <button className="btn btn-primary" onClick={() => { if (!form.room) return alert(t('common.location')); onSave(form); }}>{t('common.save')}</button>
    </>}>
      <Field label={t('common.branch')}>
        <select className="select" value={form.pid} onChange={e => set('pid', parseInt(e.target.value))}>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <div className="form-row">
        <Field label={t('common.location') + ' *'}>
          <input className="input" value={form.room} onChange={e => set('room', e.target.value)} placeholder={t('aircon.roomPlaceholder')} />
        </Field>
        <Field label={t('common.floor')}>
          <input className="input" value={form.floor} onChange={e => set('floor', e.target.value)} placeholder={t('aircon.floorPlaceholder')} />
        </Field>
      </div>
      <div className="form-row">
        <Field label={t('aircon.brand')}>
          <select className="select" value={form.brand} onChange={e => set('brand', e.target.value)}>
            {BRANDS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label={t('aircon.capacity')}>
          <select className="select" value={form.capacity} onChange={e => set('capacity', e.target.value)}>
            {CAPS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="form-row">
        <Field label={t('assets.serial')}>
          <input className="input" value={form.serial} onChange={e => set('serial', e.target.value)} placeholder={t('aircon.serialPlaceholder')} />
        </Field>
        <Field label={t('assets.installYear')}>
          <input className="input" type="number" value={form.installYear} onChange={e => set('installYear', parseInt(e.target.value))} />
        </Field>
      </div>
      <div className="form-row">
        <Field label={t('aircon.cycleLabel')}>
          <select className="select" value={form.cycle} onChange={e => set('cycle', parseInt(e.target.value))}>
            {CYCLES.map(c => <option key={c} value={c}>{c} {t('aircon.months')} / {lang === 'en' ? 'cycle' : 'lần'}</option>)}
          </select>
        </Field>
        <Field label={t('aircon.lastMaint')}>
          <input className="input" type="date" value={form.lastMaint} onChange={e => set('lastMaint', e.target.value)} />
        </Field>
      </div>
      <div style={{ background:'var(--bg)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--green)', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        <RotateCcw size={13}/> {t('aircon.nextAuto')}: <strong>{nextMaint !== '—' ? fmtDate(nextMaint, lang) : '—'}</strong>
      </div>
      <Field label={t('common.status')}>
        <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
          {statusOptions.map(s => <option key={s.vi} value={s.vi}>{lang === 'en' ? s.en : s.vi}</option>)}
        </select>
      </Field>
      <Field label={t('common.note')}>
        <textarea className="input" value={form.note} onChange={e => set('note', e.target.value)} style={{ resize:'vertical', minHeight:60 }} />
      </Field>
    </Modal>
  );
}

// ---- MAINTENANCE LOG FORM ----
function MaintLogForm({ ac, onSave, onClose }) {
  const { t, lang } = useTranslation();
  const MAINT_TYPES_VI = ['Vệ sinh lọc gió','Vệ sinh toàn bộ','Nạp gas','Thay linh kiện','Sửa chữa','Kiểm tra định kỳ'];
  const MAINT_TYPES_EN = ['Clean Air Filter','Full Cleaning','Refill Refrigerant','Replace Parts','Repair','Routine Inspection'];
  const TYPES = lang === 'en' ? MAINT_TYPES_EN : MAINT_TYPES_VI;

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    type: TYPES[0], tech: '', cost: '', note: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal title={`${t('aircon.logTitle')} — ${ac.room}`} onClose={onClose} footer={<>
      <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
      <button className="btn btn-primary" onClick={() => { if (!form.tech) return alert(t('maintenance.technician')); onSave(form); }}>
        <CheckCircle size={13}/> {t('aircon.confirmLog')}
      </button>
    </>}>
      <div style={{ background:'var(--green-light)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--green)', marginBottom:14 }}>
        {t('aircon.logAutoMsg')} <strong>{ac.cycle} {t('aircon.months')}</strong>.
      </div>
      <Field label={t('common.date')}><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
      <Field label={t('maintenance.content')}>
        <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
          {TYPES.map(tp => <option key={tp}>{tp}</option>)}
        </select>
      </Field>
      <div className="form-row">
        <Field label={t('maintenance.technician') + ' *'}><input className="input" value={form.tech} onChange={e => set('tech', e.target.value)} placeholder={t('maintenance.techPlaceholder')} /></Field>
        <Field label={t('common.cost') + ' (VNĐ)'}><input className="input" type="number" value={form.cost} onChange={e => set('cost', e.target.value)} /></Field>
      </div>
      <Field label={t('common.note')}><textarea className="input" value={form.note} onChange={e => set('note', e.target.value)} style={{ resize:'vertical', minHeight:56 }} /></Field>
    </Modal>
  );
}

// ---- DETAIL MODAL ----
function AcDetail({ ac, history, onClose, onLog, onEdit }) {
  const { t, lang } = useTranslation();
  const cfg = getCfg(ac.status);
  const acHistory = history.filter(h => h.acId === ac.id).sort((a,b) => new Date(b.date)-new Date(a.date));
  const nextMaint = ac.lastMaint ? addMonths(ac.lastMaint, ac.cycle) : null;
  const days = nextMaint ? daysDiff(nextMaint) : null;

  return (
    <Modal title={`${lang === 'en' ? 'AC Unit' : 'Máy lạnh'} ${ac.room}`} onClose={onClose} footer={<>
      <button className="btn" onClick={onEdit}><Pencil size={13}/> {t('common.edit')}</button>
      <button className="btn btn-primary" onClick={onLog}><CheckCircle size={13}/> {t('aircon.logMaint')}</button>
    </>}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        {[
          [t('aircon.brand'), ac.brand],
          [t('aircon.capacity'), ac.capacity],
          [t('common.floor'), ac.floor || '—'],
          [t('assets.installYear'), ac.installYear],
          [t('assets.serial'), ac.serial || '—'],
          [t('aircon.cycleLabel'), `${ac.cycle} ${t('aircon.months')}`],
        ].map(([k,v]) => (
          <div key={k} style={{ background:'var(--bg)', borderRadius:7, padding:'8px 10px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>{k}</div>
            <div style={{ fontSize:13, fontWeight:500 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <div style={{ flex:1, background:cfg.bg, border:`0.5px solid ${cfg.border}`, borderRadius:8, padding:'10px 12px' }}>
          <div style={{ fontSize:11, color:cfg.color, marginBottom:2 }}>{t('common.status')}</div>
          <div style={{ fontSize:13, fontWeight:600, color:cfg.color }}>{ac.status}</div>
        </div>
        <div style={{ flex:1, background: days!==null&&days<=7?'#FCEBEB':days!==null&&days<=30?'#FAEEDA':'#E1F5EE', borderRadius:8, padding:'10px 12px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>{t('aircon.nextMaint')}</div>
          <div style={{ fontSize:13, fontWeight:600 }}>{nextMaint ? fmtDate(nextMaint, lang) : '—'}</div>
          {days!==null && <div style={{ fontSize:11, color:days<=0?'var(--red)':days<=30?'var(--amber)':'var(--green)' }}>
            {days<=0 ? (lang==='en'?'Overdue!':'Đã quá hạn!') : `${lang==='en'?'In':'Còn'} ${days} ${lang==='en'?'days':'ngày'}`}
          </div>}
        </div>
      </div>

      <div style={{ fontWeight:600, fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>
        {t('aircon.maintHistory')} ({acHistory.length})
      </div>
      {acHistory.length === 0 ? (
        <div style={{ textAlign:'center', padding:'20px', color:'var(--text3)', fontSize:13 }}>{t('aircon.noHistory')}</div>
      ) : (
        <div style={{ maxHeight:220, overflowY:'auto' }}>
          {acHistory.map((h,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:'0.5px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#1D9E75', flexShrink:0, marginTop:5 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{h.type}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                  {fmtDate(h.date, lang)} · {h.tech} {h.cost ? `· ${parseInt(h.cost).toLocaleString('vi-VN')}đ` : ''}
                </div>
                {h.note && <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{h.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {ac.note && <div style={{ marginTop:12, fontSize:12, color:'var(--text2)', background:'var(--bg)', borderRadius:7, padding:'8px 10px' }}>📝 {ac.note}</div>}
    </Modal>
  );
}

// ---- DEFAULT DATA ----
const DEFAULT_ACS = [
  { id:1, pid:1, room:'P.101', floor:'Tầng 1', brand:'Daikin',     capacity:'2HP',  serial:'DAI-2020-001', installYear:2020, cycle:3, lastMaint:'2026-02-01', status:'Hoạt động',   note:'' },
  { id:2, pid:1, room:'P.102', floor:'Tầng 1', brand:'Daikin',     capacity:'2HP',  serial:'DAI-2020-002', installYear:2020, cycle:3, lastMaint:'2026-03-15', status:'Đến hạn BT',  note:'' },
  { id:3, pid:1, room:'P.103', floor:'Tầng 1', brand:'Panasonic',  capacity:'1.5HP',serial:'PAN-2021-003', installYear:2021, cycle:3, lastMaint:'2026-01-10', status:'Hỏng hóc',    note:'Cần thay board mạch' },
  { id:4, pid:1, room:'P.201', floor:'Tầng 2', brand:'Daikin',     capacity:'2HP',  serial:'DAI-2020-004', installYear:2020, cycle:6, lastMaint:'2026-03-01', status:'Hoạt động',   note:'' },
  { id:5, pid:1, room:'P.202', floor:'Tầng 2', brand:'Mitsubishi', capacity:'2HP',  serial:'MIT-2022-005', installYear:2022, cycle:3, lastMaint:'2026-04-01', status:'Hoạt động',   note:'' },
  { id:6, pid:1, room:'P.203', floor:'Tầng 2', brand:'LG',         capacity:'1.5HP',serial:'LG-2021-006',  installYear:2021, cycle:3, lastMaint:'2026-02-20', status:'Đến hạn BT',  note:'' },
  { id:7, pid:1, room:'Lobby', floor:'Tầng 1', brand:'Carrier',    capacity:'5HP',  serial:'CAR-2019-007', installYear:2019, cycle:2, lastMaint:'2026-03-10', status:'Hoạt động',   note:'' },
  { id:8, pid:1, room:'Nhà hàng', floor:'Tầng 1', brand:'Trane',   capacity:'5HP',  serial:'TRA-2019-008', installYear:2019, cycle:2, lastMaint:'2026-04-10', status:'Đang bảo trì',note:'' },
];

const DEFAULT_HISTORY = [
  { acId:1, date:'2026-02-01', type:'Vệ sinh lọc gió',  tech:'Minh T.',            cost:'350000', note:'' },
  { acId:1, date:'2025-11-01', type:'Vệ sinh toàn bộ',  tech:'Minh T.',            cost:'520000', note:'Thay lọc mới' },
  { acId:2, date:'2026-03-15', type:'Vệ sinh lọc gió',  tech:'Hùng V.',            cost:'350000', note:'' },
  { acId:3, date:'2026-01-10', type:'Sửa chữa',         tech:'Cty ABC Điện lạnh',  cost:'1500000',note:'Đã sửa quạt, còn lỗi board' },
];

// ---- MAIN COMPONENT ----
export default function AirCon({ properties, aircons: airconsProp, acHistory: acHistoryProp, onSaveAircons, onSaveHistory }) {
  const { t, lang } = useTranslation();

  // Use Firebase data if available, fall back to localStorage for first load
  const [acs, setAcs] = useState(() => {
    if (airconsProp && airconsProp.length > 0) return airconsProp;
    try { const r = localStorage.getItem('aircons'); return r ? JSON.parse(r) : DEFAULT_ACS; } catch { return DEFAULT_ACS; }
  });
  const [history, setHistory] = useState(() => {
    if (acHistoryProp && acHistoryProp.length > 0) return acHistoryProp;
    try { const r = localStorage.getItem('ac_history'); return r ? JSON.parse(r) : DEFAULT_HISTORY; } catch { return DEFAULT_HISTORY; }
  });

  // Sync from Firebase when props update
  useState(() => {
    if (airconsProp?.length > 0) setAcs(airconsProp);
  });

  const saveAcs = d => {
    setAcs(d);
    if (onSaveAircons) onSaveAircons(d);
    else localStorage.setItem('aircons', JSON.stringify(d));
  };
  const saveHistory = d => {
    setHistory(d);
    if (onSaveHistory) onSaveHistory(d);
    else localStorage.setItem('ac_history', JSON.stringify(d));
  };

  const [selProp,   setSelProp]   = useState('all');
  const [selStatus, setSelStatus] = useState('all');
  const [selFloor,  setSelFloor]  = useState('all');
  const [search,    setSearch]    = useState('');
  const [viewMode,  setViewMode]  = useState('grid');
  const [calMonth,  setCalMonth]  = useState(new Date().getMonth());
  const [calYear,   setCalYear]   = useState(new Date().getFullYear());
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [logging,   setLogging]   = useState(null);

  const floors = useMemo(() => [...new Set(acs.map(a => a.floor).filter(Boolean))].sort(), [acs]);

  const filtered = useMemo(() => acs.filter(a => {
    if (selProp   !== 'all' && a.pid !== selProp)     return false;
    if (selStatus !== 'all' && a.status !== selStatus) return false;
    if (selFloor  !== 'all' && a.floor  !== selFloor)  return false;
    if (search) return a.room.toLowerCase().includes(search.toLowerCase()) || a.brand.toLowerCase().includes(search.toLowerCase());
    return true;
  }), [acs, selProp, selStatus, selFloor, search]);

  const stats = useMemo(() => ({
    total:   acs.length,
    ok:      acs.filter(a => a.status === 'Hoạt động'   || a.status === 'Operating').length,
    due:     acs.filter(a => a.status === 'Đến hạn BT'  || a.status === 'Due Maintenance').length,
    inMaint: acs.filter(a => a.status === 'Đang bảo trì'|| a.status === 'In Maintenance').length,
    broken:  acs.filter(a => a.status === 'Hỏng hóc'   || a.status === 'Broken').length,
  }), [acs]);

  const calEvents = useMemo(() => {
    const events = {};
    acs.forEach(ac => {
      if (!ac.lastMaint) return;
      let d = new Date(ac.lastMaint);
      for (let i = 0; i < 24; i++) {
        d = new Date(d); d.setMonth(d.getMonth() + ac.cycle);
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
          const day = d.getDate();
          if (!events[day]) events[day] = [];
          events[day].push(ac);
        }
      }
    });
    return events;
  }, [acs, calMonth, calYear]);

  const handleSaveAc = (form) => {
    if (editing) saveAcs(acs.map(a => a.id === editing.id ? { ...editing, ...form } : a));
    else saveAcs([...acs, { ...form, id: Date.now() }]);
    setShowForm(false); setEditing(null);
  };

  const handleLog = (form) => {
    const ac = logging;
    saveHistory([...history, { acId: ac.id, ...form }]);
    saveAcs(acs.map(a => a.id === ac.id ? { ...a, lastMaint: form.date, status: 'Hoạt động' } : a));
    setLogging(null);
    if (detail) setDetail({ ...detail, lastMaint: form.date, status: 'Hoạt động' });
    const nextDate = addMonths(form.date, ac.cycle);
    alert(`✓ ${lang==='en'?'Maintenance logged!':'Đã ghi nhận bảo trì!'}\n${t('aircon.nextAuto')}: ${fmtDate(nextDate, lang)}`);
  };

  const MONTH_NAMES_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTH_NAMES    = lang === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_VI;
  const DAY_NAMES      = lang === 'en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['T2','T3','T4','T5','T6','T7','CN'];

  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const firstDay    = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;

  // Status options for filter dropdown
  const statusFilterOptions = lang === 'en'
    ? ['Operating','Due Maintenance','In Maintenance','Broken']
    : ['Hoạt động','Đến hạn BT','Đang bảo trì','Hỏng hóc'];

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
        <div className="stat-card"><div className="stat-label">{t('aircon.totalMachines')}</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card"><div className="stat-label">{t('aircon.operating')}</div><div className="stat-value" style={{ color:'#1D9E75' }}>{stats.ok}</div></div>
        <div className="stat-card"><div className="stat-label">{t('aircon.dueMaint')}</div><div className="stat-value" style={{ color:'#854F0B' }}>{stats.due}</div></div>
        <div className="stat-card"><div className="stat-label">{t('aircon.inMaint')}</div><div className="stat-value" style={{ color:'#185FA5' }}>{stats.inMaint}</div></div>
        <div className="stat-card"><div className="stat-label">{t('aircon.broken')}</div><div className="stat-value" style={{ color:'#A32D2D' }}>{stats.broken}</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {/* View toggle */}
            <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
              {[['grid', t('aircon.gridView')], ['calendar', t('aircon.calendarView')]].map(([mode, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding:'6px 14px', fontSize:13, border:'none', cursor:'pointer', background: viewMode===mode ? '#1D9E75':'var(--white)', color: viewMode===mode ? 'white':'var(--text2)', fontFamily:'var(--font)' }}>{label}</button>
              ))}
            </div>
            {viewMode === 'grid' && <>
              <input className="input" placeholder={t('aircon.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} style={{ width:170 }} />
              <select className="select" value={selStatus} onChange={e => setSelStatus(e.target.value)}>
                <option value="all">{t('aircon.allStatuses')}</option>
                {statusFilterOptions.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="select" value={selFloor} onChange={e => setSelFloor(e.target.value)}>
                <option value="all">{t('aircon.allFloors')}</option>
                {floors.map(f => <option key={f}>{f}</option>)}
              </select>
            </>}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={14}/> {t('aircon.add')}
          </button>
        </div>

        {/* Grid view */}
        {viewMode === 'grid' && (
          <div style={{ padding:16 }}>
            {floors.length > 0
              ? floors.filter(f => selFloor==='all' || f===selFloor).map(floor => {
                  const floorAcs = filtered.filter(a => a.floor === floor);
                  if (floorAcs.length === 0) return null;
                  return (
                    <div key={floor} style={{ marginBottom:20 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
                        {floor} — {floorAcs.length} {lang==='en'?'units':'máy'}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))', gap:8 }}>
                        {floorAcs.map(ac => {
                          const cfg  = getCfg(ac.status);
                          const next = ac.lastMaint ? addMonths(ac.lastMaint, ac.cycle) : null;
                          const days = next ? daysDiff(next) : null;
                          return (
                            <div key={ac.id} onClick={() => setDetail(ac)}
                              style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10, padding:'10px 10px 8px', cursor:'pointer', position:'relative', transition:'transform 0.1s' }}
                              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                              onMouseLeave={e => e.currentTarget.style.transform='none'}>
                              <div style={{ fontSize:13, fontWeight:700, color:cfg.color, marginBottom:2 }}>{ac.room}</div>
                              <div style={{ fontSize:10, color:cfg.color, opacity:0.8, marginBottom:4 }}>{ac.brand} · {ac.capacity}</div>
                              <div style={{ fontSize:10, fontWeight:600, color:cfg.color }}>{cfg.icon} {ac.status}</div>
                              {days!==null && (
                                <div style={{ fontSize:9, marginTop:3, color: days<=0?'#A32D2D':days<=30?'#854F0B':'#5F5E5A' }}>
                                  {days<=0 ? t('aircon.overdue') : days<=30 ? `${days}${t('aircon.daysLeft')}` : fmtDate(next, lang)}
                                </div>
                              )}
                              <button onClick={e => { e.stopPropagation(); if(confirm(t('aircon.deleteConfirm'))) saveAcs(acs.filter(a=>a.id!==ac.id)); }}
                                style={{ position:'absolute', top:5, right:5, background:'none', border:'none', cursor:'pointer', color:cfg.color, opacity:0.5, padding:2, fontSize:12, lineHeight:1 }}>✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px,1fr))', gap:8 }}>
                  {filtered.map(ac => {
                    const cfg  = getCfg(ac.status);
                    const next = ac.lastMaint ? addMonths(ac.lastMaint, ac.cycle) : null;
                    const days = next ? daysDiff(next) : null;
                    return (
                      <div key={ac.id} onClick={() => setDetail(ac)}
                        style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10, padding:'10px 10px 8px', cursor:'pointer' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{ac.room}</div>
                        <div style={{ fontSize:10, color:cfg.color, opacity:0.8, marginBottom:4 }}>{ac.brand} · {ac.capacity}</div>
                        <div style={{ fontSize:10, fontWeight:600, color:cfg.color }}>{cfg.icon} {ac.status}</div>
                        {days!==null && <div style={{ fontSize:9, marginTop:3, color:days<=0?'#A32D2D':'#5F5E5A' }}>{days<=0 ? t('aircon.overdue') : fmtDate(next, lang)}</div>}
                      </div>
                    );
                  })}
                </div>
              )
            }
            {/* Legend */}
            <div style={{ display:'flex', gap:14, marginTop:16, flexWrap:'wrap' }}>
              {[
                ['#1D9E75', lang==='en'?'Operating':'Hoạt động'],
                ['#854F0B', lang==='en'?'Due Maintenance':'Đến hạn BT'],
                ['#185FA5', lang==='en'?'In Maintenance':'Đang bảo trì'],
                ['#A32D2D', lang==='en'?'Broken':'Hỏng hóc'],
              ].map(([color, label]) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/><span style={{ color:'var(--text2)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <div style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <button className="btn btn-sm" onClick={() => { let m=calMonth-1,y=calYear; if(m<0){m=11;y--;} setCalMonth(m);setCalYear(y); }}><ChevronLeft size={14}/></button>
              <span style={{ fontWeight:600, fontSize:15 }}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button className="btn btn-sm" onClick={() => { let m=calMonth+1,y=calYear; if(m>11){m=0;y++;} setCalMonth(m);setCalYear(y); }}><ChevronRight size={14}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
              {DAY_NAMES.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--text3)', padding:'4px 0' }}>{d}</div>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {Array(firstDay).fill(null).map((_,i) => <div key={'e'+i}/>)}
              {Array(daysInMonth).fill(null).map((_,i) => {
                const day  = i+1;
                const evts = calEvents[day] || [];
                const today= new Date();
                const isToday = today.getDate()===day && today.getMonth()===calMonth && today.getFullYear()===calYear;
                return (
                  <div key={day} style={{ minHeight:52, border:'0.5px solid var(--border)', borderRadius:7, padding:'4px 5px', background: isToday?'#E1F5EE':evts.length>0?'#FAEEDA':'var(--white)', borderColor: isToday?'#9FE1CB':evts.length>0?'#FAC775':'var(--border)' }}>
                    <div style={{ fontSize:11, fontWeight:isToday?700:400, color:isToday?'#0F6E56':'var(--text2)', marginBottom:2 }}>{day}</div>
                    {evts.slice(0,2).map((ac,idx) => (
                      <div key={idx} onClick={() => setDetail(ac)} style={{ fontSize:9, background:'#854F0B22', color:'#854F0B', borderRadius:3, padding:'1px 4px', marginBottom:1, cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>❄ {ac.room}</div>
                    ))}
                    {evts.length>2 && <div style={{ fontSize:9, color:'var(--text3)' }}>+{evts.length-2}</div>}
                  </div>
                );
              })}
            </div>
            {/* Monthly list */}
            <div style={{ marginTop:16, background:'var(--bg)', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>
                {t('aircon.maintSchedule')} {MONTH_NAMES[calMonth]} {calYear} ({Object.values(calEvents).flat().length} {lang==='en'?'units':'máy'})
              </div>
              {Object.keys(calEvents).length===0 ? (
                <div style={{ fontSize:13, color:'var(--text3)' }}>{t('aircon.noEventsMonth')}</div>
              ) : Object.entries(calEvents).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).map(([day,acList]) => (
                <div key={day} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--amber)', minWidth:26 }}>{day}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {acList.map((ac,i) => (
                      <span key={i} onClick={() => setDetail(ac)} style={{ fontSize:11, background:'#FAEEDA', color:'#854F0B', padding:'2px 8px', borderRadius:20, cursor:'pointer', border:'0.5px solid #FAC775' }}>
                        ❄ {ac.room} ({ac.cycle}{t('aircon.months')[0]})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Modals */}
      {detail && (
        <AcDetail
          ac={detail}
          history={history.filter(h => h.acId === detail.id)}
          onClose={() => setDetail(null)}
          onLog={() => { setLogging(detail); setDetail(null); }}
          onEdit={() => { setEditing(detail); setShowForm(true); setDetail(null); }}
        />
      )}

      {showForm && (
        <AcForm
          initial={editing}
          properties={properties}
          onSave={(data) => {
            const saved = editing
              ? acs.map(a => a.id === data.id ? data : a)
              : [...acs, { ...data, id: Date.now() }];
            setAcs(saved);
            onSaveAircons(saved);
            setShowForm(false);
            setEditing(null);
          }}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {logging && (
        <MaintLogForm
          ac={logging}
          onSave={(entry) => {
            const nextDate = addMonths(entry.date, logging.cycle || 3);
            const newHist = [...history, { ...entry, acId: logging.id, id: Date.now() }];
            const updated = acs.map(a => a.id === logging.id
              ? { ...a, lastMaint: entry.date, nextMaint: nextDate, status: 'Hoat dong' }
              : a
            );
            setAcs(updated);
            setHistory(newHist);
            onSaveAircons(updated);
            onSaveHistory(newHist);
            setLogging(null);
          }}
          onClose={() => setLogging(null)}
        />
      )}
    </div>
  );
}
