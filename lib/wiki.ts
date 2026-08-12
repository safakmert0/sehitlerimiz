const TR_API = 'https://tr.wikipedia.org/w/api.php';
const REST_SUMMARY = 'https://tr.wikipedia.org/api/rest_v1/page/summary/';

export interface WikiResult {
  title: string;
  extract: string;
  thumbnail?: string;
  pageUrl: string;
  contentUrl: string;
  type: 'person' | 'page' | 'other' | 'disambiguation';
}

const TYPE_PERSON = ['military person', 'politician', 'person', 'human', 'soldier'];

function normalize(name: string): string {
  return name
    .replace(/^Binbaşı\s+/i, '')
    .replace(/^Yüzbaşı\s+/i, '')
    .replace(/^Onbaşı\s+/i, '')
    .replace(/^Er\s+/i, '')
    .replace(/^Uzman\s+/i, '')
    .replace(/^Piyade\s+/i, '')
    .replace(/[()]/g, '')
    .trim();
}

async function restSummary(title: string): Promise<WikiResult | null> {
  const url = REST_SUMMARY + encodeURIComponent(title);
  const res = await fetch(url, { headers: { 'User-Agent': 'SehitlerimizApp/1.0 (iOS; Android)' } });
  if (!res.ok) return null;
  const d = await res.json();
  if (!d || d.title === 'Not found.' || d.type === 'disambiguation') return null;
  return {
    title: d.displaytitle ? d.displaytitle.replace(/<[^>]*>/g, '') : d.title,
    extract: d.extract ?? '',
    thumbnail: d.thumbnail?.source ?? undefined,
    pageUrl: `https://tr.wikipedia.org/wiki/${encodeURIComponent(d.title.replace(/ /g, '_'))}`,
    contentUrl: `https://tr.wikipedia.org/wiki/${encodeURIComponent(d.title.replace(/ /g, '_'))}`,
    type: d.type ?? 'page',
  };
}

async function search(query: string): Promise<string | null> {
  const url =
    TR_API +
    '?action=query&list=search&srsearch=' +
    encodeURIComponent(query) +
    '&srnamespace=0&srlimit=5&format=json&origin=*';
  const res = await fetch(url);
  if (!res.ok) return null;
  const d = await res.json();
  const hits = d?.query?.search ?? [];
  if (hits.length === 0) return null;
  // Alakasız sonuçları elemek için benzerlik kontrolü:
  // sorgudaki kelimelerden en az birinin (3+ karakter) başlıkta geçmesi gerekir
  const words = query
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const best = hits.find((h: { title: string }) => {
    const t = h.title.toLocaleLowerCase('tr-TR');
    return words.some((w) => t.includes(w));
  });
  return best?.title ?? null;
}

/**
 * Kişi adından Vikipedi sayfası bulur: önce REST summary dener,
 * bulamazsa arama yapıp ilk sonucu dener.
 */
export async function fetchWikiInfo(name: string): Promise<WikiResult | null> {
  try {
    const base = normalize(name);
    let result = await restSummary(base);
    if (result) return result;

    const searched = await search(base);
    if (searched) {
      result = await restSummary(searched);
      if (result) return result;
    }

    // Rütbe/ünvan silinmiş haliyle bir kez daha dene
    const bare = normalize(base.replace(/^\S+\s+/, ''));
    if (bare && bare !== base) {
      result = await restSummary(bare);
      if (result) return result;
    }
    return null;
  } catch {
    return null;
  }
}

/** Kişi için harici arama linkleri (sosyal medya dahil) */
export function externalSearchLinks(name: string) {
  const q = encodeURIComponent(name);
  return [
    {
      label: 'Google',
      icon: 'globe' as const,
      url: `https://www.google.com/search?q=${q}`,
    },
    {
      label: 'Wikipedia',
      icon: 'book' as const,
      url: `https://tr.wikipedia.org/wiki/Special:Search?search=${q}`,
    },
    {
      label: 'YouTube',
      icon: 'logo-youtube' as const,
      url: `https://www.youtube.com/results?search_query=${q}`,
    },
    {
      label: 'X (Twitter)',
      icon: 'logo-twitter' as const,
      url: `https://twitter.com/search?q=${q}`,
    },
    {
      label: 'Instagram',
      icon: 'logo-instagram' as const,
      url: `https://www.instagram.com/explore/tags/?q=${q}`,
    },
  ];
}

const thumbCache = new Map<string, string | null>();

/** Fotoğrafı olmayan kahramanlar için önbellekli Vikipedi küçük görseli */
export async function fetchWikiThumb(name: string): Promise<string | null> {
  const cached = thumbCache.get(name);
  if (cached !== undefined) return cached;
  const result = await fetchWikiInfo(name);
  thumbCache.set(name, result?.thumbnail ?? null);
  return result?.thumbnail ?? null;
}
