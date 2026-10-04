import React, { useState } from 'react';

import { Resident } from '../types';

import {
  formatEmergencyContact,
  isValidPhoneNumber,
} from '../utils/contactUtils';

import { ApiError } from '../services/api';

import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

/* =========================================================
   PROPS
========================================================= */

interface AddResidentViewProps {
  onAddResident: (
    resident: Omit<
      Resident,
      'id' | 'created_at'
    >
  ) => Promise<void>;

  onNavigate: (
    view: any
  ) => void;

  onSelectResident?: (
    resident: Resident
  ) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export const AddResidentView: React.FC<
  AddResidentViewProps
> = ({
  onAddResident,
  onNavigate,
}) => {
  /* =======================================================
     STEP
  ======================================================= */

  const [
    currentStep,
    setCurrentStep,
  ] =
    useState<1 | 2 | 3>(
      1
    );

  const [
    validationError,
    setValidationError,
  ] =
    useState<
      string | null
    >(null);

  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* =======================================================
     STEP 1
  ======================================================= */

  const [
    name,
    setName,
  ] = useState('');

  const [
    icNumber,
    setIcNumber,
  ] = useState('');

  const [
    dob,
    setDob,
  ] = useState('');

  const [
    gender,
    setGender,
  ] =
    useState<
      'Male' | 'Female'
    >('Female');

  const [
    roomNumber,
    setRoomNumber,
  ] = useState('');

  /* =======================================================
     STEP 2
  ======================================================= */

  const [
    medicalHistory,
    setMedicalHistory,
  ] = useState('');

  const [
    dietaryPreference,
    setDietaryPreference,
  ] = useState(
    'Regular Eldercare Meal Plan'
  );

  const [
    mobilityStatus,
    setMobilityStatus,
  ] = useState(
    'Independent Walking'
  );

  /* =======================================================
     STEP 3
  ======================================================= */

  const [
    guardianName,
    setGuardianName,
  ] = useState('');

  const [
    guardianRelationship,
    setGuardianRelationship,
  ] =
    useState('Son');

  const [
    customRelationship,
    setCustomRelationship,
  ] = useState('');

  const [
    guardianPhone,
    setGuardianPhone,
  ] = useState('');

  /* =======================================================
     OPTIONS
  ======================================================= */

  const relationshipOptions =
    [
      'Son',
      'Daughter',
      'Spouse',
      'Sibling',
      'Grandchild',
      'Legal Guardian',
      'Relative',
      'Other (Specify)',
    ];

  const commonConditions =
    [
      'Hypertension',
      'Diabetes Mellitus Type 2',
      'Post-Stroke Recovery',
      'Osteoarthritis',
      'Coronary Artery Disease',
      'Bronchial Asthma',
      'Mild Dementia',
      'Hyperlipidemia',
      'Chronic Kidney Disease',
      'Parkinsonism',
    ];

  /* =======================================================
     COMPUTED
  ======================================================= */

  const effectiveRelationship =
    guardianRelationship ===
    'Other (Specify)'
      ? customRelationship.trim() ||
        'Guardian'
      : guardianRelationship;

  const formattedEmergencyContact =
    formatEmergencyContact(
      guardianName,
      effectiveRelationship,
      guardianPhone
    );

  const calculateAge = (
    birthDate: string
  ) => {
    if (!birthDate) {
      return null;
    }

    const birth =
      new Date(
        birthDate
      );

    const today =
      new Date();

    let age =
      today.getFullYear() -
      birth.getFullYear();

    const monthDifference =
      today.getMonth() -
      birth.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference ===
          0 &&
        today.getDate() <
          birth.getDate()
      )
    ) {
      age--;
    }

    return age >= 0
      ? age
      : null;
  };

  const computedAge =
    calculateAge(dob);

  /* =======================================================
     MEDICAL CONDITION
  ======================================================= */

  const handleToggleCondition =
    (
      condition: string
    ) => {
      let current =
        medicalHistory
          .split(',')
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);

      if (
        current.includes(
          condition
        )
      ) {
        current =
          current.filter(
            (item) =>
              item !==
              condition
          );
      } else {
        current.push(
          condition
        );
      }

      setMedicalHistory(
        current.join(', ')
      );
    };

  /* =======================================================
     STEP VALIDATION
  ======================================================= */

  const goToStep2 =
    () => {
      if (
        !name.trim()
      ) {
        setValidationError(
          'Please enter the resident full name.'
        );

        return;
      }

      if (
        !icNumber.trim()
      ) {
        setValidationError(
          'Please enter the resident IC or passport number.'
        );

        return;
      }

      if (!dob) {
        setValidationError(
          'Please select the resident date of birth.'
        );

        return;
      }

      if (
        !roomNumber.trim()
      ) {
        setValidationError(
          'Please enter the resident room number.'
        );

        return;
      }

      setValidationError(
        null
      );

      setCurrentStep(2);
    };

  const goToStep3 =
    () => {
      setValidationError(
        null
      );

      setCurrentStep(3);
    };

  /* =======================================================
     FINAL SUBMIT
  ======================================================= */

  const handleFinalSubmit =
    async () => {
      if (
        !name.trim() ||
        !icNumber.trim()
      ) {
        setValidationError(
          'Please complete the resident information in Step 1.'
        );

        setCurrentStep(1);

        return;
      }

      if (
        !guardianName.trim()
      ) {
        setValidationError(
          'Please enter the emergency contact name.'
        );

        return;
      }

      if (
        guardianRelationship ===
          'Other (Specify)' &&
        !customRelationship.trim()
      ) {
        setValidationError(
          'Please specify the relationship to the resident.'
        );

        return;
      }

      if (
        !guardianPhone.trim()
      ) {
        setValidationError(
          'Please enter the emergency contact phone number.'
        );

        return;
      }

      if (
        !isValidPhoneNumber(
          guardianPhone
        )
      ) {
        setValidationError(
          'Please enter a valid phone number, for example 013-8876543 or +60138876543.'
        );

        return;
      }

      const careNotes = [
        medicalHistory.trim() ||
          'General Eldercare Monitoring',

        `Diet: ${dietaryPreference}`,

        `Mobility: ${mobilityStatus}`,
      ].join(' | ');

      setValidationError(
        null
      );

      setIsSubmitting(
        true
      );

      try {
        await onAddResident({
          name:
            name.trim(),

          ic_number:
            icNumber.trim(),

          dob,

          gender,

          emergency_contact:
            formattedEmergencyContact,

          medical_history:
            careNotes,

          room_number:
            roomNumber.trim(),
        });

        setIsSuccess(
          true
        );

        setTimeout(() => {
          onNavigate(
            'residents-list'
          );
        }, 1200);
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

          setValidationError(
            firstError ||
              error.message
          );
        } else {
          setValidationError(
            error instanceof Error
              ? error.message
              : 'Unable to register the resident. Please try again.'
          );
        }
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  const inputClass =
    'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100';

  const steps = [
    {
      number: 1,
      title:
        'Personal Details',
      description:
        'Identity and room',
    },
    {
      number: 2,
      title:
        'Health & Care',
      description:
        'Medical information',
    },
    {
      number: 3,
      title:
        'Emergency Contact',
      description:
        'Guardian and review',
    },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#174c3c] px-6 py-6 text-white shadow-sm">

        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border border-white/5" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-4">

            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'residents-list'
                )
              }
              title="Back to Resident Directory"
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Resident Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Register New Resident
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/75">
                Add the resident&apos;s
                personal, health and
                emergency contact
                information to GoldenCare.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate(
                'residents-list'
              )
            }
            className="self-start rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 sm:self-auto"
          >
            Cancel Registration
          </button>

        </div>

      </section>

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {isSuccess && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>

            <p className="text-sm font-bold text-emerald-900">
              Resident registered successfully
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              {name} has been added to GoldenCare. Returning to the resident directory...
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          STEPS
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* PROGRESS */}
        <div className="h-1.5 bg-slate-100">

          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{
              width:
                currentStep === 1
                  ? '33.33%'
                  : currentStep === 2
                  ? '66.66%'
                  : '100%',
            }}
          />

        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-200">

          {steps.map(
            (step) => {
              const isCurrent =
                currentStep ===
                step.number;

              const isComplete =
                currentStep >
                step.number;

              return (
                <button
                  key={
                    step.number
                  }
                  type="button"
                  onClick={() => {
                    if (
                      step.number ===
                      1
                    ) {
                      setCurrentStep(
                        1
                      );

                      setValidationError(
                        null
                      );

                      return;
                    }

                    if (
                      !name.trim() ||
                      !icNumber.trim()
                    ) {
                      setValidationError(
                        'Please complete the resident name and IC number first.'
                      );

                      return;
                    }

                    setCurrentStep(
                      step.number
                    );

                    setValidationError(
                      null
                    );
                  }}
                  className={`flex items-center gap-3 px-4 py-4 text-left transition ${
                    isCurrent
                      ? 'bg-emerald-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-emerald-700 text-white'
                        : isComplete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>

                  <div className="hidden min-w-0 sm:block">

                    <p
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-emerald-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {
                        step.title
                      }
                    </p>

                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {
                        step.description
                      }
                    </p>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {validationError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4"
        >

          <div className="flex items-start gap-2.5">

            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

            <p className="text-xs font-medium leading-5 text-rose-700">
              {
                validationError
              }
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setValidationError(
                null
              )
            }
            className="shrink-0 text-xs font-semibold text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>

        </div>
      )}

      {/* =====================================================
          FORM CARD
      ====================================================== */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* ===================================================
            STEP 1
        =================================================== */}

        {currentStep === 1 && (
          <>
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <UserRound className="h-4 w-4" />
                </div>

                <div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Personal Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the resident&apos;s identification and room information.
                  </p>

                </div>

              </div>

            </div>

            <div className="space-y-5 p-5 sm:p-6">

              {/* NAME */}
              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Resident Full Name{' '}

                  <span className="text-rose-600">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  placeholder="Example: Hajah Siti Zaleha Binti Ismail"
                  value={name}
                  onChange={(
                    event
                  ) => {
                    setName(
                      event.target
                        .value
                    );

                    setValidationError(
                      null
                    );
                  }}
                  className={
                    inputClass
                  }
                  required
                />

              </div>

              {/* IC + DOB */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    IC / Passport Number{' '}

                    <span className="text-rose-600">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="Example: 490815-10-5432"
                    value={
                      icNumber
                    }
                    onChange={(
                      event
                    ) => {
                      setIcNumber(
                        event
                          .target
                          .value
                      );

                      setValidationError(
                        null
                      );
                    }}
                    className={
                      inputClass
                    }
                    required
                  />

                </div>

                <div>

                  <div className="mb-1.5 flex items-center justify-between gap-2">

                    <label className="text-xs font-semibold text-slate-700">
                      Date of Birth{' '}

                      <span className="text-rose-600">
                        *
                      </span>
                    </label>

                    {computedAge !==
                      null && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                        {
                          computedAge
                        }{' '}
                        years old
                      </span>
                    )}

                  </div>

                  <div className="relative">

                    <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="date"
                      value={dob}
                      onChange={(
                        event
                      ) =>
                        setDob(
                          event.target
                            .value
                        )
                      }
                      className={`${inputClass} pl-10`}
                      required
                    />

                  </div>

                </div>

              </div>

              {/* GENDER + ROOM */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Gender
                  </label>

                  <select
                    value={
                      gender
                    }
                    onChange={(
                      event
                    ) =>
                      setGender(
                        event.target
                          .value as
                          | 'Male'
                          | 'Female'
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="Female">
                      Female
                    </option>

                    <option value="Male">
                      Male
                    </option>
                  </select>

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Room Number{' '}

                    <span className="text-rose-600">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <BedDouble className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      placeholder="Example: R102"
                      value={
                        roomNumber
                      }
                      onChange={(
                        event
                      ) =>
                        setRoomNumber(
                          event.target
                            .value
                        )
                      }
                      className={`${inputClass} pl-10`}
                      required
                    />

                  </div>

                </div>

              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    'residents-list'
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  goToStep2
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
              >
                Continue

                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

          </>
        )}

        {/* ===================================================
            STEP 2
        =================================================== */}

        {currentStep === 2 && (
          <>
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <HeartPulse className="h-4 w-4" />
                </div>

                <div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Health & Care Information
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Add known medical conditions and basic daily care information.
                  </p>

                </div>

              </div>

            </div>

            <div className="space-y-6 p-5 sm:p-6">

              {/* CONDITIONS */}
              <div>

                <div className="mb-3">

                  <label className="text-xs font-semibold text-slate-700">
                    Medical Conditions
                  </label>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Select common conditions or type additional information below.
                  </p>

                </div>

                <div className="flex flex-wrap gap-2">

                  {commonConditions.map(
                    (
                      condition
                    ) => {
                      const selected =
                        medicalHistory
                          .split(',')
                          .map(
                            (
                              item
                            ) =>
                              item.trim()
                          )
                          .includes(
                            condition
                          );

                      return (
                        <button
                          key={
                            condition
                          }
                          type="button"
                          onClick={() =>
                            handleToggleCondition(
                              condition
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                            selected
                              ? 'border-emerald-700 bg-emerald-700 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >

                          {selected && (
                            <Check className="h-3.5 w-3.5" />
                          )}

                          {
                            condition
                          }

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {/* NOTES */}
              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Medical History / Notes
                </label>

                <textarea
                  rows={4}
                  placeholder="Example: Hypertension, diabetes, previous stroke, medication allergy..."
                  value={
                    medicalHistory
                  }
                  onChange={(
                    event
                  ) =>
                    setMedicalHistory(
                      event.target
                        .value
                    )
                  }
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />

              </div>

              {/* DIET + MOBILITY */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Dietary Plan
                  </label>

                  <select
                    value={
                      dietaryPreference
                    }
                    onChange={(
                      event
                    ) =>
                      setDietaryPreference(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="Regular Eldercare Meal Plan">
                      Regular Eldercare Meal Plan
                    </option>

                    <option value="Halal Low-Sodium">
                      Halal Low-Sodium
                    </option>

                    <option value="Halal Soft-Diet Diabetic">
                      Halal Soft-Diet Diabetic
                    </option>

                    <option value="Halal High-Protein Recovery">
                      Halal High-Protein Recovery
                    </option>
                  </select>

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Mobility Status
                  </label>

                  <select
                    value={
                      mobilityStatus
                    }
                    onChange={(
                      event
                    ) =>
                      setMobilityStatus(
                        event.target
                          .value
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="Independent Walking">
                      Independent Walking
                    </option>

                    <option value="Cane / Assisted Walk">
                      Cane / Assisted Walk
                    </option>

                    <option value="Wheelchair Assisted">
                      Wheelchair Assisted
                    </option>

                    <option value="Bedbound Care">
                      Bedbound Care
                    </option>
                  </select>

                </div>

              </div>

            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={() => {
                  setValidationError(
                    null
                  );

                  setCurrentStep(
                    1
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />

                Back
              </button>

              <button
                type="button"
                onClick={
                  goToStep3
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
              >
                Continue

                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

          </>
        )}

        {/* ===================================================
            STEP 3
        =================================================== */}

        {currentStep === 3 && (
          <>
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Emergency Contact & Review
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the resident&apos;s primary next-of-kin or guardian before registration.
                  </p>

                </div>

              </div>

            </div>

            <div className="space-y-6 p-5 sm:p-6">

              {/* GUARDIAN */}
              <div>

                <div className="mb-4">

                  <h3 className="text-xs font-bold text-slate-900">
                    Emergency Contact
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    This contact can be used by staff during urgent situations.
                  </p>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div className="md:col-span-2">

                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Full Name{' '}

                      <span className="text-rose-600">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      placeholder="Example: Encik Ahmad Danial"
                      value={
                        guardianName
                      }
                      onChange={(
                        event
                      ) => {
                        setGuardianName(
                          event.target
                            .value
                        );

                        setValidationError(
                          null
                        );
                      }}
                      className={
                        inputClass
                      }
                      required
                    />

                  </div>

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Relationship{' '}

                      <span className="text-rose-600">
                        *
                      </span>
                    </label>

                    <select
                      value={
                        guardianRelationship
                      }
                      onChange={(
                        event
                      ) => {
                        setGuardianRelationship(
                          event.target
                            .value
                        );

                        setValidationError(
                          null
                        );
                      }}
                      className={
                        inputClass
                      }
                    >
                      {relationshipOptions.map(
                        (
                          relationship
                        ) => (
                          <option
                            key={
                              relationship
                            }
                            value={
                              relationship
                            }
                          >
                            {
                              relationship
                            }
                          </option>
                        )
                      )}
                    </select>

                    {guardianRelationship ===
                      'Other (Specify)' && (
                      <input
                        type="text"
                        placeholder="Specify relationship"
                        value={
                          customRelationship
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomRelationship(
                            event.target
                              .value
                          )
                        }
                        className={`${inputClass} mt-2`}
                      />
                    )}

                  </div>

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Phone Number{' '}

                      <span className="text-rose-600">
                        *
                      </span>
                    </label>

                    <div className="relative">

                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="tel"
                        placeholder="Example: 013-8876543"
                        value={
                          guardianPhone
                        }
                        onChange={(
                          event
                        ) => {
                          setGuardianPhone(
                            event.target
                              .value
                          );

                          setValidationError(
                            null
                          );
                        }}
                        className={`${inputClass} pl-10 ${
                          guardianPhone &&
                          !isValidPhoneNumber(
                            guardianPhone
                          )
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                            : ''
                        }`}
                        required
                      />

                    </div>

                    {guardianPhone && (
                      <p
                        className={`mt-1.5 text-[11px] font-medium ${
                          isValidPhoneNumber(
                            guardianPhone
                          )
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isValidPhoneNumber(
                          guardianPhone
                        )
                          ? 'Valid phone number'
                          : 'Please check the phone number format'}
                      </p>
                    )}

                  </div>

                </div>

              </div>

              {/* REVIEW */}
              <div className="overflow-hidden rounded-xl border border-slate-200">

                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">

                  <p className="text-xs font-bold text-slate-900">
                    Registration Summary
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Review the information before creating the resident record.
                  </p>

                </div>

                <div className="grid gap-px bg-slate-200 sm:grid-cols-2">

                  <div className="bg-white p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Resident
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {name ||
                        'Not entered'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {icNumber ||
                        'No IC entered'}
                    </p>

                  </div>

                  <div className="bg-white p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Room / Gender
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      Room{' '}
                      {roomNumber ||
                        '-'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {gender}

                      {computedAge !==
                        null &&
                        ` • ${computedAge} years old`}
                    </p>

                  </div>

                  <div className="bg-white p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Care
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {
                        mobilityStatus
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        dietaryPreference
                      }
                    </p>

                  </div>

                  <div className="bg-white p-4">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Emergency Contact
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {guardianName ||
                        'Not entered'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        effectiveRelationship
                      }

                      {guardianPhone &&
                        ` • ${guardianPhone}`}
                    </p>

                  </div>

                </div>

              </div>

              {/* MEDICAL REVIEW */}
              {medicalHistory && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Medical Information
                  </p>

                  <p className="mt-1.5 text-xs leading-5 text-emerald-900">
                    {
                      medicalHistory
                    }
                  </p>

                </div>
              )}

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <button
                type="button"
                onClick={() => {
                  setValidationError(
                    null
                  );

                  setCurrentStep(
                    2
                  );
                }}
                disabled={
                  isSubmitting
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />

                Back
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleFinalSubmit()
                }
                disabled={
                  isSubmitting
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <CheckCircle2 className="h-4 w-4" />

                {isSubmitting
                  ? 'Registering Resident...'
                  : 'Register Resident'}
              </button>

            </div>

          </>
        )}

      </section>

    </div>
  );
};