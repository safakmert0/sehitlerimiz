-- ============================================================
-- ŞEHİTLERİMİZ — Supabase Şeması
-- SQL Editor'a yapıştırıp çalıştırın (veya supabase CLI ile: supabase db push)
-- ============================================================

-- Türkçe tam metin arama için unaccent
create extension if not exists unaccent;

-- ============================================================
-- PROFİL (auth.users ile senkron)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Yeni kullanıcı kaydolduğunda otomatik profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SAVAŞ / OPERASYON KATEGORİLERİ
-- ============================================================
create table if not exists public.conflicts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

insert into public.conflicts (name, sort_order) values
  ('Çanakkale Savaşı', 10),
  ('Sarıkamış Harekatı', 20),
  ('Kurtuluş Savaşı', 30),
  ('Kore Savaşı', 40),
  ('Kıbrıs Barış Harekatı', 50),
  ('15 Temmuz Darbe Girişimi', 60),
  ('Terörle Mücadele', 70),
  ('Sınır Ötesi Operasyonlar', 80),
  ('Diğer', 90)
on conflict (name) do nothing;

-- ============================================================
-- YARDIMCI FONKSİYONLAR
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- KAHRAMANLAR (şehit + gazi tek tabloda)
-- ============================================================
create table if not exists public.heroes (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  rank text,
  unit text,
  birth_date date,
  birth_place text,
  death_date date,
  death_place text,
  conflict_id uuid references public.conflicts (id),
  is_martyr boolean not null default true,
  is_veteran boolean not null default false,
  summary text,
  story text,
  profile_photo_url text,
  grave_location text,
  lat double precision,
  lng double precision,
  -- moderasyon
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_by uuid references public.profiles (id),
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector
);

create index if not exists idx_heroes_status on public.heroes (status, is_martyr);
create index if not exists idx_heroes_conflict on public.heroes (conflict_id);
create index if not exists idx_heroes_search on public.heroes using gin (search_vector);

-- Türkçe dostu tam metin arama vektörü
create or replace function public.heroes_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := setweight(to_tsvector('simple', unaccent(coalesce(new.full_name, ''))), 'A')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.birth_place, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.death_place, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.unit, ''))), 'C')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.summary, ''))), 'C')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.story, ''))), 'D');
  return new;
end;
$$;

drop trigger if exists trg_heroes_search on public.heroes;
create trigger trg_heroes_search
  before insert or update on public.heroes
  for each row execute procedure public.heroes_search_vector();

drop trigger if exists trg_heroes_updated on public.heroes;
create trigger trg_heroes_updated
  before update on public.heroes
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- GÖRSEL / VİDEO / BELGE
-- ============================================================
create table if not exists public.hero_media (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.heroes (id) on delete cascade,
  type text not null check (type in ('photo', 'video', 'audio', 'document')),
  url text not null,
  caption text,
  uploaded_by uuid references public.profiles (id),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_hero_media_hero on public.hero_media (hero_id, status);

-- ============================================================
-- BİLDİRİMLER (yanlış içerik bildirimi)
-- ============================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid references public.heroes (id) on delete cascade,
  media_id uuid references public.hero_media (id) on delete cascade,
  report_type text not null
    check (report_type in ('yanlis_bilgi', 'saldirgan_icerik', 'telif', 'eksik_bilgi', 'diger')),
  description text,
  status text not null default 'open'
    check (status in ('open', 'resolved', 'dismissed')),
  reported_by uuid references public.profiles (id),
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_status on public.reports (status);

-- ============================================================
-- ANI DEFTERİ (başsağlığı / anı mesajları)
-- ============================================================
create table if not exists public.tributes (
  id uuid primary key default gen_random_uuid(),
  hero_id uuid not null references public.heroes (id) on delete cascade,
  user_id uuid references public.profiles (id),
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_tributes_hero on public.tributes (hero_id, status);

-- ============================================================
-- YARDIMCI FONKSİYONLAR
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Admin mi?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.heroes enable row level security;
alter table public.hero_media enable row level security;
alter table public.reports enable row level security;
alter table public.tributes enable row level security;
alter table public.conflicts enable row level security;

-- conflicts herkese açık (okuma)
create policy "conflicts public read" on public.conflicts
  for select using (true);

-- profiles: herkes okuyabilir, kullanıcı kendi profilini güncelleyebilir
create policy "profiles public read" on public.profiles
  for select using (true);
create policy "profiles own update" on public.profiles
  for update using (auth.uid() = id);

-- heroes: onaylananlar herkese açık; pending sahibine ve admin'e görünür
create policy "heroes approved read" on public.heroes
  for select using (status = 'approved');
create policy "heroes own pending read" on public.heroes
  for select using (auth.uid() = created_by);
create policy "heroes admin read all" on public.heroes
  for select using (public.is_admin());
create policy "heroes insert" on public.heroes
  for insert with check (auth.uid() = created_by);
create policy "heroes owner update pending" on public.heroes
  for update using (
    auth.uid() = created_by and status = 'pending'
  );
create policy "heroes admin update" on public.heroes
  for update using (public.is_admin());
create policy "heroes admin delete" on public.heroes
  for delete using (public.is_admin());

-- hero_media: onaylananlar herkese açık
create policy "media approved read" on public.hero_media
  for select using (status = 'approved');
create policy "media owner read" on public.hero_media
  for select using (auth.uid() = uploaded_by);
create policy "media admin read" on public.hero_media
  for select using (public.is_admin());
create policy "media insert" on public.hero_media
  for insert with check (auth.uid() = uploaded_by);
create policy "media owner update pending" on public.hero_media
  for update using (auth.uid() = uploaded_by and status = 'pending');
create policy "media admin update" on public.hero_media
  for update using (public.is_admin());
create policy "media admin delete" on public.hero_media
  for delete using (public.is_admin());

-- reports: bildiren kendi bildirimini okuyabilir, admin hepsini yönetir
create policy "reports own read" on public.reports
  for select using (auth.uid() = reported_by);
create policy "reports admin read" on public.reports
  for select using (public.is_admin());
create policy "reports insert" on public.reports
  for insert with check (auth.uid() = reported_by);
create policy "reports admin update" on public.reports
  for update using (public.is_admin());

-- tributes: onaylanan anılar herkese açık
create policy "tributes approved read" on public.tributes
  for select using (status = 'approved');
create policy "tributes own pending read" on public.tributes
  for select using (auth.uid() = user_id);
create policy "tributes admin read" on public.tributes
  for select using (public.is_admin());
create policy "tributes insert" on public.tributes
  for insert with check (auth.uid() = user_id);
create policy "tributes admin update" on public.tributes
  for update using (public.is_admin());
create policy "tributes admin delete" on public.tributes
  for delete using (public.is_admin());

-- ============================================================
-- STORAGE (fotoğraf/video yükleme)
-- ============================================================
-- SQL Editor'da aşağıdakileri ayrıca çalıştırın:
--   insert into storage.buckets (id, name, public) values ('hero-media', 'hero-media', true);
--   create policy "media public read" on storage.objects for select using (bucket_id = 'hero-media');
--   create policy "media auth upload" on storage.objects for insert with check (
--     bucket_id = 'hero-media' and auth.role() = 'authenticated'
--   );
--   create policy "media admin delete" on storage.objects for delete using (
--     bucket_id = 'hero-media' and public.is_admin()
--   );
