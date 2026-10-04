import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  Shield,
  Search,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  ShieldCheck,
  UserCheck,
  Power,
  X,
  Mail,
  Calendar,
  Clock,
  Key,
} from 'lucide-react';

interface StaffManagementViewProps {
  users: User[];
  onAddUser?: (user: Omit<User, 'id' | 'created_at'>) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: number) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'caregiver'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('caregiver');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formPhone, setFormPhone] = useState('012-3456789');

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('caregiver');
    setFormStatus('Active');
    setFormPhone('012-3456789');
    setIsAddOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status || 'Active');
    setFormPhone(user.phone || '012-3456789');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (onAddUser) {
      onAddUser({
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
        phone: formPhone.trim(),
        last_login: 'Never',
      });
    }
    setIsAddOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formName.trim() || !formEmail.trim()) return;

    const updated: User = {
      ...editingUser,
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      status: formStatus,
      phone: formPhone.trim(),
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setEditingUser(null);
    if (profileUser && profileUser.id === updated.id) {
      setProfileUser(updated);
    }
  };

  const handleToggleStatus = (user: User) => {
    const nextStatus: 'Active' | 'Inactive' = user.status === 'Active' ? 'Inactive' : 'Active';
    const updated: User = {
      ...user,
      status: nextStatus,
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    if (profileUser && profileUser.id === user.id) {
      setProfileUser(updated);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (u.status || 'Active') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalStaff = users.length;
  const activeStaff = users.filter((u) => (u.status || 'Active') === 'Active').length;
  const admins = users.filter((u) => u.role === 'admin').length;
  const caregivers = users.filter((u) => u.role === 'caregiver').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Pusat Jagaan Warga Emas dan Terapi Fitrah</span>
          </div>
          <h1 className="text-2xl font-black text-white">Staff Management & Access Control</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Manage staff login accounts, access permissions, and role assignments in GoldenCare.
          </p>
        </div>

        <button
          id="add-staff-button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Useful Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Total Staff</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalStaff}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">System user accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Active Staff</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeStaff}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Authorized access</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Administrators</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{admins}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Full management access</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Caregivers</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{caregivers}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Vitals & care entry access</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-staff-input"
            type="text"
            placeholder="Search Staff Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Role filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                roleFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                roleFilter === 'admin' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter('caregiver')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                roleFilter === 'caregiver' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Caregivers
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isActive = (user.status || 'Active') === 'Active';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {user.role === 'admin' ? 'AD' : 'CG'}
                          </div>
                          <div>
                            <button
                              onClick={() => setProfileUser(user)}
                              className="font-bold text-slate-900 hover:text-amber-600 hover:underline cursor-pointer text-left"
                            >
                              {user.name}
                            </button>
                            <div className="text-[11px] text-slate-400 font-normal">
                              Joined {user.created_at.substring(0, 10)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono">
                        {user.last_login || 'Today, 08:30 AM'}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setProfileUser(user)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Staff"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                          title={isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No staff accounts match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Role Permission Comparison Guide */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>System Role Permission Boundaries</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-amber-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>ADMINISTRATOR (Full Administrative Access)</span>
            </div>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              <li>Manage residents (Admit, Edit, Archive)</li>
              <li>View all health records, health trends, and critical alerts</li>
              <li>Manage staff accounts and access permissions</li>
              <li>Manage resident profiles, reports & visitor logs</li>
              <li>Generate and export official Centre & Resident PDF reports</li>
              <li>Configure Telegram emergency notification bot</li>
            </ul>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
            <div className="font-bold text-blue-800 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>CAREGIVER (Clinical Care & Observation Access)</span>
            </div>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              <li>View assigned care residents and medical histories</li>
              <li>Record vital signs (BP, Temperature, SpO2, Heart Rate)</li>
              <li>View real-time abnormal vital alerts and health trends</li>
              <li>Record daily vital signs and visitor entries</li>
              <li>Record visitor check-in and check-out logs</li>
              <li>View and generate individual resident health reports</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Staff Profile Modal */}
      {profileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Staff Account Profile</span>
              </h3>
              <button onClick={() => setProfileUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    profileUser.role === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-blue-600 text-white font-black'
                  }`}
                >
                  {profileUser.role === 'admin' ? 'ADMIN' : 'CARE'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{profileUser.name}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">{profileUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Role Assignment</p>
                  <p className="font-bold text-slate-800 capitalize mt-0.5">{profileUser.role}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Account Status</p>
                  <p className="font-bold mt-0.5 text-emerald-700">{profileUser.status || 'Active'}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Date Joined</p>
                  <p className="font-mono text-slate-700 mt-0.5">{profileUser.created_at.substring(0, 10)}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Last Login</p>
                  <p className="font-mono text-slate-700 mt-0.5">{profileUser.last_login || 'Today, 08:30 AM'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(profileUser)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    (profileUser.status || 'Active') === 'Active'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {(profileUser.status || 'Active') === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const u = profileUser;
                      setProfileUser(null);
                      openEditModal(u);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Edit Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileUser(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {(isAddOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>{editingUser ? 'Edit Staff Account' : 'Create Staff Account'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleSaveEdit : handleSaveAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Siti Nurhaliza Binti Ahmad"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Login ID)</label>
                <input
                  type="email"
                  placeholder="e.g. staff@fitrahcare.my"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="caregiver">Caregiver</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 012-3456789"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
