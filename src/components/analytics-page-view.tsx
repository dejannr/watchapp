'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function AnalyticsPageView({
  eventName,
  properties,
}: {
  eventName: string;
  properties?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackEvent(eventName, properties);
  }, [eventName, properties]);

  return null;
}
