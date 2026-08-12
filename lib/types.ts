// ============================================================
// TİPLER
// ============================================================

export type Role = 'user' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Conflict {
  id: string;
  name: string;
  sort_order: number;
}

export type HeroStatus = 'pending' | 'approved' | 'rejected';

export interface Hero {
  id: string;
  full_name: string;
  rank: string | null;
  unit: string | null;
  birth_date: string | null;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  conflict_id: string | null;
  is_martyr: boolean;
  is_veteran: boolean;
  summary: string | null;
  story: string | null;
  profile_photo_url: string | null;
  grave_location: string | null;
  lat: number | null;
  lng: number | null;
  status: HeroStatus;
  rejection_reason: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  conflict?: Conflict | null;
}

export interface HeroWithConflict extends Hero {
  conflict?: Conflict | null;
}

export type MediaType = 'photo' | 'video' | 'audio' | 'document';

export interface HeroMedia {
  id: string;
  hero_id?: string;
  type: MediaType;
  url: string;
  caption: string | null;
  uploaded_by?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  hero?: { id: string; full_name?: string | null } | null;
}

export type ReportType =
  | 'yanlis_bilgi'
  | 'saldirgan_icerik'
  | 'telif'
  | 'eksik_bilgi'
  | 'diger';

export interface Report {
  id: string;
  hero_id: string | null;
  media_id: string | null;
  report_type: ReportType;
  description: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  reported_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  hero?: { id: string; full_name?: string | null } | null;
}

export interface Tribute {
  id: string;
  hero_id: string;
  user_id: string | null;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  hero?: { id: string; full_name?: string | null } | null;
  profile?: { full_name?: string | null } | null;
}

export interface HeroFilters {
  type: 'all' | 'martyr' | 'veteran';
  conflictId: string | null;
  query: string;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  yanlis_bilgi: 'Yanlış bilgi',
  saldirgan_icerik: 'Saldırgan / uygunsuz içerik',
  telif: 'Telif hakkı ihlali',
  eksik_bilgi: 'Eksik bilgi',
  diger: 'Diğer',
};

export const STATUS_LABELS: Record<HeroStatus, string> = {
  pending: 'Onay Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};
