import React, { useState } from 'react';
import { Visitor, Resident } from '../types';
import { ApiError } from '../services/api';
import { VisitorInput } from '../services/visitorService';

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  LogIn,
  LogOut,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react';

/* =========================================================
   PROPS
========================================================= */

interface VisitorLogsViewProps {
  visitors: Visitor[];
  residents: Resident[];

  onAddVisitor: (
    visitor: VisitorInput
  ) => Promise<void>;

  onCheckInVisitor: (
    visitorId: number
  ) => Promise<void>;

  onCheckOutVisitor: (
    visitorId: number
  ) => Promise<void>;
}

type StatusFilter =
  | 'all'
  | 'Checked In'
  | 'Checked Out';

/* =========================================================
   DATE HELPERS
========================================================= */

const getLocalDateTimeInput =
  (): string => {
    const now = new Date();

    const localTime =
      new Date(
        now.getTime() -
          now.getTimezoneOffset() *
            60_000
      );

    return localTime
      .toISOString()
      .substring(0, 16);
  };

const getTodayDateInput =
  (): string => {
    const now = new Date();

    const localDate =
      new Date(
        now.getTime() -
          now.getTimezoneOffset() *
            60_000
      );

    return localDate
      .toISOString()
      .substring(0, 10);
  };

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return '-';
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

const formatTime = (
  value?: string
): string => {
  if (!value) {
    return '-';
  }

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

const getDateKey = (
  value?: string
): string => {
  if (!value) {
    return '';
  }

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

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
};

const formatSelectedDate = (
  value: string
): string => {
  if (!value) {
    return 'All Dates';
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
   COMPONENT
========================================================= */

export const VisitorLogsView: React.FC<
  VisitorLogsViewProps
> = ({
  visitors,
  residents,
  onAddVisitor,
  onCheckInVisitor,
  onCheckOutVisitor,
}) => {
  /* =======================================================
     FILTER STATE
  ======================================================= */

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

  /*
    Default date = TODAY
  */
  const [
    selectedDate,
    setSelectedDate,
  ] = useState<string>(
    getTodayDateInput()
  );

  /* =======================================================
     MODAL STATE
  ======================================================= */

  const [
    isAddOpen,
    setIsAddOpen,
  ] = useState(false);

  const [
    viewingVisitor,
    setViewingVisitor,
  ] =
    useState<Visitor | null>(
      null
    );

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [
    residentId,
    setResidentId,
  ] = useState<number>(
    residents[0]?.id || 1
  );

  const [
    visitorName,
    setVisitorName,
  ] = useState('');

  const [
    relationship,
    setRelationship,
  ] = useState('Son');

  const [
    contactPhone,
    setContactPhone,
  ] = useState('');

  const [
    checkInTime,
    setCheckInTime,
  ] = useState(
    getLocalDateTimeInput()
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    updatingVisitorId,
    setUpdatingVisitorId,
  ] =
    useState<number | null>(
      null
    );

  /* =======================================================
     OPEN ADD VISITOR
  ======================================================= */

  const openAddModal = () => {
    if (
      residents.length === 0
    ) {
      alert(
        'Resident data must finish loading first.'
      );

      return;
    }

    setResidentId(
      residents[0].id
    );

    setVisitorName('');

    setContactPhone('');

    setRelationship(
      'Son'
    );

    setCheckInTime(
      getLocalDateTimeInput()
    );

    setFormError('');

    setIsAddOpen(true);
  };

  /* =======================================================
     ADD VISITOR
  ======================================================= */

  const handleAddSubmit =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      if (
        !visitorName.trim()
      ) {
        return;
      }

      setFormError('');

      setIsSubmitting(true);

      try {
        await onAddVisitor({
          resident_id:
            Number(
              residentId
            ),

          visitor_name:
            visitorName.trim(),

          relationship,

          contact_phone:
            contactPhone.trim(),

            check_in:
    new Date(
      checkInTime
    ).toISOString(),

          status:
            'Checked In',
        });

        setIsAddOpen(
          false
        );

        setVisitorName('');

        setContactPhone('');

        setRelationship(
          'Son'
        );

        /*
          After registering a new visitor,
          return the table to Today.
        */
        setSelectedDate(
          getTodayDateInput()
        );

        setStatusFilter(
          'all'
        );
      } catch (error) {
        setFormError(
          error instanceof ApiError
            ? error.message
            : 'Unable to save the visitor. Please try again.'
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =======================================================
     CHECK OUT
  ======================================================= */

  const handleCheckOut =
    async (
      visitorId: number
    ) => {
      setUpdatingVisitorId(
        visitorId
      );

      try {
        await onCheckOutVisitor(
          visitorId
        );
      } catch (error) {
        alert(
          error instanceof ApiError
            ? error.message
            : 'Unable to check out visitor.'
        );
      } finally {
        setUpdatingVisitorId(
          null
        );
      }
    };

  /* =======================================================
     CHECK IN
  ======================================================= */

  const handleCheckIn =
    async (
      visitorId: number
    ) => {
      setUpdatingVisitorId(
        visitorId
      );

      try {
        await onCheckInVisitor(
          visitorId
        );
      } catch (error) {
        alert(
          error instanceof ApiError
            ? error.message
            : 'Unable to check in visitor.'
        );
      } finally {
        setUpdatingVisitorId(
          null
        );
      }
    };

  /* =======================================================
     COUNTS
  ======================================================= */

  const checkedInCount =
    visitors.filter(
      (visitor) =>
        visitor.status ===
        'Checked In'
    ).length;

  const checkedOutCount =
    visitors.filter(
      (visitor) =>
        visitor.status ===
        'Checked Out'
    ).length;

  const todayKey =
    getTodayDateInput();

  const todayVisitorCount =
    visitors.filter(
      (visitor) =>
        getDateKey(
          visitor.check_in ||
            visitor.visit_date
        ) === todayKey
    ).length;

  /* =======================================================
     FILTER VISITORS
  ======================================================= */

  const filteredVisitors =
    visitors.filter(
      (visitor) => {
        const resident =
          visitor.resident ||
          residents.find(
            (item) =>
              item.id ===
              visitor.resident_id
          );

        const query =
          searchQuery
            .trim()
            .toLowerCase();

        const matchesSearch =
          query.length ===
            0 ||
          visitor.visitor_name
            .toLowerCase()
            .includes(
              query
            ) ||
          (
            resident?.name ||
            ''
          )
            .toLowerCase()
            .includes(
              query
            ) ||
          (
            visitor.contact_phone ||
            ''
          ).includes(
            query
          );

        const matchesStatus =
          statusFilter ===
            'all' ||
          visitor.status ===
            statusFilter;

        const visitorDate =
          getDateKey(
            visitor.check_in ||
              visitor.visit_date
          );

        const matchesDate =
          selectedDate ===
            '' ||
          visitorDate ===
            selectedDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDate
        );
      }
    );

  /* =======================================================
     ACTIVE FILTER
  ======================================================= */

  const isTodaySelected =
    selectedDate ===
    todayKey;

  const hasFilterChanges =
    searchQuery.trim()
      .length > 0 ||
    statusFilter !==
      'all' ||
    selectedDate !==
      todayKey;

  const resetToToday = () => {
    setSearchQuery('');

    setStatusFilter(
      'all'
    );

    setSelectedDate(
      getTodayDateInput()
    );
  };

  /* =======================================================
     VIEW
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/5" />

        <div className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 rounded-full border border-white/5" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Visitor Management
              </p>

            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Visitor Records
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Manage family and
              guest visits, monitor
              visitors currently on
              the premises and review
              previous visitation
              records.
            </p>

          </div>

          <button
            id="add-visitor-button"
            type="button"
            onClick={
              openAddModal
            }
            className="
              inline-flex min-h-11
              items-center
              justify-center gap-2
              rounded-lg bg-white
              px-5 py-2.5
              text-sm font-semibold
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

            Register Visitor
          </button>

        </div>

      </section>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {/* TOTAL */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-700" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Total Records
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {visitors.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                All visitor
                records
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
              <Users className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* ON PREMISES */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-500" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                On Premises
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                {checkedInCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Currently
                checked in
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <LogIn className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* CHECKED OUT */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-slate-400" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Checked Out
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {checkedOutCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Completed visits
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <LogOut className="h-5 w-5" />
            </div>

          </div>

        </div>

        {/* TODAY */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

          <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-500">
                Today&apos;s Visits
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {todayVisitorCount}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registered today
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          SEARCH & FILTER PANEL
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="p-5">

          <div className="grid gap-5 xl:grid-cols-[minmax(260px,1fr)_auto_auto] xl:items-end">

            {/* SEARCH */}
            <div>

              <label
                htmlFor="search-visitors-input"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
              >
                Search Visitor
              </label>

              <div className="relative">

                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="search-visitors-input"
                  type="text"
                  placeholder="Visitor, resident or phone number"
                  value={
                    searchQuery
                  }
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
                    w-full rounded-lg
                    border
                    border-slate-300
                    bg-white
                    py-2.5
                    pl-10 pr-10
                    text-sm
                    text-slate-800
                    transition-all
                    placeholder:text-slate-400
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
                    aria-label="Clear search"
                    onClick={() =>
                      setSearchQuery(
                        ''
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

              </div>

            </div>

            {/* DATE */}
            <div>

              <label
                htmlFor="visitor-date-filter"
                className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
              >
                Visit Date
              </label>

              <div className="flex flex-wrap items-center gap-2">

                <div className="relative">

                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="visitor-date-filter"
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedDate(
                        event.target
                          .value
                      )
                    }
                    className="
                      min-h-11
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      py-2.5
                      pl-9 pr-3
                      text-xs
                      font-medium
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

                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      getTodayDateInput()
                    )
                  }
                  className={`
                    min-h-11
                    rounded-lg
                    border px-3
                    text-xs
                    font-semibold
                    transition-all
                    ${
                      isTodaySelected
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
                    }
                  `}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      ''
                    )
                  }
                  className={`
                    min-h-11
                    rounded-lg
                    border px-3
                    text-xs
                    font-semibold
                    transition-all
                    ${
                      selectedDate ===
                      ''
                        ? 'border-[#174c3c] bg-[#174c3c] text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  All Dates
                </button>

              </div>

            </div>

            {/* STATUS */}
            <div>

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Visit Status
              </p>

              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      'all'
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
                      statusFilter ===
                      'all'
                        ? 'bg-[#174c3c] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }
                  `}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      'Checked In'
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
                      statusFilter ===
                      'Checked In'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-emerald-700 hover:bg-white'
                    }
                  `}
                >
                  On Premises
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      'Checked Out'
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
                      statusFilter ===
                      'Checked Out'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white'
                    }
                  `}
                >
                  Checked Out
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* FILTER SUMMARY */}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex flex-wrap items-center gap-2">

            <p className="text-xs text-slate-500">
              Showing{' '}

              <span className="font-semibold text-slate-900">
                {
                  filteredVisitors.length
                }
              </span>

              {' '}visitor
              {filteredVisitors.length !==
              1
                ? 's'
                : ''}
            </p>

            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                isTodaySelected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : selectedDate ===
                    ''
                  ? 'border-slate-200 bg-white text-slate-600'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              <CalendarDays className="h-3 w-3" />

              {isTodaySelected
                ? 'Today'
                : selectedDate
                ? formatSelectedDate(
                    selectedDate
                  )
                : 'All Dates'}
            </span>

          </div>

          {hasFilterChanges && (
            <button
              type="button"
              onClick={
                resetToToday
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
            >
              <X className="h-3.5 w-3.5" />

              Reset to Today
            </button>
          )}

        </div>

      </section>

      {/* =====================================================
          VISITOR TABLE
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Users className="h-4 w-4 text-emerald-700" />

              <h2 className="text-sm font-bold text-slate-900">
                Visitor Log
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Check-in and
              check-out activity
              recorded for
              residents.
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {
                filteredVisitors.length
              }{' '}
              record
              {filteredVisitors.length !==
              1
                ? 's'
                : ''}
            </span>

            {isTodaySelected && (
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Today
              </span>
            )}

          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px] text-left">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">

                <th className="px-5 py-3.5">
                  Visitor
                </th>

                <th className="px-4 py-3.5">
                  Resident
                </th>

                <th className="px-4 py-3.5">
                  Contact
                </th>

                <th className="px-4 py-3.5">
                  Check-In
                </th>

                <th className="px-4 py-3.5">
                  Check-Out
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

              {filteredVisitors.length >
              0 ? (
                filteredVisitors.map(
                  (visitor) => {
                    const resident =
                      visitor.resident ||
                      residents.find(
                        (item) =>
                          item.id ===
                          visitor.resident_id
                      );

                    const isCheckedIn =
                      visitor.status ===
                      'Checked In';

                    const checkIn =
                      visitor.check_in ||
                      visitor.visit_date;

                    return (
                      <tr
                        key={
                          visitor.id
                        }
                        className={`
                          group
                          transition-colors
                          duration-150
                          ${
                            isCheckedIn
                              ? 'hover:bg-emerald-50/40'
                              : 'hover:bg-slate-50'
                          }
                        `}
                      >

                        {/* VISITOR */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className={`
                                flex h-9 w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                text-xs
                                font-bold
                                transition-colors
                                ${
                                  isCheckedIn
                                    ? 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600'
                                }
                              `}
                            >
                              {visitor.visitor_name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-slate-900">
                                {
                                  visitor.visitor_name
                                }
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {
                                  visitor.relationship
                                }
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* RESIDENT */}
                        <td className="px-4 py-4">

                          <p className="text-sm font-medium text-slate-800">
                            {resident?.name ||
                              'Resident'}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Room{' '}
                            {resident?.room_number ||
                              'N/A'}
                          </p>

                        </td>

                        {/* CONTACT */}
                        <td className="px-4 py-4">

                          <span className="font-mono text-xs text-slate-600">
                            {visitor.contact_phone ||
                              'Not recorded'}
                          </span>

                        </td>

                        {/* CHECK-IN */}
                        <td className="px-4 py-4">

                          <div>

                            <div className="flex items-center gap-1.5">

                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                              <span className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                {formatDate(
                                  checkIn
                                )}
                              </span>

                            </div>

                            <div className="mt-1 flex items-center gap-1.5 pl-5">

                              <Clock3 className="h-3 w-3 text-slate-300" />

                              <span className="text-[11px] text-slate-500">
                                {formatTime(
                                  checkIn
                                )}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* CHECK-OUT */}
                        <td className="px-4 py-4">

                          {visitor.check_out ? (
                            <div>

                              <div className="flex items-center gap-1.5">

                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                                <span className="whitespace-nowrap text-xs font-semibold text-slate-700">
                                  {formatDate(
                                    visitor.check_out
                                  )}
                                </span>

                              </div>

                              <div className="mt-1 flex items-center gap-1.5 pl-5">

                                <Clock3 className="h-3 w-3 text-slate-300" />

                                <span className="text-[11px] text-slate-500">
                                  {formatTime(
                                    visitor.check_out
                                  )}
                                </span>

                              </div>

                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">

                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                              On premises
                            </span>
                          )}

                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-4">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-md
                              border
                              px-2.5
                              py-1.5
                              text-xs
                              font-semibold
                              ${
                                isCheckedIn
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-600'
                              }
                            `}
                          >

                            <span
                              className={`
                                h-1.5
                                w-1.5
                                rounded-full
                                ${
                                  isCheckedIn
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-400'
                                }
                              `}
                            />

                            {visitor.status ||
                              'Checked Out'}

                          </span>

                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewingVisitor(
                                  visitor
                                )
                              }
                              className="
                                inline-flex
                                min-h-9
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-slate-300
                                bg-white
                                px-3 py-2
                                text-xs
                                font-semibold
                                text-slate-700
                                transition-all
                                hover:border-emerald-300
                                hover:bg-emerald-50
                                hover:text-emerald-800
                              "
                            >
                              <Eye className="h-3.5 w-3.5" />

                              Details
                            </button>

                            {isCheckedIn ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCheckOut(
                                    visitor.id
                                  )
                                }
                                disabled={
                                  updatingVisitorId ===
                                  visitor.id
                                }
                                className="
                                  inline-flex
                                  min-h-9
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  bg-slate-700
                                  px-3 py-2
                                  text-xs
                                  font-semibold
                                  text-white
                                  transition-all
                                  hover:bg-slate-800
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                <LogOut className="h-3.5 w-3.5" />

                                {updatingVisitorId ===
                                visitor.id
                                  ? 'Updating...'
                                  : 'Check Out'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCheckIn(
                                    visitor.id
                                  )
                                }
                                disabled={
                                  updatingVisitorId ===
                                  visitor.id
                                }
                                className="
                                  inline-flex
                                  min-h-9
                                  items-center
                                  gap-1.5
                                  rounded-lg
                                  bg-emerald-700
                                  px-3 py-2
                                  text-xs
                                  font-semibold
                                  text-white
                                  transition-all
                                  hover:bg-emerald-800
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                "
                              >
                                <LogIn className="h-3.5 w-3.5" />

                                {updatingVisitorId ===
                                visitor.id
                                  ? 'Updating...'
                                  : 'Check In'}
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
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >

                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Users className="h-5 w-5" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      No visitor
                      records found
                    </p>

                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                      {isTodaySelected
                        ? 'No visitors have been recorded for today.'
                        : selectedDate
                        ? `No visitor records were found for ${formatSelectedDate(
                            selectedDate
                          )}.`
                        : 'No records match the current search and status filters.'}
                    </p>

                    {!isTodaySelected && (
                      <button
                        type="button"
                        onClick={
                          resetToToday
                        }
                        className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />

                        Back to Today
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
          ADD VISITOR MODAL
      ====================================================== */}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <form
            onSubmit={
              handleAddSubmit
            }
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <UserRound className="h-4 w-4" />
                </div>

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Visitor
                    Management
                  </p>

                  <h3 className="mt-0.5 font-bold text-slate-900">
                    Register New
                    Visitor
                  </h3>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(
                    false
                  );

                  setFormError(
                    ''
                  );
                }}
                aria-label="Close visitor form"
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM BODY */}
            <div className="space-y-5 p-5">

              {/* RESIDENT */}
              <div>

                <label
                  htmlFor="visitor-resident"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Visiting Resident
                </label>

                <select
                  id="visitor-resident"
                  value={
                    residentId
                  }
                  onChange={(
                    event
                  ) =>
                    setResidentId(
                      Number(
                        event.target
                          .value
                      )
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
                  required
                >

                  {residents.map(
                    (resident) => (
                      <option
                        key={
                          resident.id
                        }
                        value={
                          resident.id
                        }
                      >
                        {
                          resident.name
                        }{' '}
                        — Room{' '}
                        {
                          resident.room_number
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* VISITOR NAME */}
              <div>

                <label
                  htmlFor="visitor-name"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Visitor Full
                  Name
                </label>

                <input
                  id="visitor-name"
                  type="text"
                  placeholder="Example: Ahmad bin Razali"
                  value={
                    visitorName
                  }
                  onChange={(
                    event
                  ) =>
                    setVisitorName(
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

              {/* RELATIONSHIP + PHONE */}
              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="visitor-relationship"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Relationship
                  </label>

                  <select
                    id="visitor-relationship"
                    value={
                      relationship
                    }
                    onChange={(
                      event
                    ) =>
                      setRelationship(
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
                      px-3
                      py-2.5
                      text-sm
                      focus:border-emerald-600
                      focus:outline-none
                      focus:ring-4
                      focus:ring-emerald-100
                    "
                  >
                    <option value="Son">
                      Son
                    </option>

                    <option value="Daughter">
                      Daughter
                    </option>

                    <option value="Spouse">
                      Spouse
                    </option>

                    <option value="Sibling">
                      Sibling
                    </option>

                    <option value="Relative / Friend">
                      Relative / Friend
                    </option>

                    <option value="Guardian">
                      Guardian
                    </option>
                  </select>

                </div>

                <div>

                  <label
                    htmlFor="visitor-contact"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Contact Phone
                  </label>

                  <input
                    id="visitor-contact"
                    type="text"
                    placeholder="012-3456789"
                    value={
                      contactPhone
                    }
                    onChange={(
                      event
                    ) =>
                      setContactPhone(
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
                      px-3
                      py-2.5
                      font-mono
                      text-sm
                      focus:border-emerald-600
                      focus:outline-none
                      focus:ring-4
                      focus:ring-emerald-100
                    "
                    required
                  />

                </div>

              </div>

              {/* CHECK-IN DATE TIME */}
              <div>

                <label
                  htmlFor="visitor-check-in"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Check-In Date &
                  Time
                </label>

                <div className="relative">

                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="visitor-check-in"
                    type="datetime-local"
                    value={
                      checkInTime
                    }
                    onChange={(
                      event
                    ) =>
                      setCheckInTime(
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
                      pl-10 pr-3
                      font-mono
                      text-sm
                      text-slate-700
                      focus:border-emerald-600
                      focus:outline-none
                      focus:ring-4
                      focus:ring-emerald-100
                    "
                    required
                  />

                </div>

              </div>

              {/* INFO */}
              <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">

                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

                <p className="text-xs leading-5 text-emerald-800">
                  The visitor will
                  automatically be
                  registered as
                  Checked In. Staff
                  can record
                  check-out from
                  the visitor log
                  after the visit.
                </p>

              </div>

              {/* ERROR */}
              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700"
                >
                  {formError}
                </div>
              )}

            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(
                    false
                  );

                  setFormError(
                    ''
                  );
                }}
                className="
                  min-h-10
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4 py-2
                  text-xs
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
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
                  px-4 py-2
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:bg-emerald-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <LogIn className="h-4 w-4" />

                {isSubmitting
                  ? 'Saving...'
                  : 'Check In Visitor'}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =====================================================
          VIEW VISITOR DETAILS MODAL
      ====================================================== */}

      {viewingVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <UserRound className="h-4 w-4" />
                </div>

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Visitor Record
                  </p>

                  <h3 className="mt-0.5 font-bold text-slate-900">
                    Visitor Details
                  </h3>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingVisitor(
                    null
                  )
                }
                aria-label="Close visitor details"
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* BODY */}
            <div className="p-5">

              {/* VISITOR */}
              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Visitor
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {
                    viewingVisitor.visitor_name
                  }
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    viewingVisitor.relationship
                  }
                </p>

              </div>

              {/* INFORMATION */}
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">

                {/* RESIDENT */}
                <div className="px-4 py-3">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Visiting Resident
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {
                      (
                        viewingVisitor.resident ||
                        residents.find(
                          (resident) =>
                            resident.id ===
                            viewingVisitor.resident_id
                        )
                      )?.name ||
                      'Resident'
                    }
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Room{' '}
                    {
                      (
                        viewingVisitor.resident ||
                        residents.find(
                          (resident) =>
                            resident.id ===
                            viewingVisitor.resident_id
                        )
                      )
                        ?.room_number ||
                      'N/A'
                    }
                  </p>

                </div>

                {/* CONTACT */}
                <div className="border-t border-slate-200 px-4 py-3">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Contact Number
                  </p>

                  <p className="mt-1 font-mono text-sm text-slate-700">
                    {viewingVisitor.contact_phone ||
                      'Not recorded'}
                  </p>

                </div>

                {/* CHECK IN / OUT */}
                <div className="grid grid-cols-2 border-t border-slate-200">

                  <div className="border-r border-slate-200 p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Check-In
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {formatDate(
                        viewingVisitor.check_in ||
                          viewingVisitor.visit_date
                      )}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatTime(
                        viewingVisitor.check_in ||
                          viewingVisitor.visit_date
                      )}
                    </p>

                  </div>

                  <div className="p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Check-Out
                    </p>

                    {viewingVisitor.check_out ? (
                      <>
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatDate(
                            viewingVisitor.check_out
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatTime(
                            viewingVisitor.check_out
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        Still on
                        premises
                      </p>
                    )}

                  </div>

                </div>

              </div>

              {/* STATUS */}
              <div className="mt-4 flex items-center justify-between gap-3">

                <span className="text-xs text-slate-500">
                  Current Status
                </span>

                <span
                  className={`
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-md
                    border
                    px-2.5
                    py-1.5
                    text-xs
                    font-semibold
                    ${
                      viewingVisitor.status ===
                      'Checked In'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-100 text-slate-600'
                    }
                  `}
                >

                  <span
                    className={`
                      h-1.5
                      w-1.5
                      rounded-full
                      ${
                        viewingVisitor.status ===
                        'Checked In'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }
                    `}
                  />

                  {viewingVisitor.status ||
                    'Checked Out'}

                </span>

              </div>

            </div>

            {/* FOOTER */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setViewingVisitor(
                    null
                  )
                }
                className="min-h-10 rounded-lg bg-[#174c3c] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#123f32]"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};