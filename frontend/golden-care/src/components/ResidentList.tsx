import React, { useMemo, useState } from 'react';
import { Resident, UserRole, Vital } from '../types';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface ResidentListProps {
  residents: Resident[];
  currentRole: UserRole;
  onSelectResident: (resident: Resident) => void;
  onOpenAddModal: () => void;
}

type ResidentWithVitals = Resident & {
  vitals?: Vital[];
};

type GenderFilter = 'All' | 'Male' | 'Female';

const PAGE_SIZE = 8;

/* =========================================================
   AGE
========================================================= */

const calculateAge = (dob: string): number | null => {
  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

/* =========================================================
   LATEST VITAL
========================================================= */

const getLatestVital = (
  resident: ResidentWithVitals
): Vital | undefined =>
  resident.vitals
    ?.slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )[0];

/* =========================================================
   HEALTH STATUS
========================================================= */

const getHealthStatus = (
  resident: ResidentWithVitals
) => {
  const latestVital = getLatestVital(resident);

  if (!latestVital) {
    return {
      label: 'No Reading',
      className:
        'border-slate-200 bg-slate-50 text-slate-600',
      dotClassName: 'bg-slate-400',
    };
  }

  const isCritical =
    latestVital.bp_systolic > 140 ||
    latestVital.temperature > 37.5;

  return isCritical
    ? {
        label: 'Review Required',
        className:
          'border-rose-200 bg-rose-50 text-rose-700',
        dotClassName: 'bg-rose-600',
      }
    : {
        label: 'Stable',
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        dotClassName: 'bg-emerald-600',
      };
};

export const ResidentList: React.FC<
  ResidentListProps
> = ({
  residents,
  currentRole,
  onSelectResident,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] =
    useState('');

  const [genderFilter, setGenderFilter] =
    useState<GenderFilter>('All');

  const [currentPage, setCurrentPage] =
    useState(1);

  /* =======================================================
     FILTERING
  ======================================================= */

  const filteredResidents = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return residents.filter((resident) => {
      const searchableText = [
        resident.name,
        resident.ic_number,
        resident.room_number,
        resident.medical_history || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesGender =
        genderFilter === 'All' ||
        resident.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [genderFilter, residents, searchTerm]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredResidents.length / PAGE_SIZE
    )
  );

  const validCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedResidents =
    filteredResidents.slice(
      (validCurrentPage - 1) * PAGE_SIZE,
      validCurrentPage * PAGE_SIZE
    );

  /* =======================================================
     SUMMARY
  ======================================================= */

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    genderFilter !== 'All';

  const maleCount = residents.filter(
    (resident) => resident.gender === 'Male'
  ).length;

  const femaleCount =
    residents.length - maleCount;

  const clearFilters = () => {
    setSearchTerm('');
    setGenderFilter('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              Resident Management
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Residents Directory
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Quickly review residents,
              latest health readings and
              current monitoring status.
            </p>
          </div>

          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="
                inline-flex min-h-11 items-center justify-center gap-2
                rounded-lg bg-white px-4 py-2.5
                text-sm font-semibold text-[#174c3c]
                shadow-sm
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-emerald-50
                hover:shadow-md
              "
            >
              <UserPlus className="h-4 w-4" />
              Add Resident
            </button>
          )}

        </div>

      </section>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL */}
        <div
          className="
            group rounded-xl border border-slate-200
            bg-white p-5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-emerald-200
            hover:shadow-md
          "
        >
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total Residents
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {residents.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
              <Users className="h-5 w-5" />
            </div>

          </div>
        </div>

        {/* MALE */}
        <div
          className="
            rounded-xl border border-slate-200
            bg-white p-5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-slate-300
            hover:shadow-md
          "
        >
          <p className="text-xs font-semibold text-slate-500">
            Male Residents
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {maleCount}
          </p>
        </div>

        {/* FEMALE */}
        <div
          className="
            rounded-xl border border-slate-200
            bg-white p-5 shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-slate-300
            hover:shadow-md
          "
        >
          <p className="text-xs font-semibold text-slate-500">
            Female Residents
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {femaleCount}
          </p>
        </div>

      </section>

      {/* =====================================================
          SEARCH + FILTER
      ====================================================== */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          {/* Search */}
          <div className="w-full lg:max-w-xl">

            <label
              htmlFor="resident-search"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Search Resident
            </label>

            <div className="relative">

              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="resident-search"
                type="search"
                value={searchTerm}
                placeholder="Search name, IC number or room"
                onChange={(event) => {
                  setSearchTerm(
                    event.target.value
                  );
                  setCurrentPage(1);
                }}
                className="
                  min-h-11 w-full
                  rounded-lg border border-slate-300
                  bg-white py-2.5 pl-10 pr-10
                  text-sm text-slate-900
                  placeholder:text-slate-400
                  transition-all
                  hover:border-slate-400
                  focus:border-emerald-600
                  focus:outline-none
                  focus:ring-4
                  focus:ring-emerald-100
                "
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

            </div>

          </div>

          {/* Gender Filter */}
          <div>

            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Filter className="h-3.5 w-3.5" />
              Gender
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">

              {(
                [
                  'All',
                  'Male',
                  'Female',
                ] as const
              ).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => {
                    setGenderFilter(gender);
                    setCurrentPage(1);
                  }}
                  className={`
                    min-h-9 rounded-md px-4
                    text-xs font-semibold
                    transition-all duration-200
                    ${
                      genderFilter === gender
                        ? 'bg-[#174c3c] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }
                  `}
                >
                  {gender}
                </button>
              ))}

            </div>

          </div>

        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

          <p className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {filteredResidents.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-900">
              {residents.length}
            </span>{' '}
            residents
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}

        </div>

      </section>

      {/* =====================================================
          RESIDENT RECORDS
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Resident Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select a resident to view
              their complete profile and
              medical information.
            </p>
          </div>

          <span className="hidden rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
            {filteredResidents.length}{' '}
            residents
          </span>

        </div>

        {/* ===================================================
            DESKTOP TABLE
        ==================================================== */}

        <div className="hidden overflow-x-auto lg:block">

          <table className="w-full text-left">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">

                <th className="px-5 py-3">
                  Resident
                </th>

                <th className="px-4 py-3">
                  Room
                </th>

                <th className="px-4 py-3">
                  Details
                </th>

                <th className="px-4 py-3">
                  Latest Vitals
                </th>

                <th className="px-4 py-3">
                  Health Status
                </th>

                <th className="px-5 py-3 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {paginatedResidents.map(
                (resident) => {
                  const age =
                    calculateAge(
                      resident.dob
                    );

                  const latestVital =
                    getLatestVital(
                      resident as ResidentWithVitals
                    );

                  const healthStatus =
                    getHealthStatus(
                      resident as ResidentWithVitals
                    );

                  const isHighBP =
                    Boolean(
                      latestVital &&
                        latestVital.bp_systolic >
                          140
                    );

                  const isHighTemp =
                    Boolean(
                      latestVital &&
                        latestVital.temperature >
                          37.5
                    );

                  return (
                    <tr
                      key={resident.id}
                      onClick={() =>
                        onSelectResident(
                          resident
                        )
                      }
                      className="
                        group cursor-pointer
                        transition-all duration-200
                        hover:bg-emerald-50/40
                      "
                    >

                      {/* Resident */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div
                            className="
                              flex h-10 w-10
                              shrink-0 items-center
                              justify-center rounded-full
                              bg-emerald-50
                              text-sm font-bold
                              text-emerald-800
                              transition-all duration-200
                              group-hover:bg-emerald-700
                              group-hover:text-white
                            "
                          >
                            {resident.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p
                              className="
                                font-semibold text-slate-900
                                transition-colors
                                group-hover:text-emerald-800
                              "
                            >
                              {resident.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Resident Profile
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Room */}
                      <td className="px-4 py-4">

                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 transition-colors group-hover:border-emerald-200 group-hover:bg-white">
                          {resident.room_number}
                        </span>

                      </td>

                      {/* Details */}
                      <td className="px-4 py-4">

                        <p className="text-sm font-medium text-slate-800">
                          {resident.gender}
                          {age !== null
                            ? `, ${age} years`
                            : ''}
                        </p>

                      </td>

                      {/* Latest vitals */}
                      <td className="px-4 py-4">

                        {latestVital ? (
                          <div className="flex items-center gap-5">

                            {/* BP */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                BP
                              </p>

                              <p
                                className={`mt-0.5 font-mono text-sm font-semibold ${
                                  isHighBP
                                    ? 'text-rose-700'
                                    : 'text-slate-700'
                                }`}
                              >
                                {
                                  latestVital.bp_systolic
                                }
                                /
                                {
                                  latestVital.bp_diastolic
                                }
                              </p>
                            </div>

                            {/* Temp */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Temp
                              </p>

                              <p
                                className={`mt-0.5 font-mono text-sm font-semibold ${
                                  isHighTemp
                                    ? 'text-rose-700'
                                    : 'text-slate-700'
                                }`}
                              >
                                {
                                  latestVital.temperature
                                }
                                °C
                              </p>
                            </div>

                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No vital reading
                          </span>
                        )}

                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">

                        <span
                          className={`
                            inline-flex items-center
                            gap-1.5 rounded-md
                            border px-2.5 py-1
                            text-xs font-semibold
                            ${healthStatus.className}
                          `}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${healthStatus.dotClassName}`}
                          />

                          {healthStatus.label}
                        </span>

                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            onSelectResident(
                              resident
                            );
                          }}
                          className="
                            inline-flex min-h-10
                            items-center gap-2
                            rounded-lg
                            border border-emerald-700
                            bg-white px-3.5 py-2
                            text-xs font-semibold
                            text-emerald-800
                            transition-all duration-200
                            hover:bg-emerald-700
                            hover:text-white
                            hover:shadow-sm
                            group-hover:border-emerald-700
                          "
                        >
                          <Eye className="h-4 w-4" />
                          View Profile
                        </button>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            MOBILE
        ==================================================== */}

        <div className="divide-y divide-slate-100 lg:hidden">

          {paginatedResidents.map(
            (resident) => {
              const age =
                calculateAge(
                  resident.dob
                );

              const latestVital =
                getLatestVital(
                  resident as ResidentWithVitals
                );

              const healthStatus =
                getHealthStatus(
                  resident as ResidentWithVitals
                );

              const isHighBP =
                Boolean(
                  latestVital &&
                    latestVital.bp_systolic >
                      140
                );

              const isHighTemp =
                Boolean(
                  latestVital &&
                    latestVital.temperature >
                      37.5
                );

              return (
                <article
                  key={resident.id}
                  onClick={() =>
                    onSelectResident(
                      resident
                    )
                  }
                  className="group cursor-pointer p-5 transition-colors hover:bg-emerald-50/40"
                >

                  <div className="flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-800 transition-colors group-hover:bg-emerald-700 group-hover:text-white">
                      {resident.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">

                      {/* Top */}
                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h2 className="font-semibold text-slate-900 group-hover:text-emerald-800">
                            {resident.name}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            {resident.gender}
                            {age !== null
                              ? ` • ${age} years`
                              : ''}
                          </p>

                        </div>

                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                          Room{' '}
                          {resident.room_number}
                        </span>

                      </div>

                      {/* Vitals */}
                      <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3">

                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            BP
                          </p>

                          <p
                            className={`mt-1 font-mono text-xs font-semibold ${
                              isHighBP
                                ? 'text-rose-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {latestVital
                              ? `${latestVital.bp_systolic}/${latestVital.bp_diastolic}`
                              : '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            Temp
                          </p>

                          <p
                            className={`mt-1 font-mono text-xs font-semibold ${
                              isHighTemp
                                ? 'text-rose-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {latestVital
                              ? `${latestVital.temperature}°C`
                              : '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            SpO₂
                          </p>

                          <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                            {latestVital
                              ? `${latestVital.oxygen_level}%`
                              : '-'}
                          </p>
                        </div>

                      </div>

                      {/* Bottom */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                        <span
                          className={`
                            inline-flex items-center
                            gap-1.5 rounded-md
                            border px-2.5 py-1
                            text-xs font-semibold
                            ${healthStatus.className}
                          `}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${healthStatus.dotClassName}`}
                          />

                          {healthStatus.label}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            onSelectResident(
                              resident
                            );
                          }}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                        >
                          <Eye className="h-4 w-4" />
                          View Profile
                        </button>

                      </div>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {filteredResidents.length === 0 && (
          <div className="px-6 py-16 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              {residents.length === 0 ? (
                <Users className="h-6 w-6" />
              ) : (
                <Search className="h-6 w-6" />
              )}
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              {residents.length === 0
                ? 'No residents registered'
                : 'No matching residents'}
            </h2>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              {residents.length === 0
                ? 'Resident records will appear here after they are registered.'
                : 'Try another search term or reset the selected gender filter.'}
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Reset Filters
              </button>
            )}

          </div>
        )}

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {filteredResidents.length > 0 && (
          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <p>
              Showing{' '}
              <strong className="text-slate-800">
                {(validCurrentPage - 1) *
                  PAGE_SIZE +
                  1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(
                  validCurrentPage *
                    PAGE_SIZE,
                  filteredResidents.length
                )}
              </strong>{' '}
              of{' '}
              <strong className="text-slate-800">
                {filteredResidents.length}
              </strong>
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                  )
                }
                disabled={
                  validCurrentPage === 1
                }
                className="
                  inline-flex min-h-9
                  items-center gap-1
                  rounded-lg border
                  border-slate-300
                  bg-white px-3 py-2
                  font-semibold text-slate-700
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

              <span className="min-w-[70px] text-center font-semibold text-slate-700">
                {validCurrentPage} /{' '}
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
                className="
                  inline-flex min-h-9
                  items-center gap-1
                  rounded-lg border
                  border-slate-300
                  bg-white px-3 py-2
                  font-semibold text-slate-700
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

      {/* =====================================================
          INFO NOTE
      ====================================================== */}

      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">

        <Activity className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

        <p className="text-xs leading-5 text-slate-600">
          Health status is based on the
          resident&apos;s latest available
          vital reading. A review is shown
          when systolic blood pressure is
          above 140 mmHg or temperature is
          above 37.5°C.
        </p>

      </div>

    </div>
  );
};