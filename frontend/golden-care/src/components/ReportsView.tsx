import React, {
  useMemo,
  useState,
} from 'react';

import {
  Resident,
  Vital,
  Visitor,
  User,
} from '../types';

import { AdminSummary } from '../services/reportService';

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  HeartPulse,
  ShieldCheck,
  Thermometer,
  UserRound,
  Users,
  Search,
  Wind,
} from 'lucide-react';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  generateResidentReportPDF,
  generateResidentListReportPDF,
  generateSystemReportPDF,
} from '../utils/pdfGenerator';

import { PDFViewerModal } from './PDFViewerModal';

import jsPDF from 'jspdf';

/* =========================================================
   PROPS
========================================================= */

interface ReportsViewProps {
  residents: Resident[];
  vitals: Vital[];
  visitors: Visitor[];
  users?: User[];
  summary?: AdminSummary | null;

  onSelectResident?: (
    resident: Resident
  ) => void;
}

type ReportType =
  | 'resident'
  | 'resident-list'
  | 'system';

/* =========================================================
   HELPERS
========================================================= */

const isCriticalVital = (
  vital: Vital
): boolean => {
  return (
    vital.bp_systolic > 140 ||
    vital.temperature > 37.5
  );
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

const formatDateTime = (
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

const calculateAge = (
  dob?: string
): number | string => {
  if (!dob) {
    return 'N/A';
  }

  const birthDate =
    new Date(dob);

  if (
    Number.isNaN(
      birthDate.getTime()
    )
  ) {
    return 'N/A';
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (
      monthDiff === 0 &&
      today.getDate() <
        birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
};

/* =========================================================
   COMPONENT
========================================================= */

export const ReportsView: React.FC<
  ReportsViewProps
> = ({
  residents,
  vitals,
  visitors,
  users = [],
  summary,
  onSelectResident,
}) => {
  /* =======================================================
     REPORT TYPE
  ======================================================= */

  const [
    reportType,
    setReportType,
  ] =
    useState<ReportType>(
      'resident'
    );

  /* =======================================================
     FILTERS
  ======================================================= */

  const [
    selectedResidentId,
    setSelectedResidentId,
  ] = useState<number>(
    residents[0]?.id || 1
  );

  const [
    dateRangeDays,
    setDateRangeDays,
  ] = useState<number>(7);

  const [
    residentListSearch,
    setResidentListSearch,
  ] = useState('');

  /* =======================================================
     RESIDENT LIST REPORT DATA
  ======================================================= */

  const residentList =
    useMemo(() => {
      const search =
        residentListSearch
          .trim()
          .toLowerCase();

      return [...residents]
        .sort((a, b) => {
          const roomCompare =
            a.room_number.localeCompare(
              b.room_number,
              undefined,
              { numeric: true }
            );

          if (roomCompare !== 0) {
            return roomCompare;
          }

          return a.name.localeCompare(
            b.name
          );
        })
        .filter((resident) => {
          if (!search) {
            return true;
          }

          return [
            resident.name,
            resident.ic_number,
            resident.gender,
            resident.room_number,
            resident.emergency_contact,
            resident.medical_history,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(search)
            );
        });
    }, [
      residents,
      residentListSearch,
    ]);

  const totalRoomsInUse =
    new Set(
      residents.map(
        (resident) =>
          resident.room_number
      )
    ).size;

  /* =======================================================
     PDF
  ======================================================= */

  const [
    activePdfDoc,
    setActivePdfDoc,
  ] =
    useState<jsPDF | null>(
      null
    );

  const [
    pdfTitle,
    setPdfTitle,
  ] = useState('');

  const [
    pdfFilename,
    setPdfFilename,
  ] = useState('');

  /* =======================================================
     SELECTED RESIDENT
  ======================================================= */

  const selectedResident =
    residents.find(
      (resident) =>
        resident.id ===
        Number(
          selectedResidentId
        )
    ) || residents[0];

  /* =======================================================
     DATE RANGE
  ======================================================= */

  const cutoffDate =
    useMemo(() => {
      const date =
        new Date();

      date.setDate(
        date.getDate() -
          dateRangeDays
      );

      return date;
    }, [dateRangeDays]);

  /* =======================================================
     RESIDENT VITALS
  ======================================================= */

  const residentVitals =
    useMemo(() => {
      if (
        !selectedResident
      ) {
        return [];
      }

      return vitals
        .filter(
          (vital) =>
            vital.resident_id ===
              selectedResident.id &&
            new Date(
              vital.created_at
            ) >= cutoffDate
        )
        .sort(
          (a, b) =>
            new Date(
              a.created_at
            ).getTime() -
            new Date(
              b.created_at
            ).getTime()
        );
    }, [
      vitals,
      selectedResident,
      cutoffDate,
    ]);

  /* =======================================================
     SYSTEM VITALS
  ======================================================= */

  const systemVitals =
    useMemo(() => {
      return vitals.filter(
        (vital) =>
          new Date(
            vital.created_at
          ) >= cutoffDate
      );
    }, [
      vitals,
      cutoffDate,
    ]);

  /* =======================================================
     RESIDENT METRICS
  ======================================================= */

  const totalResidentLogs =
    residentVitals.length;

  const criticalResidentLogs =
    residentVitals.filter(
      isCriticalVital
    );

  const normalResidentLogs =
    totalResidentLogs -
    criticalResidentLogs.length;

  const avgSys =
    totalResidentLogs > 0
      ? Math.round(
          residentVitals.reduce(
            (total, vital) =>
              total +
              vital.bp_systolic,
            0
          ) /
            totalResidentLogs
        )
      : 0;

  const avgDia =
    totalResidentLogs > 0
      ? Math.round(
          residentVitals.reduce(
            (total, vital) =>
              total +
              vital.bp_diastolic,
            0
          ) /
            totalResidentLogs
        )
      : 0;

  const avgTemp =
    totalResidentLogs > 0
      ? (
          residentVitals.reduce(
            (total, vital) =>
              total +
              vital.temperature,
            0
          ) /
          totalResidentLogs
        ).toFixed(1)
      : '0.0';

  const avgSpO2 =
    totalResidentLogs > 0
      ? Math.round(
          residentVitals.reduce(
            (total, vital) =>
              total +
              vital.oxygen_level,
            0
          ) /
            totalResidentLogs
        )
      : 0;

  const avgHr =
    totalResidentLogs > 0
      ? Math.round(
          residentVitals.reduce(
            (total, vital) =>
              total +
              vital.heart_rate,
            0
          ) /
            totalResidentLogs
        )
      : 0;

  /* =======================================================
     CHART
  ======================================================= */

  const chartData =
    residentVitals.map(
      (vital) => ({
        time:
          formatDateTime(
            vital.created_at
          ),

        systolic:
          vital.bp_systolic,

        diastolic:
          vital.bp_diastolic,

        temperature:
          vital.temperature,

        oxygen:
          vital.oxygen_level,

        heartRate:
          vital.heart_rate,
      })
    );

  /* =======================================================
     RESIDENT PROFILE
  ======================================================= */

  const residentAge =
    calculateAge(
      selectedResident?.dob
    );

  /* =======================================================
     SYSTEM METRICS
  ======================================================= */

  const systemCritical =
    systemVitals.filter(
      isCriticalVital
    );

  const systemNormal =
    systemVitals.length -
    systemCritical.length;

  /* =======================================================
     RESIDENTS REQUIRING ATTENTION
  ======================================================= */

  const residentAlertCounts:
    Record<number, number> =
    {};

  systemCritical.forEach(
    (vital) => {
      residentAlertCounts[
        vital.resident_id
      ] =
        (
          residentAlertCounts[
            vital.resident_id
          ] || 0
        ) + 1;
    }
  );

  const attentionList =
    Object.entries(
      residentAlertCounts
    )
      .map(
        ([
          residentId,
          count,
        ]) => {
          const resident =
            residents.find(
              (item) =>
                item.id ===
                Number(
                  residentId
                )
            );

          const residentCriticalVitals =
            systemCritical
              .filter(
                (vital) =>
                  vital.resident_id ===
                  Number(
                    residentId
                  )
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.created_at
                  ).getTime() -
                  new Date(
                    a.created_at
                  ).getTime()
              );

          return {
            res: resident,
            count,
            latestCritical:
              residentCriticalVitals[0],
          };
        }
      )
      .filter(
        (item) =>
          item.res !==
          undefined
      )
      .sort(
        (a, b) =>
          b.count - a.count
      );

  /* =======================================================
     PDF
  ======================================================= */

  const handleOpenResidentPDF =
    () => {
      if (
        !selectedResident
      ) {
        return;
      }

      const doc =
        generateResidentReportPDF(
          {
            resident:
              selectedResident,

            vitals,

            users,

            dateRangeDays,
          }
        );

      setPdfTitle(
        `Resident Health Report — ${selectedResident.name}`
      );

      setPdfFilename(
        `GoldenCare_Resident_${selectedResident.name.replace(
          /\s+/g,
          '_'
        )}_Report.pdf`
      );

      setActivePdfDoc(doc);
    };

  const handleOpenResidentListPDF =
    () => {
      const doc =
        generateResidentListReportPDF({
          residents,
        });

      setPdfTitle(
        'Resident List Report'
      );

      setPdfFilename(
        `GoldenCare_Resident_List_${new Date()
          .toISOString()
          .substring(
            0,
            10
          )}.pdf`
      );

      setActivePdfDoc(doc);
    };

  const handleOpenSystemPDF =
    () => {
      const doc =
        generateSystemReportPDF({
          residents,
          vitals,
          users,
          visitors,
          dateRangeDays,
        });

      setPdfTitle(
        'Centre Health & Vitals Monitoring Report'
      );

      setPdfFilename(
        `GoldenCare_Centre_Health_Report_${new Date()
          .toISOString()
          .substring(
            0,
            10
          )}.pdf`
      );

      setActivePdfDoc(doc);
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border border-white/5" />

        <div className="pointer-events-none absolute -right-3 -top-3 h-28 w-28 rounded-full border border-white/5" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Health Reporting
              </p>

            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Reports & Health Records
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Review resident health
              information, monitoring
              trends, threshold events
              and centre-level records.
            </p>

          </div>

          {/* REPORT TYPE */}
          <div className="inline-flex flex-wrap self-start rounded-lg border border-white/15 bg-white/5 p-1 lg:self-auto">

            <button
              id="tab-resident-report"
              type="button"
              onClick={() =>
                setReportType(
                  'resident'
                )
              }
              className={`min-h-10 rounded-md px-4 text-xs font-semibold transition-all ${
                reportType ===
                'resident'
                  ? 'bg-white text-[#174c3c] shadow-sm'
                  : 'text-emerald-50 hover:bg-white/10'
              }`}
            >
              Resident Report
            </button>

            <button
              id="tab-resident-list-report"
              type="button"
              onClick={() =>
                setReportType(
                  'resident-list'
                )
              }
              className={`min-h-10 rounded-md px-4 text-xs font-semibold transition-all ${
                reportType ===
                'resident-list'
                  ? 'bg-white text-[#174c3c] shadow-sm'
                  : 'text-emerald-50 hover:bg-white/10'
              }`}
            >
              Resident List
            </button>

            <button
              id="tab-system-report"
              type="button"
              onClick={() =>
                setReportType(
                  'system'
                )
              }
              className={`min-h-10 rounded-md px-4 text-xs font-semibold transition-all ${
                reportType ===
                'system'
                  ? 'bg-white text-[#174c3c] shadow-sm'
                  : 'text-emerald-50 hover:bg-white/10'
              }`}
            >
              Centre Report
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTROL PANEL
      ====================================================== */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-5 p-5 xl:flex-row xl:items-end xl:justify-between">

          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">

            {/* RESIDENT SELECT */}
            {reportType ===
              'resident' && (
              <div className="w-full md:max-w-sm">

                <label
                  htmlFor="report-resident-select"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                >
                  Selected Resident
                </label>

                <select
                  id="report-resident-select"
                  value={
                    selectedResidentId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedResidentId(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
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
            )}

            {/* PERIOD / RESIDENT LIST INFO */}
            {reportType !==
            'resident-list' ? (
              <div>

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Reporting Period
                </p>

                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">

                  {[
                    7,
                    14,
                    30,
                  ].map(
                    (days) => (
                      <button
                        key={
                          days
                        }
                        type="button"
                        onClick={() =>
                          setDateRangeDays(
                            days
                          )
                        }
                        className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-all ${
                          dateRangeDays ===
                          days
                            ? 'bg-[#174c3c] text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                      >
                        {days} Days
                      </button>
                    )
                  )}

                </div>

              </div>
            ) : (
              <div>

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Resident Database
                </p>

                <div className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
                  {residents.length}{' '}
                  registered residents
                </div>

              </div>
            )}

          </div>

          {/* PDF BUTTON */}
          <button
            id={
              reportType ===
              'resident'
                ? 'view-resident-pdf-button'
                : reportType ===
                  'resident-list'
                ? 'view-resident-list-pdf-button'
                : 'view-system-pdf-button'
            }
            type="button"
            onClick={
              reportType ===
              'resident'
                ? handleOpenResidentPDF
                : reportType ===
                  'resident-list'
                ? handleOpenResidentListPDF
                : handleOpenSystemPDF
            }
            disabled={
              reportType ===
                'resident' &&
              !selectedResident
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />

            {reportType ===
            'resident'
              ? 'View Resident PDF'
              : reportType ===
                'resident-list'
              ? 'View Resident List PDF'
              : 'View Centre PDF'}
          </button>

        </div>

      </section>

      {/* =====================================================
          RESIDENT REPORT
      ====================================================== */}

      {reportType ===
        'resident' &&
        selectedResident && (
          <div className="space-y-6">

            {/* =================================================
                PROFILE SUMMARY
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Resident Health Report
                    </p>

                    <h2 className="mt-0.5 text-base font-bold text-slate-900">
                      {
                        selectedResident.name
                      }
                    </h2>

                  </div>

                </div>

                {onSelectResident && (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectResident(
                        selectedResident
                      )
                    }
                    className="self-start text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline sm:self-auto"
                  >
                    Open Resident Profile
                  </button>
                )}

              </div>

              <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">

                <div className="bg-white p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    IC / Age
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {
                      selectedResident.ic_number
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {residentAge}{' '}
                    years old
                  </p>

                </div>

                <div className="bg-white p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Room
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    Room{' '}
                    {
                      selectedResident.room_number
                    }
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      selectedResident.gender
                    }
                  </p>

                </div>

                <div className="bg-white p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Admission Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(
                      selectedResident.created_at
                    )}
                  </p>

                </div>

                <div className="bg-white p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Emergency Contact
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {
                      selectedResident.emergency_contact
                    }
                  </p>

                </div>

              </div>

              <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3.5">

                <p className="text-xs leading-5 text-slate-600">

                  <span className="font-semibold text-slate-800">
                    Medical History:
                  </span>{' '}

                  {selectedResident.medical_history ||
                    'No medical history recorded.'}

                </p>

              </div>

            </section>

            {/* =================================================
                VITAL SUMMARY
            ================================================= */}

            <section>

              <div className="mb-3 flex items-end justify-between">

                <div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Vital Signs Summary
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Average readings
                    from the last{' '}
                    {
                      dateRangeDays
                    }{' '}
                    days.
                  </p>

                </div>

                <span className="text-xs font-medium text-slate-500">
                  {
                    totalResidentLogs
                  }{' '}
                  readings
                </span>

              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                {/* BP */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-rose-500" />

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-semibold text-slate-500">
                        Avg Blood Pressure
                      </p>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {avgSys}/
                        {avgDia}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        mmHg
                      </p>

                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <HeartPulse className="h-4 w-4" />
                    </div>

                  </div>

                </div>

                {/* TEMP */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-amber-500" />

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-semibold text-slate-500">
                        Avg Temperature
                      </p>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {
                          avgTemp
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        °C
                      </p>

                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <Thermometer className="h-4 w-4" />
                    </div>

                  </div>

                </div>

                {/* SPO2 */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-teal-500" />

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-semibold text-slate-500">
                        Avg Oxygen
                      </p>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {
                          avgSpO2
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        % SpO₂
                      </p>

                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Wind className="h-4 w-4" />
                    </div>

                  </div>

                </div>

                {/* HR */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-500" />

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-semibold text-slate-500">
                        Avg Heart Rate
                      </p>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {
                          avgHr
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        bpm
                      </p>

                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Activity className="h-4 w-4" />
                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                HEALTH STATUS
            ================================================= */}

            <section className="grid gap-4 md:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                <p className="text-xs font-semibold text-slate-500">
                  Total Readings
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {
                    totalResidentLogs
                  }
                </p>

              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">

                <p className="text-xs font-semibold text-emerald-700">
                  Normal Readings
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-800">
                  {
                    normalResidentLogs
                  }
                </p>

              </div>

              <div
                className={`rounded-xl border p-4 ${
                  criticalResidentLogs.length >
                  0
                    ? 'border-rose-200 bg-rose-50/60'
                    : 'border-slate-200 bg-white'
                }`}
              >

                <p
                  className={`text-xs font-semibold ${
                    criticalResidentLogs.length >
                    0
                      ? 'text-rose-700'
                      : 'text-slate-500'
                  }`}
                >
                  Threshold Events
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${
                    criticalResidentLogs.length >
                    0
                      ? 'text-rose-700'
                      : 'text-slate-900'
                  }`}
                >
                  {
                    criticalResidentLogs.length
                  }
                </p>

              </div>

            </section>

            {/* =================================================
                CHARTS
            ================================================= */}

            <section>

              <div className="mb-3">

                <h2 className="text-sm font-bold text-slate-900">
                  Health Trends
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Trend visualization
                  based on recorded
                  vital signs.
                </p>

              </div>

              <div className="grid gap-5 xl:grid-cols-2">

                {/* BP CHART */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="mb-5">

                    <h3 className="text-sm font-semibold text-slate-900">
                      Blood Pressure
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Systolic alert
                      threshold: above
                      140 mmHg
                    </p>

                  </div>

                  <div className="h-64">

                    {chartData.length >
                    0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <LineChart
                          data={
                            chartData
                          }
                          margin={{
                            top: 5,
                            right: 15,
                            left: -20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />

                          <XAxis
                            dataKey="time"
                            tick={{
                              fontSize: 9,
                            }}
                            stroke="#94a3b8"
                            minTickGap={
                              30
                            }
                          />

                          <YAxis
                            domain={[
                              60,
                              180,
                            ]}
                            tick={{
                              fontSize: 10,
                            }}
                            stroke="#94a3b8"
                          />

                          <Tooltip
                            contentStyle={{
                              fontSize: 11,
                              borderRadius: 8,
                              borderColor:
                                '#e2e8f0',
                            }}
                          />

                          <Legend
                            wrapperStyle={{
                              fontSize: 11,
                            }}
                          />

                          <ReferenceLine
                            y={140}
                            stroke="#e11d48"
                            strokeDasharray="4 4"
                          />

                          <Line
                            type="monotone"
                            dataKey="systolic"
                            name="Systolic"
                            stroke="#be123c"
                            strokeWidth={
                              2
                            }
                            dot={{
                              r: 2.5,
                            }}
                            activeDot={{
                              r: 4,
                            }}
                          />

                          <Line
                            type="monotone"
                            dataKey="diastolic"
                            name="Diastolic"
                            stroke="#0f766e"
                            strokeWidth={
                              2
                            }
                            dot={{
                              r: 2.5,
                            }}
                          />

                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                        No blood
                        pressure readings
                        recorded for this
                        period.
                      </div>
                    )}

                  </div>

                </div>

                {/* TEMP / SPO2 */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="mb-5">

                    <h3 className="text-sm font-semibold text-slate-900">
                      Temperature &
                      Oxygen Saturation
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Temperature alert
                      threshold: above
                      37.5°C
                    </p>

                  </div>

                  <div className="h-64">

                    {chartData.length >
                    0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <LineChart
                          data={
                            chartData
                          }
                          margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 5,
                          }}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />

                          <XAxis
                            dataKey="time"
                            tick={{
                              fontSize: 9,
                            }}
                            stroke="#94a3b8"
                            minTickGap={
                              30
                            }
                          />

                          <YAxis
                            yAxisId="temp"
                            domain={[
                              35,
                              40,
                            ]}
                            tick={{
                              fontSize: 10,
                            }}
                            stroke="#d97706"
                          />

                          <YAxis
                            yAxisId="spo2"
                            orientation="right"
                            domain={[
                              85,
                              100,
                            ]}
                            tick={{
                              fontSize: 10,
                            }}
                            stroke="#0f766e"
                          />

                          <Tooltip
                            contentStyle={{
                              fontSize: 11,
                              borderRadius: 8,
                              borderColor:
                                '#e2e8f0',
                            }}
                          />

                          <Legend
                            wrapperStyle={{
                              fontSize: 11,
                            }}
                          />

                          <ReferenceLine
                            yAxisId="temp"
                            y={37.5}
                            stroke="#dc2626"
                            strokeDasharray="4 4"
                          />

                          <Line
                            yAxisId="temp"
                            type="monotone"
                            dataKey="temperature"
                            name="Temperature"
                            stroke="#d97706"
                            strokeWidth={
                              2
                            }
                            dot={{
                              r: 2.5,
                            }}
                          />

                          <Line
                            yAxisId="spo2"
                            type="monotone"
                            dataKey="oxygen"
                            name="SpO₂"
                            stroke="#0f766e"
                            strokeWidth={
                              2
                            }
                            dot={{
                              r: 2.5,
                            }}
                          />

                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                        No readings
                        recorded for this
                        period.
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                THRESHOLD EVENTS
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <AlertTriangle className="h-4 w-4 text-rose-600" />

                    <h2 className="text-sm font-bold text-slate-900">
                      Threshold Events
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Readings that
                    exceeded GoldenCare
                    monitoring
                    thresholds.
                  </p>

                </div>

                <span
                  className={`self-start rounded-md border px-2.5 py-1.5 text-xs font-semibold sm:self-auto ${
                    criticalResidentLogs.length >
                    0
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {
                    criticalResidentLogs.length
                  }{' '}
                  event
                  {criticalResidentLogs.length !==
                  1
                    ? 's'
                    : ''}
                </span>

              </div>

              {criticalResidentLogs.length >
              0 ? (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[850px] text-left">

                    <thead className="border-b border-slate-200 bg-slate-50">

                      <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                        <th className="px-5 py-3">
                          Date & Time
                        </th>

                        <th className="px-4 py-3">
                          Trigger
                        </th>

                        <th className="px-4 py-3">
                          Recorded Values
                        </th>

                        <th className="px-4 py-3">
                          Severity
                        </th>

                        <th className="px-5 py-3">
                          Event Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {criticalResidentLogs
                        .slice()
                        .sort(
                          (
                            a,
                            b
                          ) =>
                            new Date(
                              b.created_at
                            ).getTime() -
                            new Date(
                              a.created_at
                            ).getTime()
                        )
                        .map(
                          (
                            vital
                          ) => {
                            const isHighBp =
                              vital.bp_systolic >
                              140;

                            const isFever =
                              vital.temperature >
                              37.5;

                            const isSevere =
                              vital.bp_systolic >=
                                160 ||
                              vital.temperature >=
                                38.5;

                            return (
                              <tr
                                key={
                                  vital.id
                                }
                                className="transition-colors hover:bg-rose-50/40"
                              >

                                <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-slate-600">
                                  {formatDateTime(
                                    vital.created_at
                                  )}
                                </td>

                                <td className="px-4 py-3.5 text-xs font-semibold text-rose-700">

                                  {isHighBp &&
                                  isFever
                                    ? 'High Blood Pressure & Elevated Temperature'
                                    : isHighBp
                                    ? 'High Systolic Blood Pressure'
                                    : 'Elevated Temperature'}

                                </td>

                                <td className="px-4 py-3.5">

                                  <p className="text-xs font-semibold text-slate-800">
                                    BP{' '}
                                    {
                                      vital.bp_systolic
                                    }
                                    /
                                    {
                                      vital.bp_diastolic
                                    }{' '}
                                    mmHg
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-500">
                                    Temp{' '}
                                    {
                                      vital.temperature
                                    }
                                    °C •
                                    SpO₂{' '}
                                    {
                                      vital.oxygen_level
                                    }
                                    %
                                  </p>

                                </td>

                                <td className="px-4 py-3.5">

                                  <span
                                    className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold ${
                                      isSevere
                                        ? 'border-rose-300 bg-rose-100 text-rose-800'
                                        : 'border-amber-200 bg-amber-50 text-amber-700'
                                    }`}
                                  >
                                    {isSevere
                                      ? 'Critical'
                                      : 'High'}
                                  </span>

                                </td>

                                <td className="px-5 py-3.5">

                                  <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">

                                    <AlertTriangle className="h-3.5 w-3.5" />

                                    Alert Triggered

                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )}

                    </tbody>

                  </table>

                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-emerald-700">

                  <CheckCircle2 className="h-4 w-4" />

                  No threshold events
                  recorded in this
                  reporting period.

                </div>
              )}

            </section>

            {/* =================================================
                HISTORY
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-5 py-4">

                <div className="flex items-center gap-2">

                  <FileText className="h-4 w-4 text-emerald-700" />

                  <h2 className="text-sm font-bold text-slate-900">
                    Vitals History
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Recent health
                  observations within
                  the selected reporting
                  period.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px] text-left">

                  <thead className="border-b border-slate-200 bg-slate-50">

                    <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                      <th className="px-5 py-3">
                        Date & Time
                      </th>

                      <th className="px-4 py-3">
                        Blood Pressure
                      </th>

                      <th className="px-4 py-3">
                        Temp
                      </th>

                      <th className="px-4 py-3">
                        SpO₂
                      </th>

                      <th className="px-4 py-3">
                        Heart Rate
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {residentVitals.length >
                    0 ? (
                      residentVitals
                        .slice()
                        .sort(
                          (
                            a,
                            b
                          ) =>
                            new Date(
                              b.created_at
                            ).getTime() -
                            new Date(
                              a.created_at
                            ).getTime()
                        )
                        .slice(
                          0,
                          10
                        )
                        .map(
                          (
                            vital
                          ) => {
                            const critical =
                              isCriticalVital(
                                vital
                              );

                            return (
                              <tr
                                key={
                                  vital.id
                                }
                                className={`transition-colors ${
                                  critical
                                    ? 'hover:bg-rose-50/40'
                                    : 'hover:bg-emerald-50/30'
                                }`}
                              >

                                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                                  {formatDateTime(
                                    vital.created_at
                                  )}
                                </td>

                                <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                                  {
                                    vital.bp_systolic
                                  }
                                  /
                                  {
                                    vital.bp_diastolic
                                  }{' '}
                                  mmHg
                                </td>

                                <td className="px-4 py-3.5 text-xs text-slate-700">
                                  {
                                    vital.temperature
                                  }
                                  °C
                                </td>

                                <td className="px-4 py-3.5 text-xs text-slate-700">
                                  {
                                    vital.oxygen_level
                                  }
                                  %
                                </td>

                                <td className="px-4 py-3.5 text-xs text-slate-700">
                                  {
                                    vital.heart_rate
                                  }{' '}
                                  bpm
                                </td>

                                <td className="px-5 py-3.5">

                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                      critical
                                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                  >

                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${
                                        critical
                                          ? 'bg-rose-500'
                                          : 'bg-emerald-500'
                                      }`}
                                    />

                                    {critical
                                      ? 'Review Required'
                                      : 'Normal'}

                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )
                    ) : (
                      <tr>

                        <td
                          colSpan={
                            6
                          }
                          className="px-6 py-12 text-center text-xs text-slate-400"
                        >
                          No health
                          records found
                          for this
                          reporting
                          period.
                        </td>

                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                  <FileText className="h-4 w-4" />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-slate-900">
                    Monitoring Summary
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-slate-600">

                    This report
                    contains{' '}

                    <strong className="text-slate-800">
                      {
                        totalResidentLogs
                      }{' '}
                      recorded
                      observations
                    </strong>{' '}

                    for{' '}

                    <strong className="text-slate-800">
                      {
                        selectedResident.name
                      }
                    </strong>{' '}

                    during the last{' '}

                    {
                      dateRangeDays
                    }{' '}

                    days. Average blood
                    pressure was{' '}

                    <strong className="text-slate-800">
                      {avgSys}/
                      {avgDia} mmHg
                    </strong>

                    , average
                    temperature was{' '}

                    <strong className="text-slate-800">
                      {
                        avgTemp
                      }
                      °C
                    </strong>

                    , average oxygen
                    saturation was{' '}

                    <strong className="text-slate-800">
                      {
                        avgSpO2
                      }
                      %
                    </strong>

                    {' '}and average
                    heart rate was{' '}

                    <strong className="text-slate-800">
                      {
                        avgHr
                      }{' '}
                      bpm
                    </strong>

                    .{' '}

                    {criticalResidentLogs.length >
                    0
                      ? `${criticalResidentLogs.length} threshold event${
                          criticalResidentLogs.length !==
                          1
                            ? 's'
                            : ''
                        } were identified for review.`
                      : 'No blood-pressure or temperature threshold events were identified during this period.'}

                  </p>

                </div>

              </div>

            </section>

          </div>
        )}

      {/* =====================================================
          RESIDENT LIST REPORT
      ====================================================== */}

      {reportType ===
        'resident-list' && (
          <div className="space-y-6">

            {/* SUMMARY */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

              <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#174c3c]" />

                <p className="text-xs font-semibold text-slate-500">
                  Total Residents
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-slate-900">
                    {residents.length}
                  </p>

                  <Users className="h-5 w-5 text-emerald-700" />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Registered resident records
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-teal-500" />

                <p className="text-xs font-semibold text-slate-500">
                  Rooms in Use
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <p className="text-3xl font-bold text-slate-900">
                    {totalRoomsInUse}
                  </p>

                  <ShieldCheck className="h-5 w-5 text-teal-700" />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Based on current resident data
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:col-span-2 xl:col-span-1">
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />

                <p className="text-xs font-semibold text-slate-500">
                  Report Date
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <p className="text-lg font-bold text-slate-900">
                    {new Date().toLocaleDateString(
                      'en-MY',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }
                    )}
                  </p>

                  <CalendarDays className="h-5 w-5 text-blue-600" />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Current database snapshot
                </p>
              </div>

            </section>

            {/* RESIDENT LIST TABLE */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-700" />

                    <h2 className="text-sm font-bold text-slate-900">
                      Registered Resident List
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Current residents registered in GoldenCare, arranged by room.
                  </p>
                </div>

                <div className="relative w-full lg:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={
                      residentListSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setResidentListSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search name, IC, room or contact..."
                    className="min-h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">

                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">
                        No.
                      </th>
                      <th className="px-4 py-3">
                        Resident Name
                      </th>
                      <th className="px-4 py-3">
                        IC Number
                      </th>
                      <th className="px-4 py-3">
                        Date of Birth
                      </th>
                      <th className="px-4 py-3">
                        Gender
                      </th>
                      <th className="px-4 py-3">
                        Room
                      </th>
                      <th className="px-4 py-3">
                        Emergency Contact
                      </th>
                      <th className="px-5 py-3">
                        Medical History
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {residentList.length >
                    0 ? (
                      residentList.map(
                        (
                          resident,
                          index
                        ) => (
                          <tr
                            key={
                              resident.id
                            }
                            className="transition-colors hover:bg-emerald-50/30"
                          >
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-400">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3.5">
                              <button
                                type="button"
                                disabled={
                                  !onSelectResident
                                }
                                onClick={() => {
                                  if (
                                    onSelectResident
                                  ) {
                                    onSelectResident(
                                      resident
                                    );
                                  }
                                }}
                                className="text-left text-sm font-semibold text-slate-900 transition hover:text-emerald-800 hover:underline disabled:cursor-default disabled:hover:text-slate-900 disabled:hover:no-underline"
                              >
                                {resident.name}
                              </button>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-600">
                              {resident.ic_number}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">
                              {formatDate(
                                resident.dob
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              {resident.gender}
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                                {resident.room_number}
                              </span>
                            </td>

                            <td className="max-w-[240px] px-4 py-3.5 text-xs leading-5 text-slate-600">
                              {resident.emergency_contact ||
                                '-'}
                            </td>

                            <td className="max-w-[320px] px-5 py-3.5 text-xs leading-5 text-slate-600">
                              <p className="line-clamp-2">
                                {resident.medical_history ||
                                  'No medical history recorded.'}
                              </p>
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-12 text-center text-xs text-slate-400"
                        >
                          No resident records match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing{' '}
                  <strong className="text-slate-700">
                    {residentList.length}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-700">
                    {residents.length}
                  </strong>{' '}
                  residents
                </span>

                <span>
                  The PDF includes the complete resident list.
                </span>
              </div>

            </section>

          </div>
        )}

      {/* =====================================================
          CENTRE REPORT
      ====================================================== */}

      {reportType ===
        'system' && (
          <div className="space-y-6">

            {/* =================================================
                KPI
            ================================================= */}

            <section>

              <div className="mb-3">

                <h2 className="text-sm font-bold text-slate-900">
                  Centre Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Operational
                  monitoring summary
                  for the last{' '}
                  {
                    dateRangeDays
                  }{' '}
                  days.
                </p>

              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                {/* RESIDENTS */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#174c3c]" />

                  <p className="text-xs font-semibold text-slate-500">
                    Total Residents
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <p className="text-3xl font-bold text-slate-900">
                      {summary?.total_residents ??
                        residents.length}
                    </p>

                    <Users className="h-5 w-5 text-emerald-700" />

                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Resident records
                  </p>

                </div>

                {/* HEALTH RECORDS */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-teal-500" />

                  <p className="text-xs font-semibold text-slate-500">
                    Health Records
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <p className="text-3xl font-bold text-slate-900">
                      {
                        systemVitals.length
                      }
                    </p>

                    <Activity className="h-5 w-5 text-teal-700" />

                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {
                      systemNormal
                    }{' '}
                    normal readings
                  </p>

                </div>

                {/* EVENTS */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-rose-500" />

                  <p className="text-xs font-semibold text-slate-500">
                    Threshold Events
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <p
                      className={`text-3xl font-bold ${
                        systemCritical.length >
                        0
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {
                        systemCritical.length
                      }
                    </p>

                    <AlertTriangle className="h-5 w-5 text-rose-600" />

                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    BP / temperature
                    alerts
                  </p>

                </div>

                {/* VISITOR */}
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">

                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />

                  <p className="text-xs font-semibold text-slate-500">
                    Visitor Records
                  </p>

                  <div className="mt-2 flex items-end justify-between">

                    <p className="text-3xl font-bold text-slate-900">
                      {summary?.total_visitors ??
                        visitors.length}
                    </p>

                    <CalendarDays className="h-5 w-5 text-blue-600" />

                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {summary?.visitors_checked_in ??
                      visitors.filter(
                        (
                          visitor
                        ) =>
                          visitor.status ===
                          'Checked In'
                      ).length}{' '}
                    currently checked
                    in
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                ATTENTION LIST
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <AlertTriangle className="h-4 w-4 text-rose-600" />

                    <h2 className="text-sm font-bold text-slate-900">
                      Residents Requiring Review
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Residents with
                    blood-pressure or
                    temperature
                    threshold events.
                  </p>

                </div>

                <span className="self-start rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 sm:self-auto">
                  {
                    attentionList.length
                  }{' '}
                  resident
                  {attentionList.length !==
                  1
                    ? 's'
                    : ''}
                </span>

              </div>

              {attentionList.length >
              0 ? (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[850px] text-left">

                    <thead className="border-b border-slate-200 bg-slate-50">

                      <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                        <th className="px-5 py-3">
                          Resident
                        </th>

                        <th className="px-4 py-3">
                          Room
                        </th>

                        <th className="px-4 py-3">
                          Event Count
                        </th>

                        <th className="px-4 py-3">
                          Latest Reading
                        </th>

                        <th className="px-5 py-3">
                          Medical History
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {attentionList.map(
                        (
                          item
                        ) => (
                          <tr
                            key={
                              item.res
                                ?.id
                            }
                            className="transition-colors hover:bg-rose-50/30"
                          >

                            <td className="px-5 py-3.5">

                              <button
                                type="button"
                                disabled={
                                  !onSelectResident ||
                                  !item.res
                                }
                                onClick={() => {
                                  if (
                                    item.res &&
                                    onSelectResident
                                  ) {
                                    onSelectResident(
                                      item.res
                                    );
                                  }
                                }}
                                className="text-left text-sm font-semibold text-slate-900 transition hover:text-emerald-800 hover:underline disabled:cursor-default disabled:hover:text-slate-900 disabled:hover:no-underline"
                              >
                                {
                                  item.res
                                    ?.name
                                }
                              </button>

                            </td>

                            <td className="px-4 py-3.5 text-xs text-slate-600">
                              Room{' '}
                              {
                                item.res
                                  ?.room_number
                              }
                            </td>

                            <td className="px-4 py-3.5">

                              <span className="inline-flex rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                {
                                  item.count
                                }{' '}
                                event
                                {item.count !==
                                1
                                  ? 's'
                                  : ''}
                              </span>

                            </td>

                            <td className="px-4 py-3.5">

                              <p className="text-xs font-semibold text-slate-800">
                                BP{' '}
                                {
                                  item
                                    .latestCritical
                                    ?.bp_systolic
                                }
                                /
                                {
                                  item
                                    .latestCritical
                                    ?.bp_diastolic
                                }{' '}
                                mmHg
                              </p>

                              <p className="mt-1 text-[11px] text-slate-500">
                                Temp{' '}
                                {
                                  item
                                    .latestCritical
                                    ?.temperature
                                }
                                °C
                              </p>

                            </td>

                            <td className="max-w-xs px-5 py-3.5 text-xs text-slate-600">

                              <p className="line-clamp-2">
                                {item.res
                                  ?.medical_history ||
                                  'No medical history recorded.'}
                              </p>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-emerald-700">

                  <CheckCircle2 className="h-4 w-4" />

                  No residents have
                  threshold events in
                  the selected period.

                </div>
              )}

            </section>

            {/* =================================================
                RECENT THRESHOLD EVENTS
            ================================================= */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-5 py-4">

                <div className="flex items-center gap-2">

                  <ShieldCheck className="h-4 w-4 text-emerald-700" />

                  <h2 className="text-sm font-bold text-slate-900">
                    Recent Threshold Events
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Recent abnormal
                  blood-pressure and
                  temperature readings
                  detected by
                  GoldenCare.
                </p>

              </div>

              {systemCritical.length >
              0 ? (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px] text-left">

                    <thead className="border-b border-slate-200 bg-slate-50">

                      <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                        <th className="px-5 py-3">
                          Date & Time
                        </th>

                        <th className="px-4 py-3">
                          Resident
                        </th>

                        <th className="px-4 py-3">
                          Trigger
                        </th>

                        <th className="px-4 py-3">
                          Values
                        </th>

                        <th className="px-5 py-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {systemCritical
                        .slice()
                        .sort(
                          (
                            a,
                            b
                          ) =>
                            new Date(
                              b.created_at
                            ).getTime() -
                            new Date(
                              a.created_at
                            ).getTime()
                        )
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (
                            vital
                          ) => {
                            const resident =
                              residents.find(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  vital.resident_id
                              );

                            const highBp =
                              vital.bp_systolic >
                              140;

                            const fever =
                              vital.temperature >
                              37.5;

                            return (
                              <tr
                                key={
                                  vital.id
                                }
                                className="transition-colors hover:bg-rose-50/30"
                              >

                                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                                  {formatDateTime(
                                    vital.created_at
                                  )}
                                </td>

                                <td className="px-4 py-3.5">

                                  <p className="text-xs font-semibold text-slate-900">
                                    {resident?.name ||
                                      'Resident'}
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-500">
                                    Room{' '}
                                    {resident?.room_number ||
                                      'N/A'}
                                  </p>

                                </td>

                                <td className="px-4 py-3.5 text-xs font-semibold text-rose-700">

                                  {highBp &&
                                  fever
                                    ? 'High BP & Temperature'
                                    : highBp
                                    ? 'High Blood Pressure'
                                    : 'Elevated Temperature'}

                                </td>

                                <td className="px-4 py-3.5">

                                  <p className="text-xs font-semibold text-slate-800">
                                    BP{' '}
                                    {
                                      vital.bp_systolic
                                    }
                                    /
                                    {
                                      vital.bp_diastolic
                                    }{' '}
                                    mmHg
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-500">
                                    Temp{' '}
                                    {
                                      vital.temperature
                                    }
                                    °C
                                  </p>

                                </td>

                                <td className="px-5 py-3.5">

                                  <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">

                                    <AlertTriangle className="h-3.5 w-3.5" />

                                    Alert Triggered

                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )}

                    </tbody>

                  </table>

                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-emerald-700">

                  <CheckCircle2 className="h-4 w-4" />

                  No threshold events
                  detected during this
                  reporting period.

                </div>
              )}

            </section>

          </div>
        )}

      {/* =====================================================
          PDF VIEWER
      ====================================================== */}

      {activePdfDoc && (
        <PDFViewerModal
          pdfDoc={
            activePdfDoc
          }
          title={
            pdfTitle
          }
          filename={
            pdfFilename
          }
          onClose={() =>
            setActivePdfDoc(
              null
            )
          }
        />
      )}

    </div>
  );
};