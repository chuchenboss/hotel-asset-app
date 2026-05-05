import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyYTLK5HEA8t0_h9m7R61-6FpHKDiqdkE",
  authDomain: "hotel-asset-app.firebaseapp.com",
  projectId: "hotel-asset-app",
  storageBucket: "hotel-asset-app.firebasestorage.app",
  messagingSenderId: "855963320931",
  appId: "1:855963320931:web:2257f02004d013ad8b6e56",
  measurementId: "G-ZRTQ0GCXX1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveCollection(name, data = []) {
  const ref = collection(db, name);

  for (const item of data) {
    const id = item.id || crypto.randomUUID();
    await setDoc(doc(ref, id), { ...item, id });
  }
}

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

export async function migrateLocalToFirebase() {
  const store = await import("./store.js");

  await saveProperties(store.getProperties());
  await saveAssets(store.getAssets());
  await saveMaintenance(store.getMaintenance());
  await saveStaff(store.getStaff());
  await saveInventory(store.getInventory());

  alert("Đã chuyển dữ liệu local lên Firebase!");
}

export { db };
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const db = getFirestore();

// Properties
export const getProperties = async () => {
  const snapshot = await getDocs(collection(db, "properties"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveProperties = async (data) => {
  await addDoc(collection(db, "properties"), data);
};

// Maintenance
export const getMaintenance = async () => {
  const snapshot = await getDocs(collection(db, "maintenance"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveMaintenance = async (data) => {
  await addDoc(collection(db, "maintenance"), data);
};

// Staff
export const getStaff = async () => {
  const snapshot = await getDocs(collection(db, "staff"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveStaff = async (data) => {
  await addDoc(collection(db, "staff"), data);
};

// Inventory
export const getInventory = async () => {
  const snapshot = await getDocs(collection(db, "inventory"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveInventory = async (data) => {
  await addDoc(collection(db, "inventory"), data);
};

// migrate
export const migrateLocalToFirebase = async () => {
  console.log("migrate...");
};