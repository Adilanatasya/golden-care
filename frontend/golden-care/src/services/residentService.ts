import { Resident } from '../types';
import { apiRequest } from './api';

export type ResidentInput = Omit<Resident, 'id' | 'created_at'>;
export type ResidentUpdate = Partial<ResidentInput>;

interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

interface PaginatedResidents {
  current_page: number;
  data: Resident[];
  last_page: number;
}

const normalizeResident = (resident: Resident): Resident => ({
  ...resident,
  dob: resident.dob?.substring(0, 10) || '',
  medical_history: resident.medical_history || '',
});

export async function getResidents(): Promise<Resident[]> {
  const residents: Resident[] = [];
  let currentPage = 1;
  let lastPage = 1;

  do {
    const response = await apiRequest<ApiEnvelope<PaginatedResidents>>(
      `/residents?per_page=100&page=${currentPage}`,
    );

    residents.push(...response.data.data.map(normalizeResident));
    lastPage = response.data.last_page;
    currentPage += 1;
  } while (currentPage <= lastPage);

  return residents;
}

export async function getResident(id: number): Promise<Resident> {
  const response = await apiRequest<ApiEnvelope<Resident>>(`/residents/${id}`);

  return normalizeResident(response.data);
}

export async function createResident(input: ResidentInput): Promise<Resident> {
  const response = await apiRequest<ApiEnvelope<Resident>>('/residents', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return normalizeResident(response.data);
}

export async function updateResident(
  id: number,
  input: ResidentUpdate,
): Promise<Resident> {
  const response = await apiRequest<ApiEnvelope<Resident>>(`/residents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return normalizeResident(response.data);
}

export async function deleteResident(id: number): Promise<void> {
  await apiRequest(`/residents/${id}`, {
    method: 'DELETE',
  });
}
