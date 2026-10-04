import React, { useState } from 'react';

import { User, UserRole } from '../types';
import { ApiError } from '../services/api';

import {
  StaffCreateInput,
  StaffUpdateInput,
} from '../services/staffService';

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Eye,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Power,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

/* =========================================================
   PROPS
========================================================= */

interface StaffManagementViewProps {
  users: User[];

  onAddUser?: (
    input: StaffCreateInput
  ) => Promise<User>;

  onUpdateUser?: (
    userId: number,
    input: StaffUpdateInput
  ) => Promise<User>;

  onDeleteUser?: (
    userId: number
  ) => Promise<void>;
}

type RoleFilter =
  | 'all'
  | 'admin'
  | 'caregiver';

type StatusFilter =
  | 'all'
  | 'Active'
  | 'Inactive';

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return 'Not recorded';
  }

  if (
    value.toLowerCase() ===
    'never'
  ) {
    return 'Never';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'en-MY',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};

const formatDateTime = (
  value?: string
): string => {
  if (!value) {
    return 'Never';
  }

  if (
    value.toLowerCase() ===
    'never'
  ) {
    return 'Never';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    'en-MY',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

const getInitials = (
  name: string
): string => {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return '?';
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[
      words.length - 1
    ][0]
  ).toUpperCase();
};

/* =========================================================
   COMPONENT
========================================================= */

export const StaffManagementView: React.FC<
  StaffManagementViewProps
> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    roleFilter,
    setRoleFilter,
  ] =
    useState<RoleFilter>(
      'all'
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'all'
    );

  /* =======================================================
     MODALS
  ======================================================= */

  const [
    isAddOpen,
    setIsAddOpen,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    profileUser,
    setProfileUser,
  ] =
    useState<User | null>(
      null
    );

  /* =======================================================
     FORM
  ======================================================= */

  const [
    formName,
    setFormName,
  ] = useState('');

  const [
    formEmail,
    setFormEmail,
  ] = useState('');

  const [
    formRole,
    setFormRole,
  ] =
    useState<UserRole>(
      'caregiver'
    );

  const [
    formStatus,
    setFormStatus,
  ] = useState<
    'Active' | 'Inactive'
  >('Active');

  const [
    formPhone,
    setFormPhone,
  ] = useState(
    '012-3456789'
  );

  const [
    formPassword,
    setFormPassword,
  ] = useState('');

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* =======================================================
     OPEN ADD
  ======================================================= */

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');

    setFormRole(
      'caregiver'
    );

    setFormStatus(
      'Active'
    );

    setFormPhone(
      '012-3456789'
    );

    setFormPassword('');

    setFormError('');

    setIsAddOpen(true);
  };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditModal = (
    user: User
  ) => {
    setEditingUser(user);

    setFormName(
      user.name
    );

    setFormEmail(
      user.email
    );

    setFormRole(
      user.role
    );

    setFormStatus(
      user.status ||
        'Active'
    );

    setFormPhone(
      user.phone ||
        '012-3456789'
    );

    setFormPassword('');

    setFormError('');
  };

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeStaffForm =
    () => {
      setIsAddOpen(false);

      setEditingUser(
        null
      );

      setFormError('');

      setFormPassword('');
    };

  /* =======================================================
     ADD STAFF
  ======================================================= */

  const handleSaveAdd =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      setFormError('');

      if (
        !formName.trim() ||
        !formEmail.trim() ||
        formPassword.length <
          8
      ) {
        setFormError(
          'Complete all required fields. Password must contain at least 8 characters.'
        );

        return;
      }

      try {
        setIsSubmitting(
          true
        );

        if (onAddUser) {
          await onAddUser({
            name:
              formName.trim(),

            email:
              formEmail.trim(),

            role: formRole,

            status:
              formStatus,

            phone:
              formPhone.trim(),

            password:
              formPassword,

            password_confirmation:
              formPassword,
          });
        }

        setIsAddOpen(
          false
        );

        setFormPassword('');
      } catch (error) {
        setFormError(
          error instanceof
            ApiError
            ? error.message
            : 'Unable to create the staff account.'
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =======================================================
     UPDATE STAFF
  ======================================================= */

  const handleSaveEdit =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      if (
        !editingUser ||
        !formName.trim() ||
        !formEmail.trim()
      ) {
        return;
      }

      if (
        formPassword &&
        formPassword.length <
          8
      ) {
        setFormError(
          'A new password must contain at least 8 characters.'
        );

        return;
      }

      const input: StaffUpdateInput =
        {
          name:
            formName.trim(),

          email:
            formEmail.trim(),

          role: formRole,

          status:
            formStatus,

          phone:
            formPhone.trim(),
        };

      if (formPassword) {
        input.password =
          formPassword;

        input.password_confirmation =
          formPassword;
      }

      try {
        setIsSubmitting(
          true
        );

        setFormError('');

        if (onUpdateUser) {
          const updated =
            await onUpdateUser(
              editingUser.id,
              input
            );

          if (
            profileUser?.id ===
            updated.id
          ) {
            setProfileUser(
              updated
            );
          }
        }

        setEditingUser(
          null
        );

        setFormPassword('');
      } catch (error) {
        setFormError(
          error instanceof
            ApiError
            ? error.message
            : 'Unable to update the staff account.'
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =======================================================
     TOGGLE STATUS
  ======================================================= */

  const handleToggleStatus =
    async (
      user: User
    ) => {
      const nextStatus:
        | 'Active'
        | 'Inactive' =
        user.status ===
        'Active'
          ? 'Inactive'
          : 'Active';

      try {
        if (onUpdateUser) {
          const updated =
            await onUpdateUser(
              user.id,
              {
                name: user.name,

                email:
                  user.email,

                role:
                  user.role,

                status:
                  nextStatus,

                phone:
                  user.phone ||
                  '',
              }
            );

          if (
            profileUser?.id ===
            user.id
          ) {
            setProfileUser(
              updated
            );
          }
        }
      } catch (error) {
        alert(
          error instanceof
            ApiError
            ? error.message
            : 'Unable to change the account status.'
        );
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (
      user: User
    ) => {
      if (!onDeleteUser) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete the staff account for ${user.name}? This action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await onDeleteUser(
          user.id
        );

        if (
          profileUser?.id ===
          user.id
        ) {
          setProfileUser(
            null
          );
        }
      } catch (error) {
        alert(
          error instanceof
            ApiError
            ? error.message
            : 'Unable to delete the staff account.'
        );
      }
    };

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers =
    users.filter(
      (user) => {
        const query =
          searchQuery
            .trim()
            .toLowerCase();

        const matchesSearch =
          query.length ===
            0 ||
          user.name
            .toLowerCase()
            .includes(
              query
            ) ||
          user.email
            .toLowerCase()
            .includes(
              query
            ) ||
          (
            user.phone || ''
          )
            .toLowerCase()
            .includes(
              query
            );

        const matchesRole =
          roleFilter ===
            'all' ||
          user.role ===
            roleFilter;

        const matchesStatus =
          statusFilter ===
            'all' ||
          (
            user.status ||
            'Active'
          ) === statusFilter;

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      }
    );

  /* =======================================================
     COUNTS
  ======================================================= */

  const totalStaff =
    users.length;

  const activeStaff =
    users.filter(
      (user) =>
        (
          user.status ||
          'Active'
        ) === 'Active'
    ).length;

  const inactiveStaff =
    users.filter(
      (user) =>
        (
          user.status ||
          'Active'
        ) === 'Inactive'
    ).length;

  const admins =
    users.filter(
      (user) =>
        user.role ===
        'admin'
    ).length;

  const caregivers =
    users.filter(
      (user) =>
        user.role ===
        'caregiver'
    ).length;

  const hasFilters =
    searchQuery.trim()
      .length > 0 ||
    roleFilter !==
      'all' ||
    statusFilter !==
      'all';

  const clearFilters = () => {
    setSearchQuery('');

    setRoleFilter(
      'all'
    );

    setStatusFilter(
      'all'
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/5" />

        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full border border-white/5" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Administration
              </p>

            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Staff Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Manage staff
              accounts, roles,
              system access and
              account availability
              for GoldenCare.
            </p>

          </div>

          <button
            id="add-staff-button"
            type="button"
            onClick={
              openAddModal
            }
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-white
              px-5
              py-2.5
              text-sm
              font-semibold
              text-[#174c3c]
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-emerald-50
              hover:shadow-md
            "
          >
            <Plus className="h-4 w-4" />

            Add Staff Account
          </button>

        </div>

      </section>

      {/* =====================================================
          KPI
      ====================================================== */}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        {/* TOTAL */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#174c3c]" />

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Total Staff
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {totalStaff}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                System accounts
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 transition-colors group-hover:bg-emerald-100">
              <Users className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* ACTIVE */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-500" />

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Active Accounts
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                {activeStaff}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {inactiveStaff}{' '}
                inactive
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* ADMIN */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-slate-700" />

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Administrators
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {admins}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Management access
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* CAREGIVER */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-teal-500" />

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Caregivers
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {caregivers}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Daily care access
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <UserCheck className="h-5 w-5" />
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          FILTER PANEL
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-end">

          {/* SEARCH */}
          <div>

            <label
              htmlFor="search-staff-input"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
            >
              Search Staff
            </label>

            <div className="relative">

              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="search-staff-input"
                type="text"
                value={
                  searchQuery
                }
                placeholder="Name, email or phone"
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target
                      .value
                  )
                }
                className="
                  min-h-11
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  py-2.5
                  pl-10
                  pr-10
                  text-sm
                  text-slate-800
                  placeholder:text-slate-400
                  transition-all
                  hover:border-slate-400
                  focus:border-emerald-600
                  focus:outline-none
                  focus:ring-4
                  focus:ring-emerald-100
                "
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchQuery(
                      ''
                    )
                  }
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

            </div>

          </div>

          {/* ROLE */}
          <div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Role
            </p>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">

              {(
                [
                  {
                    value:
                      'all',
                    label:
                      'All',
                  },
                  {
                    value:
                      'admin',
                    label:
                      'Admin',
                  },
                  {
                    value:
                      'caregiver',
                    label:
                      'Caregiver',
                  },
                ] as const
              ).map(
                (
                  option
                ) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={() =>
                      setRoleFilter(
                        option.value
                      )
                    }
                    className={`
                      min-h-9
                      rounded-md
                      px-3
                      text-xs
                      font-semibold
                      transition-all
                      ${
                        roleFilter ===
                        option.value
                          ? 'bg-[#174c3c] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }
                    `}
                  >
                    {
                      option.label
                    }
                  </button>
                )
              )}

            </div>

          </div>

          {/* STATUS */}
          <div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Status
            </p>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    'all'
                  )
                }
                className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-all ${
                  statusFilter ===
                  'all'
                    ? 'bg-[#174c3c] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    'Active'
                  )
                }
                className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-all ${
                  statusFilter ===
                  'Active'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-white'
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(
                    'Inactive'
                  )
                }
                className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-all ${
                  statusFilter ===
                  'Inactive'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                Inactive
              </button>

            </div>

          </div>

        </div>

        {/* RESULT INFO */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-slate-500">
            Showing{' '}

            <span className="font-semibold text-slate-900">
              {
                filteredUsers.length
              }
            </span>

            {' '}of{' '}

            <span className="font-semibold text-slate-900">
              {users.length}
            </span>

            {' '}staff accounts
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
            >
              <X className="h-3.5 w-3.5" />

              Clear Filters
            </button>
          )}

        </div>

      </section>

      {/* =====================================================
          STAFF DIRECTORY
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* SECTION HEADER */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">

          <div>

            <div className="flex items-center gap-2">

              <Users className="h-4 w-4 text-emerald-700" />

              <h2 className="text-sm font-bold text-slate-900">
                Staff Directory
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Account access and role
              information for GoldenCare
              staff.
            </p>

          </div>

          <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:block">
            {
              filteredUsers.length
            }{' '}
            account
            {filteredUsers.length !==
            1
              ? 's'
              : ''}
          </span>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px] text-left">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">

                <th className="px-5 py-3.5">
                  Staff Member
                </th>

                <th className="px-4 py-3.5">
                  Contact
                </th>

                <th className="px-4 py-3.5">
                  Role
                </th>

                <th className="px-4 py-3.5">
                  Status
                </th>

                <th className="px-4 py-3.5">
                  Last Login
                </th>

                <th className="px-5 py-3.5 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredUsers.length >
              0 ? (
                filteredUsers.map(
                  (user) => {
                    const isActive =
                      (
                        user.status ||
                        'Active'
                      ) ===
                      'Active';

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className="group transition-colors duration-150 hover:bg-emerald-50/30"
                      >

                        {/* STAFF */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className={`
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                text-xs
                                font-bold
                                transition-all
                                duration-200
                                ${
                                  user.role ===
                                  'admin'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white'
                                }
                              `}
                            >
                              {getInitials(
                                user.name
                              )}
                            </div>

                            <div className="min-w-0">

                              <button
                                type="button"
                                onClick={() =>
                                  setProfileUser(
                                    user
                                  )
                                }
                                className="text-left text-sm font-semibold text-slate-900 transition-colors hover:text-emerald-800 hover:underline"
                              >
                                {
                                  user.name
                                }
                              </button>

                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">

                                <CalendarDays className="h-3 w-3" />

                                Joined{' '}

                                {formatDate(
                                  user.created_at
                                )}

                              </div>

                            </div>

                          </div>

                        </td>

                        {/* CONTACT */}
                        <td className="px-4 py-4">

                          <div className="space-y-1.5">

                            <div className="flex items-center gap-1.5">

                              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                              <span className="max-w-[230px] truncate text-xs text-slate-700">
                                {
                                  user.email
                                }
                              </span>

                            </div>

                            {user.phone && (
                              <div className="flex items-center gap-1.5">

                                <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                                <span className="font-mono text-[11px] text-slate-500">
                                  {
                                    user.phone
                                  }
                                </span>

                              </div>
                            )}

                          </div>

                        </td>

                        {/* ROLE */}
                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                              user.role ===
                              'admin'
                                ? 'border-slate-300 bg-slate-100 text-slate-700'
                                : 'border-teal-200 bg-teal-50 text-teal-700'
                            }`}
                          >
                            {user.role ===
                            'admin' ? (
                              <Shield className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}

                            {user.role ===
                            'admin'
                              ? 'Administrator'
                              : 'Caregiver'}

                          </span>

                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                              isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-500'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />

                            {isActive
                              ? 'Active'
                              : 'Inactive'}

                          </span>

                        </td>

                        {/* LAST LOGIN */}
                        <td className="px-4 py-4">

                          <p className="text-xs font-medium text-slate-700">
                            {formatDateTime(
                              user.last_login
                            )}
                          </p>

                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-1.5">

                            <button
                              type="button"
                              onClick={() =>
                                setProfileUser(
                                  user
                                )
                              }
                              title="View staff profile"
                              className="
                                inline-flex
                                min-h-9
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-slate-300
                                bg-white
                                px-2.5
                                py-2
                                text-[11px]
                                font-semibold
                                text-slate-700
                                transition-all
                                hover:border-emerald-300
                                hover:bg-emerald-50
                                hover:text-emerald-800
                              "
                            >
                              <Eye className="h-3.5 w-3.5" />

                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  user
                                )
                              }
                              title="Edit staff"
                              className="
                                inline-flex
                                min-h-9
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-slate-300
                                bg-white
                                px-2.5
                                py-2
                                text-[11px]
                                font-semibold
                                text-slate-700
                                transition-all
                                hover:border-emerald-300
                                hover:bg-emerald-50
                                hover:text-emerald-800
                              "
                            >
                              <Edit2 className="h-3.5 w-3.5" />

                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleStatus(
                                  user
                                )
                              }
                              title={
                                isActive
                                  ? 'Deactivate account'
                                  : 'Activate account'
                              }
                              className={`
                                inline-flex
                                min-h-9
                                items-center
                                justify-center
                                rounded-lg
                                border
                                p-2.5
                                transition-all
                                ${
                                  isActive
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }
                              `}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>

                            {onDeleteUser && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDelete(
                                    user
                                  )
                                }
                                title="Delete staff"
                                className="
                                  inline-flex
                                  min-h-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-rose-200
                                  bg-white
                                  p-2.5
                                  text-rose-600
                                  transition-all
                                  hover:bg-rose-50
                                  hover:text-rose-700
                                "
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>

                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >

                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Users className="h-5 w-5" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      No staff accounts
                      found
                    </p>

                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                      No accounts match
                      the current search,
                      role or status
                      filters.
                    </p>

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={
                          clearFilters
                        }
                        className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Reset Filters
                      </button>
                    )}

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>


       


      {/* =====================================================
          STAFF PROFILE MODAL
      ====================================================== */}

      {profileUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Staff Account
                </p>

                <h3 className="mt-0.5 text-base font-bold text-slate-900">
                  Account Profile
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  setProfileUser(
                    null
                  )
                }
                aria-label="Close staff profile"
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* PROFILE HEADER */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-5">

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    profileUser.role ===
                    'admin'
                      ? 'bg-slate-900 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {getInitials(
                    profileUser.name
                  )}
                </div>

                <div className="min-w-0">

                  <h4 className="truncate text-lg font-bold text-slate-900">
                    {
                      profileUser.name
                    }
                  </h4>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {
                      profileUser.email
                    }
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                        profileUser.role ===
                        'admin'
                          ? 'border-slate-300 bg-white text-slate-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {profileUser.role ===
                      'admin' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <UserCheck className="h-3 w-3" />
                      )}

                      {profileUser.role ===
                      'admin'
                        ? 'Administrator'
                        : 'Caregiver'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                        (
                          profileUser.status ||
                          'Active'
                        ) ===
                        'Active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          (
                            profileUser.status ||
                            'Active'
                          ) ===
                          'Active'
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                        }`}
                      />

                      {profileUser.status ||
                        'Active'}
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* DETAILS */}
            <div className="p-5">

              <dl className="overflow-hidden rounded-lg border border-slate-200">

                <div className="grid grid-cols-[130px_1fr] gap-3 px-4 py-3">

                  <dt className="text-xs text-slate-500">
                    Email
                  </dt>

                  <dd className="flex items-center justify-end gap-1.5 text-right text-xs font-semibold text-slate-800">

                    <Mail className="h-3.5 w-3.5 text-slate-400" />

                    {
                      profileUser.email
                    }
                  </dd>

                </div>

                <div className="grid grid-cols-[130px_1fr] gap-3 border-t border-slate-200 px-4 py-3">

                  <dt className="text-xs text-slate-500">
                    Phone
                  </dt>

                  <dd className="text-right font-mono text-xs font-semibold text-slate-800">
                    {profileUser.phone ||
                      'Not recorded'}
                  </dd>

                </div>

                <div className="grid grid-cols-[130px_1fr] gap-3 border-t border-slate-200 px-4 py-3">

                  <dt className="text-xs text-slate-500">
                    Date Joined
                  </dt>

                  <dd className="text-right text-xs font-semibold text-slate-800">
                    {formatDate(
                      profileUser.created_at
                    )}
                  </dd>

                </div>

                <div className="grid grid-cols-[130px_1fr] gap-3 border-t border-slate-200 px-4 py-3">

                  <dt className="text-xs text-slate-500">
                    Last Login
                  </dt>

                  <dd className="text-right text-xs font-semibold text-slate-800">
                    {formatDateTime(
                      profileUser.last_login
                    )}
                  </dd>

                </div>

              </dl>

              {/* ACCESS NOTE */}
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">

                {profileUser.role ===
                'admin' ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                ) : (
                  <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                )}

                <p className="text-xs leading-5 text-slate-600">
                  {profileUser.role ===
                  'admin'
                    ? 'This account has administrative access to management features in GoldenCare.'
                    : 'This account has caregiver access for resident monitoring and daily care activities.'}
                </p>

              </div>

            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <button
                type="button"
                onClick={() =>
                  void handleToggleStatus(
                    profileUser
                  )
                }
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                  (
                    profileUser.status ||
                    'Active'
                  ) === 'Active'
                    ? 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                    : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Power className="h-4 w-4" />

                {(
                  profileUser.status ||
                  'Active'
                ) === 'Active'
                  ? 'Deactivate Account'
                  : 'Activate Account'}
              </button>

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setProfileUser(
                      null
                    )
                  }
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const selected =
                      profileUser;

                    setProfileUser(
                      null
                    );

                    openEditModal(
                      selected
                    );
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#174c3c] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#123f32]"
                >
                  <Edit2 className="h-4 w-4" />

                  Edit Staff
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD / EDIT STAFF MODAL
      ====================================================== */}

      {(isAddOpen ||
        editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">

                  {editingUser ? (
                    <Edit2 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                </div>

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Access Management
                  </p>

                  <h3 className="mt-0.5 text-base font-bold text-slate-900">
                    {editingUser
                      ? 'Edit Staff Account'
                      : 'Create Staff Account'}
                  </h3>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeStaffForm
                }
                aria-label="Close staff form"
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={
                editingUser
                  ? handleSaveEdit
                  : handleSaveAdd
              }
            >

              <div className="space-y-5 p-5">

                {/* BASIC INFO */}
                <div>

                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Staff Information
                  </p>

                  <div className="space-y-4">

                    {/* NAME */}
                    <div>

                      <label
                        htmlFor="staff-name"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Staff Full Name{' '}

                        <span className="text-rose-600">
                          *
                        </span>
                      </label>

                      <input
                        id="staff-name"
                        type="text"
                        placeholder="Example: Siti Nurhaliza Binti Ahmad"
                        value={
                          formName
                        }
                        onChange={(
                          event
                        ) =>
                          setFormName(
                            event
                              .target
                              .value
                          )
                        }
                        className="
                          min-h-11
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          px-3
                          py-2.5
                          text-sm
                          text-slate-800
                          placeholder:text-slate-400
                          focus:border-emerald-600
                          focus:outline-none
                          focus:ring-4
                          focus:ring-emerald-100
                        "
                        required
                      />

                    </div>

                    {/* EMAIL */}
                    <div>

                      <label
                        htmlFor="staff-email"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Email Address / Login ID{' '}

                        <span className="text-rose-600">
                          *
                        </span>
                      </label>

                      <div className="relative">

                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          id="staff-email"
                          type="email"
                          placeholder="staff@fitrahcare.my"
                          value={
                            formEmail
                          }
                          onChange={(
                            event
                          ) =>
                            setFormEmail(
                              event
                                .target
                                .value
                            )
                          }
                          className="
                            min-h-11
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            py-2.5
                            pl-10
                            pr-3
                            text-sm
                            text-slate-800
                            placeholder:text-slate-400
                            focus:border-emerald-600
                            focus:outline-none
                            focus:ring-4
                            focus:ring-emerald-100
                          "
                          required
                        />

                      </div>

                    </div>

                    {/* PHONE */}
                    <div>

                      <label
                        htmlFor="staff-phone"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Contact Phone
                      </label>

                      <div className="relative">

                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          id="staff-phone"
                          type="text"
                          placeholder="012-3456789"
                          value={
                            formPhone
                          }
                          onChange={(
                            event
                          ) =>
                            setFormPhone(
                              event
                                .target
                                .value
                            )
                          }
                          className="
                            min-h-11
                            w-full
                            rounded-lg
                            border
                            border-slate-300
                            bg-white
                            py-2.5
                            pl-10
                            pr-3
                            font-mono
                            text-sm
                            text-slate-800
                            focus:border-emerald-600
                            focus:outline-none
                            focus:ring-4
                            focus:ring-emerald-100
                          "
                        />

                      </div>

                    </div>

                  </div>

                </div>

                {/* ACCESS SETTINGS */}
                <div className="border-t border-slate-200 pt-5">

                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Access Settings
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">

                    {/* ROLE */}
                    <div>

                      <label
                        htmlFor="staff-role"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Assigned Role
                      </label>

                      <select
                        id="staff-role"
                        value={
                          formRole
                        }
                        onChange={(
                          event
                        ) =>
                          setFormRole(
                            event
                              .target
                              .value as UserRole
                          )
                        }
                        className="
                          min-h-11
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          px-3
                          py-2.5
                          text-sm
                          text-slate-800
                          focus:border-emerald-600
                          focus:outline-none
                          focus:ring-4
                          focus:ring-emerald-100
                        "
                      >
                        <option value="caregiver">
                          Caregiver
                        </option>

                        <option value="admin">
                          Administrator
                        </option>
                      </select>

                    </div>

                    {/* STATUS */}
                    <div>

                      <label
                        htmlFor="staff-status"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Account Status
                      </label>

                      <select
                        id="staff-status"
                        value={
                          formStatus
                        }
                        onChange={(
                          event
                        ) =>
                          setFormStatus(
                            event
                              .target
                              .value as
                              | 'Active'
                              | 'Inactive'
                          )
                        }
                        className="
                          min-h-11
                          w-full
                          rounded-lg
                          border
                          border-slate-300
                          bg-white
                          px-3
                          py-2.5
                          text-sm
                          text-slate-800
                          focus:border-emerald-600
                          focus:outline-none
                          focus:ring-4
                          focus:ring-emerald-100
                        "
                      >
                        <option value="Active">
                          Active
                        </option>

                        <option value="Inactive">
                          Inactive
                        </option>
                      </select>

                    </div>

                  </div>

                </div>

                {/* PASSWORD */}
                <div className="border-t border-slate-200 pt-5">

                  <label
                    htmlFor="staff-password"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    {editingUser
                      ? 'New Password'
                      : 'Temporary Password'}

                    {!editingUser && (
                      <span className="ml-1 text-rose-600">
                        *
                      </span>
                    )}
                  </label>

                  <div className="relative">

                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="staff-password"
                      type="password"
                      placeholder={
                        editingUser
                          ? 'Leave blank to keep current password'
                          : 'Minimum 8 characters'
                      }
                      value={
                        formPassword
                      }
                      onChange={(
                        event
                      ) =>
                        setFormPassword(
                          event
                            .target
                            .value
                        )
                      }
                      minLength={
                        formPassword
                          ? 8
                          : undefined
                      }
                      required={
                        !editingUser
                      }
                      className="
                        min-h-11
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        bg-white
                        py-2.5
                        pl-10
                        pr-3
                        text-sm
                        text-slate-800
                        placeholder:text-slate-400
                        focus:border-emerald-600
                        focus:outline-none
                        focus:ring-4
                        focus:ring-emerald-100
                      "
                    />

                  </div>

                  <p className="mt-1.5 text-[11px] leading-5 text-slate-500">

                    {editingUser
                      ? 'Leave this field empty if the staff member should keep the existing password.'
                      : 'The password must contain at least 8 characters and will be used for the first sign-in.'}

                  </p>

                </div>

                {/* ERROR */}
                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />

                    <p className="text-xs font-medium leading-5 text-rose-700">
                      {formError}
                    </p>
                  </div>
                )}

                {/* ROLE INFORMATION */}
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">

                  <div className="flex items-start gap-2.5">

                    {formRole ===
                    'admin' ? (
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    ) : (
                      <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    )}

                    <div>

                      <p className="text-xs font-semibold text-emerald-800">

                        {formRole ===
                        'admin'
                          ? 'Administrator Access'
                          : 'Caregiver Access'}

                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-emerald-700">

                        {formRole ===
                        'admin'
                          ? 'This account will have access to administrative management features, including staff management.'
                          : 'This account will have access to daily resident care, vital recording and visitor management functions.'}

                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* FORM FOOTER */}
              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">

                <button
                  type="button"
                  onClick={
                    closeStaffForm
                  }
                  disabled={
                    isSubmitting
                  }
                  className="
                    min-h-10
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-100
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting
                  }
                  className="
                    inline-flex
                    min-h-10
                    items-center
                    gap-2
                    rounded-lg
                    bg-emerald-700
                    px-5
                    py-2
                    text-xs
                    font-semibold
                    text-white
                    transition-all
                    hover:bg-emerald-800
                    hover:shadow-sm
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >

                  {editingUser ? (
                    <Edit2 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {isSubmitting
                    ? 'Saving...'
                    : editingUser
                    ? 'Save Changes'
                    : 'Create Account'}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};