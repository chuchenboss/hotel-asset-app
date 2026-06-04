// migrate-companies.mjs
// Chạy: node migrate-companies.mjs

import { initializeApp } from './node_modules/firebase/app/dist/index.mjs';
import { getFirestore, collection, getDocs, writeBatch, doc } from './node_modules/firebase/firestore/dist/index.mjs';
import { getAuth, signInWithEmailAndPassword } from './node_modules/firebase/auth/dist/index.mjs';

const cfg = {
  apiKey: "AIzaSyDYyTLK5HEA8t0_h9m7R61-6FpHKDiqdkE",
  authDomain: "hotel-asset-app.firebaseapp.com",
  projectId: "hotel-asset-app",
};

const app  = initializeApp(cfg);
const db   = getFirestore(app);
const auth = getAuth(app);

// ← Điền mật khẩu super admin vào đây
const SUPER_EMAIL    = 'chuchen.boss@gmail.com';
const SUPER_PASSWORD = '123456';

async function run() {
  console.log('🔐 Đang đăng nhập...');
  await signInWithEmailAndPassword(auth, SUPER_EMAIL, SUPER_PASSWORD);
  console.log('✅ Đăng nhập thành công');

  console.log('🔄 Đọc dữ liệu...');
  const [propSnap, assetSnap, airconSnap, staffSnap] = await Promise.all([
    getDocs(collection(db, 'properties')),
    getDocs(collection(db, 'assets')),
    getDocs(collection(db, 'aircons')),
    getDocs(collection(db, 'staff')),
  ]);

  const properties = propSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
  const assets     = assetSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
  const aircons    = airconSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
  const staff      = staffSnap.docs.map(d => ({ docId: d.id, ...d.data() }));

  console.log(`📦 Properties: ${properties.length} | Assets: ${assets.length} | Aircons: ${aircons.length} | Staff: ${staff.length}`);

  // Gán companyId cho từng property theo tên
  const propCompanyMap = properties.map(p => {
    const name = (p.name || '').toLowerCase();
    let companyId = p.companyId;
    if (!companyId) {
      if (name.includes('mia')) companyId = 'mia-house';
      else companyId = 'phan';
    }
    return { ...p, companyId };
  });

  console.log('\n📋 Sẽ gán:');
  propCompanyMap.forEach(p => console.log(`  "${p.name}" → companyId="${p.companyId}"`));

  const batch = writeBatch(db);

  // Properties
  for (const p of propCompanyMap) {
    const { docId, ...data } = p;
    batch.set(doc(db, 'properties', docId), { ...data, companyId: p.companyId });
  }

  // Assets → theo pid tìm property → lấy companyId
  for (const asset of assets) {
    const pid = String(asset.pid || '');
    const prop = propCompanyMap.find(p => String(p.id || p.docId) === pid || String(p.docId) === pid);
    const companyId = prop?.companyId || asset.companyId || 'phan';
    const { docId, ...data } = asset;
    batch.set(doc(db, 'assets', docId), { ...data, companyId });
  }

  // Aircons
  for (const ac of aircons) {
    const propId = String(ac.propertyId || ac.pid || '');
    const prop = propCompanyMap.find(p => String(p.id || p.docId) === propId);
    const companyId = prop?.companyId || ac.companyId || 'phan';
    const { docId, ...data } = ac;
    batch.set(doc(db, 'aircons', docId), { ...data, companyId });
  }

  // Staff — chỉ gán nếu chưa có
  for (const s of staff) {
    if (!s.companyId) {
      const { docId, ...data } = s;
      batch.set(doc(db, 'staff', docId), { ...data, companyId: 'phan' });
    }
  }

  await batch.commit();
  console.log('\n✅ Xong! Reload app là thấy kết quả.');
  process.exit(0);
}

run().catch(e => { console.error('❌ Lỗi:', e.message); process.exit(1); });
