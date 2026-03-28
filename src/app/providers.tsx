'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { NotificationsProvider } from '@/components/notifications-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>{children}</NotificationsProvider>
    </QueryClientProvider>
  );
}
