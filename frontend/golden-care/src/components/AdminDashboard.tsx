import React from 'react';

import { Resident, Vital, User } from '../types';
import { AdminSummary } from '../services/reportService';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  HeartPulse,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface AdminDashboardProps {
  residents: Resident[];
  vitals: Vital[];
  users: User[];
  summary?: AdminSummary | null;

  onNavigate: (view: any) => void;

  // Kept because the parent component may still pass these props.
  // They are no longer displayed directly on the Admin Dashboard.
  onOpenRecordVital: () => void;
  onOpenAddResident: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  residents,
  vitals,
  users,
  summary,
  onNavigate,
}) => {
  const residentsCount =
    summary?.total_residents ?? residents.length;

  const caregiversCount =
    summary?.total_caregivers ??
    users.filter((u) => u.role === 'caregiver').length;

  const totalVitals =
    summary?.total_vitals ?? vitals.length;

  const criticalVitals = [...vitals]
    .filter(
      (v) =>
        v.bp_systolic > 140 ||
        v.temperature > 37.5
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

  const criticalCount =
    summary?.critical_vitals ??
    criticalVitals.length;

  const recentVitals = [...vitals]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  const formatDateTime = (value: string) => {
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
    <div className="space-y-7">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-7 text-white shadow-sm sm:px-8 lg:px-9">

        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/[0.05]" />

        <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-teal-300/[0.06]" />

        <div className="relative z-10">

          <div className="max-w-2xl">

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">

              <ShieldCheck className="h-3.5 w-3.5" />

              GoldenCare Administration

            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Care Centre Overview
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75">
              Monitor residents and review recent health records from the
              GoldenCare administration dashboard.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL RESIDENTS */}

        <button
          type="button"
          onClick={() => onNavigate('residents-list')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg cursor-pointer"
        >

          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-50" />

          <div className="relative z-10 flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">

              <Users className="h-5 w-5 text-emerald-700" />

            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />

          </div>

          <div className="relative z-10 mt-6">

            <p className="text-3xl font-black tracking-tight text-slate-900">
              {residentsCount}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              Total Residents
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Current resident records
            </p>

          </div>

        </button>


        {/* TOTAL CAREGIVERS */}

        <button
          type="button"
          onClick={() => onNavigate('staff-management')}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg cursor-pointer"
        >

          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-teal-50" />

          <div className="relative z-10 flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100">

              <HeartPulse className="h-5 w-5 text-teal-700" />

            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-teal-600" />

          </div>

          <div className="relative z-10 mt-6">

            <p className="text-3xl font-black tracking-tight text-slate-900">
              {caregiversCount}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              Total Caregivers
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Registered caregiver accounts
            </p>

          </div>

        </button>


        {/* CRITICAL VITAL RECORDS */}

        <button
          type="button"
          onClick={() => onNavigate('vitals-history')}
          className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg cursor-pointer"
        >

          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-50" />

          <div className="relative z-10 flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100">

              <AlertTriangle className="h-5 w-5 text-rose-600" />

            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-rose-600" />

          </div>

          <div className="relative z-10 mt-6">

            <p className="text-3xl font-black tracking-tight text-rose-600">
              {criticalCount}
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              Critical Vital Records
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Threshold events requiring attention
            </p>

          </div>

        </button>


        {/* TOTAL VITAL RECORDS */}

        <button
          type="button"
          onClick={() => onNavigate('vitals-history')}
          className="group relative overflow-hidden rounded-2xl bg-emerald-900 p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:bg-emerald-950 hover:shadow-lg cursor-pointer"
        >

          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.06]" />

          <div className="relative z-10 flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">

              <Activity className="h-5 w-5 text-emerald-200" />

            </div>

            <ArrowUpRight className="h-4 w-4 text-emerald-300" />

          </div>

          <div className="relative z-10 mt-6">

            <p className="text-3xl font-black tracking-tight text-white">
              {totalVitals}
            </p>

            <p className="mt-1 text-sm font-bold text-white">
              Total Vital Records
            </p>

            <p className="mt-1 text-xs text-emerald-200/70">
              Recorded health observations
            </p>

          </div>

        </button>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.8fr)]">


        {/* ===================================================
            RECENT VITAL SIGNS
        ==================================================== */}

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">

                  <Activity className="h-4 w-4 text-emerald-700" />

                </div>

                <h2 className="text-sm font-black text-slate-900">
                  Recent Resident Vital Signs
                </h2>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Latest health readings recorded by GoldenCare staff.
              </p>

            </div>

            <button
              onClick={() => onNavigate('vitals-history')}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 cursor-pointer"
            >
              View All

              <ArrowRight className="h-3.5 w-3.5" />

            </button>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px] text-left">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">

                  <th className="px-5 py-3">
                    Resident
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
                    Pulse
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100 text-xs">

                {recentVitals.length > 0 ? (

                  recentVitals.map((vital) => {

                    const resident =
                      vital.resident ||
                      residents.find(
                        (r) => r.id === vital.resident_id
                      );

                    const isHighBP =
                      vital.bp_systolic > 140;

                    const isHighTemp =
                      vital.temperature > 37.5;

                    const isCritical =
                      isHighBP || isHighTemp;

                    return (

                      <tr
                        key={vital.id}
                        className="transition hover:bg-emerald-50/30"
                      >

                        {/* RESIDENT */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">

                              {(resident?.name || 'R')
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <div>

                              <p className="font-bold text-slate-900">

                                {resident?.name ||
                                  `Resident #${vital.resident_id}`}

                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">

                                Room {resident?.room_number || '-'}

                              </p>

                            </div>

                          </div>

                        </td>


                        {/* BLOOD PRESSURE */}

                        <td className="px-4 py-4">

                          <span
                            className={`inline-flex rounded-lg px-2 py-1 font-mono font-bold ${
                              isHighBP
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >

                            {vital.bp_systolic}/{vital.bp_diastolic}

                          </span>

                        </td>


                        {/* TEMPERATURE */}

                        <td className="px-4 py-4">

                          <span
                            className={`font-mono font-bold ${
                              isHighTemp
                                ? 'text-rose-600'
                                : 'text-slate-700'
                            }`}
                          >

                            {vital.temperature}°C

                          </span>

                        </td>


                        {/* SPO2 */}

                        <td className="px-4 py-4 font-mono font-semibold text-slate-700">

                          {vital.oxygen_level}%

                        </td>


                        {/* HEART RATE */}

                        <td className="px-4 py-4 font-mono text-slate-700">

                          {vital.heart_rate}

                        </td>


                        {/* STATUS */}

                        <td className="px-4 py-4">

                          {isCritical ? (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">

                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />

                              Critical

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">

                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                              Normal

                            </span>

                          )}

                        </td>

                      </tr>

                    );

                  })

                ) : (

                  <tr>

                    <td
                      colSpan={6}
                      className="px-6 py-14 text-center text-sm text-slate-400"
                    >

                      No vital sign records are available.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ===================================================
            CRITICAL ALERTS
        ==================================================== */}

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">

                  <BellRing className="h-4 w-4 text-rose-600" />

                </div>

                <h3 className="text-sm font-black text-slate-900">
                  Critical Alerts
                </h3>

              </div>

              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[9px] font-bold text-rose-600">

                {criticalVitals.length}

              </span>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Latest abnormal readings detected by the system.
            </p>

          </div>


          <div className="space-y-3 p-4">

            {criticalVitals.length > 0 ? (

              criticalVitals.slice(0, 4).map((vital) => {

                const resident =
                  vital.resident ||
                  residents.find(
                    (item) =>
                      item.id === vital.resident_id
                  );

                return (

                  <div
                    key={vital.id}
                    className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/80 to-white p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs font-black text-slate-900">

                          {resident?.name ||
                            `Resident #${vital.resident_id}`}

                        </p>

                        <p className="mt-1.5 text-[11px] leading-5 text-slate-600">

                          BP {vital.bp_systolic}/{vital.bp_diastolic} mmHg
                          {' • '}
                          {vital.temperature}°C

                        </p>

                      </div>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100">

                        <AlertTriangle className="h-4 w-4 text-rose-600" />

                      </div>

                    </div>

                    <div className="mt-3">

                      <p className="text-[10px] text-slate-400">

                        {formatDateTime(vital.created_at)}

                      </p>

                    </div>

                  </div>

                );

              })

            ) : (

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">

                    <ShieldCheck className="h-4 w-4 text-emerald-700" />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-emerald-800">
                      No critical alerts
                    </p>

                    <p className="mt-1 text-[11px] text-emerald-600">
                      No abnormal BP or temperature readings are currently recorded.
                    </p>

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>

      </section>

    </div>
  );
};