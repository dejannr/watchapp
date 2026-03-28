'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError, apiRequest, refreshAccessToken } from '@/lib/api';
import { clearAccessToken, getAccessToken } from '@/lib/auth';

export type SessionUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  roles: string[];
  role: 'USER' | 'SELLER' | 'ADMIN';
  userStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING_EMAIL_VERIFICATION';
  sellerStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  sellerVerificationLevel?: 'UNVERIFIED' | 'BASIC_VERIFIED' | 'ENHANCED_VERIFIED';
  sellerType?: 'PRIVATE' | 'BUSINESS';
  emailVerified: boolean;
};

export function useCurrentUser() {
  return useQuery<SessionUser | null>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      let token = getAccessToken();
      if (!token) {
        token = await refreshAccessToken();
        if (!token) {
          return null;
        }
      }

      try {
        return await apiRequest<SessionUser>('/auth/me', 'GET', undefined, true, {
          suppressErrorToast: true,
          suppressLoadingIndicator: true,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && token) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            clearAccessToken();
            return null;
          }
          return await apiRequest<SessionUser>('/auth/me', 'GET', undefined, true, {
            suppressErrorToast: true,
            suppressLoadingIndicator: true,
          });
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}
