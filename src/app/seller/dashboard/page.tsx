'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

type SellerDashboardData = {
  listingCounts?: Record<string, number>;
  latestInquiries?: Array<{
    id: string;
    createdAt: string;
  }>;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function SellerDashboardPage() {
  const statusChartRef = useRef<HTMLDivElement | null>(null);
  const inquiryChartRef = useRef<HTMLDivElement | null>(null);
  const dashboard = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => apiRequest<SellerDashboardData>('/seller/dashboard', 'GET', undefined, true),
  });
  const listingCounts = dashboard.data?.listingCounts ?? {};
  const totalListings = (Object.values(listingCounts) as Array<number | string | null | undefined>)
    .reduce((sum: number, value) => sum + Number(value ?? 0), 0);
  const totalInquiries = dashboard.data?.latestInquiries?.length ?? 0;

  const statusChartData = useMemo(
    () =>
      Object.entries(listingCounts)
        .map(([status, count]) => ({ name: formatStatus(status), value: Number(count ?? 0) }))
        .filter((row) => row.value > 0),
    [listingCounts],
  );

  const inquiryTrend = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const row of dashboard.data?.latestInquiries ?? []) {
      const d = new Date(row.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const labels = Array.from(buckets.keys()).sort();
    const values = labels.map((label) => buckets.get(label) ?? 0);
    return { labels, values };
  }, [dashboard.data?.latestInquiries]);

  useEffect(() => {
    let mounted = true;
    let instance: any;
    let onResize: (() => void) | null = null;
    void import('echarts').then((echarts) => {
      if (!mounted || !statusChartRef.current) return;
      instance = echarts.init(statusChartRef.current);
      instance.setOption({
        color: ['#1f8a70', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6', '#64748b'],
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { color: '#57534e' } },
        series: [
          {
            name: 'Listings',
            type: 'pie',
            radius: ['45%', '70%'],
            itemStyle: { borderRadius: 8, borderColor: '#fafaf9', borderWidth: 3 },
            label: { color: '#44403c' },
            data: statusChartData.length > 0 ? statusChartData : [{ name: 'No listings', value: 1 }],
          },
        ],
      });
      onResize = () => instance?.resize();
      window.addEventListener('resize', onResize);
    });
    return () => {
      mounted = false;
      if (onResize) window.removeEventListener('resize', onResize);
      instance?.dispose();
    };
  }, [statusChartData]);

  useEffect(() => {
    let mounted = true;
    let instance: any;
    let onResize: (() => void) | null = null;
    void import('echarts').then((echarts) => {
      if (!mounted || !inquiryChartRef.current) return;
      instance = echarts.init(inquiryChartRef.current);
      instance.setOption({
        color: ['#1f8a70'],
        tooltip: { trigger: 'axis' },
        grid: { left: 32, right: 16, top: 20, bottom: 28 },
        xAxis: {
          type: 'category',
          data: inquiryTrend.labels,
          axisLabel: { color: '#57534e' },
          axisLine: { lineStyle: { color: '#d6d3d1' } },
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#57534e' },
          splitLine: { lineStyle: { color: '#e7e5e4' } },
        },
        series: [
          {
            data: inquiryTrend.values,
            type: 'bar',
            barMaxWidth: 36,
            itemStyle: { borderRadius: [8, 8, 0, 0] },
          },
        ],
      });
      onResize = () => instance?.resize();
      window.addEventListener('resize', onResize);
    });
    return () => {
      mounted = false;
      if (onResize) window.removeEventListener('resize', onResize);
      instance?.dispose();
    };
  }, [inquiryTrend]);

  return (
    <div className="container space-y-4">
      <h1 className="text-3xl font-bold">Seller Dashboard</h1>
      <div className="pt-1 pb-2">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/seller-dashboard/listings/new"
            className="inline-flex rounded bg-[var(--brand)] px-4 py-2 text-white"
          >
            Create Listing
          </Link>
          <Link
            href="/seller-dashboard/listings"
            className="inline-flex rounded border border-[var(--line)] px-4 py-2"
          >
            My Listings
          </Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(listingCounts).map(([status, count]) => (
          <div key={status} className="card p-3">
            <p className="text-sm text-[var(--muted)]">{formatStatus(status)}</p>
            <p className="text-2xl font-bold">{String(count)}</p>
          </div>
        ))}
        <div className="card p-3">
          <p className="text-sm text-[var(--muted)]">Recent Inquiries</p>
          <p className="text-2xl font-bold">{totalInquiries}</p>
        </div>
      </div>
      {totalListings === 0 && (
        <div className="card p-4 text-sm text-[var(--muted)]">
          You do not have any listings yet. Create your first listing to start receiving buyer inquiries.
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 text-lg font-semibold">Listings By Status</h2>
          <div ref={statusChartRef} className="h-72 w-full" />
        </div>
        <div className="card p-4">
          <h2 className="mb-2 text-lg font-semibold">Inquiries Trend (Recent)</h2>
          <div ref={inquiryChartRef} className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}
