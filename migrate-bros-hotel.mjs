// migrate-bros-hotel.mjs
// Chạy: node migrate-bros-hotel.mjs
// Tạo chi nhánh Bros Hotel cho công ty Phan và gán tất cả assets/aircons vào

import { initializeApp } from './node_modules/firebase/app/dist/index.mjs';
import { getFirestore, collection, getDocs, setDoc, doc, writeBatch } from './node_modules/firebase/firestore/dist/index.mjs';

const cfg = {
  apiKey: "AIzaSyDYyTLK5HEA8t0_h9m7R61-6FpHKDiqdkE",
  authDomain: "hotel-asset-app.firebaseapp.com",
  projectId: "hotel-asset-app",
  storageBucket: "hotel-asset-app.firebasestorage.app",
  messagingSenderId: "855963320931",
  appId: "1:855963320931:web:2257f02004d013ad8b6e56",
};

const COMPANY_ID  = 'phan';
const PROP_NAME   = 'Bros Hotel';
const PROP_COLOR  = '#185FA5';

const app = initializeApp(cfg);
const db  = getFirestore(app);

async function run() {
  console.log('🔄 Đang kết nối Firebase...');

  const [propSnap, assetSnap, airconSnap] = await Promise.all([
    getDocs(collection(db, 'properties')),
    getDocs(collection(db, 'assets')),
    getDocs(collection(db, 'aircons')),
  ]);

  const properties = propSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const assets     = assetSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const aircons    = airconSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`📦 Đọc được: ${properties.length} properties, ${assets.length} assets, ${aircons.length} aircons`);

  // Tìm hoặc tạo Bros Hotel property
  let brosHotel = properties.find(p =>
    p.companyId === COMPANY_ID && p.name?.toLowerCase().includes('bros')
  );

  let propId;
  if (brosHotel) {
    propId = brosHotel.id;
    console.log(`✅ Bros Hotel đã tồn tại (id: ${propId})`);
  } else {
    propId = String(Date.now());
    const newProp = {
      id:        propId,
      name:      PROP_NAME,
      city:      'Hồ Chí Minh',
      color:     PROP_COLOR,
      companyId: COMPANY_ID,
    };
    await setDoc(doc(db, 'properties', propId), newProp);
    // Cũng lưu vào collection "properties" theo cách app đang dùng (array doc)
    console.log(`✅ Đã tạo property Bros Hotel (id: ${propId})`);
  }

  // Gán tất cả assets + aircons vào Bros Hotel / phan
  const batch = writeBatch(db);

  for (const asset of assets) {
    batch.set(doc(db, 'assets', String(asset.id)), {
      ...asset,
      companyId: COMPANY_ID,
      pid: Number(propId),
    });
  }

  for (const ac of aircons) {
    batch.set(doc(db, 'aircons', String(ac.id)), {
      ...ac,
      companyId:  COMPANY_ID,
      propertyId: propId,
    });
  }

  await batch.commit();
  console.log(`✅ Đã gán ${assets.length} assets và ${aircons.length} aircons vào Bros Hotel (${COMPANY_ID})`);
  console.log('🎉 Xong! Reload app để thấy kết quả.');
  process.exit(0);
}

run().catch(e => {
  console.error('❌ Lỗi:', e.message);
  process.exit(1);
});
