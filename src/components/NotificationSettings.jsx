// src/components/NotificationSettings.jsx
// Cài đặt thông báo email tự động — tích hợp vào trang Settings

import { useState } from 'react';
import { Save, Mail, Send, Check, AlertTriangle } from 'lucide-react';
import { saveEmailConfig, sendMaintenanceAlert } from '../services/emailNotification.js';
import { useTranslation } from '../i18n/useTranslation.jsx';
import { useToast } from './Toast.jsx';

const DEFAULT_CONFIG = { publicKey: '', serviceId: '', templateId: '', testEmail: '' };

export default function NotificationSettings({ maintenance, properties, staff }) {
  const { lang } = useTranslation();
  const toast = useToast();

  const [config, setConfig] = useState(() => {
    try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem('email_config')||'{}') }; }
    catch { return DEFAULT_CONFIG; }
  });
  const [saved,    setSaved]    = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [testMsg,  setTestMsg]  = useState(null); // {ok, msg}
  const [sending,  setSending]  = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));
  const isConfigured = config.publicKey && config.serviceId && config.templateId;

  // Đếm bảo trì cần alert
  const today   = new Date(); today.setHours(0,0,0,0);
  const in7days = new Date(today); in7days.setDate(today.getDate()+7);
  const alertCount = maintenance.filter(m => {
    if (m.status==='Hoàn thành'||m.status==='Completed') return false;
    const d = new Date(m.date);
    return m.urgency==='Khẩn'||m.urgency==='Urgent'||(d>=today&&d<=in7days);
  }).length;

  const handleSave = () => {
    saveEmailConfig(config);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    if (!config.testEmail) return toast.error('Nhập email để test!');
    if (!isConfigured) return toast.error('Vui lòng điền đủ Public Key, Service ID và Template ID trước!');
    setTesting(true); setTestMsg(null);
    try {
      await sendMaintenanceAlert({
        toEmail:      config.testEmail,
        toName:       'Quản lý',
        assetName:    'Điều hòa P.101 (TEST)',
        propertyName: 'Grand Palace Hà Nội',
        urgency:      'Khẩn',
        maintDate:    new Date().toISOString().slice(0,10),
        maintType:    'Kiểm tra kết nối email',
        technician:   'Hệ thống test',
      });
      setTestMsg({ ok: true, msg: `✓ Email test đã gửi tới ${config.testEmail}!` });
    } catch (err) {
      setTestMsg({ ok: false, msg: `✕ Lỗi: ${err.text || err.message || 'Kiểm tra lại Public Key / Service ID / Template ID'}` });
    }
    setTesting(false);
  };

  const handleSendAlerts = async () => {
    if (!isConfigured) return toast.error('Vui lòng cài đặt EmailJS trước!');
    if (alertCount === 0) return toast.info('Không có bảo trì nào cần thông báo lúc này.');
    setSending(true); setSendResult(null);
    const { sendBulkAlerts } = await import('../services/emailNotification.js');
    const result = await sendBulkAlerts(maintenance, properties, staff);
    setSendResult(result);
    setSending(false);
  };

  return (
    <div>
      {/* Status bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background: isConfigured?'#E1F5EE':'#FAEEDA', borderRadius:10, marginBottom:18, border:`1px solid ${isConfigured?'#9FE1CB':'#FAC775'}` }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background: isConfigured?'#1D9E75':'#EF9F27', flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color: isConfigured?'#0F6E56':'#854F0B' }}>
            {isConfigured ? '✓ EmailJS đã kết nối — sẵn sàng gửi thông báo' : 'Chưa cấu hình — điền thông tin EmailJS bên dưới'}
          </div>
          {alertCount > 0 && <div style={{ fontSize:12, color: isConfigured?'#0F6E56':'#854F0B', marginTop:2 }}>
            Có <strong>{alertCount}</strong> bảo trì cần thông báo (khẩn + trong 7 ngày tới)
          </div>}
        </div>
        {isConfigured && alertCount > 0 && (
          <button className="btn btn-primary" onClick={handleSendAlerts} disabled={sending} style={{ fontSize:12 }}>
            {sending ? '⏳ Đang gửi...' : <><Send size={13}/> Gửi ngay ({alertCount})</>}
          </button>
        )}
      </div>

      {sendResult && (
        <div style={{ background: sendResult.errors.length===0?'#E1F5EE':'#FAEEDA', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>
          ✓ Đã gửi <strong>{sendResult.sent}</strong> email.
          {sendResult.errors.length > 0 && <div style={{ color:'var(--red)', marginTop:4, fontSize:12 }}>Lỗi: {sendResult.errors.join(', ')}</div>}
        </div>
      )}

      <div className="two-col">
        {/* Config form */}
        <div className="panel">
          <div className="panel-header"><span className="panel-title">⚙️ Cấu hình EmailJS</span></div>
          <div style={{ padding:16 }}>
            {/* Hướng dẫn nhanh */}
            <div style={{ background:'#E6F1FB', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#185FA5', marginBottom:14, lineHeight:1.8 }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>📋 Cách lấy thông tin (miễn phí):</div>
              1. Vào <strong>emailjs.com</strong> → Sign up bằng Gmail<br/>
              2. <strong>Email Services</strong> → Add Service → Gmail → Connect<br/>
              3. <strong>Email Templates</strong> → Create → đặt tên <code style={{ background:'#fff', padding:'1px 5px', borderRadius:4 }}>maintenance_alert</code><br/>
              4. <strong>Account</strong> → API Keys → copy Public Key
            </div>

            {[
              ['Public Key', 'publicKey', 'user_xxxxxxxxxxxx'],
              ['Service ID', 'serviceId', 'service_xxxxxxx'],
              ['Template ID', 'templateId', 'template_xxxxxxx'],
            ].map(([label, key, placeholder]) => (
              <div key={key} className="form-field">
                <label className="form-label">{label}</label>
                <input className="input" style={{ width:'100%', fontFamily:'monospace', fontSize:12 }} type={key==='publicKey'?'password':'text'} value={config[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} />
              </div>
            ))}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <button className="btn" onClick={handleSave}>
                {saved ? <><Check size={13}/> Đã lưu!</> : <><Save size={13}/> Lưu cấu hình</>}
              </button>
            </div>
          </div>
        </div>

        {/* Test + template */}
        <div>
          <div className="panel" style={{ marginBottom:14 }}>
            <div className="panel-header"><span className="panel-title">🧪 Gửi email test</span></div>
            <div style={{ padding:16 }}>
              <div className="form-field">
                <label className="form-label">Email nhận test</label>
                <input className="input" style={{ width:'100%' }} type="email" value={config.testEmail} onChange={e=>set('testEmail',e.target.value)} placeholder="email@congty.vn" />
              </div>
              <button className="btn btn-primary" onClick={handleTest} disabled={testing} style={{ width:'100%', justifyContent:'center' }}>
                {testing ? '⏳ Đang gửi...' : <><Mail size={13}/> Gửi email test</>}
              </button>
              {testMsg && (
                <div style={{ marginTop:10, background: testMsg.ok?'#E1F5EE':'#FCEBEB', borderRadius:7, padding:'8px 12px', fontSize:12, color: testMsg.ok?'#0F6E56':'#A32D2D' }}>
                  {testMsg.msg}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span className="panel-title">📧 Nội dung email mẫu</span></div>
            <div style={{ padding:16 }}>
              <div style={{ background:'#f7f6f2', borderRadius:8, padding:'12px', fontSize:12, lineHeight:1.8, fontFamily:'monospace', color:'#333' }}>
                <div style={{ fontWeight:600, marginBottom:6 }}>Subject:</div>
                <div style={{ color:'#185FA5', marginBottom:10 }}>[{'{{company_name}}'}] Cảnh báo bảo trì: {'{{asset_name}}'}</div>
                <div style={{ fontWeight:600, marginBottom:6 }}>Body:</div>
                Kính gửi {'{{to_name}}'},<br/><br/>
                Tài sản <strong>{'{{asset_name}}'}</strong> tại {'{{property_name}}'} cần bảo trì.<br/>
                Mức độ: <strong>{'{{urgency}}'}</strong><br/>
                Ngày dự kiến: {'{{maint_date}}'}<br/>
                Nội dung: {'{{maint_type}}'}<br/>
                Kỹ thuật viên: {'{{technician}}'}<br/><br/>
                Trân trọng,<br/>
                {'{{company_name}}'}
              </div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>
                Copy đoạn trên vào EmailJS Template để email hiển thị đúng nội dung.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
