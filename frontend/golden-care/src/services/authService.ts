import { apiRequest } from './api';

interface LogoutResponse {
  status: 'success';
  message: string;
}

/**
 * Revoke the current Sanctum Bearer token in Laravel.
 */
export async function logoutUser(): Promise<void> {
  await apiRequest<LogoutResponse>('/logout', {
    method: 'POST',
  });
}
