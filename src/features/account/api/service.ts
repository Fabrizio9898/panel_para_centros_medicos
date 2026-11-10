import { apiClient } from '@/lib/api-client';
import type { Me } from './types';

export async function getMe() {
  return apiClient<Me>('/clinic/users/me');
}
