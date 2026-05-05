// src/data/store.js
// Dữ liệu mẫu + lưu vào localStorage (dữ liệu không mất khi tắt trình duyệt)

const DEFAULT_PROPERTIES = [
  { id: 1, name: 'Grand Palace Hà Nội', city: 'Hà Nội', type: '5 sao', addr: '1 Đinh Tiên Hoàng, Hoàn Kiếm', manager: 'Nguyễn Văn An', phone: '024 3936 0000', color: '#0F6E56' },
  { id: 2, name: 'Grand Palace TP.HCM', city: 'TP.HCM', type: '5 sao', addr: '89 Lê Duẩn, Quận 1', manager: 'Trần Thị Bích', phone: '028 3822 0000', color: '#185FA5' },
  { id: 3, name: 'Palace Resort Phú Quốc', city: 'Phú Quốc', type: 'Resort', addr: 'Bãi Trường, Dương Tơ', manager: 'Lê Hoàng Minh', phone: '0297 626 0000', color: '#854F0B' },
  { id: 4, name: 'Palace Boutique Hội An', city: 'Hội An', type: 'Boutique', addr: '22 Trần Phú, Cẩm Phô', manager: 'Phạm Thị Lan', phone: '0235 386 0000', color: '#534AB7' },
];

const DEFAULT_ASSETS = [
  { id: 1, pid: 1, code: 'HN-001', name: 'Điều hòa Daikin 2HP', category: 'Phòng khách', value: 45000000, year: 2020, lifespan: 10, status: 'Đang dùng', location: 'Tầng 3–8', note: '' },
  { id: 2, pid: 1, code: 'HN-002', name: 'Hệ thống thang máy (4 cabin)', category: 'Kỹ thuật', value: 2400000000, year: 2015, lifespan: 20, status: 'Đang dùng', location: 'Toà nhà chính', note: '' },
  { id: 3, pid: 1, code: 'HN-003', name: 'Máy chiếu Epson phòng HN-A', category: 'Hội nghị', value: 32000000, year: 2019, lifespan: 7, status: 'Hỏng hóc', location: 'Phòng HN-A', note: 'Cần thay bóng đèn' },
  { id: 4, pid: 1, code: 'HN-004', name: 'Nội thất phòng Deluxe (40 phòng)', category: 'Phòng khách', value: 1600000000, year: 2018, lifespan: 10, status: 'Đang dùng', location: 'Tầng 4–7', note: '' },
  { id: 5, pid: 2, code: 'HCM-001', name: 'Hệ thống bếp nhà hàng', category: 'Nhà hàng', value: 850000000, year: 2017, lifespan: 10, status: 'Bảo trì', location: 'Tầng 1 – Bếp chính', note: 'Đang bảo dưỡng định kỳ' },
  { id: 6, pid: 2, code: 'HCM-002', name: 'Tivi Samsung 65" (80 phòng)', category: 'Phòng khách', value: 1760000000, year: 2022, lifespan: 8, status: 'Đang dùng', location: 'Tầng 3–12', note: '' },
  { id: 7, pid: 2, code: 'HCM-003', name: 'Hệ thống camera giám sát', category: 'Hành chính', value: 95000000, year: 2021, lifespan: 7, status: 'Đang dùng', location: 'Toàn khách sạn', note: '' },
  { id: 8, pid: 2, code: 'HCM-004', name: 'Xe đưa đón sân bay (3 xe)', category: 'Tiện ích', value: 1200000000, year: 2020, lifespan: 10, status: 'Đang dùng', location: 'Bãi xe tầng hầm', note: '' },
  { id: 9, pid: 3, code: 'PQ-001', name: 'Bể bơi vô cực + hệ thống lọc', category: 'Tiện ích', value: 1200000000, year: 2019, lifespan: 15, status: 'Đang dùng', location: 'Rooftop', note: '' },
  { id: 10, pid: 3, code: 'PQ-002', name: 'Máy lạnh trung tâm Carrier', category: 'Kỹ thuật', value: 1800000000, year: 2019, lifespan: 15, status: 'Đang dùng', location: 'Tầng hầm kỹ thuật', note: '' },
  { id: 11, pid: 3, code: 'PQ-003', name: 'Xe Buggy sân golf (5 xe)', category: 'Tiện ích', value: 450000000, year: 2020, lifespan: 8, status: 'Hỏng hóc', location: 'Sân golf', note: '2 xe cần thay ắc quy' },
  { id: 12, pid: 4, code: 'HA-001', name: 'Nội thất phòng Deluxe (20 phòng)', category: 'Phòng khách', value: 650000000, year: 2021, lifespan: 10, status: 'Đang dùng', location: 'Tầng 2–4', note: '' },
  { id: 13, pid: 4, code: 'HA-002', name: 'Hệ thống âm thanh lobby', category: 'Kỹ thuật', value: 42000000, year: 2021, lifespan: 7, status: 'Đang dùng', location: 'Sảnh tầng 1', note: '' },
];

const DEFAULT_MAINTENANCE = [
  { id: 1, pid: 1, assetId: 2, assetName: 'Hệ thống thang máy', type: 'Kiểm tra cảm biến', date: '2026-05-03', tech: 'Công ty ABC Lift', cost: 8500000, status: 'Chờ thực hiện', urgency: 'Khẩn' },
  { id: 2, pid: 1, assetId: 1, assetName: 'Điều hòa Daikin 2HP', type: 'Vệ sinh lọc gió', date: '2026-05-10', tech: 'Minh T.', cost: 350000, status: 'Lên lịch', urgency: 'Thường' },
  { id: 3, pid: 2, assetId: 5, assetName: 'Hệ thống bếp nhà hàng', type: 'Kiểm tra gas & bảo dưỡng', date: '2026-05-05', tech: 'Cty Bếp Việt', cost: 4200000, status: 'Đang thực hiện', urgency: 'Khẩn' },
  { id: 4, pid: 2, assetId: 8, assetName: 'Xe đưa đón (3 xe)', type: 'Bảo dưỡng định kỳ', date: '2026-05-15', tech: 'Garage Thành Công', cost: 4500000, status: 'Lên lịch', urgency: 'Trung bình' },
  { id: 5, pid: 3, assetId: 9, assetName: 'Bể bơi vô cực', type: 'Thay lọc cát + vệ sinh', date: '2026-05-08', tech: 'Hùng V.', cost: 2100000, status: 'Lên lịch', urgency: 'Trung bình' },
  { id: 6, pid: 4, assetId: 13, assetName: 'Hệ thống âm thanh lobby', type: 'Kiểm tra loa & mixer', date: '2026-05-20', tech: 'Khoa N.', cost: 800000, status: 'Lên lịch', urgency: 'Thường' },
];

const DEFAULT_STAFF = [
  { id: 1, pid: 1, name: 'Nguyễn Văn An', role: 'Quản lý khách sạn', dept: 'Ban quản lý', email: 'an.nv@grandpalace.vn', status: 'Hoạt động', permission: 'manager' },
  { id: 2, pid: 1, name: 'Trần Minh Khoa', role: 'Kỹ thuật viên', dept: 'Kỹ thuật', email: 'khoa.tm@grandpalace.vn', status: 'Hoạt động', permission: 'staff' },
  { id: 3, pid: 1, name: 'Lê Thị Hoa', role: 'Lễ tân', dept: 'Tiền sảnh', email: 'hoa.lt@grandpalace.vn', status: 'Hoạt động', permission: 'viewer' },
  { id: 4, pid: 2, name: 'Trần Thị Bích', role: 'Quản lý khách sạn', dept: 'Ban quản lý', email: 'bich.tt@grandpalace.vn', status: 'Hoạt động', permission: 'manager' },
  { id: 5, pid: 2, name: 'Phạm Văn Hùng', role: 'Kỹ thuật viên', dept: 'Kỹ thuật', email: 'hung.pv@grandpalace.vn', status: 'Nghỉ phép', permission: 'staff' },
  { id: 6, pid: 3, name: 'Lê Hoàng Minh', role: 'Quản lý resort', dept: 'Ban quản lý', email: 'minh.lh@palaceresort.vn', status: 'Hoạt động', permission: 'manager' },
  { id: 7, pid: 3, name: 'Võ Thị Kim', role: 'Thủ kho', dept: 'Hậu cần', email: 'kim.vt@palaceresort.vn', status: 'Hoạt động', permission: 'staff' },
  { id: 8, pid: 4, name: 'Phạm Thị Lan', role: 'Quản lý boutique', dept: 'Ban quản lý', email: 'lan.pt@palaceboutique.vn', status: 'Hoạt động', permission: 'manager' },
];

const DEFAULT_INVENTORY = [
  { id: 1, pid: 1, code: 'VT-001', name: 'Khăn tắm 70x140cm', category: 'Buồng phòng', qty: 340, minQty: 200, unit: 'Cái', price: 85000 },
  { id: 2, pid: 1, code: 'VT-002', name: 'Xà phòng phòng tắm 50g', category: 'Buồng phòng', qty: 1200, minQty: 500, unit: 'Hộp', price: 8000 },
  { id: 3, pid: 1, code: 'VT-003', name: 'Bóng đèn LED E27 9W', category: 'Kỹ thuật', qty: 48, minQty: 100, unit: 'Cái', price: 35000 },
  { id: 4, pid: 2, code: 'VT-004', name: 'Ga trải giường 1m8', category: 'Buồng phòng', qty: 95, minQty: 150, unit: 'Bộ', price: 320000 },
  { id: 5, pid: 2, code: 'VT-005', name: 'Dầu gội đầu 30ml', category: 'Buồng phòng', qty: 85, minQty: 200, unit: 'Chai', price: 12000 },
  { id: 6, pid: 3, code: 'VT-006', name: 'Hóa chất xử lý hồ bơi', category: 'Kỹ thuật', qty: 25, minQty: 20, unit: 'Thùng', price: 450000 },
  { id: 7, pid: 4, code: 'VT-007', name: 'Cà phê Arabica 1kg', category: 'F&B', qty: 18, minQty: 10, unit: 'Gói', price: 180000 },
];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getProperties() { return load('properties', DEFAULT_PROPERTIES); }
export function getAssets() { return load('assets', DEFAULT_ASSETS); }
export function getMaintenance() { return load('maintenance', DEFAULT_MAINTENANCE); }
export function getStaff() { return load('staff', DEFAULT_STAFF); }
export function getInventory() { return load('inventory', DEFAULT_INVENTORY); }

export function saveProperties(d) { save('properties', d); }
export function saveAssets(d) { save('assets', d); }
export function saveMaintenance(d) { save('maintenance', d); }
export function saveStaff(d) { save('staff', d); }
export function saveInventory(d) { save('inventory', d); }

export const CATEGORIES = ['Phòng khách', 'Nhà hàng', 'Kỹ thuật', 'Hội nghị', 'Tiện ích', 'Hành chính'];
export const STATUSES = ['Đang dùng', 'Bảo trì', 'Hỏng hóc', 'Thanh lý'];
export const URGENCIES = ['Khẩn', 'Trung bình', 'Thường'];
export const MAINT_STATUSES = ['Lên lịch', 'Chờ thực hiện', 'Đang thực hiện', 'Hoàn thành'];
export const ROLES = ['Quản lý khách sạn', 'Quản lý resort', 'Kỹ thuật viên', 'Lễ tân', 'Thủ kho', 'Buồng phòng', 'F&B'];
export const PERMISSIONS = [
  { value: 'admin', label: 'Quản trị hệ thống' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'viewer', label: 'Chỉ xem' },
];
export const HOTEL_TYPES = ['5 sao', '4 sao', '3 sao', 'Resort', 'Boutique'];
export const PROP_COLORS = ['#0F6E56', '#185FA5', '#854F0B', '#534AB7', '#993C1D', '#3B6D11', '#A32D2D', '#993556'];
