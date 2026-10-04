import React, { useState } from 'react';
import { Vital, Resident, User } from '../types';
import { HealthTrendsChart } from './HealthTrendsChart';

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Droplets,
  Eye,
  HeartPulse,
  PlusCircle,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Stethoscope,
  Thermometer,
  TrendingUp,
  UserCheck,
  X,
} from 'lucide-react';

interface VitalsMonitoringViewProps {
  vitals: Vital[];
  residents: Resident[];
  users: User[];

  onOpenRecordVital: (
    residentId?: number
  ) => void;

  onSelectResident: (
    resident: Resident
  ) => void;
}

type ViewMode =
  | 'table'
  | 'trends';

type StatusFilter =
  | 'all'
  | 'critical'
  | 'normal';

type SortBy =
  | 'newest'
  | 'highest_bp'
  | 'highest_temp';

export const VitalsMonitoringView: React.FC<
  VitalsMonitoringViewProps
> = ({
  vitals,
  residents,
  users,
  onOpenRecordVital,
  onSelectResident,
}) => {
  /* =========================================================
     STATES
  ========================================================= */

  const [
    viewMode,
    setViewMode,
  ] =
    useState<ViewMode>(
      'table'
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      'all'
    );

  const [
    sortBy,
    setSortBy,
  ] =
    useState<SortBy>(
      'newest'
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState('');

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    inspectedVital,
    setInspectedVital,
  ] = useState<{
    vital: Vital;
    resident?: Resident;
    caregiver?: User;
  } | null>(null);

  const pageSize = 5;

  /* =========================================================
     HELPERS
  ========================================================= */

  const isCriticalVital = (
    vital: Vital
  ) =>
    vital.bp_systolic >
      140 ||
    vital.temperature >
      37.5;

  const getLocalDateKey = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const formatDate = (
    value: string
  ) => {
    if (!value) return '-';

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

  const formatTime = (
    value: string
  ) => {
    if (!value) return '-';

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return date.toLocaleTimeString(
      'en-MY',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const formatSelectedDate =
    (
      value: string
    ) => {
      if (!value) {
        return '';
      }

      const [
        year,
        month,
        day,
      ] = value
        .split('-')
        .map(Number);

      const date =
        new Date(
          year,
          month - 1,
          day
        );

      return date.toLocaleDateString(
        'en-MY',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      );
    };

  /* =========================================================
     METRICS
  ========================================================= */

  const totalLogs =
    vitals.length;

  const criticalLogs =
    vitals.filter(
      isCriticalVital
    );

  const normalLogsCount =
    totalLogs -
    criticalLogs.length;

  const avgSystolic =
    totalLogs > 0
      ? Math.round(
          vitals.reduce(
            (
              total,
              vital
            ) =>
              total +
              vital.bp_systolic,
            0
          ) / totalLogs
        )
      : 0;

  const avgTemperature =
    totalLogs > 0
      ? (
          vitals.reduce(
            (
              total,
              vital
            ) =>
              total +
              vital.temperature,
            0
          ) / totalLogs
        ).toFixed(1)
      : '0.0';

  const todayKey =
    getLocalDateKey(
      new Date().toISOString()
    );

  const todayCount =
    vitals.filter(
      (vital) =>
        getLocalDateKey(
          vital.created_at
        ) === todayKey
    ).length;

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredVitals =
    vitals.filter(
      (vital) => {
        const resident =
          residents.find(
            (item) =>
              item.id ===
              vital.resident_id
          );

        const caregiver =
          vital.recordedBy ||
          users.find(
            (user) =>
              user.id ===
              vital.recorded_by
          );

        const query =
          searchQuery
            .trim()
            .toLowerCase();

        const matchesSearch =
          query.length === 0 ||
          (
            resident?.name ||
            ''
          )
            .toLowerCase()
            .includes(query) ||
          (
            resident?.room_number ||
            ''
          )
            .toLowerCase()
            .includes(query) ||
          (
            caregiver?.name ||
            ''
          )
            .toLowerCase()
            .includes(query);

        const isCritical =
          isCriticalVital(
            vital
          );

        const matchesStatus =
          statusFilter ===
          'all' ||
          (statusFilter ===
            'critical' &&
            isCritical) ||
          (statusFilter ===
            'normal' &&
            !isCritical);

        const matchesDate =
          !selectedDate ||
          getLocalDateKey(
            vital.created_at
          ) === selectedDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDate
        );
      }
    );

  /* =========================================================
     SORTING
  ========================================================= */

  const sortedVitals = [
    ...filteredVitals,
  ].sort((a, b) => {
    if (
      sortBy ===
      'highest_bp'
    ) {
      return (
        b.bp_systolic -
        a.bp_systolic
      );
    }

    if (
      sortBy ===
      'highest_temp'
    ) {
      return (
        b.temperature -
        a.temperature
      );
    }

    return (
      new Date(
        b.created_at
      ).getTime() -
      new Date(
        a.created_at
      ).getTime()
    );
  });

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedVitals.length /
        pageSize
    )
  );

  const validPage =
    Math.min(
      currentPage,
      totalPages
    );

  const paginatedVitals =
    sortedVitals.slice(
      (validPage - 1) *
        pageSize,
      validPage * pageSize
    );

  const hasActiveFilters =
    searchQuery.trim()
      .length > 0 ||
    statusFilter !==
      'all' ||
    selectedDate !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedDate('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleStatusFilter = (
    filter: StatusFilter
  ) => {
    setStatusFilter(
      filter
    );

    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border border-white/5" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full border border-white/5" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Health Monitoring
              </p>

            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vitals & Alert Log
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Monitor resident
              health readings,
              review critical
              measurements and track
              vital sign records by
              date.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              onOpenRecordVital()
            }
            className="
              inline-flex min-h-11
              items-center justify-center
              gap-2 rounded-lg
              bg-white px-5 py-2.5
              text-sm font-semibold
              text-[#174c3c]
              shadow-sm
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-emerald-50
              hover:shadow-md
            "
          >
            <PlusCircle className="h-4 w-4" />

            Record New Vitals
          </button>

        </div>

      </section>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        {/* TOTAL */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-600" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Total Readings
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {totalLogs}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                All recorded
                observations
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
              <Activity className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* CRITICAL */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-rose-600" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Critical Records
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-rose-700">
                {
                  criticalLogs.length
                }
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Requires review
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* TODAY */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Today&apos;s
                Readings
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {todayCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recorded today
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* AVERAGE */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-slate-400" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Overall Average
              </p>

              <div className="mt-2 flex items-baseline gap-3">

                <span className="font-mono text-xl font-bold text-slate-900">
                  {avgSystolic ||
                    '-'}
                </span>

                <span className="text-xs text-slate-400">
                  BP
                </span>

                <span className="font-mono text-xl font-bold text-slate-900">
                  {totalLogs >
                  0
                    ? `${avgTemperature}°`
                    : '-'}
                </span>

                <span className="text-xs text-slate-400">
                  Temp
                </span>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Across all
                readings
              </p>

            </div>

            <HeartPulse className="h-5 w-5 text-slate-400" />

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTROL PANEL
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* TOP */}
        <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">

          {/* VIEW MODE */}
          <div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              View
            </p>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">

              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    'table'
                  )
                }
                className={`
                  inline-flex min-h-9
                  items-center gap-2
                  rounded-md px-4
                  text-xs font-semibold
                  transition-all
                  ${
                    viewMode ===
                    'table'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }
                `}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Records
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode(
                    'trends'
                  )
                }
                className={`
                  inline-flex min-h-9
                  items-center gap-2
                  rounded-md px-4
                  text-xs font-semibold
                  transition-all
                  ${
                    viewMode ===
                    'trends'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }
                `}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Health Trends
              </button>

            </div>

          </div>

          {/* SEARCH - RECORDS VIEW ONLY */}
          {viewMode === 'table' && (
            <div className="w-full xl:max-w-sm">

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Search
              </p>

              <div className="relative">

                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Resident, room or caregiver"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="
                    min-h-10 w-full
                    rounded-lg border
                    border-slate-300
                    bg-white py-2
                    pl-10 pr-10
                    text-xs text-slate-800
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
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

              </div>

            </div>
          )}

        </div>

        {/* SECOND FILTER ROW */}
        {viewMode ===
          'table' && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

              {/* STATUS */}
              <div>

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Health Status
                </p>

                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusFilter(
                        'all'
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      statusFilter ===
                      'all'
                        ? 'bg-[#174c3c] text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-800'
                    }`}
                  >
                    All Records{' '}
                    <span className="ml-1 opacity-70">
                      {totalLogs}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusFilter(
                        'critical'
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      statusFilter ===
                      'critical'
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />

                    Critical

                    <span className="opacity-70">
                      {
                        criticalLogs.length
                      }
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusFilter(
                        'normal'
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      statusFilter ===
                      'normal'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />

                    Normal

                    <span className="opacity-70">
                      {
                        normalLogsCount
                      }
                    </span>
                  </button>

                </div>

              </div>

              {/* DATE + SORT */}
              <div className="flex flex-col gap-3 sm:flex-row">

                {/* DATE */}
                <div>

                  <label
                    htmlFor="vitals-date"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    Record Date
                  </label>

                  <div className="relative">

                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="vitals-date"
                      type="date"
                      value={
                        selectedDate
                      }
                      onChange={(
                        event
                      ) => {
                        setSelectedDate(
                          event
                            .target
                            .value
                        );

                        setCurrentPage(
                          1
                        );
                      }}
                      className="
                        min-h-10
                        rounded-lg
                        border border-slate-300
                        bg-white
                        py-2 pl-9 pr-3
                        text-xs font-medium
                        text-slate-700
                        transition-all
                        hover:border-slate-400
                        focus:border-emerald-600
                        focus:outline-none
                        focus:ring-4
                        focus:ring-emerald-100
                      "
                    />

                  </div>

                </div>

                {/* SORT */}
                <div>

                  <label
                    htmlFor="vitals-sort"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    Sort Records
                  </label>

                  <div className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">

                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />

                    <select
                      id="vitals-sort"
                      value={sortBy}
                      onChange={(
                        event
                      ) => {
                        setSortBy(
                          event
                            .target
                            .value as SortBy
                        );

                        setCurrentPage(
                          1
                        );
                      }}
                      className="min-w-[155px] bg-transparent text-xs font-medium text-slate-700 outline-none"
                    >
                      <option value="newest">
                        Newest First
                      </option>

                      <option value="highest_bp">
                        Highest BP
                      </option>

                      <option value="highest_temp">
                        Highest Temp
                      </option>
                    </select>

                  </div>

                </div>

              </div>

            </div>

            {/* ACTIVE FILTER INFO */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">

              <div className="flex flex-wrap items-center gap-2">

                <p className="text-xs text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-900">
                    {
                      sortedVitals.length
                    }
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-900">
                    {totalLogs}
                  </span>{' '}
                  readings
                </p>

                {selectedDate && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">

                    <CalendarDays className="h-3 w-3" />

                    {formatSelectedDate(
                      selectedDate
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(
                          ''
                        );

                        setCurrentPage(
                          1
                        );
                      }}
                      aria-label="Clear date filter"
                      className="ml-0.5 rounded p-0.5 hover:bg-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>

                  </span>
                )}

              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear All Filters
                </button>
              )}

            </div>

          </div>
        )}

      </section>

      {/* =====================================================
          HEALTH TRENDS
      ====================================================== */}

      {viewMode ===
      'trends' ? (
        <HealthTrendsChart
          allResidents={
            residents
          }
          vitals={vitals}
        />
      ) : (

        /* ===================================================
           RECORDS TABLE
        ==================================================== */

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* TITLE */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Activity className="h-4 w-4 text-emerald-700" />

                <h2 className="text-sm font-bold text-slate-900">
                  Vital Sign
                  Records
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                Resident measurements
                organised by date and
                health status.
              </p>

            </div>

            <div className="flex items-center gap-2">

              {selectedDate && (
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {
                    formatSelectedDate(
                      selectedDate
                    )
                  }
                </span>
              )}

              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {
                  sortedVitals.length
                }{' '}
                record
                {sortedVitals.length !==
                1
                  ? 's'
                  : ''}
              </span>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px] text-left">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">

                  <th className="px-5 py-3.5">
                    Resident
                  </th>

                  <th className="px-4 py-3.5">
                    Blood Pressure
                  </th>

                  <th className="px-4 py-3.5">
                    Temperature
                  </th>

                  <th className="px-4 py-3.5">
                    Pulse / SpO₂
                  </th>

                  <th className="px-4 py-3.5">
                    Recorded By
                  </th>

                  <th className="px-4 py-3.5">
                    Date & Time
                  </th>

                  <th className="px-4 py-3.5">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {paginatedVitals.length ===
                0 ? (
                  <tr>

                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Activity className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-800">
                        No vital records
                        found
                      </p>

                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                        No records match
                        the selected date,
                        status or search
                        criteria.
                      </p>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={
                            clearFilters
                          }
                          className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Reset Filters
                        </button>
                      )}

                    </td>

                  </tr>
                ) : (
                  paginatedVitals.map(
                    (vital) => {
                      const resident =
                        residents.find(
                          (item) =>
                            item.id ===
                            vital.resident_id
                        );

                      const caregiver =
                        vital.recordedBy ||
                        users.find(
                          (user) =>
                            user.id ===
                            vital.recorded_by
                        );

                      const isHighBP =
                        vital.bp_systolic >
                        140;

                      const isHighTemp =
                        vital.temperature >
                        37.5;

                      const isCritical =
                        isHighBP ||
                        isHighTemp;

                      return (
                        <tr
                          key={
                            vital.id
                          }
                          className={`
                            group relative
                            transition-all
                            duration-150
                            ${
                              isCritical
                                ? 'bg-rose-50/20 hover:bg-rose-50/50'
                                : 'hover:bg-emerald-50/30'
                            }
                          `}
                        >

                          {/* RESIDENT */}
                          <td className={`border-l-[3px] px-5 py-4 ${
                            isCritical
                              ? 'border-l-rose-500'
                              : 'border-l-transparent'
                          }`}>

                            {resident ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectResident(
                                    resident
                                  )
                                }
                                className="group/resident text-left"
                              >

                                <div className="flex items-center gap-3">

                                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                    isCritical
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100'
                                  }`}>
                                    {resident.name
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div>

                                    <p className="text-sm font-semibold text-slate-900 transition-colors group-hover/resident:text-emerald-800">
                                      {
                                        resident.name
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Room{' '}
                                      {
                                        resident.room_number
                                      }
                                    </p>

                                  </div>

                                </div>

                              </button>
                            ) : (
                              <span className="text-sm font-medium text-slate-700">
                                Resident #
                                {
                                  vital.resident_id
                                }
                              </span>
                            )}

                          </td>

                          {/* BP */}
                          <td className="px-4 py-4">

                            <p
                              className={`font-mono text-sm font-bold ${
                                isHighBP
                                  ? 'text-rose-700'
                                  : 'text-slate-800'
                              }`}
                            >
                              {
                                vital.bp_systolic
                              }
                              /
                              {
                                vital.bp_diastolic
                              }
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                isHighBP
                                  ? 'font-semibold text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isHighBP
                                ? 'Above threshold'
                                : 'mmHg'}
                            </p>

                          </td>

                          {/* TEMP */}
                          <td className="px-4 py-4">

                            <div className="flex items-center gap-1.5">

                              <Thermometer
                                className={`h-3.5 w-3.5 ${
                                  isHighTemp
                                    ? 'text-rose-600'
                                    : 'text-slate-400'
                                }`}
                              />

                              <span
                                className={`font-mono text-sm font-bold ${
                                  isHighTemp
                                    ? 'text-rose-700'
                                    : 'text-slate-800'
                                }`}
                              >
                                {
                                  vital.temperature
                                }
                                °C
                              </span>

                            </div>

                            {isHighTemp ? (
                              <p className="mt-1 text-[10px] font-semibold text-rose-600">
                                Above
                                threshold
                              </p>
                            ) : (
                              <p className="mt-1 text-[10px] text-slate-400">
                                Temperature
                              </p>
                            )}

                          </td>

                          {/* PULSE / SPO2 */}
                          <td className="px-4 py-4">

                            <div className="space-y-1.5">

                              <div className="flex items-center gap-1.5">

                                <HeartPulse className="h-3.5 w-3.5 text-slate-400" />

                                <span className="font-mono text-xs font-medium text-slate-700">
                                  {
                                    vital.heart_rate
                                  }{' '}
                                  bpm
                                </span>

                              </div>

                              <div className="flex items-center gap-1.5">

                                <Droplets className="h-3.5 w-3.5 text-slate-400" />

                                <span className="font-mono text-xs font-medium text-slate-700">
                                  {
                                    vital.oxygen_level
                                  }
                                  % SpO₂
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* CAREGIVER */}
                          <td className="px-4 py-4">

                            <div className="flex items-center gap-2">

                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <UserCheck className="h-3.5 w-3.5" />
                              </div>

                              <span className="max-w-[150px] text-xs font-medium leading-5 text-slate-700">
                                {caregiver?.name ||
                                  'Caregiver Staff'}
                              </span>

                            </div>

                          </td>

                          {/* DATE */}
                          <td className="px-4 py-4">

                            <div>

                              <div className="flex items-center gap-1.5">

                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                                <span className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                  {formatDate(
                                    vital.created_at
                                  )}
                                </span>

                              </div>

                              <div className="mt-1 flex items-center gap-1.5 pl-5">

                                <Clock3 className="h-3 w-3 text-slate-300" />

                                <span className="text-[11px] text-slate-500">
                                  {formatTime(
                                    vital.created_at
                                  )}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-4">

                            {isCritical ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setInspectedVital(
                                    {
                                      vital,
                                      resident,
                                      caregiver,
                                    }
                                  )
                                }
                                className="
                                  inline-flex items-center
                                  gap-1.5 rounded-md
                                  border border-rose-200
                                  bg-rose-50
                                  px-2.5 py-1.5
                                  text-xs font-semibold
                                  text-rose-700
                                  transition-all
                                  hover:border-rose-300
                                  hover:bg-rose-100
                                "
                                title="View alert details"
                              >
                                <ShieldAlert className="h-3.5 w-3.5" />

                                Review Required
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">

                                <CheckCircle2 className="h-3.5 w-3.5" />

                                Normal

                              </span>
                            )}

                          </td>

                          {/* ACTION */}
                          <td className="px-5 py-4">

                            <div className="flex items-center justify-end gap-2">

                              {resident && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelectResident(
                                      resident
                                    )
                                  }
                                  className="
                                    inline-flex min-h-9
                                    items-center gap-1.5
                                    rounded-lg border
                                    border-slate-300
                                    bg-white px-3 py-2
                                    text-xs font-semibold
                                    text-slate-700
                                    transition-all
                                    hover:border-emerald-300
                                    hover:bg-emerald-50
                                    hover:text-emerald-800
                                  "
                                  title="View resident profile"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Profile
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  onOpenRecordVital(
                                    vital.resident_id
                                  )
                                }
                                className="
                                  inline-flex min-h-9
                                  items-center gap-1.5
                                  rounded-lg
                                  bg-emerald-700
                                  px-3 py-2
                                  text-xs font-semibold
                                  text-white
                                  transition-all
                                  hover:-translate-y-px
                                  hover:bg-emerald-800
                                  hover:shadow-sm
                                "
                                title="Record another vital reading"
                              >
                                <PlusCircle className="h-3.5 w-3.5" />

                                Re-check
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              PAGINATION
          ================================================== */}

          {sortedVitals.length >
            0 && (
            <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

              <p>
                Showing{' '}

                <strong className="text-slate-800">
                  {(validPage -
                    1) *
                    pageSize +
                    1}
                </strong>

                {' '}to{' '}

                <strong className="text-slate-800">
                  {Math.min(
                    validPage *
                      pageSize,
                    sortedVitals.length
                  )}
                </strong>

                {' '}of{' '}

                <strong className="text-slate-800">
                  {
                    sortedVitals.length
                  }
                </strong>

                {' '}records
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    validPage ===
                    1
                  }
                  className="
                    inline-flex min-h-9
                    items-center gap-1
                    rounded-lg border
                    border-slate-300
                    bg-white px-3 py-2
                    font-semibold
                    text-slate-700
                    transition-all
                    hover:border-emerald-300
                    hover:bg-emerald-50
                    hover:text-emerald-800
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <ChevronLeft className="h-4 w-4" />

                  Previous
                </button>

                <span className="min-w-[80px] text-center font-semibold text-slate-700">
                  {validPage} /{' '}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    validPage ===
                    totalPages
                  }
                  className="
                    inline-flex min-h-9
                    items-center gap-1
                    rounded-lg border
                    border-slate-300
                    bg-white px-3 py-2
                    font-semibold
                    text-slate-700
                    transition-all
                    hover:border-emerald-300
                    hover:bg-emerald-50
                    hover:text-emerald-800
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next

                  <ChevronRight className="h-4 w-4" />
                </button>

              </div>

            </footer>
          )}

        </section>
      )}

      {/* =====================================================
          ALERT DETAIL MODAL
      ====================================================== */}

      {inspectedVital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                    Health Alert
                  </p>

                  <h3 className="mt-0.5 font-bold text-slate-900">
                    Critical Reading
                    Details
                  </h3>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setInspectedVital(
                    null
                  )
                }
                aria-label="Close alert details"
                className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* BODY */}
            <div className="space-y-5 p-5">

              {/* RESIDENT */}
              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Resident
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {inspectedVital
                      .resident
                      ?.name ||
                      'Resident'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Room{' '}
                    {inspectedVital
                      .resident
                      ?.room_number ||
                      '-'}
                  </p>

                </div>

                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5" />

                  Review Required
                </span>

              </div>

              {/* READING */}
              <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-4">

                <div
                  className={`border-b border-r border-slate-200 p-4 sm:border-b-0 ${
                    inspectedVital
                      .vital
                      .bp_systolic >
                    140
                      ? 'bg-rose-50'
                      : 'bg-white'
                  }`}
                >

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    BP
                  </p>

                  <p
                    className={`mt-1 font-mono text-sm font-bold ${
                      inspectedVital
                        .vital
                        .bp_systolic >
                      140
                        ? 'text-rose-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {
                      inspectedVital
                        .vital
                        .bp_systolic
                    }
                    /
                    {
                      inspectedVital
                        .vital
                        .bp_diastolic
                    }
                  </p>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    mmHg
                  </p>

                </div>

                <div
                  className={`border-b border-slate-200 p-4 sm:border-b-0 sm:border-r ${
                    inspectedVital
                      .vital
                      .temperature >
                    37.5
                      ? 'bg-rose-50'
                      : 'bg-white'
                  }`}
                >

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Temperature
                  </p>

                  <p
                    className={`mt-1 font-mono text-sm font-bold ${
                      inspectedVital
                        .vital
                        .temperature >
                      37.5
                        ? 'text-rose-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {
                      inspectedVital
                        .vital
                        .temperature
                    }
                    °C
                  </p>

                </div>

                <div className="border-r border-slate-200 p-4">

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Pulse
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {
                      inspectedVital
                        .vital
                        .heart_rate
                    }
                  </p>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    bpm
                  </p>

                </div>

                <div className="p-4">

                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    SpO₂
                  </p>

                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {
                      inspectedVital
                        .vital
                        .oxygen_level
                    }
                    %
                  </p>

                </div>

              </div>

              {/* INFO */}
              <div className="rounded-lg border border-slate-200 bg-slate-50">

                <div className="flex items-center justify-between gap-4 px-4 py-3">

                  <span className="text-xs text-slate-500">
                    Recorded by
                  </span>

                  <span className="text-right text-xs font-semibold text-slate-900">
                    {inspectedVital
                      .caregiver
                      ?.name ||
                      'Caregiver Staff'}
                  </span>

                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3">

                  <span className="text-xs text-slate-500">
                    Date
                  </span>

                  <span className="text-right text-xs font-semibold text-slate-900">
                    {formatDate(
                      inspectedVital
                        .vital
                        .created_at
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3">

                  <span className="text-xs text-slate-500">
                    Time
                  </span>

                  <span className="text-right text-xs font-semibold text-slate-900">
                    {formatTime(
                      inspectedVital
                        .vital
                        .created_at
                    )}
                  </span>

                </div>

              </div>

              {/* NOTE */}
              <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">

                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />

                <div>

                  <p className="text-sm font-semibold text-rose-800">
                    Clinical review
                    required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-rose-700">
                    This reading
                    exceeded the
                    configured alert
                    threshold. GoldenCare
                    identifies critical
                    readings when
                    systolic blood
                    pressure is above
                    140 mmHg or body
                    temperature is above
                    37.5°C.
                  </p>

                </div>

              </div>

            </div>

            {/* FOOTER */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setInspectedVital(
                    null
                  )
                }
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              {inspectedVital.resident && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectResident(
                      inspectedVital.resident!
                    );

                    setInspectedVital(
                      null
                    );
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  <Eye className="h-4 w-4" />

                  View Profile
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenRecordVital(
                    inspectedVital
                      .vital
                      .resident_id
                  );

                  setInspectedVital(
                    null
                  );
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
              >
                <Stethoscope className="h-4 w-4" />

                Re-check Vitals
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};