// src/data/firebase.js
import { initializeApp, getApps } from "firebase/app";

import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDYyTLK5HEA8t0_h9m7R61-6FpHKDiqdkE",
  authDomain: "hotel-asset-app.firebaseapp.com",
  projectId: "hotel-asset-app",
  storageBucket: "hotel-asset-app.firebasestorage.app",
  messagingSenderId: "855963320931",
  appId: "1:855963320931:web:2257f02004d013ad8b6e56",
  measurementId: "G-ZRTQ0GCXX1"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Dùng app phụ để tạo user mới mà không làm super admin bị logout
const secondaryApp = getApps().find(a => a.name === "Secondary")
  || initializeApp(firebaseConfig, "Secondary");

const secondaryAuth = getAuth(secondaryApp);

// ================= BASIC FIRESTORE =================

async function getCollection(name) {
  const snapshot = await getDocs(collection(db, name));

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
}

async function saveCollection(name, data = []) {
  const ref = collection(db, name);
  const snapshot = await getDocs(ref);

  const newIds = data.map(item => String(item.id));

  // xoá document không còn trong mảng
  for (const oldDoc of snapshot.docs) {
    if (!newIds.includes(oldDoc.id)) {
      await deleteDoc(doc(db, name, oldDoc.id));
    }
  }

  // lưu / cập nhật document
  for (const item of data) {
    const id = String(item.id || crypto.randomUUID());

    await setDoc(doc(db, name, id), {
      ...item,
      id,
    });
  }
}

// ================= COLLECTION EXPORTS =================

export const getProperties = () => getCollection("properties");
export const saveProperties = (data) => saveCollection("properties", data);

export const getAssets = () => getCollection("assets");
export const saveAssets = (data) => saveCollection("assets", data);

export const getMaintenance = () => getCollection("maintenance");
export const saveMaintenance = (data) => saveCollection("maintenance", data);

export const getStaff = () => getCollection("staff");
export const saveStaff = (data) => saveCollection("staff", data);

export const getInventory = () => getCollection("inventory");
export const saveInventory = (data) => saveCollection("inventory", data);

export const getCompanies = () => getCollection("companies");
export const saveCompanies = (data) => saveCollection("companies", data);

// ================= LOGIN COMPANY CHECK =================

export async function findStaffByEmailAndCompany(email, companyId) {
  const q = query(
    collection(db, "staff"),
    where("email", "==", String(email).toLowerCase()),
    where("companyId", "==", companyId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const item = snapshot.docs[0];

  return {
    id: item.id,
    ...item.data(),
  };
}

// ================= CREATE COMPANY ADMIN =================

export async function createCompanyAdmin(
  companyId,
  email,
  password,
  name = "Admin tổng công ty"
) {
  const cleanEmail = String(email).trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    cleanEmail,
    password
  );

  const uid = userCredential.user.uid;

  await setDoc(doc(db, "staff", uid), {
    id: uid,
    name,
    email: cleanEmail,
    companyId,
    permission: "company_admin",
    role: "Admin tổng công ty",
    dept: "Ban Giám Đốc",
    status: "Hoạt động",
    isSuperAdmin: false,
    createdAt: Date.now(),
  });

  await signOut(secondaryAuth);

  return uid;
}

// ================= STORAGE IMAGE UPLOAD =================

export async function uploadAssetImage(file, assetId, type) {
  const fileName = `${Date.now()}-${file.name}`;
  const fileRef = ref(storage, `assets/${assetId}/${type}/${fileName}`);

  await uploadBytes(fileRef, file);

  return await getDownloadURL(fileRef);
}

// ================= MIGRATE OLD LOCAL DATA =================

export async function migrateLocalToFirebase() {
  const store = await import("./store.js");

  await saveProperties(store.getProperties());
  await saveAssets(store.getAssets());
  await saveMaintenance(store.getMaintenance());
  await saveStaff(store.getStaff());
  await saveInventory(store.getInventory());

  alert("Đã chuyển dữ liệu local lên Firebase!");
}