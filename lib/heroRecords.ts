import type { Hero } from './types';

type RecordSource = 'msb' | 'mehmetcik' | 'temmuz15' | null;

const REVIEW_REQUIRED_IDS = new Set([
  'msb-95',
  'msb-107923',
  'msb-23988',
  'msb-109689',
  'mc-120',
  'd-h44',
]);

function sourceOf(hero: Pick<Hero, 'id'>): RecordSource {
  if (hero.id.startsWith('msb-')) return 'msb';
  if (hero.id.startsWith('mc-')) return 'mehmetcik';
  if (hero.id.startsWith('t15-')) return 'temmuz15';
  return null;
}

function clean(value: string | null): string | null {
  const cleaned = value?.replace(/\s+/g, ' ').trim() ?? '';
  return cleaned || null;
}

function dateYear(value: string | null): string | null {
  return value?.match(/^\d{4}/)?.[0] ?? null;
}

function msbStory(hero: Hero): string {
  const details = [clean(hero.rank), clean(hero.unit)].filter(Boolean).join(' · ');
  const event = [hero.death_date, clean(hero.death_place)].filter(Boolean).join(' — ');
  const sentences = [`Bu kayıt, MSB Şehit Bilgi Kapısı'ndaki sicil kaydına dayanmaktadır.`];
  if (details) sentences.push(`${details} bilgisi kaynak kaydında yer alır.`);
  if (event) sentences.push(`Kaynak kaydındaki şehadet bilgisi: ${event}.`);
  return sentences.join(' ');
}

/**
 * İçeriği kaynak kaydına sadık, ek/otomatik üretilmiş cümlelerden arındırılmış
 * biçimde gösterir. Ham veri dosyaları kaynak incelemesi için korunur.
 */
export function reviewedHero(hero: Hero): Hero {
  const base: Hero = {
    ...hero,
    full_name: hero.full_name.replace(/\s+/g, ' ').trim(),
    rank: clean(hero.rank),
    unit: clean(hero.unit),
    birth_place: clean(hero.birth_place),
    death_place: clean(hero.death_place),
    grave_location: clean(hero.grave_location),
    profile_photo_url: clean(hero.profile_photo_url),
  };

  if (REVIEW_REQUIRED_IDS.has(base.id)) {
    return {
      ...base,
      status: 'pending',
      summary: null,
      story: null,
      profile_photo_url: null,
    };
  }

  switch (sourceOf(base)) {
    case 'msb':
      return {
        ...base,
        summary: 'MSB Şehit Bilgi Kapısı kaynak kaydı.',
        story: msbStory(base),
      };
    case 'mehmetcik':
      return {
        ...base,
        summary: 'TSK Mehmetçik Vakfı şehitler listesinde yer alan kaynak kaydı.',
        story: null,
      };
    case 'temmuz15':
      // Kişiye özgü kaynakla doğrulanmamış şablon anlatılar yayımlanmaz.
      return { ...base, summary: null, story: null };
    default:
      return base;
  }
}

/** Supabase'den gelen katkı kayıtları için aynı içerik güvenliği uygulanır. */
export function approvedHeroRecord(hero: Hero): Hero | null {
  if (hero.status !== 'approved') return null;
  return reviewedHero(hero);
}

export function recordSourceLabel(hero: Hero): string | null {
  const source = sourceOf(hero);
  if (source === 'msb') return `MSB sicil no: ${hero.id.replace(/^msb-/, '')}`;
  if (source === 'mehmetcik') return 'TSK Mehmetçik Vakfı kaydı';
  if (source === 'temmuz15') return '15 Temmuz Şehitleri kaydı';
  return null;
}

/** Aynı adla kayıtlı farklı kişileri listede ayırt edecek kısa, kaynak-temelli bilgi. */
export function recordDisambiguator(hero: Hero): string | null {
  const source = sourceOf(hero);
  const year = dateYear(hero.death_date);

  if (source === 'msb') {
    return [clean(hero.birth_place), year ? `${year} şehadet kaydı` : null, recordSourceLabel(hero)]
      .filter(Boolean)
      .join(' · ');
  }
  if (source === 'temmuz15') {
    return [clean(hero.birth_place), clean(hero.unit), recordSourceLabel(hero)]
      .filter(Boolean)
      .join(' · ');
  }
  if (source === 'mehmetcik') return recordSourceLabel(hero);

  return [clean(hero.birth_place), year].filter(Boolean).join(' · ') || null;
}

/**
 * İsimle yapılan Vikipedi/Commons eşlemesi, tek adlı ya da aynı adlı kaynak
 * kayıtlarında yanlış kişi içeriği getirebildiği için bu kayıtlarda kapalıdır.
 */
export function canAutoEnrichHero(hero: Hero): boolean {
  // Kişi sayfası ve Commons medya eşleşmesi yalnız elle seçilmiş demo
  // kayıtlarında kullanılabilir. Kullanıcı katkıları ve kaynak listeleri için
  // medya, moderasyonla onaylanan hero_media kayıtlarından gelir.
  return hero.id.startsWith('d-h') && hero.full_name.trim().split(/\s+/).length >= 2;
}
