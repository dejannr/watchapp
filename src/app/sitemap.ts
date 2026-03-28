import type { MetadataRoute } from 'next';
import { API_URL } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const [listingsRes, brandsRes] = await Promise.all([
    fetch(`${API_URL}/listings?limit=200`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ items: [] })),
    fetch(`${API_URL}/brands`, { cache: 'no-store' }).then((r) => r.json()).catch(() => []),
  ]);

  const listingItems = Array.isArray(listingsRes?.items) ? listingsRes.items : [];
  const brandItems = Array.isArray(brandsRes) ? brandsRes : [];

  const core: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/sell`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const listings: MetadataRoute.Sitemap = listingItems
    .filter((item: any) => item?.slug)
    .map((item: any) => ({
      url: `${baseUrl}/listing/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  const brands: MetadataRoute.Sitemap = brandItems
    .filter((item: any) => item?.slug)
    .map((item: any) => ({
      url: `${baseUrl}/browse?brand=${item.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  return [...core, ...listings, ...brands];
}
