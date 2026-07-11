// src/services/emailNotification.js
// Gửi email tự động qua EmailJS — miễn phí, không cần backend/server
// EmailJS cho phép gửi email trực tiếp từ browser bằng Gmail

// ============================================================
// HƯỚNG DẪN CÀI ĐẶT (làm 1 lần):
// 1. Vào emailjs.com → Sign up miễn phí (Gmail)
// 2. Add Service → chọn Gmail → đặt tên "hotel_app" → Connect Account
// 3. Email Templates → Create New Template → đặt tên "maintenance_alert"
//    Nội dung template (copy nguyên vào):
//    Subject: [{{company_name}}] Cảnh báo bảo trì: {{asset_name}}
//    Body:
//      Kính gửi {{to_name}},
//      Tài sản {{asset_name}} tại {{property_name}} cần bảo trì.
//      Mức độ: {{urgency}}
//      Ngày dự kiến: {{maint_date}}
//      Nội dung: {{maint_type}}
//      Kỹ thuật viên: {{technician}}
//      Trân trọng, {{company_name}}
// 4. Account → API Keys → copy Public Key
// 5. Điền 3 thông tin bên dưới vào trang Cài đặt app
// ============================================================

const EMAILJS_CDN = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';

// Load EmailJS SDK một lần
let emailjsLoaded = false;
function loadEmailJS() {
  return new Promise((resolve, reject) => {
    if (emailjsLoaded || window.emailjs) { resolve(); return; }
    const s = document.createElement('script');
    s.src = EMAILJS_CDN;
    s.onload = () => { emailjsLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Lấy config từ localStorage
function getEmailConfig() {
  try {
    const r = localStorage.getItem('email_config');
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

export function saveEmailConfig(config) {
  localStorage.setItem('email_config', JSON.stringify(config));
}

// ---- Gửi 1 email ----
export async function sendMaintenanceAlert({ toEmail, toName, assetName, propertyName, urgency, maintDate, maintType, technician }) {
  const config = getEmailConfig();
  if (!config?.publicKey || !config?.serviceId || !config?.templateId) {
    throw new Error('Chưa cấu hình EmailJS. Vào Cài đặt → Thông báo để điền thông tin.');
  }
  const settings    = JSON.parse(localStorage.getItem('app_settings')||'{}');
  const companyName = settings.companyName || 'Palace Group';

  await loadEmailJS();
  window.emailjs.init(config.publicKey);

  return window.emailjs.send(config.serviceId, config.templateId, {
    to_email:      toEmail,
    to_name:       toName || 'Quản lý',
    company_name:  companyName,
    asset_name:    assetName,
    property_name: propertyName,
    urgency:       urgency,
    maint_date:    new Date(maintDate).toLocaleDateString('vi-VN'),
    maint_type:    maintType || 'Bảo trì định kỳ',
    technician:    technician || 'Chưa phân công',
  });
}

// ---- Kiểm tra và gửi thông báo hàng loạt ----
export async function sendBulkAlerts(maintenance, properties, staff) {
  const config = getEmailConfig();
  if (!config?.publicKey) return { sent: 0, errors: [] };

  // Lọc các bảo trì khẩn/sắp đến hạn (trong 7 ngày)
  const today   = new Date(); today.setHours(0,0,0,0);
  const in7days = new Date(today); in7days.setDate(today.getDate() + 7);

  const toAlert = maintenance.filter(m => {
    if (m.status === 'Hoàn thành' || m.status === 'Completed') return false;
    const d = new Date(m.date);
    return m.urgency === 'Khẩn' || m.urgency === 'Urgent' || (d >= today && d <= in7days);
  });

  const results = { sent: 0, errors: [] };
  for (const m of toAlert) {
    const p = properties.find(x => x.id === m.pid);
    // Gửi cho tất cả manager của cơ sở đó (hỗ trợ cả pids[] và pid cũ)
    const managers = staff.filter(s => {
      const staffPids = s.pids?.length ? s.pids.map(Number) : (s.pid != null ? [Number(s.pid)] : []);
      return staffPids.includes(Number(m.pid)) &&
        (s.permission === 'admin' || s.permission === 'manager') &&
        s.email;
    });
    for (const mgr of managers) {
      try {
        await sendMaintenanceAlert({
          toEmail:      mgr.email,
          toName:       mgr.name,
          assetName:    m.assetName,
          propertyName: p?.name || '',
          urgency:      m.urgency,
          maintDate:    m.date,
          maintType:    m.type,
          technician:   m.tech,
        });
        results.sent++;
        await new Promise(r => setTimeout(r, 500)); // tránh spam
      } catch (err) {
        results.errors.push(`${mgr.email}: ${err.message || err}`);
      }
    }
  }
  return results;
}

// ---- Lên lịch kiểm tra tự động mỗi ngày ----
let checkInterval = null;
export function startDailyCheck(maintenance, properties, staff) {
  if (checkInterval) clearInterval(checkInterval);
  // Kiểm tra mỗi 24 giờ
  checkInterval = setInterval(() => {
    sendBulkAlerts(maintenance, properties, staff);
  }, 24 * 60 * 60 * 1000);
}

export function stopDailyCheck() {
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
}
