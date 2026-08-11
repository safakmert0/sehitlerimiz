-- ============================================================
-- İSTATİSTİK FONKSİYONU
-- SQL Editor'a yapıştırıp çalıştırın (uygulamada "İstatistik" sekmesi için)
-- ============================================================

create or replace function public.get_stats()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total',          count(*),
    'martyrs',        count(*) filter (where is_martyr),
    'veterans',       count(*) filter (where is_veteran),
    'per_conflict',   coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'count', cnt))
      from (
        select conflict_id, count(*) as cnt
        from heroes
        where status = 'approved'
        group by conflict_id
      ) h
      left join conflicts c on c.id = h.conflict_id
    ), '[]'::jsonb),
    'per_year',       coalesce((
      select jsonb_agg(jsonb_build_object('year', y, 'count', cnt))
      from (
        select extract(year from death_date)::int as y, count(*) as cnt
        from heroes
        where status = 'approved' and is_martyr and death_date is not null
        group by 1
      ) t
    ), '[]'::jsonb),
    'per_city',       coalesce((
      select jsonb_agg(jsonb_build_object('city', city, 'count', cnt))
      from (
        select birth_place as city, count(*) as cnt
        from heroes
        where status = 'approved' and birth_place is not null
        group by 1
        order by cnt desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'updated_at',     now()
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_stats() to anon, authenticated;
