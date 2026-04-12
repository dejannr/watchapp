'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export function useCountries() {
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void apiRequest<string[]>('/locations/countries', 'GET', undefined, false, {
      suppressErrorToast: true,
      suppressLoadingIndicator: true,
    })
      .then((data) => {
        if (!active) return;
        setCountries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setCountries([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return countries;
}

export function useCities(country: string) {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const normalizedCountry = country.trim();
    if (!normalizedCountry) {
      return;
    }

    let active = true;
    void apiRequest<string[]>(
      `/locations/cities?country=${encodeURIComponent(normalizedCountry)}`,
      'GET',
      undefined,
      false,
      {
        suppressErrorToast: true,
        suppressLoadingIndicator: true,
      },
    )
      .then((data) => {
        if (!active) return;
        setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setCities([]);
      });

    return () => {
      active = false;
    };
  }, [country]);

  if (!country.trim()) {
    return [];
  }
  return cities;
}
