// src/components/ExportButton.jsx
// Xuất báo cáo Excel (.xlsx) và Google Sheets
// Dùng thư viện SheetJS (xlsx) — không cần cài thêm, import từ CDN

import { useState } from 'react';
import { Download, FileSpreadsheet, ChevronDown } from 'lucide-react';

// ---- HELPER: tạo workbook từ dữ liệu ----
function buildWorkbook(properties, assets, maintenance, inventory, staff) {
  // Import XLSX từ window (load qua CDN trong index.html)
  const XLSX = window.XLSX;
  const wb   = XLSX.utils.book_new();

  // ---- Sheet 1: Tổng quan ----
  const overviewData = [
    ['BÁO CÁO QUẢN LÝ TÀI SẢN', '', '', ''],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN'), '', ''],
    ['', '', '', ''],
    ['CHỈ SỐ', 'GIÁ TRỊ', '', ''],
    ['Tổng cơ sở', properties.length, '', ''],
    ['Tổng tài sản', assets.length, '', ''],
    ['Tổng giá trị tài sản (VNĐ)', assets.reduce((s,a)=>s+(a.value||0),0), '', ''],
    ['Đang sử dụng', assets.filter(a=>a.status==='Đang dùng').length, '', ''],
    ['Cần bảo trì / hỏng', assets.filter(a=>a.status!=='Đang dùng').length, '', ''],
    ['Tổng nhân viên', staff.length, '', ''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
  ws1['!cols'] = [{wch:30},{wch:20},{wch:20},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

  // ---- Sheet 2: Danh sách tài sản ----
  const assetRows = [
    ['Mã TS', 'Tên tài sản', 'Cơ sở', 'Danh mục', 'Giá trị (VNĐ)', 'Năm mua', 'Thời hạn SD', 'Vị trí', 'Trạng thái', 'Ghi chú']
  ];
  assets.forEach(a => {
    const p = properties.find(x=>x.id===a.pid);
    assetRows.push([
      a.code||'', a.name||'', p?.name||'', a.category||'',
      a.value||0, a.year||'', a.lifespan||'', a.location||'',
      a.status||'', a.note||''
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(assetRows);
  ws2['!cols'] = [{wch:10},{wch:30},{wch:25},{wch:15},{wch:18},{wch:10},{wch:12},{wch:20},{wch:14},{wch:25}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Tài sản');

  // ---- Sheet 3: Bảo trì ----
  const maintRows = [
    ['Cơ sở', 'Tài sản', 'Nội dung', 'Ngày', 'Kỹ thuật viên', 'Chi phí (VNĐ)', 'Mức độ', 'Trạng thái']
  ];
  maintenance.forEach(m => {
    const p = properties.find(x=>x.id===m.pid);
    maintRows.push([
      p?.name||'', m.assetName||'', m.type||'',
      m.date||'', m.tech||'', m.cost||0,
      m.urgency||'', m.status||''
    ]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(maintRows);
  ws3['!cols'] = [{wch:25},{wch:25},{wch:30},{wch:12},{wch:20},{wch:15},{wch:12},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Bảo trì');

  // ---- Sheet 4: Kho vật tư ----
  const invRows = [
    ['Mã VT', 'Tên vật tư', 'Cơ sở', 'Danh mục', 'Tồn kho', 'Định mức', 'Đơn vị', 'Đơn giá (VNĐ)', 'Tổng giá trị']
  ];
  inventory.forEach(i => {
    const p = properties.find(x=>x.id===i.pid);
    invRows.push([
      i.code||'', i.name||'', p?.name||'', i.category||'',
      i.qty||0, i.minQty||0, i.unit||'', i.price||0,
      `=E${invRows.length+1}*H${invRows.length+1}` // formula
    ]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(invRows);
  ws4['!cols'] = [{wch:10},{wch:28},{wch:25},{wch:15},{wch:10},{wch:10},{wch:10},{wch:15},{wch:15}];
  XLSX.utils.book_append_sheet(wb, ws4, 'Kho vật tư');

  // ---- Sheet 5: Nhân viên ----
  const staffRows = [
    ['Họ tên', 'Cơ sở', 'Vai trò', 'Bộ phận', 'Email', 'Phân quyền', 'Trạng thái']
  ];
  staff.forEach(s => {
    const p = properties.find(x=>x.id===s.pid);
    staffRows.push([
      s.name||'', p?.name||'', s.role||'', s.dept||'',
      s.email||'', s.permission||'', s.status||''
    ]);
  });
  const ws5 = XLSX.utils.aoa_to_sheet(staffRows);
  ws5['!cols'] = [{wch:25},{wch:25},{wch:22},{wch:18},{wch:28},{wch:15},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws5, 'Nhân viên');

  // ---- Sheet 6: Khấu hao ----
  const depRows = [
    ['Tài sản', 'Cơ sở', 'Nguyên giá (VNĐ)', 'Năm mua', 'Thời hạn SD', 'Đã dùng (năm)', 'Còn lại (năm)', '% Khấu hao', 'Tình trạng']
  ];
  assets.forEach(a => {
    const p    = properties.find(x=>x.id===a.pid);
    const used = 2026 - (a.year||2020);
    const pct  = Math.min(100, Math.round(used/(a.lifespan||10)*100));
    const rem  = Math.max(0, (a.lifespan||10) - used);
    const cond = pct>=100?'Đã hết':pct>=80?'Sắp hết':'Còn hạn';
    depRows.push([a.name||'', p?.name||'', a.value||0, a.year||'', a.lifespan||'', used, rem, pct/100, cond]);
  });
  const ws6 = XLSX.utils.aoa_to_sheet(depRows);
  ws6['!cols'] = [{wch:30},{wch:25},{wch:18},{wch:10},{wch:14},{wch:14},{wch:14},{wch:14},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws6, 'Khấu hao');

  return wb;
}

// ---- Xuất Excel ----
function exportExcel(properties, assets, maintenance, inventory, staff, companyName) {
  const XLSX = window.XLSX;
  if (!XLSX) { alert('Đang tải thư viện Excel, vui lòng thử lại sau 2 giây...'); return; }
  const wb       = buildWorkbook(properties, assets, maintenance, inventory, staff);
  const fileName = `BaoCaoTaiSan_${companyName.replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ---- Xuất Google Sheets (mở tab mới với CSV) ----
function exportGoogleSheets(properties, assets) {
  const XLSX = window.XLSX;
  if (!XLSX) return;
  // Tạo CSV từ dữ liệu tài sản
  const rows = [['Mã TS','Tên tài sản','Cơ sở','Danh mục','Giá trị','Năm mua','Trạng thái']];
  assets.forEach(a => {
    const p = properties.find(x=>x.id===a.pid);
    rows.push([a.code||'',a.name||'',p?.name||'',a.category||'',a.value||0,a.year||'',a.status||'']);
  });
  const ws  = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  // Mở Google Sheets mới với dữ liệu
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'TaiSan_Import.csv'; a.click();
  URL.revokeObjectURL(url);
  // Hướng dẫn import
  setTimeout(() => alert('✓ File CSV đã tải về!\n\nĐể mở bằng Google Sheets:\n1. Vào drive.google.com\n2. Kéo thả file CSV vừa tải vào\n3. Double-click để mở\n4. Google tự hỏi "Mở bằng Google Sheets" → nhấn OK'), 500);
}

// ---- COMPONENT CHÍNH ----
export default function ExportButton({ properties, assets, maintenance, inventory, staff }) {
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const settings    = (() => { try { return JSON.parse(localStorage.getItem('app_settings')||'{}'); } catch { return {}; } })();
  const companyName = settings.companyName || 'PalaceGroup';

  const handleExcel = () => {
    setLoading(true); setOpen(false);
    setTimeout(() => { exportExcel(properties, assets, maintenance, inventory, staff, companyName); setLoading(false); }, 100);
  };

  const handleSheets = () => {
    setOpen(false);
    exportGoogleSheets(properties, assets);
  };

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button
        className="btn"
        onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'center', gap:6 }}
      >
        {loading ? '⏳' : <Download size={14}/>}
        Xuất báo cáo
        <ChevronDown size={12}/>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }}/>
          <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'white', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 4px 16px rgba(0,0,0,0.1)', zIndex:100, minWidth:200, overflow:'hidden' }}>
            <div style={{ padding:'8px 0' }}>
              <button onClick={handleExcel} style={{ width:'100%', padding:'10px 16px', textAlign:'left', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:13, fontFamily:'var(--font)' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <FileSpreadsheet size={15} color="#1D9E75"/> 
                <div>
                  <div style={{ fontWeight:500 }}>Xuất Excel (.xlsx)</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>6 sheet: Tài sản, Bảo trì, Kho, Nhân viên...</div>
                </div>
              </button>
              <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
              <button onClick={handleSheets} style={{ width:'100%', padding:'10px 16px', textAlign:'left', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:13, fontFamily:'var(--font)' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                <span style={{ fontSize:15 }}>📊</span>
                <div>
                  <div style={{ fontWeight:500 }}>Xuất Google Sheets</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Tải CSV rồi import vào Google Drive</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
