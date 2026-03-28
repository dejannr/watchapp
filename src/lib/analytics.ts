'use client';

import { getAccessToken } from './auth';
import { API_URL } from './config';

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const token = getAccessToken();
  const sessionId = window.localStorage.getItem('watchapp_session_id') ?? crypto.randomUUID();
  window.localStorage.setItem('watchapp_session_id', sessionId);

  void fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      eventName,
      page: window.location.pathname + window.location.search,
      sessionId,
      properties: properties ?? {},
    }),
  }).catch(() => undefined);
}
