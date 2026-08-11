import { Platform } from 'react-native';

export const SITE_NAME = 'Şehitlerimiz';
export const SITE_TAGLINE =
  'Vatan için canını veren şehitlerimizin ve gazilerimizin hayat hikayeleri.';

// Supabase storage public URL'si oluşturma
export function publicMediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${url}/storage/v1/object/public/hero-media/${path}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ageAtDeath(birth: string | null, death: string | null): number | null {
  if (!birth || !death) return null;
  const b = new Date(birth);
  const d = new Date(death);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export function openMapUrl(lat: number | null, lng: number | null, query: string | null): string {
  const q = encodeURIComponent(query ?? '');
  if (Platform.OS === 'ios' && lat && lng) {
    return `maps://?daddr=${lat},${lng}&q=${q}`;
  }
  if (lat && lng) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
