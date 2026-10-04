import React, { useMemo, useState } from 'react';
import { Resident, User } from '../types';
import { ApiError } from '../services/api';

import {
  CreateVitalResult,
  VitalInput,
} from '../services/vitalService';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Save,
  Search,
  Thermometer,
  UserRound,
  Wind,
  X,
} from 'lucide-react';

interface RecordVitalsModalProps {
  residents: Resident[];
  currentUser: User;
  initialResidentId?: number;
  onClose: () => void;
  onSubmitVital: (
    vital: VitalInput
  ) => Promise<CreateVitalResult>;
}

export const RecordVitalsModal: React.FC<
  RecordVitalsModalProps
> = ({
  residents,
  currentUser,
  initialResidentId,
  onClose,
  onSubmitVital,
}) => {
  const [residentId, setResidentId] =
    useState<number>(
      initialResidentId ||
        residents[0]?.id ||
        1
    );

  const [residentSearch, setResidentSearch] =
    useState('');

  const [showResidentResults, setShowResidentResults] =
    useState(false);

  const [bpSystolic, setBpSystolic] =
    useState<number>(120);

  const [bpDiastolic, setBpDiastolic] =
    useState<number>(80);

  const [heartRate, setHeartRate] =
    useState<number>(75);

  const [temperature, setTemperature] =
    useState<number>(36.8);

  const [oxygenLevel, setOxygenLevel] =
    useState<number>(98);

  const [
    validationErrors,
    setValidationErrors,
  ] = useState<Record<string, string>>({});

  const [
    submissionResult,
    setSubmissionResult,
  ] = useState<CreateVitalResult | null>(
    null
  );

  const [submitError, setSubmitError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /* =========================================================
     RESIDENT SEARCH
  ========================================================= */

  const selectedResident =
    residents.find(
      (resident) =>
        resident.id ===
        Number(residentId)
    );

  const filteredResidents = useMemo(() => {
    const query =
      residentSearch
        .trim()
        .toLowerCase();

    if (!query) {
      return residents;
    }

    return residents.filter(
      (resident) =>
        resident.name
          .toLowerCase()
          .includes(query) ||
        String(
          resident.room_number
        )
          .toLowerCase()
          .includes(query) ||
        resident.ic_number
          ?.toLowerCase()
          .includes(query)
    );
  }, [
    residents,
    residentSearch,
  ]);

  const handleSelectResident = (
    resident: Resident
  ) => {
    setResidentId(
      resident.id
    );

    setResidentSearch('');

    setShowResidentResults(
      false
    );

    setValidationErrors(
      (previous) => {
        const updated = {
          ...previous,
        };

        delete updated.residentId;

        return updated;
      }
    );
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validate = () => {
    const errors: Record<
      string,
      string
    > = {};

    if (!residentId) {
      errors.residentId =
        'Please select a resident.';
    }

    if (
      bpSystolic < 70 ||
      bpSystolic > 240
    ) {
      errors.bpSystolic =
        'Systolic BP must be between 70 and 240 mmHg.';
    }

    if (
      bpDiastolic < 40 ||
      bpDiastolic > 150
    ) {
      errors.bpDiastolic =
        'Diastolic BP must be between 40 and 150 mmHg.';
    }

    if (
      temperature < 35 ||
      temperature > 42
    ) {
      errors.temperature =
        'Temperature must be between 35.0°C and 42.0°C.';
    }

    if (
      heartRate < 40 ||
      heartRate > 200
    ) {
      errors.heartRate =
        'Heart rate must be between 40 and 200 BPM.';
    }

    if (
      oxygenLevel < 70 ||
      oxygenLevel > 100
    ) {
      errors.oxygenLevel =
        'SpO₂ level must be between 70% and 100%.';
    }

    setValidationErrors(
      errors
    );

    return (
      Object.keys(errors)
        .length === 0
    );
  };

  /* =========================================================
     CRITICAL LOGIC
  ========================================================= */

  const isHighSystolic =
    bpSystolic > 140;

  const isHighTemperature =
    temperature > 37.5;

  const isTriggerCriteriaMet =
    isHighSystolic ||
    isHighTemperature;

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      if (!validate()) {
        return;
      }

      setSubmitError('');

      setIsSubmitting(true);

      try {
        const result =
          await onSubmitVital({
            resident_id:
              Number(
                residentId
              ),

            bp_systolic:
              Number(
                bpSystolic
              ),

            bp_diastolic:
              Number(
                bpDiastolic
              ),

            heart_rate:
              Number(
                heartRate
              ),

            temperature:
              Number(
                temperature
              ),

            oxygen_level:
              Number(
                oxygenLevel
              ),
          });

        setSubmissionResult(
          result
        );

        if (
          !result.isCritical
        ) {
          onClose();
        }
      } catch (error) {
        if (
          error instanceof
            ApiError &&
          error.errors
        ) {
          const firstError =
            Object.values(
              error.errors
            )[0]?.[0];

          setSubmitError(
            firstError ||
              error.message
          );
        } else {
          setSubmitError(
            error instanceof
              Error
              ? error.message
              : 'Unable to save the vital record. Please try again.'
          );
        }
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  const baseInput =
    'min-h-12 w-full rounded-lg border bg-white px-3 py-2.5 text-base font-semibold text-slate-900 outline-none transition-all focus:ring-4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">

      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">

        {!submissionResult ? (
          <>
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#174c3c] px-5 py-4 text-white">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-emerald-100">
                  <Activity className="h-5 w-5" />
                </div>

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                    Health Monitoring
                  </p>

                  <h2 className="mt-0.5 text-base font-bold">
                    Record Vital Signs
                  </h2>

                  <p className="mt-0.5 text-xs text-emerald-100/70">
                    Enter the resident&apos;s current health readings.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close vital signs form"
                className="rounded-lg p-2 text-emerald-100 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="space-y-6 p-5 sm:p-6">

                {/* =================================================
                    SEARCH RESIDENT
                ================================================= */}

                <section>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="resident-search"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Select Resident
                    </label>

                    <span className="text-[10px] text-slate-400">
                      Search by name, room or IC
                    </span>

                  </div>

                  <div className="relative">

                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="resident-search"
                      type="text"
                      value={
                        residentSearch
                      }
                      onChange={(
                        event
                      ) => {
                        setResidentSearch(
                          event.target
                            .value
                        );

                        setShowResidentResults(
                          true
                        );
                      }}
                      onFocus={() =>
                        setShowResidentResults(
                          true
                        )
                      }
                      placeholder="Type resident name or room number..."
                      className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    />

                    {residentSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setResidentSearch(
                            ''
                          );

                          setShowResidentResults(
                            true
                          );
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                  </div>

                  {/* SEARCH RESULTS */}
                  {showResidentResults && (
                    <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">

                      {filteredResidents.length >
                      0 ? (
                        filteredResidents.map(
                          (
                            resident
                          ) => {
                            const isSelected =
                              resident.id ===
                              residentId;

                            return (
                              <button
                                key={
                                  resident.id
                                }
                                type="button"
                                onClick={() =>
                                  handleSelectResident(
                                    resident
                                  )
                                }
                                className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                                  isSelected
                                    ? 'bg-emerald-50'
                                    : 'hover:bg-slate-50'
                                }`}
                              >

                                <div className="flex min-w-0 items-center gap-3">

                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                      isSelected
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {resident.name
                                      .trim()
                                      .substring(
                                        0,
                                        1
                                      )
                                      .toUpperCase()}
                                  </div>

                                  <div className="min-w-0">

                                    <p
                                      className={`truncate text-sm font-semibold ${
                                        isSelected
                                          ? 'text-emerald-900'
                                          : 'text-slate-900'
                                      }`}
                                    >
                                      {
                                        resident.name
                                      }
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                      Room{' '}
                                      {
                                        resident.room_number
                                      }

                                      {resident.ic_number &&
                                        ` • ${resident.ic_number}`}
                                    </p>

                                  </div>

                                </div>

                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                )}

                              </button>
                            );
                          }
                        )
                      ) : (
                        <div className="px-4 py-6 text-center">

                          <Search className="mx-auto h-5 w-5 text-slate-300" />

                          <p className="mt-2 text-xs font-semibold text-slate-600">
                            No resident found
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Try another name or room number.
                          </p>

                        </div>
                      )}

                    </div>
                  )}

                  {/* SELECTED RESIDENT */}
                  {selectedResident && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                          <UserRound className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">

                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                            Selected Resident
                          </p>

                          <p className="truncate text-sm font-bold text-emerald-900">
                            {
                              selectedResident.name
                            }
                          </p>

                          <p className="mt-0.5 text-[11px] text-emerald-700">
                            Room{' '}
                            {
                              selectedResident.room_number
                            }
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setResidentSearch(
                            ''
                          );

                          setShowResidentResults(
                            true
                          );
                        }}
                        className="shrink-0 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Change
                      </button>

                    </div>
                  )}

                  {validationErrors.residentId && (
                    <p className="mt-1.5 text-[10px] font-medium text-rose-600">
                      {
                        validationErrors.residentId
                      }
                    </p>
                  )}

                </section>

                {/* ERROR */}
                {(submitError ||
                  Object.values(
                    validationErrors
                  )[0]) && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3"
                  >

                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                    <p className="text-xs font-medium leading-5 text-rose-700">
                      {submitError ||
                        Object.values(
                          validationErrors
                        )[0]}
                    </p>

                  </div>
                )}

                {/* BLOOD PRESSURE */}
                <section>

                  <div className="mb-3 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <HeartPulse className="h-4 w-4 text-rose-600" />

                      <div>

                        <h3 className="text-sm font-bold text-slate-900">
                          Blood Pressure
                        </h3>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Record systolic and diastolic pressure.
                        </p>

                      </div>

                    </div>

                    {isHighSystolic && (
                      <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">
                        Above Threshold
                      </span>
                    )}

                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    {/* SYSTOLIC */}
                    <div>

                      <label
                        htmlFor="bp-systolic"
                        className="mb-1.5 block text-xs font-semibold text-slate-600"
                      >
                        Systolic
                      </label>

                      <div className="relative">

                        <input
                          id="bp-systolic"
                          type="number"
                          min={70}
                          max={240}
                          value={
                            bpSystolic
                          }
                          onChange={(
                            event
                          ) =>
                            setBpSystolic(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          className={`${baseInput} pr-16 ${
                            isHighSystolic
                              ? 'border-rose-300 bg-rose-50 text-rose-800 focus:border-rose-500 focus:ring-rose-100'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                          }`}
                          required
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                          mmHg
                        </span>

                      </div>

                      {validationErrors.bpSystolic && (
                        <p className="mt-1 text-[10px] font-medium text-rose-600">
                          {
                            validationErrors.bpSystolic
                          }
                        </p>
                      )}

                    </div>

                    {/* DIASTOLIC */}
                    <div>

                      <label
                        htmlFor="bp-diastolic"
                        className="mb-1.5 block text-xs font-semibold text-slate-600"
                      >
                        Diastolic
                      </label>

                      <div className="relative">

                        <input
                          id="bp-diastolic"
                          type="number"
                          min={40}
                          max={150}
                          value={
                            bpDiastolic
                          }
                          onChange={(
                            event
                          ) =>
                            setBpDiastolic(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          className={`${baseInput} border-slate-300 pr-16 focus:border-emerald-600 focus:ring-emerald-100`}
                          required
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                          mmHg
                        </span>

                      </div>

                      {validationErrors.bpDiastolic && (
                        <p className="mt-1 text-[10px] font-medium text-rose-600">
                          {
                            validationErrors.bpDiastolic
                          }
                        </p>
                      )}

                    </div>

                  </div>

                </section>

                {/* OTHER VITALS */}
                <section>

                  <div className="mb-3">

                    <h3 className="text-sm font-bold text-slate-900">
                      Other Vital Signs
                    </h3>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Complete the remaining health readings.
                    </p>

                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">

                    {/* TEMPERATURE */}
                    <div
                      className={`rounded-xl border p-3 transition-colors ${
                        isHighTemperature
                          ? 'border-rose-200 bg-rose-50/60'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >

                      <div className="mb-2 flex items-center gap-2">

                        <Thermometer
                          className={`h-4 w-4 ${
                            isHighTemperature
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        />

                        <label
                          htmlFor="vital-temperature"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Temperature
                        </label>

                      </div>

                      <div className="relative">

                        <input
                          id="vital-temperature"
                          type="number"
                          step="0.1"
                          min={35}
                          max={42}
                          value={
                            temperature
                          }
                          onChange={(
                            event
                          ) =>
                            setTemperature(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          className={`${baseInput} pr-10 ${
                            isHighTemperature
                              ? 'border-rose-300 bg-white text-rose-800 focus:border-rose-500 focus:ring-rose-100'
                              : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                          }`}
                          required
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                          °C
                        </span>

                      </div>

                      {isHighTemperature && (
                        <p className="mt-1.5 text-[10px] font-semibold text-rose-700">
                          Above 37.5°C
                        </p>
                      )}

                    </div>

                    {/* HEART RATE */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                      <div className="mb-2 flex items-center gap-2">

                        <Activity className="h-4 w-4 text-emerald-700" />

                        <label
                          htmlFor="vital-heart-rate"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Heart Rate
                        </label>

                      </div>

                      <div className="relative">

                        <input
                          id="vital-heart-rate"
                          type="number"
                          min={40}
                          max={200}
                          value={
                            heartRate
                          }
                          onChange={(
                            event
                          ) =>
                            setHeartRate(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          className={`${baseInput} border-slate-300 pr-12 focus:border-emerald-600 focus:ring-emerald-100`}
                          required
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                          bpm
                        </span>

                      </div>

                    </div>

                    {/* OXYGEN */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">

                      <div className="mb-2 flex items-center gap-2">

                        <Wind className="h-4 w-4 text-teal-700" />

                        <label
                          htmlFor="vital-oxygen"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Oxygen Level
                        </label>

                      </div>

                      <div className="relative">

                        <input
                          id="vital-oxygen"
                          type="number"
                          min={70}
                          max={100}
                          value={
                            oxygenLevel
                          }
                          onChange={(
                            event
                          ) =>
                            setOxygenLevel(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          className={`${baseInput} border-slate-300 pr-9 focus:border-emerald-600 focus:ring-emerald-100`}
                          required
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                          %
                        </span>

                      </div>

                    </div>

                  </div>

                </section>

                {/* STATUS */}
                <section
                  className={`rounded-lg border p-3.5 ${
                    isTriggerCriteriaMet
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-emerald-200 bg-emerald-50/60'
                  }`}
                >

                  <div className="flex items-start gap-3">

                    {isTriggerCriteriaMet ? (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    )}

                    <div>

                      <p
                        className={`text-xs font-bold ${
                          isTriggerCriteriaMet
                            ? 'text-rose-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        {isTriggerCriteriaMet
                          ? 'Critical threshold detected'
                          : 'Readings within alert thresholds'}
                      </p>

                      <p
                        className={`mt-1 text-[11px] leading-5 ${
                          isTriggerCriteriaMet
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >

                        {isTriggerCriteriaMet ? (
                          <>
                            {isHighSystolic &&
                              'Systolic blood pressure is above 140 mmHg. '}

                            {isHighTemperature &&
                              'Temperature is above 37.5°C. '}

                            GoldenCare will process the critical alert when this record is saved.
                          </>
                        ) : (
                          <>
                            No blood-pressure or temperature alert threshold is currently triggered.
                          </>
                        )}

                      </p>

                    </div>

                  </div>

                </section>

              </div>

              {/* FOOTER */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-[11px] text-slate-400">

                  Recorded by{' '}

                  <span className="font-semibold text-slate-600">
                    {currentUser.name}
                  </span>

                </p>

                <div className="flex justify-end gap-2">

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={
                      isSubmitting
                    }
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:bg-slate-400 ${
                      isTriggerCriteriaMet
                        ? 'bg-rose-700 hover:bg-rose-800'
                        : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                  >
                    <Save className="h-4 w-4" />

                    {isSubmitting
                      ? 'Saving...'
                      : 'Save Vital Signs'}
                  </button>

                </div>

              </div>

            </form>
          </>
        ) : (
          <>
            {/* =================================================
                CRITICAL RESULT HEADER
            ================================================= */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-[#174c3c] px-5 py-4 text-white">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  Vital Record Saved
                </p>

                <h2 className="mt-0.5 text-base font-bold">
                  Critical Reading Recorded
                </h2>

              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-emerald-100 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-5 p-6">

              {/* SAVED */}
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-emerald-900">
                    Vital signs saved successfully
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">

                    The health record has been stored in GoldenCare for{' '}

                    <span className="font-semibold">
                      {selectedResident?.name ||
                        'the selected resident'}
                    </span>

                    .

                  </p>

                </div>

              </div>

              {/* TELEGRAM */}
              <div
                className={`rounded-xl border p-4 ${
                  submissionResult.telegramDispatched
                    ? 'border-emerald-200 bg-white'
                    : 'border-amber-200 bg-amber-50/50'
                }`}
              >

                <div className="flex items-start gap-3">

                  {submissionResult.telegramDispatched ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}

                  <div>

                    <h3
                      className={`text-sm font-bold ${
                        submissionResult.telegramDispatched
                          ? 'text-slate-900'
                          : 'text-amber-900'
                      }`}
                    >
                      {submissionResult.telegramDispatched
                        ? 'Emergency alert sent'
                        : 'Alert delivery not confirmed'}
                    </h3>

                    <p
                      className={`mt-1 text-xs leading-5 ${
                        submissionResult.telegramDispatched
                          ? 'text-slate-600'
                          : 'text-amber-800'
                      }`}
                    >
                      {submissionResult.telegramDispatched
                        ? 'The critical vital alert was successfully dispatched through the configured Telegram notification channel.'
                        : 'The vital record was saved successfully, but Telegram alert delivery could not be confirmed.'}
                    </p>

                  </div>

                </div>

              </div>

              {/* SUMMARY */}
              <div className="overflow-hidden rounded-xl border border-slate-200">

                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Record Summary
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-px bg-slate-200">

                  <div className="bg-white p-4">

                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Vital ID
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      #
                      {
                        submissionResult
                          .vital.id
                      }
                    </p>

                  </div>

                  <div className="bg-white p-4">

                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Recorded By
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {
                        currentUser.name
                      }
                    </p>

                  </div>

                </div>

              </div>

            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4" />

                Done
              </button>

            </div>

          </>
        )}

      </div>

    </div>
  );
};