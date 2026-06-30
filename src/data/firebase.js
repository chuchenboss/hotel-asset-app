// src/data/firebase.js
import { initializeApp, getApps } from "firebase/app";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  deleteDoc,
  query,
  where,
  writeBatch,
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
  measurementId: "G-ZRTQ0GCXX1",
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// Secondary app — used to create staff/admin accounts without logging out current user
const secondaryApp = getApps().find((a) => a.name === "Secondary")
  || initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);


// ─────────────────────────────────────────────────────────────
//  CORE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * getCollection — fetch all docs, or scoped by companyId
 * @param {string} name  Collection name
 * @param {string|null} companyId  If provided, adds WHERE companyId == companyId
 */
async function getCollection(name, companyId = null) {
  const col = collection(db, name);
  const q   = companyId
    ? query(col, where("companyId", "==", String(companyId)))
    : col;
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * saveCollection — upsert/delete using a Firestore writeBatch.
 *
 * Strategy:
 *   1. Read current doc IDs in the collection (scoped by companyId if given)
 *   2. Delete docs no longer present in `data`
 *   3. Upsert all docs in `data`
 * Uses batched writes (max 500 ops per batch) for atomicity & efficiency.
 *
 * @param {string}   name       Collection name
 * @param {Array}    data       Array of items to persist
 * @param {string|null} companyId  Scope deletes to this company (leave null for company-less collections like "companies")
 */
async function saveCollection(name, data = [], companyId = null) {
  const col = collection(db, name);

  // Fetch existing IDs (scoped)
  const q        = companyId ? query(col, where("companyId", "==", String(companyId))) : col;
  const snapshot = await getDocs(q);
  const existingIds = new Set(snapshot.docs.map((d) => d.id));
  const newIds      = new Set(data.map((item) => String(item.id || '')));

  // Collect all operations
  const toDelete = [...existingIds].filter((id) => !newIds.has(id));
  const toUpsert = data;

  // Firestore batch max = 500 ops — chunk if needed
  const ops = [
    ...toDelete.map((id) => ({ type: 'delete', id })),
    ...toUpsert.map((item) => ({ type: 'set',    item })),
  ];

  const CHUNK = 490;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + CHUNK)) {
      if (op.type === 'delete') {
        batch.delete(doc(db, name, op.id));
      } else {
        const id = String(op.item.id || crypto.randomUUID());
        const raw = { ...op.item, id };
        // Strip undefined values — Firestore rejects them
        const clean = Object.fromEntries(
          Object.entries(raw).filter(([, v]) => v !== undefined)
        );
        batch.set(doc(db, name, id), clean);
      }
    }
    await batch.commit();
  }
}

/**
 * saveSingleDoc — upsert one document by ID.
 * Use this for add/edit of a single record instead of rewriting the whole collection.
 */
export async function saveSingleDoc(collectionName, item) {
  const id = String(item.id || crypto.randomUUID());
  await setDoc(doc(db, collectionName, id), { ...item, id });
  return id;
}

/**
 * deleteSingleDoc — delete one document by ID.
 */
export async function deleteSingleDoc(collectionName, id) {
  await deleteDoc(doc(db, collectionName, String(id)));
}


// ─────────────────────────────────────────────────────────────
//  COLLECTION EXPORTS — scoped reads & writes
// ─────────────────────────────────────────────────────────────

// Properties
export const getProperties          = (companyId) => getCollection("properties", companyId);
export const saveProperties         = (data, companyId) => saveCollection("properties", data, companyId);

// Assets
export const getAssets              = (companyId) => getCollection("assets", companyId);
export const saveAssets             = (data, companyId) => saveCollection("assets", data, companyId);

// Maintenance
export const getMaintenance         = (companyId) => getCollection("maintenance", companyId);
export const saveMaintenance        = (data, companyId) => saveCollection("maintenance", data, companyId);

// Staff
export const getStaff               = (companyId) => getCollection("staff", companyId);
export const saveStaff              = (data, companyId) => saveCollection("staff", data, companyId);

// Inventory
export const getInventory           = (companyId) => getCollection("inventory", companyId);
export const saveInventory          = (data, companyId) => saveCollection("inventory", data, companyId);

// Aircons
export const getAircons             = (companyId) => getCollection("aircons", companyId);
export const saveAircons            = (data, companyId) => saveCollection("aircons", data, companyId);

// AC History
export const getAcHistory           = (companyId) => getCollection("ac_history", companyId);
export const saveAcHistory          = (data, companyId) => saveCollection("ac_history", data, companyId);

// Companies — no scoping (super admin only)
export const getCompanies           = () => getCollection("companies");
export const saveCompanies          = (data) => saveCollection("companies", data, null);


// ─────────────────────────────────────────────────────────────
//  AUTH HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * findStaffByEmailAndCompany — used on login to verify staff belongs to company
 */
export async function findStaffByEmailAndCompany(email, companyId) {
  const q = query(
    collection(db, "staff"),
    where("email", "==", String(email).trim().toLowerCase()),
    where("companyId", "==", String(companyId).trim())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() };
}

/**
 * createCompanyAdmin — creates Firebase Auth user + staff doc for a new company admin.
 * Uses secondary auth instance so the current super admin session stays intact.
 */
export async function createCompanyAdmin(companyId, email, password, name = "Admin tổng công ty") {
  const cleanEmail = String(email).trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    cleanEmail,
    password
  );
  const uid = userCredential.user.uid;

  await setDoc(doc(db, "staff", uid), {
    id:          uid,
    name,
    email:       cleanEmail,
    companyId:   String(companyId).trim(),
    permission:  "company_admin",
    role:        "Admin tổng công ty",
    dept:        "Ban Giám Đốc",
    status:      "Hoạt động",
    isSuperAdmin: false,
    createdAt:   Date.now(),
  });

  await signOut(secondaryAuth);
  return uid;
}

/**
 * createStaffAccount — creates Firebase Auth user + staff doc.
 */
export async function createStaffAccount(staffData, password) {
  const cleanEmail = String(staffData.email).trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    cleanEmail,
    password
  );
  const uid = userCredential.user.uid;

  await setDoc(doc(db, "staff", uid), {
    ...staffData,
    id:        uid,
    email:     cleanEmail,
    companyId: String(staffData.companyId || "").trim(),
    createdAt: Date.now(),
  });

  await signOut(secondaryAuth);
  return uid;
}


// ─────────────────────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────────────────────

export async function uploadAssetImage(file, assetId, type) {
  const fileName = `${Date.now()}-${file.name}`;
  const fileRef  = ref(storage, `assets/${assetId}/${type}/${fileName}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}


// ─────────────────────────────────────────────────────────────
//  MIGRATION (one-time: local → Firebase)
// ─────────────────────────────────────────────────────────────

export async function migrateLocalToFirebase(companyId) {
  const store = await import("./store.js");

  const migrate = (items) =>
    items.map((item) => ({ ...item, companyId: String(companyId) }));

  await saveProperties(migrate(store.getProperties()), companyId);
  await saveAssets(migrate(store.getAssets()), companyId);
  await saveMaintenance(migrate(store.getMaintenance()), companyId);
  await saveStaff(migrate(store.getStaff()), companyId);
  await saveInventory(migrate(store.getInventory()), companyId);
  await saveAircons([], companyId);

  alert("✓ Đã chuyển dữ liệu local lên Firebase!");
}
