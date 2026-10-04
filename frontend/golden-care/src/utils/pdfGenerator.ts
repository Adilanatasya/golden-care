import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, Vital, User, Visitor, TelegramAlertLog } from '../types';

interface ResidentReportData {
  resident: Resident;
  vitals: Vital[];
  users: User[];
  dateRangeDays: number;
}

interface SystemReportData {
  residents: Resident[];
  vitals: Vital[];
  users: User[];
  visitors: Visitor[];
  dateRangeDays: number;
}

interface ResidentListReportData {
  residents: Resident[];
}

/**
 * Generate a formal PDF Document for Individual Resident Health Report
 */
export function generateResidentReportPDF(data: ResidentReportData): jsPDF {
  const { resident, vitals, users, dateRangeDays } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const now = new Date();
  const cutoff = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
  const filteredVitals = vitals
    .filter((v) => v.resident_id === resident.id && new Date(v.created_at) >= cutoff)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Calculate age helper
  const birthYear = resident.dob ? new Date(resident.dob).getFullYear() : null;
  const age = birthYear ? now.getFullYear() - birthYear : 'N/A';

  // Primary Header Banner
  doc.setFillColor(15, 23, 42); // Dark Slate #0f172a
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(245, 158, 11); // Amber-500
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GoldenCare Health System', 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Pusat Jagaan Warga Emas dan Terapi Fitrah', 14, 21);
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Official Clinical Resident Health & Vital Signs Monitoring Record', 14, 27);

  // Right-aligned report meta
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text(`REPORT ID: GC-RPT-${resident.id}-${now.getFullYear()}`, 196, 14, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${now.toLocaleString('en-GB')}`, 196, 20, { align: 'right' });
  doc.text(`Period: Last ${dateRangeDays} Days`, 196, 26, { align: 'right' });

  let cursorY = 44;

  // Section 1: Resident Demographic Profile
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESIDENT DEMOGRAPHIC & CARE PROFILE', 14, cursorY);
  cursorY += 4;

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    body: [
      [
        { content: 'Full Name:', styles: { fontStyle: 'bold', cellWidth: 32 } },
        { content: resident.name, styles: { fontStyle: 'bold' } },
        { content: 'NRIC / IC No:', styles: { fontStyle: 'bold', cellWidth: 32 } },
        { content: resident.ic_number },
      ],
      [
        { content: 'Age / Gender:', styles: { fontStyle: 'bold' } },
        { content: `${age} Years Old / ${resident.gender}` },
        { content: 'Assigned Room:', styles: { fontStyle: 'bold' } },
        { content: `Room ${resident.room_number}` },
      ],
      [
        { content: 'Emergency Contact:', styles: { fontStyle: 'bold' } },
        { content: resident.emergency_contact },
        { content: 'Admission Date:', styles: { fontStyle: 'bold' } },
        { content: resident.created_at.substring(0, 10) },
      ],
      [
        { content: 'Medical Diagnoses:', styles: { fontStyle: 'bold' } },
        { content: resident.medical_history, colSpan: 3 },
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 2: Vitals Summary Metrics
  const totalReadings = filteredVitals.length;
  const criticalReadings = filteredVitals.filter((v) => v.bp_systolic > 140 || v.temperature > 37.5 || v.oxygen_level < 95);

  const avgSys = totalReadings > 0 ? Math.round(filteredVitals.reduce((acc, v) => acc + v.bp_systolic, 0) / totalReadings) : 0;
  const avgDia = totalReadings > 0 ? Math.round(filteredVitals.reduce((acc, v) => acc + v.bp_diastolic, 0) / totalReadings) : 0;
  const avgTemp = totalReadings > 0 ? (filteredVitals.reduce((acc, v) => acc + v.temperature, 0) / totalReadings).toFixed(1) : '0';
  const avgSpO2 = totalReadings > 0 ? Math.round(filteredVitals.reduce((acc, v) => acc + v.oxygen_level, 0) / totalReadings) : 0;
  const avgHr = totalReadings > 0 ? Math.round(filteredVitals.reduce((acc, v) => acc + v.heart_rate, 0) / totalReadings) : 0;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. VITAL SIGNS MONITORING SUMMARY', 14, cursorY);
  cursorY += 4;

  autoTable(doc, {
    startY: cursorY,
    theme: 'plain',
    head: [['Parameter', 'Average Value', 'Clinical Reference', 'Status in Period']],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    body: [
      [
        'Blood Pressure (BP)',
        `${avgSys}/${avgDia} mmHg`,
        'Systolic <= 140 mmHg, Diastolic <= 90 mmHg',
        avgSys > 140 ? 'ELEVATED / HIGH' : 'NORMAL RANGE',
      ],
      [
        'Body Temperature',
        `${avgTemp} °C`,
        'Normal 36.1°C - 37.2°C (Alert > 37.5°C)',
        Number(avgTemp) > 37.5 ? 'HYPERTHERMIA / FEVER' : 'NORMAL RANGE',
      ],
      [
        'Blood Oxygen (SpO2)',
        `${avgSpO2} %`,
        'Optimal >= 95% (Caution < 95%)',
        avgSpO2 < 95 && avgSpO2 > 0 ? 'LOW OXYGENATION' : 'OPTIMAL RANGE',
      ],
      [
        'Heart Rate (Pulse)',
        `${avgHr} BPM`,
        'Standard Resting 60 - 100 BPM',
        avgHr > 100 || (avgHr < 60 && avgHr > 0) ? 'BORDERLINE' : 'NORMAL RANGE',
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 3: Abnormal Readings & Alerts
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ABNORMAL READINGS & TELEGRAM ALERTS RECORD', 14, cursorY);
  cursorY += 4;

  const abnormalRows = criticalReadings.map((v) => {
    const isHighBp = v.bp_systolic > 140;
    const isFever = v.temperature > 37.5;
    const isLowO2 = v.oxygen_level < 95;
    const reasons: string[] = [];
    if (isHighBp) reasons.push(`High BP (${v.bp_systolic}/${v.bp_diastolic})`);
    if (isFever) reasons.push(`High Temp (${v.temperature}°C)`);
    if (isLowO2) reasons.push(`Low SpO2 (${v.oxygen_level}%)`);

    const severity = v.bp_systolic >= 160 || v.temperature >= 38.5 ? 'CRITICAL' : 'HIGH';
    const caregiver = users.find((u) => u.id === v.recorded_by)?.name || 'Caregiver Staff';

    return [
      v.created_at,
      reasons.join(', '),
      `BP ${v.bp_systolic}/${v.bp_diastolic} | ${v.temperature}°C | ${v.oxygen_level}%`,
      severity,
      'Dispatched to Telegram Bot',
      caregiver,
    ];
  });

  if (abnormalRows.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      theme: 'grid',
      head: [['Timestamp', 'Abnormality Trigger', 'Reading Value', 'Severity', 'Notification', 'Recorded By']],
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      body: abnormalRows.slice(0, 8),
      margin: { left: 14, right: 14 },
    });
  } else {
    autoTable(doc, {
      startY: cursorY,
      theme: 'plain',
      body: [['No critical abnormal vitals recorded in the selected observation period. All readings remained stable.']],
      bodyStyles: { fontSize: 8, textColor: [16, 185, 129], fontStyle: 'italic' },
      margin: { left: 14, right: 14 },
    });
  }

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 4: Health Record History Table
  if (cursorY > 210) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. HEALTH RECORD CHRONOLOGICAL AUDIT LOG', 14, cursorY);
  cursorY += 4;

  const historyRows = filteredVitals.slice(0, 15).map((v) => {
    const isAbnormal = v.bp_systolic > 140 || v.temperature > 37.5;
    const caregiver = users.find((u) => u.id === v.recorded_by)?.name.split(' ')[0] || 'Staff';
    return [
      v.created_at.substring(0, 10),
      v.created_at.substring(11, 16),
      `${v.bp_systolic}/${v.bp_diastolic} mmHg`,
      `${v.temperature} °C`,
      `${v.oxygen_level} %`,
      `${v.heart_rate} bpm`,
      isAbnormal ? 'ABNORMAL' : 'NORMAL',
      caregiver,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    theme: 'striped',
    head: [['Date', 'Time', 'Blood Pressure', 'Temp', 'SpO2', 'Pulse', 'Status', 'Caregiver']],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    body: historyRows,
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 5: Factual Report Summary & Verification
  if (cursorY > 230) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('5. FACTUAL MONITORING SUMMARY & CARE CENTRE SIGN-OFF', 14, cursorY);
  cursorY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const summaryText = `During the ${dateRangeDays}-day observation window, a total of ${totalReadings} clinical vitals were documented for ${resident.name}. Blood pressure averaged ${avgSys}/${avgDia} mmHg, body temperature averaged ${avgTemp}°C, and blood oxygen averaged ${avgSpO2}%. ${
    criticalReadings.length > 0
      ? `${criticalReadings.length} alert threshold events were detected and notified in real-time via the Telegram emergency bot.`
      : 'All logged readings remained within the safe operational parameters with zero emergency alerts dispatched.'
  } This report is generated strictly from verified monitoring logs for internal care management, doctor consultation, and regulatory review under Pusat Jagaan Warga Emas dan Terapi Fitrah.`;

  const splitSummary = doc.splitTextToSize(summaryText, 182);
  doc.text(splitSummary, 14, cursorY);
  cursorY += splitSummary.length * 4 + 10;

  // Signature boxes
  doc.setDrawColor(203, 213, 225);
  doc.line(14, cursorY + 12, 80, cursorY + 12);
  doc.line(120, cursorY + 12, 196, cursorY + 12);

  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By: Staff Caregiver / Nurse', 14, cursorY + 16);
  doc.text('Verified By: Centre Administrator / Supervisor', 120, cursorY + 16);

  doc.setTextColor(100, 116, 139);
  doc.text('Pusat Jagaan Warga Emas dan Terapi Fitrah', 14, cursorY + 20);
  doc.text('Official Stamp & Signature', 120, cursorY + 20);

  // Footer for all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `GoldenCare System • Pusat Jagaan Warga Emas dan Terapi Fitrah • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Generate a formal PDF Document for the complete Resident List Report
 */
export function generateResidentListReportPDF(
  data: ResidentListReportData
): jsPDF {
  const { residents } = data;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();

  const sortedResidents = [...residents].sort((a, b) => {
    const roomCompare = a.room_number.localeCompare(
      b.room_number,
      undefined,
      { numeric: true }
    );

    if (roomCompare !== 0) return roomCompare;

    return a.name.localeCompare(b.name);
  });

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 34, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GoldenCare Health System', 14, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Pusat Jagaan Warga Emas dan Terapi Fitrah',
    14,
    20
  );

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Official Registered Resident List Report',
    14,
    26
  );

  // Report Metadata
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text(
    `REPORT ID: GC-RES-LIST-${now.getFullYear()}`,
    283,
    13,
    { align: 'right' }
  );

  doc.setTextColor(255, 255, 255);
  doc.text(
    `Generated: ${now.toLocaleString('en-GB')}`,
    283,
    19,
    { align: 'right' }
  );

  doc.text(
    `Total Residents: ${sortedResidents.length}`,
    283,
    25,
    { align: 'right' }
  );

  // Report Intro
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTERED RESIDENT DATABASE', 14, 43);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This report lists all residents currently registered in the GoldenCare database.',
    14,
    49
  );

  const residentRows = sortedResidents.map(
    (resident, index) => [
      String(index + 1),
      resident.name,
      resident.ic_number,
      resident.dob,
      resident.gender,
      resident.room_number,
      resident.emergency_contact,
      resident.medical_history || 'No medical history recorded',
    ]
  );

  autoTable(doc, {
    startY: 55,
    theme: 'grid',
    head: [[
      'No.',
      'Resident Name',
      'IC Number',
      'Date of Birth',
      'Gender',
      'Room',
      'Emergency Contact',
      'Medical History',
    ]],
    body:
      residentRows.length > 0
        ? residentRows
        : [[
            '-',
            'No resident records available',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-',
          ]],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 30 },
      3: { cellWidth: 23, halign: 'center' },
      4: { cellWidth: 17, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 48 },
      7: { cellWidth: 76 },
    },
    margin: {
      left: 14,
      right: 14,
      bottom: 18,
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);

      doc.text(
        'GoldenCare System • Pusat Jagaan Warga Emas dan Terapi Fitrah • Resident List Report',
        14,
        pageHeight - 8
      );
    },
  });

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Page ${page} of ${pageCount}`,
      283,
      202,
      { align: 'right' }
    );
  }

  return doc;
}

/**
 * Generate a formal PDF Document for System / Centre Health Overview Report
 */
export function generateSystemReportPDF(data: SystemReportData): jsPDF {
  const { residents, vitals, users, visitors, dateRangeDays } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const now = new Date();
  const cutoff = new Date(now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
  const filteredVitals = vitals.filter((v) => new Date(v.created_at) >= cutoff);
  const criticalLogs = filteredVitals.filter((v) => v.bp_systolic > 140 || v.temperature > 37.5);
  const normalLogs = filteredVitals.length - criticalLogs.length;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark Slate
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(245, 158, 11); // Amber
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GoldenCare System', 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Pusat Jagaan Warga Emas dan Terapi Fitrah', 14, 21);
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Official Centre Executive Health & Vitals Monitoring Report', 14, 27);

  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text(`CENTRE REPORT: GC-SYS-${now.getFullYear()}`, 196, 14, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${now.toLocaleString('en-GB')}`, 196, 20, { align: 'right' });
  doc.text(`Period: Last ${dateRangeDays} Days`, 196, 26, { align: 'right' });

  let cursorY = 44;

  // Section 1: Executive KPI Metrics
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. FACILITY HEALTH MONITORING EXECUTIVE SUMMARY', 14, cursorY);
  cursorY += 4;

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    body: [
      [
        { content: 'Registered Residents:', styles: { fontStyle: 'bold' } },
        { content: `${residents.length} Active Residents` },
        { content: 'Total Vitals Logged:', styles: { fontStyle: 'bold' } },
        { content: `${filteredVitals.length} Recorded Readings` },
      ],
      [
        { content: 'Normal Range Readings:', styles: { fontStyle: 'bold' } },
        { content: `${normalLogs} Logs (${filteredVitals.length > 0 ? Math.round((normalLogs / filteredVitals.length) * 100) : 0}%)` },
        { content: 'Abnormal Alert Events:', styles: { fontStyle: 'bold' } },
        { content: `${criticalLogs.length} Critical Alerts Dispatched` },
      ],
      [
        { content: 'Registered Caregivers:', styles: { fontStyle: 'bold' } },
        { content: `${users.filter((user) => user.role === 'caregiver').length} Caregivers` },
        { content: 'Registered Visitors:', styles: { fontStyle: 'bold' } },
        { content: `${visitors.length} Logged Entries` },
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 2: Residents Requiring Attention
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. RESIDENTS REQUIRING CLINICAL ATTENTION & RECENT ALERTS', 14, cursorY);
  cursorY += 4;

  // Find residents with alerts
  const residentAlertCounts: Record<number, number> = {};
  criticalLogs.forEach((v) => {
    residentAlertCounts[v.resident_id] = (residentAlertCounts[v.resident_id] || 0) + 1;
  });

  const attentionList = Object.entries(residentAlertCounts)
    .map(([resId, count]) => {
      const res = residents.find((r) => r.id === Number(resId));
      const latestCritical = criticalLogs.find((v) => v.resident_id === Number(resId));
      return {
        res,
        count,
        latestCritical,
      };
    })
    .filter((item) => item.res !== undefined)
    .sort((a, b) => b.count - a.count);

  const attentionRows = attentionList.map((item) => [
    item.res?.name || 'Resident',
    `Room ${item.res?.room_number}`,
    `${item.count} Critical Alert(s)`,
    item.latestCritical ? `BP ${item.latestCritical.bp_systolic}/${item.latestCritical.bp_diastolic} mmHg | ${item.latestCritical.temperature}°C` : 'N/A',
    item.res?.medical_history || 'N/A',
  ]);

  if (attentionRows.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      theme: 'striped',
      head: [['Resident Name', 'Room', 'Alert Count', 'Latest Critical Reading', 'Underlying Condition']],
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      body: attentionRows,
      margin: { left: 14, right: 14 },
    });
  } else {
    autoTable(doc, {
      startY: cursorY,
      theme: 'plain',
      body: [['All residents currently maintain stable vital signs within standard reference intervals.']],
      bodyStyles: { fontSize: 8, textColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    });
  }

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 3: Recent Critical Events Log
  if (cursorY > 210) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. RECENT CRITICAL TELEGRAM NOTIFICATIONS DISPATCHED', 14, cursorY);
  cursorY += 4;

  const alertRows = criticalLogs.slice(0, 10).map((v) => {
    const res = residents.find((r) => r.id === v.resident_id);
    const caregiver = users.find((u) => u.id === v.recorded_by)?.name || 'Caregiver';
    const alertType = v.bp_systolic > 140 && v.temperature > 37.5
      ? 'High BP & Fever'
      : v.bp_systolic > 140
      ? 'Hypertension Alert'
      : 'Elevated Temp Alert';

    return [
      v.created_at,
      res?.name || 'Resident',
      `Room ${res?.room_number || 'N/A'}`,
      alertType,
      `BP ${v.bp_systolic}/${v.bp_diastolic} | ${v.temperature}°C`,
      caregiver,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    theme: 'grid',
    head: [['Timestamp', 'Resident Name', 'Room', 'Alert Classification', 'Readings Value', 'Caregiver']],
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    body: alertRows.length > 0 ? alertRows : [['N/A', 'No abnormal records in period', '-', '-', '-', '-']],
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  cursorY = doc.lastAutoTable.finalY + 8;

  // Section 4: Operational Verification & Sign Off
  if (cursorY > 230) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('4. ADMINISTRATIVE CONCLUSION & SUPERVISORY AUDIT', 14, cursorY);
  cursorY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `This report provides an official facility-level summary of health monitoring, abnormal vital signs detection, and automated notifications for Pusat Jagaan Warga Emas dan Terapi Fitrah. All data points reflect real-time inputs by verified nursing and caregiving staff.`,
    14,
    cursorY,
    { maxWidth: 182 }
  );

  cursorY += 16;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, cursorY + 12, 80, cursorY + 12);
  doc.line(120, cursorY + 12, 196, cursorY + 12);

  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Administrator: Norazlan Bin Ismail', 14, cursorY + 16);
  doc.text('Medical Director / Supervisor Sign-Off', 120, cursorY + 16);

  doc.setTextColor(100, 116, 139);
  doc.text('Pusat Jagaan Warga Emas dan Terapi Fitrah', 14, cursorY + 20);
  doc.text('Official Centre Record Validation', 120, cursorY + 20);

  // Footer for all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `GoldenCare System • Pusat Jagaan Warga Emas dan Terapi Fitrah • Centre Report • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
}
