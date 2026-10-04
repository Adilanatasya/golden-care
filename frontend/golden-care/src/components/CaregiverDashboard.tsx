import React, { useState } from 'react';
import { Resident, Vital, User } from '../types';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';

interface CaregiverDashboardProps {
  currentUser: User;
  residents: Resident[];
  vitals: Vital[];
  onOpenRecordVital: () => void;
  onNavigate: (view: any) => void;
  onOpenAddResident?: () => void;
  onSelectResident?: (resident: Resident) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  currentUser,
  residents,
  vitals,
  onOpenRecordVital,
  onNavigate,
  onOpenAddResident,
  onSelectResident,
}) => {
  /* =========================================================
     EXISTING DATA / LOGIC
  ========================================================= */

  const myVitals = vitals.filter(
    (vital) => vital.recorded_by === currentUser.id
  );

  const criticalVitals = vitals.filter(
    (vital) =>
      vital.bp_systolic > 140 ||
      vital.temperature > 37.5
  );

  /* =========================================================
     SEARCH + PAGINATION
  ========================================================= */

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const pageSize = 5;

  const filteredResidents = residents.filter(
    (resident) =>
      resident.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      resident.room_number
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      resident.ic_number.includes(searchQuery)
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResidents.length / pageSize)
  );

  const validCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedResidents =
    filteredResidents.slice(
      (validCurrentPage - 1) * pageSize,
      validCurrentPage * pageSize
    );

  /* =========================================================
     RESIDENTS REQUIRING ATTENTION
  ========================================================= */

  const residentsRequiringAttention =
    new Set(
      criticalVitals.map(
        (vital) => vital.resident_id
      )
    ).size;

  /* =========================================================
     LATEST VITAL HELPER
  ========================================================= */

  const getLatestVital = (
    residentId: number
  ): Vital | undefined => {
    return [...vitals]
      .filter(
        (vital) =>
          vital.resident_id === residentId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0];
  };

  const formatDateTime = (
    value: string
  ) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          CAREGIVER HEADER
      ====================================================== */}
      <section className="rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              Caregiver Workspace
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Welcome, {currentUser.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Review resident health status,
              record vital signs and manage
              daily care activities.
            </p>

          </div>

          <div className="flex flex-wrap gap-2.5">

            <button
              type="button"
              onClick={() =>
                onNavigate('visitor-logs')
              }
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              <Users className="h-4 w-4" />
              Visitor Management
            </button>

            <button
              type="button"
              onClick={onOpenRecordVital}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#174c3c] transition-colors hover:bg-emerald-50"
            >
              <Stethoscope className="h-4 w-4" />
              Record Vital Signs
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          CARE SUMMARY
      ====================================================== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Residents */}
        <button
          type="button"
          onClick={() =>
            onNavigate('residents-list')
          }
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Monitored Residents
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {residents.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <UserRound className="h-5 w-5" />
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

            <span className="text-xs text-slate-500">
              Resident records
            </span>

            <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-emerald-700" />

          </div>
        </button>

        {/* Personal vital logs */}
        <button
          type="button"
          onClick={() =>
            onNavigate('vitals-history')
          }
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Vitals Logged By You
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {myVitals.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Activity className="h-5 w-5" />
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

            <span className="text-xs text-slate-500">
              Recorded health observations
            </span>

            <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-emerald-700" />

          </div>
        </button>

        {/* Attention */}
        <button
          type="button"
          onClick={() =>
            onNavigate('vitals-history')
          }
          className="group rounded-xl border border-rose-200 bg-white p-5 text-left shadow-sm transition hover:border-rose-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Requiring Attention
              </p>

              <p className="mt-2 text-3xl font-bold text-rose-700">
                {residentsRequiringAttention}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-rose-100 pt-3">

            <span className="text-xs text-slate-500">
              Residents with critical readings
            </span>

            <ArrowRight className="h-3.5 w-3.5 text-rose-400" />

          </div>
        </button>

      </section>

      {/* =====================================================
          RESIDENT MONITORING
      ====================================================== */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Activity className="h-4 w-4 text-emerald-700" />

              <h2 className="text-sm font-bold text-slate-900">
                Resident Health Overview
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Review each resident's latest
              recorded vital signs and health
              status.
            </p>

          </div>

          {/* Search */}
          <div className="relative w-full lg:w-72">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchQuery}
              placeholder="Search resident, room or IC..."
              onChange={(event) => {
                setSearchQuery(
                  event.target.value
                );
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

          </div>

        </div>

        {/* ===================================================
            RESIDENT TABLE
        ==================================================== */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] text-left">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">

                <th className="px-5 py-3">
                  Resident
                </th>

                <th className="px-4 py-3">
                  Latest BP
                </th>

                <th className="px-4 py-3">
                  Temperature
                </th>

                <th className="px-4 py-3">
                  SpO₂
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  Last Recorded
                </th>

                <th className="px-5 py-3 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {paginatedResidents.length >
              0 ? (
                paginatedResidents.map(
                  (resident) => {
                    const lastVital =
                      getLatestVital(
                        resident.id
                      );

                    const hasHighBP =
                      Boolean(
                        lastVital &&
                          lastVital.bp_systolic >
                            140
                      );

                    const hasHighTemp =
                      Boolean(
                        lastVital &&
                          lastVital.temperature >
                            37.5
                      );

                    const isCritical =
                      hasHighBP ||
                      hasHighTemp;

                    return (
                      <tr
                        key={resident.id}
                        className="transition-colors hover:bg-slate-50"
                      >

                        {/* Resident */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {resident.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="font-semibold text-slate-900">
                                {resident.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                Room{' '}
                                {
                                  resident.room_number
                                }
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* BP */}
                        <td className="px-4 py-4">

                          {lastVital ? (
                            <span
                              className={`font-mono text-sm font-semibold ${
                                hasHighBP
                                  ? 'text-rose-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {
                                lastVital.bp_systolic
                              }
                              /
                              {
                                lastVital.bp_diastolic
                              }
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              No record
                            </span>
                          )}

                        </td>

                        {/* Temperature */}
                        <td className="px-4 py-4">

                          {lastVital ? (
                            <span
                              className={`font-mono text-sm font-semibold ${
                                hasHighTemp
                                  ? 'text-rose-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {
                                lastVital.temperature
                              }
                              °C
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              -
                            </span>
                          )}

                        </td>

                        {/* SpO2 */}
                        <td className="px-4 py-4">

                          {lastVital ? (
                            <span className="font-mono text-sm font-medium text-slate-700">
                              {
                                lastVital.oxygen_level
                              }
                              %
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              -
                            </span>
                          )}

                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">

                          {!lastVital ? (
                            <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                              No Data
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">

                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />

                              Critical

                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">

                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

                              Normal

                            </span>
                          )}

                        </td>

                        {/* Last recorded */}
                        <td className="px-4 py-4">

                          <div className="flex items-center gap-1.5 text-xs text-slate-500">

                            <Clock3 className="h-3.5 w-3.5 shrink-0" />

                            {lastVital
                              ? formatDateTime(
                                  lastVital.created_at
                                )
                              : '-'}

                          </div>

                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  onSelectResident
                                ) {
                                  onSelectResident(
                                    resident
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={
                                onOpenRecordVital
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                            >
                              <Activity className="h-3.5 w-3.5" />
                              Record
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>

                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center"
                  >

                    <Search className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      No residents found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      No resident matches "
                      {searchQuery}".
                    </p>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            TABLE FOOTER + PAGINATION
        ==================================================== */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-slate-500">

            Showing{' '}

            <span className="font-semibold text-slate-700">
              {filteredResidents.length ===
              0
                ? 0
                : (validCurrentPage - 1) *
                    pageSize +
                  1}
            </span>

            {' '}to{' '}

            <span className="font-semibold text-slate-700">
              {Math.min(
                validCurrentPage *
                  pageSize,
                filteredResidents.length
              )}
            </span>

            {' '}of{' '}

            <span className="font-semibold text-slate-700">
              {filteredResidents.length}
            </span>

            {' '}residents

          </p>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              disabled={
                validCurrentPage === 1
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-[82px] text-center text-xs font-semibold text-slate-600">
              Page {validCurrentPage} of{' '}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    totalPages,
                    page + 1
                  )
                )
              }
              disabled={
                validCurrentPage >=
                totalPages
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          CRITICAL ALERT STRIP
      ====================================================== */}
      {criticalVitals.length > 0 && (
        <section className="rounded-xl border border-rose-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>

              <div>

                <p className="text-sm font-semibold text-slate-900">
                  Critical health readings require attention
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {criticalVitals.length}{' '}
                  critical vital record
                  {criticalVitals.length !==
                  1
                    ? 's'
                    : ''}{' '}
                  detected from resident
                  monitoring.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'vitals-history'
                )
              }
              className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-rose-700 transition hover:text-rose-900 sm:self-auto"
            >
              Review Alerts
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

          </div>

        </section>
      )}

    </div>
  );
};