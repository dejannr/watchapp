'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type NotifyApi = {
  notify: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const NotifyContext = createContext<NotifyApi | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const onRequestEvent = (evt: Event) => {
      const detail = (evt as CustomEvent<{ type?: string; message?: string }>).detail;
      if (detail?.type === 'start') {
        setPendingCount((c) => c + 1);
      } else if (detail?.type === 'end') {
        setPendingCount((c) => (c > 0 ? c - 1 : 0));
      } else if (detail?.type === 'error' && detail.message) {
        notify(detail.message, 'error');
      }
    };
    window.addEventListener('watchapp:request', onRequestEvent as EventListener);
    return () => window.removeEventListener('watchapp:request', onRequestEvent as EventListener);
  }, [notify]);

  const value = useMemo<NotifyApi>(
    () => ({
      notify,
      success: (message: string) => notify(message, 'success'),
      error: (message: string) => notify(message, 'error'),
      info: (message: string) => notify(message, 'info'),
    }),
    [notify],
  );

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(360px,92vw)] flex-col gap-2">
        {pendingCount > 0 && (
          <div className="rounded border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm shadow">
            Working...
          </div>
        )}
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded border px-3 py-2 text-sm shadow ${
              toast.type === 'success'
                ? 'border-green-300 bg-green-50 text-green-800'
                : toast.type === 'error'
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : 'border-[var(--line)] bg-[var(--card)] text-[var(--text)]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotify must be used inside NotificationsProvider');
  }
  return ctx;
}

