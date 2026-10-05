import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const FIRESTORE_DATABASE_ID = 'ai-studio-grabtaxisharedri-e45d19b0-1b7f-4529-bd6a-f0aebd18cea8';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, FIRESTORE_DATABASE_ID);

async function cleanUsersAndDrivers() {
  console.log('🚀 Starting Firebase Firestore User & Driver Cleanup...');
  console.log(`Database ID: ${FIRESTORE_DATABASE_ID}`);
  console.log(`Project ID: ${firebaseConfig.projectId}`);

  // 1. Purge non-admin users
  console.log('\n--- Checking users collection ---');
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Found ${usersSnap.docs.length} total user records in Firestore.`);

  let deletedUsersCount = 0;
  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    const isAdmin =
      docId === 'usr_admin_baashe' ||
      data.id === 'usr_admin_baashe' ||
      data.phone === '+252 63 6807814' ||
      data.phone === '+252636807814' ||
      data.email === 'baashe2002@gmail.com' ||
      data.role === 'admin';

    if (!isAdmin) {
      console.log(`Deleting non-admin user: ${docId} (${data.name || 'Unknown'}, phone: ${data.phone || 'None'}, role: ${data.role || 'user'})`);
      await deleteDoc(docSnap.ref).catch((e) => console.error(`Failed to delete ${docId}:`, e.message));
      deletedUsersCount++;
    } else {
      console.log(`✅ Preserving Admin user: ${docId} (${data.name})`);
    }
  }
  console.log(`Deleted ${deletedUsersCount} non-admin users.`);

  // 2. Ensure Baashe Super Admin exists
  console.log('\n--- Anchoring Baashe Super Admin account ---');
  const adminRef = doc(db, 'users', 'usr_admin_baashe');
  await setDoc(
    adminRef,
    {
      id: 'usr_admin_baashe',
      name: 'Baashe (Super Admin)',
      role: 'admin',
      email: 'baashe2002@gmail.com',
      phone: '+252 63 6807814',
      rating: 5.0,
      trips: 0,
      status: 'Active',
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  console.log('✅ Admin user "usr_admin_baashe" confirmed in Firestore.');

  // 3. Purge existing test drivers
  console.log('\n--- Checking drivers collection ---');
  const driversSnap = await getDocs(collection(db, 'drivers'));
  console.log(`Found ${driversSnap.docs.length} driver records in Firestore.`);
  let deletedDriversCount = 0;
  for (const docSnap of driversSnap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    const isLinkedToAdmin =
      data.userId === 'usr_admin_baashe' ||
      data.phone === '+252 63 6807814' ||
      data.phone === '+252636807814';

    if (!isLinkedToAdmin) {
      console.log(`Deleting driver record: ${docId} (${data.name || 'Unknown'})`);
      await deleteDoc(docSnap.ref).catch((e) => console.error(`Failed to delete driver ${docId}:`, e.message));
      deletedDriversCount++;
    } else {
      console.log(`Preserving admin driver profile: ${docId}`);
    }
  }
  console.log(`Deleted ${deletedDriversCount} drivers.`);

  // 4. Purge test driver applications
  console.log('\n--- Checking driver_applications collection ---');
  const appsSnap = await getDocs(collection(db, 'driver_applications'));
  let deletedAppsCount = 0;
  for (const docSnap of appsSnap.docs) {
    const data = docSnap.data();
    if (data.phone !== '+252 63 6807814' && data.phone !== '+252636807814') {
      await deleteDoc(docSnap.ref).catch(() => {});
      deletedAppsCount++;
    }
  }
  console.log(`Deleted ${deletedAppsCount} test driver applications.`);

  console.log('\n✨ Firestore cleanup complete! Ready for real live users & drivers.');
}

cleanUsersAndDrivers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error cleaning Firebase Firestore:', err);
    process.exit(1);
  });
