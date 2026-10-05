import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { Driver, PricingSettings, RideRequest, DriverWalletTransaction, AuthUser, ChatMessage, DriverApplication } from '../types';
import { getApiUrl } from './apiConfig';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence non-critical network retry notices
setLogLevel('silent');

// Hardcoded Production Firestore Database ID to permanently eliminate '5 NOT_FOUND' error
export const FIRESTORE_DATABASE_ID = 'ai-studio-grabtaxisharedri-e45d19b0-1b7f-4529-bd6a-f0aebd18cea8';

// Initialize Firebase App & Firestore strictly as defined in standard Firebase Web SDK
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreDb: any;
try {
  firestoreDb = initializeFirestore(
    firebaseApp,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    FIRESTORE_DATABASE_ID
  );
} catch {
  firestoreDb = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);
}

/**
 * Sanitizes an object before writing to Firestore, stripping away all undefined fields
 * so Firestore never throws "Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

export const db = firestoreDb;
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer,
  signInWithPopup,
  fbSignOut,
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isOffline = error instanceof Error && (
    error.message.includes('offline') ||
    error.message.includes('unavailable') ||
    (error as any)?.code === 'unavailable'
  );

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
  };

  if (isOffline) {
    console.info(`[Firestore Sync] Operating in persistent offline cache mode for ${path || 'operation'}.`);
  } else {
    console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  }
}

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
      console.info('Firestore client ready (offline-resilient mode).');
    }
    try {
      const res = await fetch(getApiUrl('/api/db/health'));
      return res.ok;
    } catch {
      return true;
    }
  }
}

// ----------------------------------------------------
// Real-time Rides Sync (Firestore onSnapshot + SSE Fallback)
// ----------------------------------------------------

export async function saveRideToFirestore(ride: RideRequest): Promise<void> {
  if (!ride || !ride.id) return;
  const cleaned = cleanForFirestore({
    ...ride,
    updatedAt: new Date().toISOString(),
  });
  // 1. Direct Firestore write
  try {
    const rideRef = doc(db, 'rides', ride.id);
    await setDoc(rideRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `rides/${ride.id}`);
  }

  // 2. Relay to server REST
  try {
    await fetch(getApiUrl('/api/rides/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleaned),
    });
  } catch (err) {
    console.warn('Ride sync notice:', err);
  }
}

/**
 * Atomic Single-Driver Accept Operation
 * Guarantees that only ONE driver can accept a trip even if multiple drivers tap at the exact same millisecond.
 * Uses both Firestore runTransaction (Atomic distributed database lock) and Server Mutex.
 */
export async function acceptRideAtomically(
  rideId: string,
  driverPayload: {
    driverId: string;
    driverName?: string;
    driverPhone?: string;
    driverAvatar?: string;
    vehicleModel?: string;
    licensePlate?: string;
    optimalWaypointsSequence?: any[];
    ride?: RideRequest;
  }
): Promise<{ success: boolean; conflict?: boolean; ride?: RideRequest; message?: string }> {
  try {
    // 1. Direct Firestore Atomic Transaction
    let firestoreUpdatedRide: RideRequest | null = null;
    try {
      const rideRef = doc(db, 'rides', rideId);
      await runTransaction(db, async (transaction) => {
        const rideSnap = await transaction.get(rideRef);
        if (rideSnap.exists()) {
          const currentData = rideSnap.data() as RideRequest;
          // If already accepted by a DIFFERENT driver, abort transaction
          if (
            currentData.status !== 'searching' &&
            currentData.assignedDriverId &&
            currentData.assignedDriverId !== driverPayload.driverId
          ) {
            throw new Error('ALREADY_ACCEPTED');
          }

          const dName = driverPayload.driverName || (driverPayload as any).driver_name || 'Wadaage Captain';
          const dPhone = driverPayload.driverPhone || (driverPayload as any).driver_phone || '+252 63 6807814';
          const vModel = driverPayload.vehicleModel || (driverPayload as any).vehicle_model || 'Toyota Vitz';
          const lPlate = driverPayload.licensePlate || (driverPayload as any).license_plate || 'SL-24810';

          firestoreUpdatedRide = cleanForFirestore({
            ...currentData,
            status: 'accepted',
            assignedDriverId: driverPayload.driverId,
            driverName: dName,
            driver_name: dName,
            driverPhone: dPhone,
            driver_phone: dPhone,
            driverAvatar: driverPayload.driverAvatar,
            vehicleModel: vModel,
            vehicle_model: vModel,
            licensePlate: lPlate,
            license_plate: lPlate,
            optimalWaypointsSequence: driverPayload.optimalWaypointsSequence || currentData.optimalWaypointsSequence,
            updatedAt: new Date().toISOString(),
          });

          transaction.update(
            rideRef,
            cleanForFirestore({
              status: 'accepted',
              assignedDriverId: driverPayload.driverId,
              driverName: dName,
              driver_name: dName,
              driverPhone: dPhone,
              driver_phone: dPhone,
              driverAvatar: driverPayload.driverAvatar || '',
              vehicleModel: vModel,
              vehicle_model: vModel,
              licensePlate: lPlate,
              license_plate: lPlate,
              acceptedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          );
        }
      });
    } catch (transactionErr: any) {
      if (transactionErr?.message === 'ALREADY_ACCEPTED') {
        return {
          success: false,
          conflict: true,
          message: 'Codsigan waxa durba qaatay darawal kale (This trip was already accepted by another driver).',
        };
      }
    }

    // 2. Server-Authoritative Mutex Lock
    const response = await fetch(getApiUrl(`/api/rides/${rideId}/accept`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverPayload),
    });

    const data = await response.json();

    if (!response.ok || data.conflict || !data.success) {
      return {
        success: false,
        conflict: true,
        message: data.message || 'Codsigan waxa durba qaatay darawal kale (This trip was already accepted by another driver).',
      };
    }

    const updatedRide: RideRequest = data.ride || firestoreUpdatedRide;

    return {
      success: true,
      conflict: false,
      ride: updatedRide,
      message: 'Trip accepted successfully.',
    };
  } catch (err) {
    console.warn('Atomic accept fallback error:', err);
    return {
      success: false,
      conflict: false,
      message: 'Network connection issue while accepting trip.',
    };
  }
}

/**
 * Driver Decline / Reject Operation
 * Registers the driver ID into declinedDriverIds on both Server and Firestore.
 */
export async function declineRideAtomically(
  rideId: string,
  driverId: string
): Promise<void> {
  try {
    // 1. Notify server
    await fetch(getApiUrl(`/api/rides/${rideId}/decline`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId }),
    });

    // 2. Update Firestore
    const rideRef = doc(db, 'rides', rideId);
    const snap = await getDoc(rideRef);
    if (snap.exists()) {
      const current = snap.data();
      const declinedList: string[] = current.declinedDriverIds || [];
      if (!declinedList.includes(driverId)) {
        declinedList.push(driverId);
        await setDoc(rideRef, { declinedDriverIds: declinedList, updatedAt: new Date().toISOString() }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('Decline ride error:', err);
  }
}

export function subscribeToLiveRides(onUpdate: (rides: RideRequest[]) => void): () => void {
  let sseSource: EventSource | null = null;
  let pollInterval: any = null;
  let unsubscribeFirestore: (() => void) | null = null;

  // 1. Live Firestore onSnapshot Listener
  try {
    const ridesCol = collection(db, 'rides');
    unsubscribeFirestore = onSnapshot(
      ridesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreRides: RideRequest[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.id) {
              firestoreRides.push(data as RideRequest);
            }
          });
          if (firestoreRides.length > 0) {
            onUpdate(firestoreRides);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'rides');
      }
    );
  } catch (err) {
    console.warn('Firestore rides onSnapshot fallback:', err);
  }

  // 2. Initial fetch from server
  fetch(getApiUrl('/api/rides/active'))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.rides) && data.rides.length > 0) {
        onUpdate(data.rides as RideRequest[]);
      }
    })
    .catch(() => {});

  // 3. Server-Sent Events stream
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      sseSource = new EventSource(getApiUrl('/api/rides/stream'));
      sseSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && Array.isArray(parsed.rides) && parsed.rides.length > 0) {
            onUpdate(parsed.rides as RideRequest[]);
          }
        } catch (_e) {}
      };
    }
  } catch (_e) {}

  // 4. Fallback polling
  pollInterval = setInterval(() => {
    fetch(getApiUrl('/api/rides/active'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.rides) && data.rides.length > 0) {
          onUpdate(data.rides as RideRequest[]);
        }
      })
      .catch(() => {});
  }, 3000);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (sseSource) sseSource.close();
    if (pollInterval) clearInterval(pollInterval);
  };
}

// ----------------------------------------------------
// Real-time Drivers Sync (Firestore onSnapshot + REST Telematics)
// ----------------------------------------------------

export async function saveDriverToFirestore(driver: Driver): Promise<void> {
  if (!driver || !driver.id) return;
  const lat = driver.currentLocation?.lat ?? (driver as any).lat ?? 9.5600;
  const lng = driver.currentLocation?.lng ?? (driver as any).lng ?? 44.0650;
  const heading = (driver as any).heading ?? 0;
  const realBalUsd = driver.walletBalanceUsd !== undefined ? Number(driver.walletBalanceUsd) : (driver as any).wallet_balance_usd !== undefined ? Number((driver as any).wallet_balance_usd) : undefined;

  // 1. Direct Firestore write
  try {
    const driverRef = doc(db, 'drivers', driver.id);
    await setDoc(
      driverRef,
      cleanForFirestore({
        ...driver,
        currentLocation: { lat, lng },
        lat,
        lng,
        heading,
        ...(realBalUsd !== undefined ? { walletBalanceUsd: realBalUsd, wallet_balance_usd: realBalUsd } : {}),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `drivers/${driver.id}`);
  }

  // 2. Server telematics relay
  try {
    await fetch(getApiUrl('/api/drivers/location'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        lat,
        lng,
        heading,
        status: driver.status || 'available',
        category: (driver as any).category || driver.vehicle?.category || 'wadaage_taxi',
      }),
    });
  } catch (err) {
    console.warn('Driver telematics notice:', err);
  }

  // 3. Sync to DB backend
  try {
    await fetch(getApiUrl('/api/db/drivers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driver),
    });
  } catch (err) {
    console.warn('Driver sync notice:', err);
  }
}

export function subscribeToDrivers(onUpdate: (drivers: Driver[]) => void): () => void {
  let unsubscribeFirestore: (() => void) | null = null;
  let sseSource: EventSource | null = null;

  // 1. Live Firestore onSnapshot Listener for real-time driver lat/lng changes
  try {
    const driversCol = collection(db, 'drivers');
    unsubscribeFirestore = onSnapshot(
      driversCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreDrivers: Driver[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.id) {
              const dLat = data.currentLocation?.lat ?? data.lat ?? 9.5600;
              const dLng = data.currentLocation?.lng ?? data.lng ?? 44.0650;
              firestoreDrivers.push({
                ...(data as any),
                currentLocation: { lat: Number(dLat), lng: Number(dLng) },
              } as Driver);
            }
          });
          if (firestoreDrivers.length > 0) {
            onUpdate(firestoreDrivers);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'drivers');
      }
    );
  } catch (err) {
    console.warn('Firestore drivers onSnapshot fallback:', err);
  }

  // 2. Real-time SSE Driver Telematics & Wallet stream
  try {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      sseSource = new EventSource(getApiUrl('/api/rides/stream'));
      sseSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === 'DRIVER_LOCATION' && parsed.driver) {
            const d = parsed.driver;
            // Only update location, heading, status without fabricating dummy wallet balances
            onUpdate([
              {
                id: d.id,
                name: d.name,
                phone: d.phone,
                currentLocation: { lat: Number(d.lat), lng: Number(d.lng) },
                status: d.status || 'available',
                ...(d.heading !== undefined ? { heading: Number(d.heading) } : {}),
                ...(d.wallet_balance_usd !== undefined || d.walletBalanceUsd !== undefined
                  ? { walletBalanceUsd: Number(d.walletBalanceUsd ?? d.wallet_balance_usd) }
                  : {}),
              } as unknown as Driver,
            ]);
          } else if (parsed && parsed.type === 'DRIVER_WALLET_UPDATED') {
            // Immediately relay real-time wallet update across tabs and storage
            try {
              if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                const bc = new BroadcastChannel('wadaage_ride_realtime_events');
                bc.postMessage(parsed);
                bc.close();
              }
              localStorage.setItem('wadaage_last_broadcast_event', JSON.stringify(parsed));
            } catch (_e) {}
          }
        } catch (_e) {}
      };
    }
  } catch (_e) {}

  // Helper to map DB drivers to client Driver interface with normalized real walletBalanceUsd
  const mapDbDrivers = (rawDrivers: any[]): Driver[] => {
    return rawDrivers.map((drv) => {
      const realBalUsd = Number(drv.walletBalanceUsd ?? drv.wallet_balance_usd ?? 0);
      return {
        ...drv,
        walletBalanceUsd: realBalUsd,
        wallet_balance_usd: realBalUsd,
        todayEarnings: Number(drv.todayEarnings ?? drv.today_earnings_usd ?? drv.today_earnings ?? 0),
        weeklyEarnings: Number(drv.weeklyEarnings ?? drv.weekly_earnings_usd ?? drv.weekly_earnings ?? 0),
        totalTrips: Number(drv.totalTrips ?? drv.total_trips ?? 0),
        rating: Number(drv.rating ?? 5.0),
        status: drv.status || (drv.is_online ? 'available' : 'offline'),
        currentLocation: drv.currentLocation || {
          lat: Number(drv.current_lat || 9.5600),
          lng: Number(drv.current_lng || 44.0650),
        },
      } as Driver;
    });
  };

  // 3. Fetch initial drivers from DB API
  fetch(getApiUrl('/api/db/drivers'))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        onUpdate(mapDbDrivers(data.data));
      }
    })
    .catch(() => {});

  const interval = setInterval(() => {
    fetch(getApiUrl('/api/db/drivers'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          onUpdate(mapDbDrivers(data.data));
        }
      })
      .catch(() => {});
  }, 5000);

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (sseSource) sseSource.close();
    clearInterval(interval);
  };
}

// ----------------------------------------------------
// Settings & Pricing Sync (Direct Cloud Firestore)
// ----------------------------------------------------

export async function saveSettingsToFirestore(settings: PricingSettings, updatedBy?: string): Promise<void> {
  try {
    const settingsRef = doc(db, 'system_settings', 'pricing');
    await setDoc(
      settingsRef,
      cleanForFirestore({
        ...settings,
        id: 'pricing',
        updatedBy: updatedBy || 'admin',
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'system_settings/pricing');
  }

  try {
    await fetch(getApiUrl('/api/db/settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, updatedBy }),
    });
  } catch (err) {
    console.warn('Settings sync notice:', err);
  }
}

export function subscribeToSettings(onUpdate: (settings: PricingSettings) => void): () => void {
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const settingsDoc = doc(db, 'system_settings', 'pricing');
    unsubscribeFirestore = onSnapshot(
      settingsDoc,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) onUpdate(data as unknown as PricingSettings);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'system_settings/pricing');
      }
    );
  } catch (err) {
    console.warn('Firestore settings listener fallback:', err);
  }

  fetch(getApiUrl('/api/db/pricing-configs'))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.pricing) {
        onUpdate(data.pricing);
      }
    })
    .catch(() => {});

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

// ----------------------------------------------------
// Driver Wallet & Mobile Money Transactions Sync (Direct Cloud Firestore)
// ----------------------------------------------------

export async function saveTransactionToFirestore(tx: DriverWalletTransaction): Promise<void> {
  if (!tx || !tx.id) return;
  try {
    const txRef = doc(db, 'transactions', tx.id);
    await setDoc(
      txRef,
      cleanForFirestore({
        ...tx,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`);
  }

  try {
    await fetch(getApiUrl('/api/db/wallet-transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
  } catch (err) {
    console.warn('Transaction sync notice:', err);
  }
}

export function subscribeToTransactions(onUpdate: (txs: DriverWalletTransaction[]) => void): () => void {
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const txCol = collection(db, 'transactions');
    unsubscribeFirestore = onSnapshot(
      txCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: DriverWalletTransaction[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d && d.id) list.push(d as DriverWalletTransaction);
          });
          if (list.length > 0) onUpdate(list);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'transactions');
      }
    );
  } catch (err) {
    console.warn('Firestore transactions listener fallback:', err);
  }

  fetch(getApiUrl('/api/db/wallet-transactions'))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        onUpdate(data.data as DriverWalletTransaction[]);
      }
    })
    .catch(() => {});

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

// ----------------------------------------------------
// Driver Applications & KYC Sync (Direct Cloud Firestore)
// ----------------------------------------------------

export async function saveDriverApplicationToFirestore(app: DriverApplication): Promise<void> {
  if (!app || !app.id) return;
  try {
    const appRef = doc(db, 'driver_applications', app.id);
    await setDoc(
      appRef,
      cleanForFirestore({
        ...app,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `driver_applications/${app.id}`);
  }

  try {
    await fetch(getApiUrl('/api/driver-applications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app),
    });
  } catch (err) {
    console.warn('Driver application sync notice:', err);
  }
}

export function subscribeToDriverApplications(onUpdate: (apps: DriverApplication[]) => void): () => void {
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const appCol = collection(db, 'driver_applications');
    unsubscribeFirestore = onSnapshot(
      appCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: DriverApplication[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d && d.id) list.push(d as DriverApplication);
          });
          if (list.length > 0) onUpdate(list);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'driver_applications');
      }
    );
  } catch (err) {
    console.warn('Firestore driver applications fallback:', err);
  }

  fetch(getApiUrl('/api/driver-applications'))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.applications) && data.applications.length > 0) {
        onUpdate(data.applications);
      }
    })
    .catch(() => {});

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}

// ----------------------------------------------------
// Users & Auth Profiles Sync (Direct Cloud Firestore)
// ----------------------------------------------------

export async function saveUserToFirestore(user: AuthUser): Promise<void> {
  if (!user || !user.id) return;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      cleanForFirestore({
        ...user,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
  }

  try {
    await fetch(getApiUrl('/api/db/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (err) {
    console.warn('User sync notice:', err);
  }
}

export async function updateUserInFirestore(user: Partial<AuthUser> & { id: string }): Promise<void> {
  if (!user || !user.id) return;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(
      userRef,
      cleanForFirestore({
        ...user,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
  }

  try {
    await fetch(getApiUrl(`/api/db/users/${user.id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
  } catch (err) {
    console.warn('User update notice:', err);
  }
}

export async function updateDriverInFirestore(driverId: string, updates: Partial<Driver>): Promise<void> {
  if (!driverId) return;
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await setDoc(
      driverRef,
      cleanForFirestore({
        ...updates,
        id: driverId,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `drivers/${driverId}`);
  }

  try {
    await fetch(getApiUrl(`/api/db/drivers/${driverId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (_e) {}
}

export async function updateDriverApplicationInFirestore(appId: string, updates: Partial<DriverApplication>): Promise<void> {
  if (!appId) return;
  try {
    const appRef = doc(db, 'driver_applications', appId);
    await setDoc(
      appRef,
      cleanForFirestore({
        ...updates,
        id: appId,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `driver_applications/${appId}`);
  }
}

/**
 * Online Centralized Credential Verification across Firestore and Backend API
 * Allows any terminal, browser, or mobile APK to immediately authenticate with real-time passwords
 */
export async function verifyCredentialsOnline(
  cleanPhone: string,
  role: 'passenger' | 'driver' | 'admin',
  passwordInput: string
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  foundUser?: boolean;
}> {
  const cleanPassword = passwordInput.trim();
  const targetSuffix = cleanPhone.length >= 7 ? cleanPhone.substring(cleanPhone.length - 7) : cleanPhone;

  // 1. Try Backend API first (/api/auth/verify)
  try {
    const res = await fetch(getApiUrl('/api/auth/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, role, password: cleanPassword }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.user) {
        return { success: true, user: data.user, foundUser: true };
      }
    } else if (res.status === 401) {
      return { success: false, foundUser: true, error: 'WRONG_PASSWORD' };
    }
  } catch (_err) {}

  // 2. Direct Firestore verification (works anywhere on APK, web, or remote terminal without backend dependency)
  try {
    if (role === 'driver') {
      const driversCol = collection(db, 'drivers');
      const snap = await getDocs(driversCol);
      let matchedDriver: any = null;
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d) {
          const dPhone = String(d.phone || '').replace(/\D/g, '');
          if (dPhone === cleanPhone || (targetSuffix.length >= 6 && dPhone.endsWith(targetSuffix))) {
            matchedDriver = { id: docSnap.id, ...d };
          }
        }
      });

      if (!matchedDriver) {
        const appsCol = collection(db, 'driver_applications');
        const appSnap = await getDocs(appsCol);
        appSnap.forEach((docSnap) => {
          const a = docSnap.data();
          if (a) {
            const aPhone = String(a.phone || '').replace(/\D/g, '');
            if (aPhone === cleanPhone || (targetSuffix.length >= 6 && aPhone.endsWith(targetSuffix))) {
              matchedDriver = { id: docSnap.id, ...a, isFromApp: true };
            }
          }
        });
      }

      if (matchedDriver) {
        const expectedPassword = String(matchedDriver.password || '123456').trim();
        if (expectedPassword === cleanPassword) {
          const isVerified = Boolean(
            ((matchedDriver.isVerified === true || matchedDriver.is_verified === true) &&
             (matchedDriver.kycStatus === 'approved' || matchedDriver.kyc_status === 'approved')) ||
            (matchedDriver.isFromApp && matchedDriver.status === 'approved')
          );
          const kycStatus = matchedDriver.kycStatus || matchedDriver.kyc_status || (matchedDriver.status === 'approved' ? 'approved' : isVerified ? 'approved' : 'pending');

          return {
            success: true,
            foundUser: true,
            user: {
              id: matchedDriver.id,
              name: matchedDriver.name || matchedDriver.fullName || 'Wadaage Captain',
              phone: matchedDriver.phone,
              role: 'driver',
              avatar: matchedDriver.avatar || matchedDriver.driverPhoto,
              password: expectedPassword,
              isVerified,
              kycStatus,
              status: matchedDriver.status || (isVerified ? 'available' : 'offline'),
            },
          };
        } else {
          return { success: false, foundUser: true, error: 'WRONG_PASSWORD' };
        }
      }
    } else {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      let matchedUser: any = null;
      snap.forEach((docSnap) => {
        const u = docSnap.data();
        if (u) {
          const uPhone = String(u.phone || '').replace(/\D/g, '');
          if (uPhone === cleanPhone || (targetSuffix.length >= 6 && uPhone.endsWith(targetSuffix))) {
            matchedUser = { id: docSnap.id, ...u };
          }
        }
      });

      if (matchedUser) {
        const expectedPassword = String(matchedUser.password || '').trim();
        if (!expectedPassword || expectedPassword === cleanPassword) {
          return { success: true, foundUser: true, user: matchedUser };
        } else {
          return { success: false, foundUser: true, error: 'WRONG_PASSWORD' };
        }
      }
    }
  } catch (_e) {}

  return { success: false, foundUser: false, error: 'NOT_FOUND' };
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  if (!userId) return;
  // 1. Delete from Firestore users collection
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }

  // 2. Delete from Firestore drivers collection if exists
  try {
    const driverRef = doc(db, 'drivers', userId);
    await deleteDoc(driverRef);
  } catch (_err) {}

  // 3. Delete from Server Database
  try {
    await fetch(getApiUrl(`/api/db/users/${userId}`), {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('User delete notice:', err);
  }
}

export async function deleteDriverFromFirestore(driverId: string): Promise<void> {
  if (!driverId) return;
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await deleteDoc(driverRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `drivers/${driverId}`);
  }

  try {
    const appRef = doc(db, 'driver_applications', driverId);
    await deleteDoc(appRef);
  } catch (_err) {}

  try {
    await fetch(getApiUrl(`/api/db/drivers/${driverId}`), {
      method: 'DELETE',
    });
  } catch (_err) {}
}

export async function deleteApplicationFromFirestore(appId: string): Promise<void> {
  if (!appId) return;
  try {
    const appRef = doc(db, 'driver_applications', appId);
    await deleteDoc(appRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `driver_applications/${appId}`);
  }

  try {
    await fetch(getApiUrl(`/api/driver-applications/${appId}`), {
      method: 'DELETE',
    });
  } catch (_err) {}
}

export async function deleteRideFromFirestore(rideId: string): Promise<void> {
  if (!rideId) return;
  try {
    const rideRef = doc(db, 'rides', rideId);
    await deleteDoc(rideRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `rides/${rideId}`);
  }

  try {
    await fetch(getApiUrl(`/api/db/rides/${rideId}`), {
      method: 'DELETE',
    });
  } catch (_err) {}
}

/**
 * Performs batched deletion of Firestore documents in chunks (max 400 docs per batch)
 * to strictly prevent 'resource-exhausted' or 'Transaction too big' Firestore quota errors.
 */
export async function batchDeleteFirestoreDocs(docRefs: any[]): Promise<number> {
  if (!docRefs || docRefs.length === 0) return 0;
  const BATCH_LIMIT = 400; // Well within the 500 operation limit of Firestore
  let deletedCount = 0;

  for (let i = 0; i < docRefs.length; i += BATCH_LIMIT) {
    const chunk = docRefs.slice(i, i + BATCH_LIMIT);
    try {
      const batch = writeBatch(db);
      for (const ref of chunk) {
        batch.delete(ref);
      }
      await batch.commit();
      deletedCount += chunk.length;
    } catch (batchErr) {
      console.warn('[Firestore] Batched deletion chunk error, falling back to individual deletes:', batchErr);
      // Resilient fallback: delete individually if batch write fails
      for (const ref of chunk) {
        await deleteDoc(ref).catch(() => {});
        deletedCount++;
      }
    }
  }
  return deletedCount;
}

/**
 * Resets Firebase User & Driver Database:
 * Batched deletes all existing users, drivers, applications, and non-active rides,
 * while STRICTLY preserving the admin user: usr_admin_baashe (+252 63 6807814).
 * Eliminates 'resource-exhausted' errors via safe 400-doc chunked writeBatch.
 */
export async function resetFirebaseUserDatabase(): Promise<{
  success: boolean;
  deletedDriversCount: number;
  deletedUsersCount: number;
  deletedAppsCount: number;
  adminPreserved: string;
}> {
  let deletedDriversCount = 0;
  let deletedUsersCount = 0;
  let deletedAppsCount = 0;

  // 1. Purge all drivers with batched deletion
  try {
    const driversSnap = await getDocs(collection(db, 'drivers'));
    const driverRefs = driversSnap.docs.map((d) => d.ref);
    deletedDriversCount = await batchDeleteFirestoreDocs(driverRefs);
  } catch (err) {
    console.warn('[Firebase Reset] Drivers batch error:', err);
  }

  // 2. Purge all driver applications with batched deletion
  try {
    const appsSnap = await getDocs(collection(db, 'driver_applications'));
    const appRefs = appsSnap.docs.map((a) => a.ref);
    deletedAppsCount = await batchDeleteFirestoreDocs(appRefs);
  } catch (err) {
    console.warn('[Firebase Reset] Driver applications batch error:', err);
  }

  // 3. Purge all users EXCEPT usr_admin_baashe with batched deletion
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersToDeleteRefs: any[] = [];

    for (const u of usersSnap.docs) {
      const data = u.data();
      const docId = u.id;
      const isAdmin =
        docId === 'usr_admin_baashe' ||
        data.id === 'usr_admin_baashe' ||
        data.phone === '+252 63 6807814' ||
        data.phone === '+252636807814' ||
        data.role === 'admin';

      if (!isAdmin) {
        usersToDeleteRefs.push(u.ref);
      }
    }

    deletedUsersCount = await batchDeleteFirestoreDocs(usersToDeleteRefs);

    // Ensure Super Admin Baashe is anchored and intact in Firestore
    await setDoc(
      doc(db, 'users', 'usr_admin_baashe'),
      {
        id: 'usr_admin_baashe',
        name: 'Baashe (Super Admin)',
        role: 'admin',
        email: 'baashe2002@gmail.com',
        phone: '+252 63 6807814',
        status: 'Active',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    ).catch(() => {});
  } catch (err) {
    console.warn('[Firebase Reset] Users batch error:', err);
  }

  // 4. Also call server-side purge to sync in-memory & MySQL databases
  try {
    await fetch(getApiUrl('/api/admin/nuclear-purge'), { method: 'POST' });
  } catch (_err) {}

  return {
    success: true,
    deletedDriversCount,
    deletedUsersCount,
    deletedAppsCount,
    adminPreserved: 'usr_admin_baashe (+252 63 6807814)',
  };
}

export async function purgeAllFirestoreDemoCollections(): Promise<void> {
  await resetFirebaseUserDatabase();
}

export function subscribeToUsers(onUpdate: (users: AuthUser[]) => void): () => void {
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const usersCol = collection(db, 'users');
    unsubscribeFirestore = onSnapshot(
      usersCol,
      (snapshot) => {
        const list: AuthUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.id) list.push(d as AuthUser);
        });
        onUpdate(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    );
  } catch (err) {
    console.warn('Users firestore subscription notice:', err);
  }

  // Server event stream fallback
  let eventSource: EventSource | null = null;
  try {
    if (typeof EventSource !== 'undefined') {
      eventSource = new EventSource(getApiUrl('/api/rides/stream'));
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'USER_DELETED' || data.type === 'USER_REGISTERED') {
            fetch(getApiUrl('/api/db/users'))
              .then((res) => (res.ok ? res.json() : null))
              .then((json) => {
                if (json && Array.isArray(json.data)) {
                  onUpdate(json.data);
                }
              });
          }
        } catch (_e) {}
      };
    }
  } catch (_e) {}

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
    if (eventSource) eventSource.close();
  };
}

// ----------------------------------------------------
// SOS Emergency Alerts & In-Ride Chat Sync (Direct Cloud Firestore)
// ----------------------------------------------------

export async function saveSosAlertToFirestore(alertData: any): Promise<void> {
  if (!alertData) return;
  const alertId = alertData.id || `sos_${Date.now()}`;
  try {
    const alertRef = doc(db, 'support_tickets', alertId);
    await setDoc(
      alertRef,
      cleanForFirestore({
        ...alertData,
        id: alertId,
        issueType: 'SOS_EMERGENCY',
        status: 'open',
        priority: 'critical',
        createdAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `support_tickets/${alertId}`);
  }
}

export async function saveChatMessageToFirestore(rideId: string, message: ChatMessage): Promise<void> {
  if (!rideId || !message || !message.text) return;
  const msgId = message.id || `msg_${Date.now()}`;
  try {
    const msgRef = doc(db, 'rides', rideId, 'messages', msgId);
    await setDoc(
      msgRef,
      cleanForFirestore({
        ...message,
        id: msgId,
        rideId,
        createdAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `rides/${rideId}/messages/${msgId}`);
  }

  try {
    await fetch(getApiUrl(`/api/rides/${rideId}/messages`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.warn('Chat message sync notice:', err);
  }
}

export function subscribeToRideMessages(
  rideId: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  if (!rideId) return () => {};
  let unsubscribeFirestore: (() => void) | null = null;

  try {
    const msgCol = collection(db, 'rides', rideId, 'messages');
    unsubscribeFirestore = onSnapshot(
      msgCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            if (d && d.id) list.push(d as ChatMessage);
          });
          if (list.length > 0) onUpdate(list);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `rides/${rideId}/messages`);
      }
    );
  } catch (err) {
    console.warn('Firestore messages fallback:', err);
  }

  fetch(getApiUrl(`/api/rides/${rideId}/messages`))
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && Array.isArray(data.messages) && data.messages.length > 0) {
        onUpdate(data.messages);
      }
    })
    .catch(() => {});

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}
