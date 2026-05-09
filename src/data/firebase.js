import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDYyTLK5HEA8t0_h9m7R61-6FpHKDiqdkE",
  authDomain: "hotel-asset-app.firebaseapp.com",
  projectId: "hotel-asset-app",
  storageBucket: "hotel-asset-app.firebasestorage.app",
  messagingSenderId: "855963320931",
  appId: "1:855963320931:web:2257f02004d013ad8b6e56",
  measurementId: "G-ZRTQ0GCXX1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export async function createStaffLogin(email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user.uid;
}
async function getCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function saveCollection(name, data = []) {
  const ref = collection(db, name);

  for (const item of data) {
    const id = item.id || crypto.randomUUID();
    await setDoc(doc(ref, String(id)), { ...item, id });
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
export const getCompanies = () => getCollection("companies");
export const saveCompanies = (data) => saveCollection("companies", data);