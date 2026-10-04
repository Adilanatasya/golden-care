import React, { useMemo, useState } from 'react';
import { Vital, Resident } from '../types';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Flame,
  HeartPulse,
  Search,
  UserRound,
  X,
} from 'lucide-react';

interface HealthTrendsChartProps {
  resident?: Resident | null;
  allResidents?: Resident[];
  vitals: Vital[];
  onSelectResident?: (resident: Resident) => void;
}

export type DateRangeOption =
  | '7days'
  | '30days'
  | '3months'
  | 'custom';

export const HealthTrendsChart: React.FC<
  HealthTrendsChartProps
> = ({
  resident: initialResident,
  allResidents = [],
  vitals,
}) => {
  const [
    selectedResidentId,
    setSelectedResidentId,
  ] = useState<number>(
    initialResident?.id ||
      allResidents[0]?.id ||
      1
  );

  const [
    residentSearch,
    setResidentSearch,
  ] = useState('');

  const [
    showResidentResults,
    setShowResidentResults,
  ] = useState(false);

  const [
    dateRange,
    setDateRange,
  ] =
    useState<DateRangeOption>(
      '7days'
    );

  const [
    startDate,
    setStartDate,
  ] = useState('');

  const [
    endDate,
    setEndDate,
  ] = useState('');

  const [
    activeChartTab,
    setActiveChartTab,
  ] =
    useState<
      'bp' | 'spo2' | 'temp'
    >('bp');

  /* =========================================================
     ACTIVE RESIDENT
  ========================================================= */

  const activeResident =
    useMemo(() => {
      if (
        initialResident &&
        initialResident.id ===
          selectedResidentId
      ) {
        return initialResident;
      }

      return (
        allResidents.find(
          (resident) =>
            resident.id ===
            selectedResidentId
        ) ||
        initialResident ||
        null
      );
    }, [
      initialResident,
      allResidents,
      selectedResidentId,
    ]);

  /* =========================================================
     SEARCH RESIDENT
  ========================================================= */

  const filteredResidents =
    useMemo(() => {
      const query =
        residentSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return allResidents;
      }

      return allResidents.filter(
        (resident) =>
          resident.name
            .toLowerCase()
            .includes(query) ||
          String(
            resident.room_number
          )
            .toLowerCase()
            .includes(query) ||
          String(
            resident.ic_number || ''
          )
            .toLowerCase()
            .includes(query)
      );
    }, [
      allResidents,
      residentSearch,
    ]);

  const handleSelectResident = (
    resident: Resident
  ) => {
    setSelectedResidentId(
      resident.id
    );

    setResidentSearch('');

    setShowResidentResults(
      false
    );

    /*
      IMPORTANT:
      Do not call onSelectResident here.
      This selector is only for changing
      the resident shown in the chart.
    */
  };

  /* =========================================================
     FILTER VITALS
  ========================================================= */

  const filteredVitals =
    useMemo(() => {
      if (!activeResident) {
        return [];
      }

      const residentLogs =
        vitals.filter(
          (vital) =>
            vital.resident_id ===
            activeResident.id
        );

      const sortedLogsDesc = [
        ...residentLogs,
      ].sort(
        (a, b) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      );

      if (
        sortedLogsDesc.length ===
        0
      ) {
        return [];
      }

      const latestLogTime =
        new Date(
          sortedLogsDesc[0]
            .created_at
        ).getTime();

      const nowTime =
        Math.max(
          Date.now(),
          !Number.isNaN(
            latestLogTime
          )
            ? latestLogTime
            : Date.now()
        );

      const rangeMsMap: Record<
        DateRangeOption,
        number | null
      > = {
        '7days':
          7 *
          24 *
          60 *
          60 *
          1000,

        '30days':
          30 *
          24 *
          60 *
          60 *
          1000,

        '3months':
          90 *
          24 *
          60 *
          60 *
          1000,

        custom: null,
      };

      const rangeMs =
        rangeMsMap[
          dateRange
        ];

      return residentLogs
        .filter(
          (vital) => {
            const logDate =
              new Date(
                vital.created_at
              );

            if (
              Number.isNaN(
                logDate.getTime()
              )
            ) {
              return true;
            }

            if (
              dateRange ===
              'custom'
            ) {
              const start =
                startDate
                  ? new Date(
                      `${startDate}T00:00:00`
                    )
                  : new Date(
                      '2000-01-01'
                    );

              const end =
                endDate
                  ? new Date(
                      `${endDate}T23:59:59`
                    )
                  : new Date(
                      '2099-12-31'
                    );

              return (
                logDate >=
                  start &&
                logDate <=
                  end
              );
            }

            if (
              rangeMs !==
              null
            ) {
              const cutoff =
                new Date(
                  nowTime -
                    rangeMs
                );

              return (
                logDate >=
                cutoff
              );
            }

            return true;
          }
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
      activeResident,
      vitals,
      dateRange,
      startDate,
      endDate,
    ]);

  /* =========================================================
     CHART DATA
  ========================================================= */

  const chartData =
    useMemo(() => {
      return filteredVitals.map(
        (vital) => {
          const date =
            new Date(
              vital.created_at
            );

          const dateLabel =
            !Number.isNaN(
              date.getTime()
            )
              ? `${date.getDate()} ${date.toLocaleString(
                  'en-US',
                  {
                    month:
                      'short',
                  }
                )} ${date
                  .getHours()
                  .toString()
                  .padStart(
                    2,
                    '0'
                  )}:${date
                  .getMinutes()
                  .toString()
                  .padStart(
                    2,
                    '0'
                  )}`
              : vital.created_at.substring(
                  0,
                  16
                );

          return {
            id: vital.id,
            timestamp:
              dateLabel,
            rawDate:
              vital.created_at,
            systolic:
              vital.bp_systolic,
            diastolic:
              vital.bp_diastolic,
            temperature:
              vital.temperature,
            spo2:
              vital.oxygen_level,
            heartRate:
              vital.heart_rate,
          };
        }
      );
    }, [
      filteredVitals,
    ]);

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">

            <Activity className="h-4 w-4" />

            <span>
              Health Monitoring
            </span>

          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Health Trends
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Review changes in blood pressure, oxygen saturation and temperature.
          </p>

        </div>

        {/* ===================================================
            SEARCHABLE RESIDENT SELECTOR
        =================================================== */}

        {!initialResident &&
          allResidents.length >
            0 && (
          <div className="w-full lg:max-w-sm">

            <label
              htmlFor="health-trend-resident-search"
              className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400"
            >
              Select Resident
            </label>

            <div className="relative">

              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="health-trend-resident-search"
                type="text"
                value={
                  residentSearch
                }
                onFocus={() =>
                  setShowResidentResults(
                    true
                  )
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
                placeholder={
                  activeResident
                    ? `${activeResident.name} • Room ${activeResident.room_number}`
                    : 'Search resident by name, room or IC'
                }
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
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
                  aria-label="Clear resident search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* RESULTS */}
              {showResidentResults && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">

                  {filteredResidents.length >
                  0 ? (
                    filteredResidents.map(
                      (
                        resident
                      ) => {
                        const selected =
                          resident.id ===
                          selectedResidentId;

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
                              selected
                                ? 'bg-emerald-50'
                                : 'hover:bg-slate-50'
                            }`}
                          >

                            <div className="flex min-w-0 items-center gap-3">

                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  selected
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {resident.name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">

                                <p
                                  className={`truncate text-sm font-semibold ${
                                    selected
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

                            {selected && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            )}

                          </button>
                        );
                      }
                    )
                  ) : (
                    <div className="px-4 py-7 text-center">

                      <Search className="mx-auto h-5 w-5 text-slate-300" />

                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        No resident found
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Try another name, room or IC number.
                      </p>

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* =====================================================
          SELECTED RESIDENT
      ====================================================== */}

      {activeResident && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-bold text-white">
              {activeResident.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                Selected Resident
              </p>

              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {
                  activeResident.name
                }
              </p>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Room{' '}
                {
                  activeResident.room_number
                }

                {activeResident.ic_number &&
                  ` • IC ${activeResident.ic_number}`}
              </p>

            </div>

          </div>

          <div className="text-left sm:text-right">

            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Records Found
            </p>

            <p className="mt-1 text-sm font-bold text-emerald-800">
              {
                filteredVitals.length
              }{' '}
              record
              {filteredVitals.length !==
              1
                ? 's'
                : ''}
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          CONTROLS
      ====================================================== */}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 xl:flex-row xl:items-center xl:justify-between">

        {/* CHART TYPE */}
        <div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Measurement
          </p>

          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1">

            <button
              type="button"
              onClick={() =>
                setActiveChartTab(
                  'bp'
                )
              }
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                activeChartTab ===
                'bp'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="h-3.5 w-3.5" />

              Blood Pressure
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveChartTab(
                  'spo2'
                )
              }
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                activeChartTab ===
                'spo2'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Droplets className="h-3.5 w-3.5" />

              Oxygen
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveChartTab(
                  'temp'
                )
              }
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition ${
                activeChartTab ===
                'temp'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />

              Temperature
            </button>

          </div>

        </div>

        {/* RANGE */}
        <div>

          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Date Range
          </p>

          <div className="flex flex-wrap items-center gap-2">

            <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1">

              {(
                [
                  '7days',
                  '30days',
                  '3months',
                  'custom',
                ] as DateRangeOption[]
              ).map(
                (
                  option
                ) => {
                  const labels: Record<
                    DateRangeOption,
                    string
                  > = {
                    '7days':
                      '7 Days',

                    '30days':
                      '30 Days',

                    '3months':
                      '3 Months',

                    custom:
                      'Custom',
                  };

                  return (
                    <button
                      key={
                        option
                      }
                      type="button"
                      onClick={() =>
                        setDateRange(
                          option
                        )
                      }
                      className={`min-h-9 rounded-md px-3 text-[11px] font-semibold transition ${
                        dateRange ===
                        option
                          ? 'bg-[#174c3c] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {
                        labels[
                          option
                        ]
                      }
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </div>

      {/* CUSTOM RANGE */}
      {dateRange ===
        'custom' && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">

          <div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Start Date
            </label>

            <div className="relative">

              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={
                  startDate
                }
                onChange={(
                  event
                ) =>
                  setStartDate(
                    event.target
                      .value
                  )
                }
                className="min-h-10 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />

            </div>

          </div>

          <div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              End Date
            </label>

            <div className="relative">

              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={
                  endDate
                }
                onChange={(
                  event
                ) =>
                  setEndDate(
                    event.target
                      .value
                  )
                }
                className="min-h-10 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          CHART
      ====================================================== */}

      <div className="relative min-h-[340px] w-full">

        {chartData.length ===
        0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 text-center">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <AlertCircle className="h-5 w-5" />
            </div>

            <h4 className="mt-3 text-sm font-semibold text-slate-700">
              No health records available
            </h4>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              No vital readings were found for this resident within the selected date range.
            </p>

          </div>
        ) : (
          <div className="h-80 w-full">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              {activeChartTab ===
              'bp' ? (
                <LineChart
                  data={
                    chartData
                  }
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="timestamp"
                    tick={{
                      fontSize: 10,
                      fill: '#64748b',
                    }}
                    angle={-15}
                    textAnchor="end"
                    interval="preserveStartEnd"
                  />

                  <YAxis
                    domain={[
                      40,
                      200,
                    ]}
                    tick={{
                      fontSize: 10,
                      fill: '#64748b',
                    }}
                    unit=" mmHg"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        '#ffffff',
                      color:
                        '#0f172a',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0',
                      fontSize:
                        '12px',
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                  />

                  <ReferenceLine
                    y={140}
                    label="Alert 140"
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                  />

                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic BP"
                    stroke="#be123c"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic BP"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />

                </LineChart>
              ) : activeChartTab ===
                'spo2' ? (
                <LineChart
                  data={
                    chartData
                  }
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="timestamp"
                    tick={{
                      fontSize: 10,
                      fill: '#64748b',
                    }}
                    angle={-15}
                    textAnchor="end"
                  />

                  <YAxis
                    domain={[
                      85,
                      100,
                    ]}
                    tick={{
                      fontSize: 10,
                      fill: '#64748b',
                    }}
                    unit="%"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        '#ffffff',
                      color:
                        '#0f172a',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0',
                      fontSize:
                        '12px',
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                  />

                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="SpO₂"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />

                </LineChart>
              ) : (
                <LineChart
                  data={
                    chartData
                  }
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="timestamp"
                    tick={{
                      fontSize: 10,
                      fill: '#64748b',
                    }}
                    angle={-15}
                    textAnchor="end"
                  />

                  <YAxis
                    domain={[
                      35,
                      41,
                    ]}
                    tick={{
                      fontSize: 10,
                      fill: '#64748b',
                    }}
                    unit="°C"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        '#ffffff',
                      color:
                        '#0f172a',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0',
                      fontSize:
                        '12px',
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                  />

                  <ReferenceLine
                    y={37.5}
                    label="Alert 37.5°C"
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                  />

                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />

                </LineChart>
              )}

            </ResponsiveContainer>

          </div>
        )}

      </div>

    </div>
  );
};