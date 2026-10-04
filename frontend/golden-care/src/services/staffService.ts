import { User, UserRole } from '../types';
import { apiRequest } from './api';

export interface StaffCreateInput {
  name: string;
  email: string;
  role: UserRole;
  status: User['status'];
  phone?: string;
  password: string;
  password_confirmation: string;
}

export interface StaffUpdateInput {
  name: string;
  email: string;
  role: UserRole;
  status: User['status'];
  phone?: string;
  password?: string;
  password_confirmation?: string;
}

interface ApiEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

const normalizeUser = (user: User): User => ({
  ...user,
  status: user.status || 'Active',
  phone: user.phone || '',
  last_login: user.last_login || undefined,
});

export async function getStaff(): Promise<User[]> {
  const response = await apiRequest<ApiEnvelope<User[]>>('/staff');
  return response.data.map(normalizeUser);
}

export async function createStaff(input: StaffCreateInput): Promise<User> {
  const response = await apiRequest<ApiEnvelope<User>>('/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return normalizeUser(response.data);
}

export async function updateStaff(
  id: number,
  input: StaffUpdateInput,
): Promise<User> {
  const response = await apiRequest<ApiEnvelope<User>>(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return normalizeUser(response.data);
}

export async function deleteStaff(id: number): Promise<void> {
  await apiRequest(`/staff/${id}`, {
    method: 'DELETE',
  });
}
