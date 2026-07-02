'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';

type TrackedPage = 'HOME' | 'ANNONCES' | 'BOUTIQUES' | 'EMPLOIS' | 'RESTAURANTS' | 'HOTELS';

export default function PageViewTracker({ page }: { page: TrackedPage }) {
  useEffect(() => {
    api.post('/analytics/pageview', { page }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
