import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  MessageSquareText,
  Send,
  ShieldCheck,
  Thermometer,
  Activity,
} from 'lucide-react';

export const TelegramAlertConfig: React.FC = () => {
  const [testBp, setTestBp] = useState(145);
  const [testTemp, setTestTemp] = useState(37.8);
  const [testResident, setTestResident] = useState(
    'Hajah Fatimah Binti Abdullah'
  );
  const [testRoom, setTestRoom] = useState('R1');
  const [testCaregiver, setTestCaregiver] = useState(
    'Siti Nurhaliza Binti Ahmad'
  );

  const [previewMessage, setPreviewMessage] =
    useState<string | null>(null);

  const isTrigger =
    testBp > 140 || testTemp > 37.5;

  const getAlertReason = () => {
    if (testBp > 140 && testTemp > 37.5) {
      return 'High Blood Pressure and Elevated Temperature';
    }

    if (testBp > 140) {
      return 'High Blood Pressure';
    }

    return 'Elevated Temperature';
  };

  const handleGeneratePreview = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!isTrigger) {
      setPreviewMessage(null);
      return;
    }

    const recordedAt =
      new Date().toLocaleString('en-MY', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    const alertReason = getAlertReason();

    setPreviewMessage(
      [
        '🚨 GoldenCare Emergency Health Alert',
        '',
        'Resident Information',
        `Name: ${testResident}`,
        `Room: ${testRoom}`,
        '',
        'Abnormal Reading Detected',
        `Blood Pressure: ${testBp}/90 mmHg`,
        `Temperature: ${testTemp.toFixed(1)}°C`,
        'Heart Rate: 78 bpm',
        'Oxygen Level: 97%',
        '',
        'Alert Reason',
        alertReason,
        '',
        'Recorded By',
        testCaregiver,
        recordedAt,
        '',
        'Action Required',
        "Please review the resident's condition and take the appropriate action promptly.",
        '',
        'GoldenCare',
        'Elderly Health Monitoring & Alert Management System',
      ].join('\n')
    );
  };

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Send className="h-6 w-6" />
            </div>

            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Telegram Integration
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Emergency Health Alerts
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                GoldenCare uses Telegram to notify the care centre when a
                resident's blood pressure or body temperature exceeds the
                configured health threshold.
              </p>
            </div>

          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Server-managed integration
          </div>

        </div>
      </section>

      {/* =====================================================
          STATUS / SECURITY / THRESHOLD
      ====================================================== */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Integration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <MessageSquareText className="h-5 w-5" />
            </div>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Automated
            </span>
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-900">
            Notification Channel
          </h2>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Care Centre Telegram Group
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Critical resident readings are sent through the server-side
            Telegram integration.
          </p>

        </div>

        {/* Threshold */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <Activity className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-900">
            Alert Trigger Rules
          </h2>

          <div className="mt-3 space-y-2">

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-600">
                Systolic Blood Pressure
              </span>

              <span className="text-xs font-bold text-rose-700">
                &gt; 140 mmHg
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-xs font-medium text-slate-600">
                Body Temperature
              </span>

              <span className="text-xs font-bold text-rose-700">
                &gt; 37.5°C
              </span>
            </div>

          </div>

        </div>

        {/* Security */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-sm font-bold text-slate-900">
            Credential Protection
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Telegram bot credentials are stored securely in the server
            environment and are not displayed in the GoldenCare interface.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Sensitive credentials hidden
          </div>

        </div>

      </section>

      {/* =====================================================
          ALERT PREVIEW
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <AlertTriangle className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Alert Message Preview
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Preview how a Telegram alert will appear when a reading exceeds
                the GoldenCare critical threshold.
              </p>
            </div>

          </div>

        </div>

        <div className="p-6">

          <form
            onSubmit={handleGeneratePreview}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
          >

            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Resident Name
              </label>

              <input
                type="text"
                value={testResident}
                onChange={(e) =>
                  setTestResident(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Room
              </label>

              <input
                type="text"
                value={testRoom}
                onChange={(e) =>
                  setTestRoom(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Systolic BP
              </label>

              <div className="relative">
                <input
                  type="number"
                  value={testBp}
                  onChange={(e) =>
                    setTestBp(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-14 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                  mmHg
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Temperature
              </label>

              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={testTemp}
                  onChange={(e) =>
                    setTestTemp(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <Thermometer className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-5">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Recorded By
              </label>

              <input
                type="text"
                value={testCaregiver}
                onChange={(e) =>
                  setTestCaregiver(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-5">

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  {isTrigger ? (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                      <div>
                        <p className="text-xs font-bold text-rose-700">
                          Critical threshold detected
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {getAlertReason()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                      <div>
                        <p className="text-xs font-bold text-emerald-700">
                          Reading within alert threshold
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          No Telegram alert would be triggered.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isTrigger}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-emerald-700
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-emerald-800
                    disabled:cursor-not-allowed
                    disabled:bg-slate-300
                    disabled:text-slate-500
                  "
                >
                  <MessageSquareText className="h-4 w-4" />
                  Generate Preview
                </button>

              </div>

            </div>

          </form>

          {/* =================================================
              TELEGRAM STYLE PREVIEW
          ================================================== */}

          {previewMessage && (
            <div className="mt-6 border-t border-slate-200 pt-6">

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Telegram Message
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Message preview only. No Telegram notification is sent from
                    this page.
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Preview
                </span>

              </div>

              <div className="max-w-2xl rounded-2xl border border-slate-200 bg-[#eef5f1] p-4">

                <div className="rounded-2xl rounded-tl-md bg-white px-4 py-4 shadow-sm">

                  <div className="mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">
                      G
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        GoldenCare Alert Bot
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Emergency health notification
                      </p>
                    </div>
                  </div>

                  <div className="whitespace-pre-line text-sm leading-6 text-slate-800">
                    {previewMessage}
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          SECURITY NOTICE
      ====================================================== */}

      <section className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

        <div>
          <p className="text-xs font-semibold text-slate-700">
            Security Notice
          </p>

          <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
            Telegram bot tokens and chat identifiers are maintained in the
            backend server environment. GoldenCare does not expose these
            credentials through the frontend interface.
          </p>
        </div>

      </section>

    </div>
  );
};
