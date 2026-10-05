import { Ban, CheckCircle2, Edit3, Plus, Search, Shield, Trash2, User, UserCheck, UserPlus, UserX, Wallet, DollarSign, ArrowUpRight, Database, RefreshCw, Sparkles } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useRide } from '../../context/RideContext';
import { secureStorage, safeJsonParse } from '../../utils/security';
import { AuthUser } from '../../types';
import { saveUserToFirestore, updateUserInFirestore, deleteUserFromFirestore, subscribeToUsers, purgeAllFirestoreDemoCollections } from '../../services/firebase';

interface UserRecord {
  id: string;
  name: string;
  role: 'Passenger' | 'Driver' | 'Sub-Admin';
  email: string;
  phone: string;
  rating: number;
  trips: number;
  status: 'Active' | 'Blocked' | 'Suspended';
  password?: string;
}

const STORAGE_USERS_KEY = 'wadaage_registered_users';
const STORAGE_USER_PROFILES_KEY = 'wadaage_user_management_records';
const DELETED_USER_IDS_KEY = 'wadaage_deleted_user_ids';

const getDeletedUserIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_USER_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (_e) {}
  return new Set();
};

const markUserPermanentlyDeleted = (id: string, phone?: string) => {
  try {
    const deletedSet = getDeletedUserIds();
    if (id) deletedSet.add(id);
    if (phone) deletedSet.add(phone);
    localStorage.setItem(DELETED_USER_IDS_KEY, JSON.stringify(Array.from(deletedSet)));

    // Clean from local storage arrays
    const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
    if (rawUsers) {
      try {
        const parsed = JSON.parse(rawUsers);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((u: any) => u.id !== id && u.phone !== phone);
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(cleaned));
        }
      } catch (_e) {}
    }

    const rawProfiles = localStorage.getItem(STORAGE_USER_PROFILES_KEY);
    if (rawProfiles) {
      try {
        const parsed = JSON.parse(rawProfiles);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((u: any) => u.id !== id && u.phone !== phone);
          localStorage.setItem(STORAGE_USER_PROFILES_KEY, JSON.stringify(cleaned));
        }
      } catch (_e) {}
    }
  } catch (_e) {}
};

const loadPersistedUsers = (drivers: any[], driverApplications: any[]): UserRecord[] => {
  try {
    const deletedIds = getDeletedUserIds();
    const registeredUsersMap = new Map<string, UserRecord>();

    // 1. Ensure Super Admin is always anchored
    const superAdmin: UserRecord = {
      id: 'usr_admin_baashe',
      name: 'Baashe (Super Admin)',
      role: 'Sub-Admin',
      email: 'baashe2002@gmail.com',
      phone: '+252 63 6807814',
      rating: 5.0,
      trips: 0,
      status: 'Active',
    };
    if (!deletedIds.has(superAdmin.id)) {
      registeredUsersMap.set(superAdmin.id, superAdmin);
    }

    // 2. Check customized user management records
    const customRecordsStr = localStorage.getItem(STORAGE_USER_PROFILES_KEY);
    if (customRecordsStr) {
      try {
        const parsed = safeJsonParse(customRecordsStr, null);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: UserRecord) => {
            if ((u.id && deletedIds.has(u.id)) || (u.phone && deletedIds.has(u.phone))) return;
            if (u.id || u.phone) registeredUsersMap.set(u.id || u.phone, u);
          });
        }
      } catch (e) {
        console.error('Failed to parse custom user records', e);
      }
    }

    // 3. Read secure storage users
    const secUsers = secureStorage.getItem<AuthUser[]>(STORAGE_USERS_KEY, []) || [];
    secUsers.forEach((u) => {
      const key = u.id || u.phone;
      if (deletedIds.has(u.id) || (u.phone && deletedIds.has(u.phone))) return;
      if (!registeredUsersMap.has(key)) {
        registeredUsersMap.set(key, {
          id: u.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: u.name || 'Wadaage User',
          role: u.role === 'admin' ? 'Sub-Admin' : u.role === 'driver' ? 'Driver' : 'Passenger',
          email: u.email || `${(u.phone || 'user').replace(/\D/g, '')}@wadaage.com`,
          phone: u.phone || '+252 63 0000000',
          rating: 5.0,
          trips: 0,
          status: 'Active',
        });
      }
    });

    // 4. Read plain users from local storage safely
    const plainUsersStr = localStorage.getItem(STORAGE_USERS_KEY);
    if (plainUsersStr) {
      try {
        const parsed = safeJsonParse(plainUsersStr, null);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: any) => {
            const key = u.id || u.phone;
            if (deletedIds.has(u.id) || (u.phone && deletedIds.has(u.phone))) return;
            if (!registeredUsersMap.has(key)) {
              registeredUsersMap.set(key, {
                id: u.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: u.name || 'Wadaage User',
                role: u.role === 'admin' ? 'Sub-Admin' : u.role === 'driver' ? 'Driver' : 'Passenger',
                email: u.email || `${(u.phone || 'user').replace(/\D/g, '')}@wadaage.com`,
                phone: u.phone || '+252 63 0000000',
                rating: 5.0,
                trips: 0,
                status: 'Active',
              });
            }
          });
        }
      } catch {}
    }

    // De-duplication key helper (normalizes phone number to avoid duplicate rows for same user/driver)
    const getDedupeKey = (item: { id?: string; phone?: string; name?: string }) => {
      if (item.phone) {
        const cleanPhone = item.phone.replace(/\D/g, '');
        if (cleanPhone.length >= 6) return `phone_${cleanPhone.slice(-7)}`;
      }
      if (item.id) return `id_${item.id}`;
      if (item.name) return `name_${item.name.toLowerCase().trim()}`;
      return `key_${Math.random()}`;
    };

    const deduplicatedMap = new Map<string, UserRecord>();

    registeredUsersMap.forEach((u) => {
      const dKey = getDedupeKey(u);
      if (!deduplicatedMap.has(dKey)) {
        deduplicatedMap.set(dKey, u);
      } else {
        const existing = deduplicatedMap.get(dKey)!;
        // Prioritize Driver/Admin role or merged details
        if (u.role === 'Driver' || u.role === 'Sub-Admin') {
          deduplicatedMap.set(dKey, { ...existing, ...u });
        }
      }
    });

    // 5. Add drivers from state
    drivers.forEach((d) => {
      if (deletedIds.has(d.id) || (d.phone && deletedIds.has(d.phone))) return;
      const dKey = getDedupeKey(d);
      const driverRecord: UserRecord = {
        id: d.id,
        name: d.name,
        role: 'Driver',
        email: `${d.name.toLowerCase().replace(/\s+/g, '.')}@wadaage.com`,
        phone: d.phone,
        rating: d.rating || 5.0,
        trips: d.totalTrips || 0,
        status: d.status === 'blocked' ? 'Blocked' : 'Active',
      };
      if (!deduplicatedMap.has(dKey)) {
        deduplicatedMap.set(dKey, driverRecord);
      } else {
        const existing = deduplicatedMap.get(dKey)!;
        deduplicatedMap.set(dKey, { ...existing, ...driverRecord, role: 'Driver' });
      }
    });

    // 6. Add driver applications from state
    driverApplications.forEach((app) => {
      if (deletedIds.has(app.id) || (app.phone && deletedIds.has(app.phone))) return;
      const dKey = getDedupeKey({ id: app.id, phone: app.phone, name: app.fullName });
      if (!deduplicatedMap.has(dKey)) {
        deduplicatedMap.set(dKey, {
          id: app.id,
          name: app.fullName,
          role: 'Driver',
          email: `${app.fullName.toLowerCase().replace(/\s+/g, '.')}@wadaage.com`,
          phone: app.phone,
          rating: 5.0,
          trips: 0,
          status: app.status === 'approved' ? 'Active' : 'Suspended',
        });
      }
    });

    return Array.from(deduplicatedMap.values());
  } catch (e) {
    console.error('Error loading persisted users:', e);
    return [];
  }
};

export const UserManagementTable: React.FC = () => {
  const {
    drivers,
    driverApplications,
    getDriverWalletBalance,
    getUserWalletBalance,
    adminCreditDriverWallet,
    adminCreditUserWallet,
    pricing,
    updateUserPassword,
    registerRider,
    registerDriver,
  } = useRide();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Individual user/driver wallet top-up modal state
  const [topUpUserId, setTopUpUserId] = useState<string | null>(null);
  const [topUpAmountUsd, setTopUpAmountUsd] = useState<number>(5.00);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState<boolean>(false);

  const [users, setUsers] = useState<UserRecord[]>(() => loadPersistedUsers(drivers, driverApplications));

  // Merge server data seamlessly
  const mergeServerUsers = useCallback((serverUsers: any[]) => {
    if (!serverUsers || !Array.isArray(serverUsers)) return;
    const deletedIds = getDeletedUserIds();
    setUsers((prev) => {
      const userMap = new Map<string, UserRecord>();

      // Put server users (excluding any permanently deleted IDs)
      serverUsers.forEach((su: any) => {
        const id = su.id || `usr_${su.phone}`;
        if (deletedIds.has(id) || (su.phone && deletedIds.has(su.phone))) return;

        userMap.set(id, {
          id: id,
          name: su.name || 'Wadaage User',
          role: su.role === 'admin' || su.role === 'Sub-Admin' ? 'Sub-Admin' : su.role === 'driver' || su.role === 'Driver' ? 'Driver' : 'Passenger',
          email: su.email || `${(su.phone ? String(su.phone).replace(/\D/g, '') : 'user')}@wadaage.com`,
          phone: su.phone || '+252 63 0000000',
          rating: su.rating ? Number(su.rating) : 5.0,
          trips: su.total_trips !== undefined ? Number(su.total_trips) : (su.trips ? Number(su.trips) : 0),
          status: su.status === 'blocked' || su.status === 'Blocked' ? 'Blocked' : su.status === 'suspended' || su.status === 'Suspended' ? 'Suspended' : 'Active',
        });
      });

      // Retain existing users if not on server yet (and not deleted)
      prev.forEach((pu) => {
        if (deletedIds.has(pu.id) || (pu.phone && deletedIds.has(pu.phone))) return;
        if (!userMap.has(pu.id) && !userMap.has(pu.phone)) {
          userMap.set(pu.id, pu);
        }
      });

      return Array.from(userMap.values());
    });
    setLastSyncTime(new Date().toLocaleTimeString());
  }, []);

  // 1. Subscribe to Live Database Server via API / SSE polling
  useEffect(() => {
    const unsubscribe = subscribeToUsers((serverUsers) => {
      mergeServerUsers(serverUsers);
    });

    return () => unsubscribe();
  }, [mergeServerUsers]);

  // 2. Listen to real-time events & storage updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_USERS_KEY || e.key === STORAGE_USER_PROFILES_KEY) {
        setUsers(loadPersistedUsers(drivers, driverApplications));
      }
    };

    window.addEventListener('storage', handleStorage);

    // Listen on custom BroadcastChannel if supported
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('wadaage_ride_realtime_events');
        channel.onmessage = (event) => {
          if (
            event.data?.type === 'USER_REGISTERED' ||
            event.data?.type === 'DRIVER_REGISTERED' ||
            event.data?.type === 'USER_UPDATED' ||
            event.data?.type === 'DRIVER_WALLET_UPDATED' ||
            event.data?.type === 'RIDE_STATUS_UPDATED'
          ) {
            setUsers(loadPersistedUsers(drivers, driverApplications));
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        };
      }
    } catch (_e) {}

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [drivers, driverApplications]);

  // 3. Sync users to persistent storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USER_PROFILES_KEY, JSON.stringify(users));

      const authUsersFormat: AuthUser[] = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role === 'Sub-Admin' ? 'admin' : u.role === 'Driver' ? 'driver' : 'passenger',
      }));

      secureStorage.setItem(STORAGE_USERS_KEY, authUsersFormat);
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(authUsersFormat));
    } catch (e) {
      console.error('Error persisting users to storage:', e);
    }
  }, [users]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'Passenger' | 'Driver' | 'Sub-Admin'>('Passenger');
  const [formPassword, setFormPassword] = useState('');

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Wad#';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generated += `${Math.floor(10 + Math.random() * 90)}`;
    setFormPassword(generated);
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleBlock = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const newStatus = target.status === 'Blocked' ? 'Active' : 'Blocked';

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
    );

    // Sync to database
    updateUserInFirestore({ id, status: newStatus.toLowerCase() as any });
  };

  const handleDelete = (id: string) => {
    const target = users.find((u) => u.id === id);
    markUserPermanentlyDeleted(id, target?.phone);
    setUsers((prev) => prev.filter((u) => u.id !== id && (target?.phone ? u.phone !== target.phone : true)));
    deleteUserFromFirestore(id);

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('wadaage_ride_realtime_events');
        channel.postMessage({ type: 'USER_DELETED', userId: id });
        channel.close();
      }
    } catch (_e) {}
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('Passenger');
    setFormPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPhone(u.phone);
    setFormRole(u.role);
    setFormPassword('');
    setIsModalOpen(true);
  };

  const handleManualRefresh = () => {
    setIsSyncing(true);
    fetch('/api/db/users')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.data)) {
          mergeServerUsers(data.data);
        }
      })
      .finally(() => {
        setTimeout(() => setIsSyncing(false), 600);
      });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let targetUserId = '';

    if (editingUser) {
      targetUserId = editingUser.id;
      const updatedUser: UserRecord = {
        ...editingUser,
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        password: formPassword.trim() || editingUser.password,
      };

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? updatedUser : u))
      );

      // Save to backend database
      updateUserInFirestore({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: formRole === 'Sub-Admin' ? 'admin' : formRole === 'Driver' ? 'driver' : 'passenger',
        password: formPassword.trim() || editingUser.password,
      });
    } else {
      targetUserId = `usr_${Date.now()}`;
      const newUser: UserRecord = {
        id: targetUserId,
        name: formName.trim(),
        email: formEmail.trim() || `${formName.trim().toLowerCase().replace(/\s+/g, '.')}@wadaage.com`,
        phone: formPhone.trim() || '+252 63 0000000',
        role: formRole,
        rating: 5.0,
        trips: 0,
        status: 'Active',
        password: formPassword.trim() || undefined,
      };
      setUsers((prev) => [newUser, ...prev]);

      // If Driver, register driver in store
      if (formRole === 'Driver') {
        registerDriver({
          name: newUser.name,
          phone: newUser.phone,
          password: formPassword.trim() || undefined,
          vehicleCategory: 'wadaage_both',
          autoApprove: true,
        });
      } else if (formRole === 'Passenger') {
        registerRider({
          name: newUser.name,
          phone: newUser.phone,
          password: formPassword.trim() || undefined,
        });
      }

      // Save to backend database & Firestore
      saveUserToFirestore({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: formRole === 'Sub-Admin' ? 'admin' : formRole === 'Driver' ? 'driver' : 'passenger',
        password: formPassword.trim() || undefined,
      });
    }

    // Securely hash and update password across all stores smoothly
    if (formPassword.trim()) {
      try {
        await updateUserPassword(targetUserId, formPassword.trim());
        if (formPhone.trim()) {
          await updateUserPassword(formPhone.trim(), formPassword.trim());
        }
      } catch (_e) {}
    }

    setIsModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                User & Driver Profile Management
              </h3>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Database className="w-3 h-3" />
                <span>DB Live Synced ({users.length} Records)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time Google Cloud Firestore Database store • Last synced: {lastSyncTime}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-1.5 text-xs rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none w-48 sm:w-60"
            />
          </div>

          <button
            onClick={handleManualRefresh}
            title="Refresh database records"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Execute Nuclear Purge? This will wipe all fake/demo/simulator drivers, riders, and applications from Firestore and Database while preserving real registered accounts.')) {
                setIsPurging(true);
                await purgeAllFirestoreDemoCollections();
                handleManualRefresh();
                setTimeout(() => setIsPurging(false), 1000);
              }
            }}
            disabled={isPurging}
            title="Nuclear Data Purge (Wipe Demo & Simulator Data)"
            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Nuclear Purge</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <th className="py-2.5 px-3">Name & Email</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3">Wallet / Rating</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {(u.name || 'U').substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
                        <span>{u.name}</span>
                        {u.role === 'Sub-Admin' && (
                          <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-black px-1.5 py-0.2 rounded">SUPER</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'Driver'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : u.role === 'Sub-Admin'
                        ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-3 font-medium text-slate-500 font-mono">{u.phone}</td>
                <td className="py-3 px-3 font-bold">
                  {u.role === 'Driver' ? (
                    <div>
                      {(() => {
                        const bal = getDriverWalletBalance(u.id) || (u.phone ? getDriverWalletBalance(u.phone) : 0);
                        return (
                          <>
                            <span className="text-emerald-500 font-mono">
                              ${bal.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {(bal * 10000).toLocaleString()} SOS
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div>
                      {(() => {
                        const passBal = getUserWalletBalance(u.id) || (u.phone ? getUserWalletBalance(u.phone) : 0);
                        return (
                          <>
                            <span className="text-emerald-400 font-mono">
                              ${passBal.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-amber-500 block font-normal">
                              ★ {u.rating} ({u.trips} trips)
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3">
                  {u.status === 'Blocked' ? (
                    <span className="inline-flex items-center space-x-1 text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      <UserX className="w-3.5 h-3.5" />
                      <span>Blocked</span>
                    </span>
                  ) : u.status === 'Suspended' ? (
                    <span className="inline-flex items-center space-x-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Pending Verification</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setTopUpUserId(u.id);
                        setTopUpSuccessMsg(null);
                      }}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                      title={`Top-Up ${u.name}'s Wallet`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Top-Up</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleBlock(u.id)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                        u.status === 'Blocked'
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {u.status === 'Blocked' ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1 text-red-400 hover:text-red-500 transition"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specific User/Driver Wallet Admin Top-Up Modal */}
      {topUpUserId && (() => {
        const targetUser = users.find((u) => u.id === topUpUserId);
        const isDriver = targetUser?.role === 'Driver';
        const currentBal = targetUser
          ? isDriver
            ? (getDriverWalletBalance(targetUser.id) || (targetUser.phone ? getDriverWalletBalance(targetUser.phone) : 0))
            : (getUserWalletBalance(targetUser.id) || (targetUser.phone ? getUserWalletBalance(targetUser.phone) : 0))
          : 0;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {isDriver ? 'Driver Top-Up' : 'Passenger Top-Up'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Target: <b className="text-white">{targetUser?.name || 'Selected User'}</b> ({targetUser?.phone})
                  </p>
                </div>
              </div>

              {/* Current balance card */}
              <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold">Current Balance:</span>
                <div className="text-right">
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    ${currentBal.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {(currentBal * 10000).toLocaleString()} SOS
                  </span>
                </div>
              </div>

              {topUpSuccessMsg ? (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold text-center">
                  {topUpSuccessMsg}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Top-Up Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={topUpAmountUsd}
                        onChange={(e) => setTopUpAmountUsd(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Equivalent to <b className="text-emerald-400">{(topUpAmountUsd * 10000).toLocaleString()} SOS</b>.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[2, 5, 10].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmountUsd(amt)}
                        className={`py-1.5 rounded-lg font-bold border transition text-xs ${
                          topUpAmountUsd === amt
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        +${amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTopUpUserId(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingTopUp || !!topUpSuccessMsg}
                      onClick={() => {
                        if (!targetUser || isSubmittingTopUp) return;
                        setIsSubmittingTopUp(true);
                        if (isDriver) {
                          adminCreditDriverWallet(targetUser.id, topUpAmountUsd, false, `Admin Direct Top-Up for ${targetUser.name}`);
                        } else {
                          adminCreditUserWallet(targetUser.id, topUpAmountUsd, `Admin Direct Top-Up for ${targetUser.name}`);
                        }
                        setTopUpSuccessMsg(`Successfully credited $${topUpAmountUsd.toFixed(2)} to ${targetUser.name}!`);
                        setTimeout(() => {
                          setTopUpUserId(null);
                          setTopUpSuccessMsg(null);
                          setIsSubmittingTopUp(false);
                        }, 1800);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{isSubmittingTopUp ? 'Crediting...' : 'Credit Wallet'}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">
              {editingUser ? 'Edit Profile' : 'Add New Profile'}
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Hassan Jama"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="Passenger">Passenger</option>
                  <option value="Driver">Driver</option>
                  <option value="Sub-Admin">Sub-Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. hassan@wadaage.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +252 63 4556677"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400">Edit Password (Hashed Securely)</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "Leave blank to keep existing password" : "Enter account password"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Passwords are securely hashed before insertion into the database.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
