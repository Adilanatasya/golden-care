import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';

import { Resident, User, Visitor, Vital } from '../types';
import { ApiError } from '../services/api';
import { VisitorInput } from '../services/visitorService';

import {
  getContactActionLinks,
  isValidPhoneNumber,
  parseEmergencyContact,
} from '../utils/contactUtils';

import { generateResidentReportPDF } from '../utils/pdfGenerator';
import { HealthTrendsChart } from './HealthTrendsChart';
import { PDFViewerModal } from './PDFViewerModal';

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Droplets,
  FileCheck2,
  FileText,
  HeartPulse,
  PhoneCall,
  Plus,
  Printer,
  Send,
  Stethoscope,
  Thermometer,
  UserRound,
  Users,
  X,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

interface ResidentProfileProps {
  resident: Resident;
  vitals: Vital[];
  visitors: Visitor[];
  users: User[];

  onBack: () => void;

  onOpenRecordVital: (
    residentId: number
  ) => void;

  onAddVisitor?: (
    visitor: VisitorInput
  ) => Promise<void>;
}

type ProfileTab =
  | 'overview'
  | 'vitals'
  | 'visitors';

type VitalsFilter =
  | 'all'
  | 'critical';

/* =========================================================
   HELPERS
========================================================= */

const isCriticalVital = (
  vital: Vital
): boolean =>
  vital.bp_systolic > 140 ||
  vital.temperature > 37.5;

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? value
    : new Intl.DateTimeFormat(
        'en-MY',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      ).format(date);
};

const formatDateTime = (
  value?: string
): string => {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? value
    : new Intl.DateTimeFormat(
        'en-MY',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(date);
};

const calculateAge = (
  dob: string
): number | null => {
  const birthDate =
    new Date(dob);

  if (
    Number.isNaN(
      birthDate.getTime()
    )
  ) {
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
      today.getDate() <
        birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

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

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({
  icon,
  title,
  description,
}) => (
  <div className="px-5 py-14 text-center">

    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      {icon}
    </div>

    <h3 className="mt-3 text-sm font-semibold text-slate-900">
      {title}
    </h3>

    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
      {description}
    </p>

  </div>
);

/* =========================================================
   COMPONENT
========================================================= */

export const ResidentProfile: React.FC<
  ResidentProfileProps
> = ({
  resident,
  vitals,
  visitors,
  users,
  onBack,
  onOpenRecordVital,
  onAddVisitor,
}) => {
  /* =======================================================
     STATES
  ======================================================= */

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ProfileTab>(
      'overview'
    );

  const [
    vitalsFilter,
    setVitalsFilter,
  ] =
    useState<VitalsFilter>(
      'all'
    );

  const [
    isHealthPassportOpen,
    setIsHealthPassportOpen,
  ] = useState(false);

  const [
    isEmergencyContactOpen,
    setIsEmergencyContactOpen,
  ] = useState(false);

  const [
    isAddVisitorOpen,
    setIsAddVisitorOpen,
  ] = useState(false);

  const [
    activePdfDoc,
    setActivePdfDoc,
  ] =
    useState<jsPDF | null>(
      null
    );

  const [
    newVisitorName,
    setNewVisitorName,
  ] = useState('');

  const [
    newVisitorRel,
    setNewVisitorRel,
  ] = useState(
    'Son / Daughter'
  );

  const [
    newVisitorPhone,
    setNewVisitorPhone,
  ] = useState('');

  const [
    isSubmittingVisitor,
    setIsSubmittingVisitor,
  ] = useState(false);

  const [
    visitorError,
    setVisitorError,
  ] = useState('');

  /* =======================================================
     RESIDENT DATA
  ======================================================= */

  const residentVitals =
    useMemo(
      () =>
        vitals
          .filter(
            (vital) =>
              vital.resident_id ===
              resident.id
          )
          .sort(
            (a, b) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          ),
      [
        resident.id,
        vitals,
      ]
    );

  const residentVisitors =
    useMemo(
      () =>
        visitors
          .filter(
            (visitor) =>
              visitor.resident_id ===
              resident.id
          )
          .sort(
            (a, b) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          ),
      [
        resident.id,
        visitors,
      ]
    );

  const latestVital =
    residentVitals[0];

  const latestVitalIsCritical =
    latestVital
      ? isCriticalVital(
          latestVital
        )
      : false;

  const criticalVitalsCount =
    residentVitals.filter(
      isCriticalVital
    ).length;

  const filteredVitals =
    residentVitals.filter(
      (vital) =>
        vitalsFilter ===
          'all' ||
        isCriticalVital(
          vital
        )
    );

  const residentAge =
    calculateAge(
      resident.dob
    );

  const parsedContact =
    useMemo(
      () =>
        parseEmergencyContact(
          resident.emergency_contact
        ),
      [
        resident.emergency_contact,
      ]
    );

  const guardianLinks =
    useMemo(
      () =>
        getContactActionLinks(
          parsedContact.phone
        ),
      [
        parsedContact.phone,
      ]
    );

  const medicalConditions =
    (
      resident.medical_history ||
      ''
    )
      .split(',')
      .map((condition) =>
        condition.trim()
      )
      .filter(Boolean);

  /* =======================================================
     PDF
  ======================================================= */

  const handleOpenPdfReport =
    () => {
      const doc =
        generateResidentReportPDF(
          {
            resident,
            vitals,
            users,
            dateRangeDays: 30,
          }
        );

      setActivePdfDoc(doc);
    };

  /* =======================================================
     ADD VISITOR
  ======================================================= */

  const handleAddVisitor =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      if (
        !onAddVisitor ||
        !newVisitorName.trim()
      ) {
        return;
      }

      if (
        !isValidPhoneNumber(
          newVisitorPhone
        )
      ) {
        setVisitorError(
          'Enter a valid Malaysian phone number.'
        );

        return;
      }

      setVisitorError('');
      setIsSubmittingVisitor(
        true
      );

      try {
        await onAddVisitor({
          resident_id:
            resident.id,

          visitor_name:
            newVisitorName.trim(),

          relationship:
            newVisitorRel,

          contact_phone:
            newVisitorPhone.trim(),

           check_in: new Date(
    getLocalDateTimeInput()
  ).toISOString(),

          status:
            'Checked In',
        });

        setNewVisitorName('');
        setNewVisitorPhone('');

        setNewVisitorRel(
          'Son / Daughter'
        );

        setIsAddVisitorOpen(
          false
        );
      } catch (error) {
        setVisitorError(
          error instanceof ApiError
            ? error.message
            : 'Unable to save the visitor. Please try again.'
        );
      } finally {
        setIsSubmittingVisitor(
          false
        );
      }
    };

  /* =======================================================
     TABS
  ======================================================= */

  const tabs: Array<{
    id: ProfileTab;
    label: string;
    count?: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <ClipboardList className="h-4 w-4" />
      ),
    },
    {
      id: 'vitals',
      label:
        'Vitals & Trends',
      count:
        residentVitals.length,
      icon: (
        <Activity className="h-4 w-4" />
      ),
    },
    {
      id: 'visitors',
      label:
        'Visitor Records',
      count:
        residentVisitors.length,
      icon: (
        <Users className="h-4 w-4" />
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* =====================================================
          TOP ACTION BAR
      ====================================================== */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex min-h-10
            w-fit items-center gap-2
            rounded-lg border
            border-slate-300
            bg-white px-3.5 py-2
            text-xs font-semibold
            text-slate-700
            transition-all
            hover:border-emerald-300
            hover:bg-emerald-50
            hover:text-emerald-800
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Residents
        </button>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setIsEmergencyContactOpen(
                true
              )
            }
            className="
              inline-flex min-h-10
              items-center gap-2
              rounded-lg border
              border-rose-200
              bg-white px-3.5 py-2
              text-xs font-semibold
              text-rose-700
              transition-colors
              hover:bg-rose-50
            "
          >
            <PhoneCall className="h-4 w-4" />
            Emergency Contact
          </button>

          <button
            type="button"
            onClick={() =>
              setIsHealthPassportOpen(
                true
              )
            }
            className="
              inline-flex min-h-10
              items-center gap-2
              rounded-lg border
              border-slate-300
              bg-white px-3.5 py-2
              text-xs font-semibold
              text-slate-700
              transition-colors
              hover:bg-slate-50
            "
          >
            <Printer className="h-4 w-4" />
            Health Passport
          </button>

          <button
            type="button"
            onClick={
              handleOpenPdfReport
            }
            className="
              inline-flex min-h-10
              items-center gap-2
              rounded-lg
              bg-[#174c3c]
              px-4 py-2
              text-xs font-semibold
              text-white
              transition-all
              hover:-translate-y-0.5
              hover:bg-[#123f32]
              hover:shadow-md
            "
          >
            <FileText className="h-4 w-4" />
            Generate PDF
          </button>

        </div>

      </div>

      {/* =====================================================
          RESIDENT HEADER
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">

        <div className="bg-[#174c3c] px-6 py-6 text-white">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold text-white ring-1 ring-white/20">
                {resident.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-50 ring-1 ring-white/15">
                    Room{' '}
                    {
                      resident.room_number
                    }
                  </span>

                  <span
                    className={`
                      inline-flex items-center gap-1.5
                      rounded-md border px-2.5 py-1
                      text-xs font-semibold
                      ${
                        latestVital
                          ? latestVitalIsCritical
                            ? 'border-rose-300/40 bg-rose-500/15 text-rose-100'
                            : 'border-emerald-200/30 bg-white/10 text-emerald-100'
                          : 'border-white/20 bg-white/10 text-slate-200'
                      }
                    `}
                  >
                    <span
                      className={`
                        h-1.5 w-1.5 rounded-full
                        ${
                          latestVital
                            ? latestVitalIsCritical
                              ? 'bg-rose-300'
                              : 'bg-emerald-300'
                            : 'bg-slate-300'
                        }
                      `}
                    />

                    {latestVital
                      ? latestVitalIsCritical
                        ? 'Review Required'
                        : 'Stable'
                      : 'No Vital Reading'}
                  </span>

                </div>

                <h1 className="mt-3 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {resident.name}
                </h1>

                <p className="mt-1 text-sm text-emerald-50/75">
                  {resident.gender}

                  {residentAge !==
                  null
                    ? ` • ${residentAge} years old`
                    : ''}

                  {' • '}IC{' '}
                  {
                    resident.ic_number
                  }
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                onOpenRecordVital(
                  resident.id
                )
              }
              className="
                inline-flex min-h-11
                items-center justify-center
                gap-2 rounded-lg
                bg-white px-5 py-2.5
                text-sm font-semibold
                text-[#174c3c]
                shadow-sm
                transition-all
                hover:-translate-y-0.5
                hover:bg-emerald-50
                hover:shadow-md
              "
            >
              <Stethoscope className="h-4 w-4" />
              Record New Vitals
            </button>

          </div>

        </div>

        {/* =================================================
            QUICK PROFILE SUMMARY
        ================================================== */}

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">

          <div className="p-4 sm:p-5">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Date of Birth
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatDate(
                resident.dob
              )}
            </p>

          </div>

          <div className="p-4 sm:p-5">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Vital Records
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {
                residentVitals.length
              }{' '}
              readings
            </p>

          </div>

          <div className="p-4 sm:p-5">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Critical Records
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${
                criticalVitalsCount >
                0
                  ? 'text-rose-700'
                  : 'text-emerald-700'
              }`}
            >
              {
                criticalVitalsCount
              }
            </p>

          </div>

          <div className="p-4 sm:p-5">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Last Recorded
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {latestVital
                ? formatDateTime(
                    latestVital.created_at
                  )
                : 'No reading yet'}
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          TAB NAVIGATION
      ====================================================== */}

      <nav
        aria-label="Resident profile sections"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >

        {tabs.map((tab) => {
          const isActive =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id
                )
              }
              aria-current={
                isActive
                  ? 'page'
                  : undefined
              }
              className={`
                relative inline-flex
                min-h-11 shrink-0
                items-center gap-2
                px-4 py-2
                text-sm font-semibold
                transition-colors
                ${
                  isActive
                    ? 'text-emerald-800'
                    : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              {tab.icon}

              <span>
                {tab.label}
              </span>

              {tab.count !==
                undefined && (
                <span
                  className={`
                    rounded-full
                    px-1.5 py-0.5
                    text-[10px]
                    ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}

              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700" />
              )}

            </button>
          );
        })}

      </nav>

      {/* =====================================================
          OVERVIEW
      ====================================================== */}

      {activeTab ===
        'overview' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">

          {/* ===============================================
              LEFT
          ================================================ */}

          <div className="space-y-6">

            {/* LATEST VITALS */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <HeartPulse className="h-4 w-4 text-emerald-700" />

                    <h2 className="text-sm font-bold text-slate-900">
                      Latest Vital Signs
                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Most recent health
                    measurements recorded
                    for this resident.
                  </p>

                </div>

                {latestVital && (
                  <span className="text-xs text-slate-500">
                    {formatDateTime(
                      latestVital.created_at
                    )}
                  </span>
                )}

              </div>

              {latestVital ? (
                <>

                  <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">

                    {/* BP */}
                    <div
                      className={`p-5 ${
                        latestVital.bp_systolic >
                        140
                          ? 'bg-rose-50/60'
                          : ''
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <HeartPulse
                          className={`h-4 w-4 ${
                            latestVital.bp_systolic >
                            140
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        />

                        {latestVital.bp_systolic >
                          140 && (
                          <span className="text-[10px] font-semibold uppercase text-rose-600">
                            High
                          </span>
                        )}

                      </div>

                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Blood Pressure
                      </p>

                      <p
                        className={`mt-1 font-mono text-xl font-bold ${
                          latestVital.bp_systolic >
                          140
                            ? 'text-rose-700'
                            : 'text-slate-900'
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

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        mmHg
                      </p>

                    </div>

                    {/* TEMP */}
                    <div
                      className={`p-5 ${
                        latestVital.temperature >
                        37.5
                          ? 'bg-rose-50/60'
                          : ''
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <Thermometer
                          className={`h-4 w-4 ${
                            latestVital.temperature >
                            37.5
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}
                        />

                        {latestVital.temperature >
                          37.5 && (
                          <span className="text-[10px] font-semibold uppercase text-rose-600">
                            High
                          </span>
                        )}

                      </div>

                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Temperature
                      </p>

                      <p
                        className={`mt-1 font-mono text-xl font-bold ${
                          latestVital.temperature >
                          37.5
                            ? 'text-rose-700'
                            : 'text-slate-900'
                        }`}
                      >
                        {
                          latestVital.temperature
                        }
                        °C
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Body temperature
                      </p>

                    </div>

                    {/* HEART RATE */}
                    <div className="p-5">

                      <Activity className="h-4 w-4 text-slate-400" />

                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Heart Rate
                      </p>

                      <p className="mt-1 font-mono text-xl font-bold text-slate-900">
                        {
                          latestVital.heart_rate
                        }
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        beats per minute
                      </p>

                    </div>

                    {/* SPO2 */}
                    <div className="p-5">

                      <Droplets className="h-4 w-4 text-slate-400" />

                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Oxygen Level
                      </p>

                      <p className="mt-1 font-mono text-xl font-bold text-slate-900">
                        {
                          latestVital.oxygen_level
                        }
                        %
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        SpO₂
                      </p>

                    </div>

                  </div>

                  {latestVitalIsCritical && (
                    <div className="border-t border-rose-200 bg-rose-50 px-5 py-4">

                      <div className="flex items-start gap-3">

                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />

                        <div>
                          <p className="text-sm font-semibold text-rose-800">
                            Clinical review
                            required
                          </p>

                          <p className="mt-1 text-xs leading-5 text-rose-700">
                            The latest
                            reading exceeded
                            the configured
                            blood pressure or
                            temperature
                            threshold.
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                </>
              ) : (
                <EmptyState
                  icon={
                    <Stethoscope className="h-5 w-5" />
                  }
                  title="No vital reading recorded"
                  description="Record the first vital signs measurement to begin monitoring this resident."
                />
              )}

            </section>

            {/* RECENT MEASUREMENTS */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Recent Measurements
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest three health
                    records.
                  </p>

                </div>

                {residentVitals.length >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        'vitals'
                      )
                    }
                    className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
                  >
                    View All
                  </button>
                )}

              </div>

              {residentVitals.length >
              0 ? (
                <div className="divide-y divide-slate-100">

                  {residentVitals
                    .slice(0, 3)
                    .map(
                      (vital) => {
                        const caregiver =
                          users.find(
                            (user) =>
                              user.id ===
                              vital.recorded_by
                          );

                        const critical =
                          isCriticalVital(
                            vital
                          );

                        return (
                          <div
                            key={
                              vital.id
                            }
                            className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div className="flex items-center gap-3">

                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                  critical
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {critical ? (
                                  <AlertTriangle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </div>

                              <div>

                                <p className="text-sm font-semibold text-slate-900">
                                  BP{' '}
                                  {
                                    vital.bp_systolic
                                  }
                                  /
                                  {
                                    vital.bp_diastolic
                                  }
                                  {' • '}
                                  {
                                    vital.temperature
                                  }
                                  °C
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {caregiver?.name ||
                                    'Caregiver staff'}
                                  {' • '}
                                  {formatDateTime(
                                    vital.created_at
                                  )}
                                </p>

                              </div>

                            </div>

                            <span
                              className={`w-fit rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                critical
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {critical
                                ? 'Review Required'
                                : 'Normal'}
                            </span>

                          </div>
                        );
                      }
                    )}

                </div>
              ) : (
                <EmptyState
                  icon={
                    <Activity className="h-5 w-5" />
                  }
                  title="No measurement history"
                  description="Recent measurements will appear here after vital signs are recorded."
                />
              )}

            </section>

          </div>

          {/* ===============================================
              RIGHT SIDE
          ================================================ */}

          <aside className="space-y-5">

            {/* RESIDENT INFORMATION */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">

                <UserRound className="h-4 w-4 text-emerald-700" />

                <h2 className="text-sm font-bold text-slate-900">
                  Resident Information
                </h2>

              </div>

              <dl className="mt-4 space-y-3.5">

                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    IC Number
                  </dt>

                  <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
                    {
                      resident.ic_number
                    }
                  </dd>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Gender / Age
                  </dt>

                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {
                      resident.gender
                    }
                    {residentAge !==
                    null
                      ? ` • ${residentAge} years`
                      : ''}
                  </dd>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Room
                  </dt>

                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {
                      resident.room_number
                    }
                  </dd>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Registered
                  </dt>

                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(
                      resident.created_at
                    )}
                  </dd>
                </div>

              </dl>

            </section>

            {/* MEDICAL HISTORY */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">

                <ClipboardList className="h-4 w-4 text-emerald-700" />

                <h2 className="text-sm font-bold text-slate-900">
                  Medical History
                </h2>

              </div>

              {medicalConditions.length >
              0 ? (
                <div className="mt-4 space-y-2">

                  {medicalConditions.map(
                    (
                      condition,
                      index
                    ) => (
                      <div
                        key={`${condition}-${index}`}
                        className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />

                        <span className="text-xs font-medium leading-5 text-slate-700">
                          {condition}
                        </span>
                      </div>
                    )
                  )}

                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No medical history
                  recorded.
                </p>
              )}

            </section>

            {/* EMERGENCY CONTACT */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                <div className="flex items-center gap-2">

                  <PhoneCall className="h-4 w-4 text-rose-600" />

                  <h2 className="text-sm font-bold text-slate-900">
                    Emergency Contact
                  </h2>

                </div>

                {parsedContact.relationship && (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    {
                      parsedContact.relationship
                    }
                  </span>
                )}

              </div>

              <div className="py-4">

                <p className="text-sm font-semibold text-slate-900">
                  {parsedContact.name ||
                    'Next-of-kin not named'}
                </p>

                <p className="mt-1 font-mono text-xs text-slate-500">
                  {parsedContact.phone ||
                    'No phone number recorded'}
                </p>

              </div>

              <div className="grid grid-cols-2 gap-2">

                <a
                  href={
                    guardianLinks.telUrl
                  }
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors ${
                    guardianLinks.isValid
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'pointer-events-none bg-slate-100 text-slate-400'
                  }`}
                >
                  <PhoneCall className="h-4 w-4" />
                  Call
                </a>

                <a
                  href={
                    guardianLinks.telegramUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors ${
                    guardianLinks.isValid
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'pointer-events-none border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Telegram
                </a>

              </div>

            </section>

          </aside>

        </div>
      )}

      {/* =====================================================
          VITALS & TRENDS
      ====================================================== */}

      {activeTab ===
        'vitals' && (
        <div className="space-y-6">

          <HealthTrendsChart
            resident={resident}
            vitals={vitals}
          />

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <Stethoscope className="h-4 w-4 text-emerald-700" />

                  <h2 className="text-sm font-bold text-slate-900">
                    Vital Measurement
                    History
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Complete health
                  readings recorded by
                  the care team.
                </p>

              </div>

              <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-100 p-1">

                {(
                  [
                    'all',
                    'critical',
                  ] as const
                ).map(
                  (filter) => (
                    <button
                      key={
                        filter
                      }
                      type="button"
                      onClick={() =>
                        setVitalsFilter(
                          filter
                        )
                      }
                      className={`min-h-9 rounded-md px-3 text-xs font-semibold capitalize transition-all ${
                        vitalsFilter ===
                        filter
                          ? 'bg-[#174c3c] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {filter ===
                      'all'
                        ? `All (${residentVitals.length})`
                        : `Critical (${criticalVitalsCount})`}
                    </button>
                  )
                )}

              </div>

            </div>

            {filteredVitals.length >
            0 ? (
              <>

                {/* DESKTOP */}
                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full text-left">

                    <thead className="border-b border-slate-200 bg-slate-50">

                      <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">

                        <th className="px-5 py-3">
                          Recorded At
                        </th>

                        <th className="px-4 py-3">
                          Blood Pressure
                        </th>

                        <th className="px-4 py-3">
                          Temperature
                        </th>

                        <th className="px-4 py-3">
                          Heart Rate
                        </th>

                        <th className="px-4 py-3">
                          SpO₂
                        </th>

                        <th className="px-4 py-3">
                          Recorded By
                        </th>

                        <th className="px-5 py-3">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredVitals.map(
                        (vital) => {
                          const caregiver =
                            users.find(
                              (user) =>
                                user.id ===
                                vital.recorded_by
                            );

                          const critical =
                            isCriticalVital(
                              vital
                            );

                          return (
                            <tr
                              key={
                                vital.id
                              }
                              className="transition-colors hover:bg-emerald-50/30"
                            >

                              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                                {formatDateTime(
                                  vital.created_at
                                )}
                              </td>

                              <td
                                className={`px-4 py-4 font-mono text-sm font-semibold ${
                                  vital.bp_systolic >
                                  140
                                    ? 'text-rose-700'
                                    : 'text-slate-900'
                                }`}
                              >
                                {
                                  vital.bp_systolic
                                }
                                /
                                {
                                  vital.bp_diastolic
                                }

                                <span className="ml-1 text-[10px] font-normal text-slate-400">
                                  mmHg
                                </span>
                              </td>

                              <td
                                className={`px-4 py-4 font-mono text-sm font-semibold ${
                                  vital.temperature >
                                  37.5
                                    ? 'text-rose-700'
                                    : 'text-slate-900'
                                }`}
                              >
                                {
                                  vital.temperature
                                }
                                °C
                              </td>

                              <td className="px-4 py-4 font-mono text-sm text-slate-700">
                                {
                                  vital.heart_rate
                                }{' '}
                                bpm
                              </td>

                              <td className="px-4 py-4 font-mono text-sm text-slate-700">
                                {
                                  vital.oxygen_level
                                }
                                %
                              </td>

                              <td className="px-4 py-4 text-xs font-medium text-slate-700">
                                {caregiver?.name ||
                                  'Caregiver staff'}
                              </td>

                              <td className="px-5 py-4">

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                    critical
                                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {critical ? (
                                    <AlertTriangle className="h-3 w-3" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}

                                  {critical
                                    ? 'Alert Triggered'
                                    : 'Normal'}
                                </span>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {/* MOBILE */}
                <div className="divide-y divide-slate-100 md:hidden">

                  {filteredVitals.map(
                    (vital) => {
                      const caregiver =
                        users.find(
                          (user) =>
                            user.id ===
                            vital.recorded_by
                        );

                      const critical =
                        isCriticalVital(
                          vital
                        );

                      return (
                        <article
                          key={
                            vital.id
                          }
                          className="p-4"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div>

                              <p className="text-xs text-slate-500">
                                {formatDateTime(
                                  vital.created_at
                                )}
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-900">
                                {caregiver?.name ||
                                  'Caregiver staff'}
                              </p>

                            </div>

                            <span
                              className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${
                                critical
                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {critical
                                ? 'Alert'
                                : 'Normal'}
                            </span>

                          </div>

                          <div className="mt-3 grid grid-cols-4 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50 text-center">

                            <div className="p-2">
                              <p className="text-[9px] font-semibold text-slate-400">
                                BP
                              </p>

                              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                                {
                                  vital.bp_systolic
                                }
                                /
                                {
                                  vital.bp_diastolic
                                }
                              </p>
                            </div>

                            <div className="p-2">
                              <p className="text-[9px] font-semibold text-slate-400">
                                TEMP
                              </p>

                              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                                {
                                  vital.temperature
                                }
                                °
                              </p>
                            </div>

                            <div className="p-2">
                              <p className="text-[9px] font-semibold text-slate-400">
                                PULSE
                              </p>

                              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                                {
                                  vital.heart_rate
                                }
                              </p>
                            </div>

                            <div className="p-2">
                              <p className="text-[9px] font-semibold text-slate-400">
                                SpO₂
                              </p>

                              <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                                {
                                  vital.oxygen_level
                                }
                                %
                              </p>
                            </div>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>

              </>
            ) : (
              <EmptyState
                icon={
                  <Activity className="h-5 w-5" />
                }
                title={
                  vitalsFilter ===
                  'critical'
                    ? 'No critical readings'
                    : 'No vital readings'
                }
                description={
                  vitalsFilter ===
                  'critical'
                    ? 'No readings exceeded the configured alert thresholds.'
                    : 'Record the first vital signs measurement for this resident.'
                }
              />
            )}

          </section>

        </div>
      )}

      {/* =====================================================
          VISITORS
      ====================================================== */}

      {activeTab ===
        'visitors' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Users className="h-4 w-4 text-emerald-700" />

                <h2 className="text-sm font-bold text-slate-900">
                  Family & Visitor
                  Records
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                Visitor activity recorded
                for {resident.name}.
              </p>

            </div>

            {onAddVisitor && (
              <button
                type="button"
                onClick={() =>
                  setIsAddVisitorOpen(
                    true
                  )
                }
                className="
                  inline-flex min-h-10
                  items-center justify-center
                  gap-2 rounded-lg
                  bg-emerald-700
                  px-4 py-2
                  text-xs font-semibold
                  text-white
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-emerald-800
                  hover:shadow-sm
                "
              >
                <Plus className="h-4 w-4" />
                Register Visitor
              </button>
            )}

          </div>

          {residentVisitors.length >
          0 ? (
            <>

              {/* DESKTOP */}
              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left">

                  <thead className="border-b border-slate-200 bg-slate-50">

                    <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">

                      <th className="px-5 py-3">
                        Visitor
                      </th>

                      <th className="px-4 py-3">
                        Relationship
                      </th>

                      <th className="px-4 py-3">
                        Contact
                      </th>

                      <th className="px-4 py-3">
                        Check-In
                      </th>

                      <th className="px-4 py-3">
                        Check-Out
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {residentVisitors.map(
                      (visitor) => (
                        <tr
                          key={
                            visitor.id
                          }
                          className="transition-colors hover:bg-emerald-50/30"
                        >

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {
                              visitor.visitor_name
                            }
                          </td>

                          <td className="px-4 py-4 text-xs text-slate-600">
                            {
                              visitor.relationship
                            }
                          </td>

                          <td className="px-4 py-4 font-mono text-xs text-slate-600">
                            {visitor.contact_phone ||
                              'Not recorded'}
                          </td>

                          <td className="px-4 py-4 text-xs text-slate-600">
                            {formatDateTime(
                              visitor.check_in ||
                                visitor.visit_date
                            )}
                          </td>

                          <td className="px-4 py-4 text-xs text-slate-600">
                            {visitor.check_out
                              ? formatDateTime(
                                  visitor.check_out
                                )
                              : '—'}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                visitor.status ===
                                'Checked In'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : visitor.status ===
                                    'Checked Out'
                                  ? 'border-slate-200 bg-slate-100 text-slate-600'
                                  : 'border-amber-200 bg-amber-50 text-amber-700'
                              }`}
                            >
                              {
                                visitor.status
                              }
                            </span>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}
              <div className="divide-y divide-slate-100 md:hidden">

                {residentVisitors.map(
                  (visitor) => (
                    <article
                      key={
                        visitor.id
                      }
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h3 className="text-sm font-semibold text-slate-900">
                            {
                              visitor.visitor_name
                            }
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              visitor.relationship
                            }

                            {' • '}

                            {visitor.contact_phone ||
                              'No phone'}
                          </p>

                        </div>

                        <span
                          className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${
                            visitor.status ===
                            'Checked In'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {
                            visitor.status
                          }
                        </span>

                      </div>

                      <div className="mt-3 grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">

                        <div className="p-3">

                          <p className="text-[9px] font-semibold uppercase text-slate-400">
                            Check-In
                          </p>

                          <p className="mt-1 text-xs text-slate-700">
                            {formatDateTime(
                              visitor.check_in ||
                                visitor.visit_date
                            )}
                          </p>

                        </div>

                        <div className="p-3">

                          <p className="text-[9px] font-semibold uppercase text-slate-400">
                            Check-Out
                          </p>

                          <p className="mt-1 text-xs text-slate-700">
                            {visitor.check_out
                              ? formatDateTime(
                                  visitor.check_out
                                )
                              : 'Not yet'}
                          </p>

                        </div>

                      </div>

                    </article>
                  )
                )}

              </div>

            </>
          ) : (
            <EmptyState
              icon={
                <Users className="h-5 w-5" />
              }
              title="No visitor records"
              description="Registered visitor activity for this resident will appear here."
            />
          )}

        </section>
      )}

      {/* =====================================================
          EMERGENCY CONTACT MODAL
      ====================================================== */}

      {isEmergencyContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-contact-title"
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                  Resident Safety
                </p>

                <h2
                  id="emergency-contact-title"
                  className="mt-1 text-base font-bold text-slate-900"
                >
                  Emergency Next-of-Kin
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setIsEmergencyContactOpen(
                    false
                  )
                }
                aria-label="Close emergency contact"
                className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="p-5">

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Contact Person
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {parsedContact.name ||
                        'Next-of-kin not named'}
                    </p>

                    <p className="mt-1 font-mono text-sm text-slate-600">
                      {parsedContact.phone ||
                        'No phone number recorded'}
                    </p>

                  </div>

                  {parsedContact.relationship && (
                    <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {
                        parsedContact.relationship
                      }
                    </span>
                  )}

                </div>

                <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                  Primary emergency
                  contact for{' '}
                  {resident.name},
                  Room{' '}
                  {
                    resident.room_number
                  }.
                </p>

              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">

                <a
                  href={
                    guardianLinks.telUrl
                  }
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${
                    guardianLinks.isValid
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'pointer-events-none bg-slate-100 text-slate-400'
                  }`}
                >
                  <PhoneCall className="h-4 w-4" />
                  Call Contact
                </a>

                <a
                  href={
                    guardianLinks.telegramUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold ${
                    guardianLinks.isValid
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'pointer-events-none border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Telegram
                </a>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          HEALTH PASSPORT MODAL
      ====================================================== */}

      {isHealthPassportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="health-passport-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <FileCheck2 className="h-4 w-4" />
                </div>

                <div>

                  <h2
                    id="health-passport-title"
                    className="font-bold text-slate-900"
                  >
                    Resident Health
                    Passport
                  </h2>

                  <p className="text-xs text-slate-500">
                    Printable resident
                    care summary
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setIsHealthPassportOpen(
                    false
                  )
                }
                aria-label="Close health passport"
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="p-5">

              <div className="overflow-hidden rounded-xl border border-slate-200">

                <div className="bg-[#174c3c] px-5 py-4 text-white">

                  <p className="text-xl font-bold">
                    {resident.name}
                  </p>

                  <p className="mt-1 font-mono text-xs text-emerald-50/75">
                    IC{' '}
                    {
                      resident.ic_number
                    }
                    {' • '}Room{' '}
                    {
                      resident.room_number
                    }
                  </p>

                </div>

                <div className="p-5">

                  <dl className="grid grid-cols-1 gap-5 text-xs sm:grid-cols-2">

                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-slate-400">
                        Gender / DOB
                      </dt>

                      <dd className="mt-1 font-semibold text-slate-900">
                        {
                          resident.gender
                        }
                        {' • '}
                        {formatDate(
                          resident.dob
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-slate-400">
                        Emergency Contact
                      </dt>

                      <dd className="mt-1 font-semibold text-slate-900">
                        {parsedContact.name ||
                          'Not recorded'}

                        {parsedContact.phone
                          ? ` • ${parsedContact.phone}`
                          : ''}
                      </dd>
                    </div>

                    <div className="sm:col-span-2">

                      <dt className="font-semibold uppercase tracking-wide text-slate-400">
                        Medical History
                      </dt>

                      <dd className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                        {resident.medical_history ||
                          'No medical history recorded'}
                      </dd>

                    </div>

                  </dl>

                  {latestVital && (
                    <div className="mt-5 border-t border-slate-200 pt-4">

                      <div className="mb-3 flex items-center justify-between gap-3">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Latest Vital
                          Signs
                        </p>

                        <p className="text-[10px] text-slate-500">
                          {formatDateTime(
                            latestVital.created_at
                          )}
                        </p>

                      </div>

                      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 rounded-lg border border-slate-200 sm:grid-cols-4 sm:divide-y-0">

                        <div className="p-3 text-center">
                          <span className="block text-[9px] text-slate-400">
                            BP
                          </span>

                          <strong className="mt-1 block font-mono text-xs text-slate-900">
                            {
                              latestVital.bp_systolic
                            }
                            /
                            {
                              latestVital.bp_diastolic
                            }
                          </strong>
                        </div>

                        <div className="p-3 text-center">
                          <span className="block text-[9px] text-slate-400">
                            TEMP
                          </span>

                          <strong className="mt-1 block font-mono text-xs text-slate-900">
                            {
                              latestVital.temperature
                            }
                            °C
                          </strong>
                        </div>

                        <div className="p-3 text-center">
                          <span className="block text-[9px] text-slate-400">
                            PULSE
                          </span>

                          <strong className="mt-1 block font-mono text-xs text-slate-900">
                            {
                              latestVital.heart_rate
                            }
                          </strong>
                        </div>

                        <div className="p-3 text-center">
                          <span className="block text-[9px] text-slate-400">
                            SpO₂
                          </span>

                          <strong className="mt-1 block font-mono text-xs text-slate-900">
                            {
                              latestVital.oxygen_level
                            }
                            %
                          </strong>
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>

              <div className="mt-5 flex justify-end gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setIsHealthPassportOpen(
                      false
                    )
                  }
                  className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <Printer className="h-4 w-4" />
                  Print Passport
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD VISITOR MODAL
      ====================================================== */}

      {isAddVisitorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">

          <form
            onSubmit={
              handleAddVisitor
            }
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Visitor Management
                </p>

                <h2 className="mt-1 font-bold text-slate-900">
                  Register Resident
                  Visitor
                </h2>

              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddVisitorOpen(
                    false
                  );

                  setVisitorError(
                    ''
                  );
                }}
                aria-label="Close visitor form"
                className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-4 p-5 text-sm">

              {visitorError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />

                  {visitorError}
                </div>
              )}

              {/* NAME */}
              <div>

                <label
                  htmlFor="visitor-name"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Visitor Full Name{' '}
                  <span className="text-rose-600">
                    *
                  </span>
                </label>

                <input
                  id="visitor-name"
                  type="text"
                  required
                  value={
                    newVisitorName
                  }
                  onChange={(
                    event
                  ) =>
                    setNewVisitorName(
                      event.target
                        .value
                    )
                  }
                  placeholder="Example: Farhan Ahmad"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                />

              </div>

              {/* RELATIONSHIP */}
              <div>

                <label
                  htmlFor="visitor-relationship"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Relationship{' '}
                  <span className="text-rose-600">
                    *
                  </span>
                </label>

                <select
                  id="visitor-relationship"
                  value={
                    newVisitorRel
                  }
                  onChange={(
                    event
                  ) =>
                    setNewVisitorRel(
                      event.target
                        .value
                    )
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="Son / Daughter">
                    Son / Daughter
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
                </select>

              </div>

              {/* PHONE */}
              <div>

                <div className="mb-1.5 flex items-center justify-between gap-2">

                  <label
                    htmlFor="visitor-phone"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Contact Phone{' '}
                    <span className="text-rose-600">
                      *
                    </span>
                  </label>

                  {newVisitorPhone &&
                    isValidPhoneNumber(
                      newVisitorPhone
                    ) && (
                    <span className="text-[10px] font-semibold text-emerald-700">
                      Valid format
                    </span>
                  )}

                </div>

                <input
                  id="visitor-phone"
                  type="tel"
                  required
                  value={
                    newVisitorPhone
                  }
                  onChange={(
                    event
                  ) =>
                    setNewVisitorPhone(
                      event.target
                        .value
                    )
                  }
                  placeholder="Example: 012-3456789"
                  className={`min-h-11 w-full rounded-lg border px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-4 ${
                    newVisitorPhone &&
                    !isValidPhoneNumber(
                      newVisitorPhone
                    )
                      ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />

              </div>

              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">

                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

                <p>
                  The current date and
                  time will be recorded
                  automatically as the
                  visitor&apos;s
                  check-in time.
                </p>

              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={() => {
                  setIsAddVisitorOpen(
                    false
                  );

                  setVisitorError(
                    ''
                  );
                }}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSubmittingVisitor ||
                  !newVisitorName.trim() ||
                  !isValidPhoneNumber(
                    newVisitorPhone
                  )
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingVisitor
                  ? 'Saving...'
                  : 'Save Visitor'}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* =====================================================
          PDF VIEWER
      ====================================================== */}

      {activePdfDoc && (
        <PDFViewerModal
          pdfDoc={activePdfDoc}
          title={`Resident Health Report — ${resident.name}`}
          filename={`GoldenCare_Resident_${resident.name.replace(
            /\s+/g,
            '_'
          )}_Report.pdf`}
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