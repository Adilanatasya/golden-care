import { apiRequest } from './api';

export interface AdminSummary {
  total_residents: number;
  total_caregivers: number;
  total_vitals: number;
  critical_vitals: number;
  total_medication_logs: number;
  medication_given: number;
  medication_missed: number;
  medication_pending: number;
  total_visitors: number;
  visitors_checked_in: number;
}

interface SummaryResponse {
  status: 'success' | 'error';
  report: string;
  data: AdminSummary;
}

const normalizeSummary = (summary: AdminSummary): AdminSummary => ({
  total_residents: Number(summary.total_residents),
  total_caregivers: Number(summary.total_caregivers),
  total_vitals: Number(summary.total_vitals),
  critical_vitals: Number(summary.critical_vitals),
  total_medication_logs: Number(summary.total_medication_logs),
  medication_given: Number(summary.medication_given),
  medication_missed: Number(summary.medication_missed),
  medication_pending: Number(summary.medication_pending || 0),
  total_visitors: Number(summary.total_visitors),
  visitors_checked_in: Number(summary.visitors_checked_in || 0),
});

export async function getAdminSummary(): Promise<AdminSummary> {
  const response = await apiRequest<SummaryResponse>('/reports/summary');

  return normalizeSummary(response.data);
}
