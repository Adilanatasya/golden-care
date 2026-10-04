
import { Vital } from '../types';
import { apiRequest } from './api';

export type VitalInput = Pick<
  Vital,
  | 'resident_id'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'heart_rate'
  | 'temperature'
  | 'oxygen_level'
>;

export interface CreateVitalResult {
  vital: Vital;
  message: string;
  isCritical: boolean;
  telegramDispatched: boolean | null;
}

interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

interface PaginatedVitals {
  current_page: number;
  data: Vital[];
  last_page: number;
}

interface CreateVitalResponse extends ApiEnvelope<Vital> {
  is_critical: boolean;
  telegram_dispatched: boolean | null;
}

const normalizeVital = (vital: Vital): Vital => ({
  ...vital,
  resident_id: Number(vital.resident_id),
  recorded_by: Number(vital.recorded_by),
  bp_systolic: Number(vital.bp_systolic),
  bp_diastolic: Number(vital.bp_diastolic),
  heart_rate: Number(vital.heart_rate),
  temperature: Number(vital.temperature),
  oxygen_level: Number(vital.oxygen_level),
});

export async function getVitals(): Promise<Vital[]> {
  const vitals: Vital[] = [];
  let currentPage = 1;
  let lastPage = 1;

  do {
    const response = await apiRequest<ApiEnvelope<PaginatedVitals>>(
      `/vitals?page=${currentPage}`,
    );

    vitals.push(...response.data.data.map(normalizeVital));
    lastPage = response.data.last_page;
    currentPage += 1;
  } while (currentPage <= lastPage);

  return vitals;
}

export async function createVital(
  input: VitalInput,
): Promise<CreateVitalResult> {
  const response = await apiRequest<CreateVitalResponse>('/vitals', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return {
    vital: normalizeVital(response.data),
    message: response.message || 'Vital successfully recorded.',
    isCritical: response.is_critical,
    telegramDispatched: response.telegram_dispatched,
  };
}
