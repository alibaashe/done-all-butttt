import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Check,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  ShieldAlert,
  Edit3,
  Trash2,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { AdminPermissionKey, AdminPermissions, AdminRoleType, StaffRole } from '../../types';
import { safeJsonParse } from '../../utils/security';

const PERMISSION_METADATA: { key: AdminPermissionKey; label: string; desc: string }[] = [
  { key: 'manageDispatch', label: 'Live Dispatch Control', desc: 'God’s eye GPS tracking, manual driver assignment, trip cancellation' },
  { key: 'managePricing', label: 'Pricing & Surge Rules', desc: 'Base fares, per-km rates, peak surge multipliers, driver commission %' },
  { key: 'approveDrivers', label: 'Driver Onboarding & KYC', desc: 'Inspect Somaliland IDs, Driver Licenses, Guarantors, Accept/Reject' },
  { key: 'verifyTopUps', label: 'Driver Wallet & Top-Up Verifications', desc: 'Inspect ZAAD/eDahab USSD receipts, adjust real amount, verify & credit' },
  { key: 'manageUsers', label: 'User & Driver Accounts', desc: 'Edit profiles, view ratings, block/unblock riders and drivers' },
  { key: 'managePromos', label: 'Promos, Coupons & Marketing', desc: 'Create discount codes, referral bonuses, SMS broadcast campaigns' },
  { key: 'manageGateways', label: 'Merchant Payment Gateways', desc: 'Configure Telesom ZAAD (0636807814), Somtel eDahab merchant numbers' },
  { key: 'manageRoles', label: 'Staff Roles & RBAC Control', desc: 'Create sub-admin accounts, grant/revoke operational permissions' },
  { key: 'viewFinancials', label: 'Financial Audit & Ledgers', desc: 'View net platform earnings, commission logs, revenue analytics' },
];

const DEFAULT_ROLE_PRESETS: Record<AdminRoleType, AdminPermissions> = {
  'Super Admin': {
    manageDispatch: true,
    managePricing: true,
    approveDrivers: true,
    verifyTopUps: true,
    manageUsers: true,
    managePromos: true,
    manageGateways: true,
    manageRoles: true,
    viewFinancials: true,
  },
  'Fleet Dispatcher': {
    manageDispatch: true,
    managePricing: false,
    approveDrivers: true,
    verifyTopUps: false,
    manageUsers: true,
    managePromos: false,
    manageGateways: false,
    manageRoles: false,
    viewFinancials: false,
  },
  'Finance Admin': {
    manageDispatch: false,
    managePricing: true,
    approveDrivers: false,
    verifyTopUps: true,
    manageUsers: false,
    managePromos: true,
    manageGateways: true,
    manageRoles: false,
    viewFinancials: true,
  },
  'KYC Verification Specialist': {
    manageDispatch: false,
    managePricing: false,
    approveDrivers: true,
    verifyTopUps: false,
    manageUsers: true,
    managePromos: false,
    manageGateways: false,
    manageRoles: false,
    viewFinancials: false,
  },
  'Customer Support': {
    manageDispatch: true,
    managePricing: false,
    approveDrivers: false,
    verifyTopUps: false,
    manageUsers: true,
    managePromos: false,
    manageGateways: false,
    manageRoles: false,
    viewFinancials: false,
  },
};

const INITIAL_STAFF: StaffRole[] = [
  {
    id: 'staff_1',
    name: 'Baashe (Super Admin)',
    email: 'baashe2002@gmail.com',
    phone: '+252 63 6807814',
    role: 'Super Admin',
    status: 'Active',
    createdAt: '2026-01-15',
    permissions: DEFAULT_ROLE_PRESETS['Super Admin'],
  },
  {
    id: 'staff_2',
    name: 'Xasan Jaamac',
    email: 'hassan.dispatch@wadaage.com',
    phone: '0634112233',
    role: 'Fleet Dispatcher',
    status: 'Active',
    createdAt: '2026-02-01',
    permissions: DEFAULT_ROLE_PRESETS['Fleet Dispatcher'],
  },
  {
    id: 'staff_3',
    name: 'Khadra Axmed',
    email: 'khadra.finance@wadaage.com',
    phone: '0654889900',
    role: 'Finance Admin',
    status: 'Active',
    createdAt: '2026-03-10',
    permissions: DEFAULT_ROLE_PRESETS['Finance Admin'],
  },
  {
    id: 'staff_4',
    name: 'Muniira Cumar',
    email: 'muniira.kyc@wadaage.com',
    phone: '0634776655',
    role: 'KYC Verification Specialist',
    status: 'Active',
    createdAt: '2026-04-05',
    permissions: DEFAULT_ROLE_PRESETS['KYC Verification Specialist'],
  },
];

export const RolePermissionManager: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffRole[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_staff_roles');
      if (saved) {
        const parsed = safeJsonParse(saved, null);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_staff_roles', JSON.stringify(staffList));
    } catch (e) {
      console.error(e);
    }
  }, [staffList]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeStaffId, setActiveStaffId] = useState<string>('staff_1');

  // Form State for Adding Staff
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<AdminRoleType>('Fleet Dispatcher');
  const [formPermissions, setFormPermissions] = useState<AdminPermissions>(DEFAULT_ROLE_PRESETS['Fleet Dispatcher']);

  const handleRolePresetChange = (newRole: AdminRoleType) => {
    setFormRole(newRole);
    setFormPermissions(DEFAULT_ROLE_PRESETS[newRole]);
  };

  const togglePermission = (staffId: string, permKey: AdminPermissionKey) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              permissions: {
                ...s.permissions,
                [permKey]: !s.permissions[permKey],
              },
            }
          : s
      )
    );
  };

  const toggleStaffStatus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId ? { ...s, status: s.status === 'Active' ? 'Suspended' : 'Active' } : s
      )
    );
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newStaff: StaffRole = {
      id: `staff_${Date.now()}`,
      name: formName,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@wadaage.com`,
      phone: formPhone || '0634000000',
      role: formRole,
      status: 'Active',
      createdAt: new Date().toISOString().substring(0, 10),
      permissions: formPermissions,
    };

    setStaffList((prev) => [newStaff, ...prev]);
    setIsAddModalOpen(false);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRoleFilter === 'all' || s.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const activeStaff = staffList.find((s) => s.id === activeStaffId) || staffList[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-5 text-slate-900 dark:text-white font-sans">

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              Maamulka Doorka & Ogolaanshaha (RBAC & Staff Permissions)
            </h3>
            <p className="text-xs text-slate-500">
              Configure precise operational privileges for Super Admins, Dispatchers, Finance Managers & KYC Specialists
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff / Sub-Admin</span>
          </button>
        </div>
      </div>

      {/* ACTIVE STAFF SESSION INDICATOR */}
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
              Active Staff Admin Session
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {activeStaff.name} ({activeStaff.role})
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium">Switch Active Staff:</span>
          <select
            value={activeStaffId}
            onChange={(e) => setActiveStaffId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-white font-bold rounded-xl px-3 py-1.5 outline-none"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {s.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search staff name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-slate-400 font-bold">Filter Role:</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
          >
            <option value="all">All Staff Roles ({staffList.length})</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Fleet Dispatcher">Fleet Dispatcher</option>
            <option value="Finance Admin">Finance Admin</option>
            <option value="KYC Verification Specialist">KYC Specialist</option>
            <option value="Customer Support">Customer Support</option>
          </select>
        </div>
      </div>

      {/* STAFF RBAC LISTING */}
      <div className="space-y-4">
        {filteredStaff.map((staff) => {
          const isSuperAdmin = staff.role === 'Super Admin';
          const activePermsCount = Object.values(staff.permissions).filter(Boolean).length;

          return (
            <div
              key={staff.id}
              className={`p-4 rounded-2xl border space-y-3 text-xs transition-all ${
                staff.id === activeStaffId
                  ? 'bg-indigo-50/20 dark:bg-slate-800/90 border-indigo-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Staff Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${
                      isSuperAdmin
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                    }`}
                  >
                    {(staff.name || 'S').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">{staff.name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isSuperAdmin
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : staff.role === 'Fleet Dispatcher'
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : staff.role === 'Finance Admin'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                      {staff.email} • {staff.phone} • Added {staff.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {activePermsCount} of {PERMISSION_METADATA.length} Privileges Active
                  </span>

                  <button
                    onClick={() => toggleStaffStatus(staff.id)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 ${
                      staff.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {staff.status === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{staff.status}</span>
                  </button>
                </div>
              </div>

              {/* Granular Permission Toggle Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Operational Privileges & Access Toggles:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {PERMISSION_METADATA.map((meta) => {
                    const isGranted = staff.permissions[meta.key];

                    return (
                      <button
                        key={meta.key}
                        type="button"
                        onClick={() => togglePermission(staff.id, meta.key)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start space-x-2 ${
                          isGranted
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/50 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center font-bold text-[10px] ${
                            isGranted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {isGranted ? '✓' : '✕'}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`font-bold text-xs block ${isGranted ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-slate-400 block leading-tight">{meta.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD NEW STAFF / SUB-ADMIN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Create New Staff / Sub-Admin Account</h3>
                  <p className="text-[11px] text-slate-400">Assign role template & operational privileges</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Staff Full Name*</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Farxaan Maxamed"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="farxaan@wadaage.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0634889900"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">Select Role Template Preset:</label>
                <select
                  value={formRole}
                  onChange={(e) => handleRolePresetChange(e.target.value as AdminRoleType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-indigo-500"
                >
                  <option value="Super Admin">Super Admin (Full Unrestricted Access)</option>
                  <option value="Fleet Dispatcher">Fleet Dispatcher (Dispatch & Tracking)</option>
                  <option value="Finance Admin">Finance Admin (Top-Ups, Fares & Ledgers)</option>
                  <option value="KYC Verification Specialist">KYC Specialist (Driver Onboarding)</option>
                  <option value="Customer Support">Customer Support (User Accounts & Dispatch)</option>
                </select>
              </div>

              {/* Custom Permission Checkbox Grid */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block">Fine-Tune Individual Permissions:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERMISSION_METADATA.map((meta) => {
                    const isChecked = formPermissions[meta.key];
                    return (
                      <label
                        key={meta.key}
                        className={`p-2 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                          isChecked ? 'bg-indigo-950/60 border-indigo-500 text-white' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setFormPermissions({
                              ...formPermissions,
                              [meta.key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded text-indigo-500 focus:ring-0 accent-indigo-500"
                        />
                        <span className="font-bold text-xs">{meta.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl uppercase shadow-lg"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
