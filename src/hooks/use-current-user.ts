'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/lib/api';
import { clearAccessToken, getAccessToken } from '@/lib/auth';

export type SessionUser = {
  id: string;
  email: string;
  roles: string[];
  role: 'USER' | 'SELLER' | 'ADMIN';
  userStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING_EMAIL_VERIFICATION';
  sellerStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  sellerVerificationLevel?: 'UNVERIFIED' | 'BASIC_VERIFIED' | 'ENHANCED_VERIFIED';
  sellerType?: 'PRIVATE' | 'BUSINESS';
  emailVerified: boolean;
};

export function useCurrentUser() {
  const token = getAccessToken();
  return useQuery({
    queryKey: ['auth-me', token],
    queryFn: async () => {
      try {
        return await apiRequest<SessionUser>('/auth/me', 'GET', undefined, true, {
          suppressErrorToast: true,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAccessToken();
        }
        throw error;
      }
    },
    enabled: Boolean(token),
    retry: false,
  });
}
