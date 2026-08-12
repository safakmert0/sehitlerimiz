const TR_API = 'https://tr.wikipedia.org/w/api.php';
const REST_SUMMARY = 'https://tr.wikipedia.org/api/rest_v1/page/summary/';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/** Sayfa görsellerinde elemesi gereken dosya türleri (logo/ikon/harita vb.) */
const SKIP_FILE_PATTERN = /logo|icon|map|flag|coat|seal|signature|stub|wikimedia|svg|locator|insignia|buğday|bayrak/i;

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

const galleryCache = new Map<string, string[]>();

/** Vikipedi sayfasındaki gerçek fotoğrafları toplar (logo/ikon/harita hariç) */
export async function fetchWikiGallery(name: string): Promise<string[]> {
  const cached = galleryCache.get(name);
  if (cached !== undefined) return cached;
  try {
    const result = await fetchWikiInfo(name);
    if (!result) {
      galleryCache.set(name, []);
      return [];
    }
    const title = decodeURIComponent(result.pageUrl.split('/wiki/')[1] ?? '');
    const filesRes = await fetch(
      `${TR_API}?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=40&format=json&origin=*`
    );
    const filesData = await filesRes.json();
    const pages = Object.values(filesData?.query?.pages ?? {}) as Array<{
      images?: { title: string }[];
    }>;
    const fileTitles = (pages[0]?.images ?? [])
      .map((i) => i.title)
      .filter((t) => !SKIP_FILE_PATTERN.test(t));

    const infoRes = await fetch(
      `${TR_API}?action=query&titles=${encodeURIComponent(
        fileTitles.slice(0, 12).join('|')
      )}&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`
    );
    const infoData = await infoRes.json();
    const files = Object.values(infoData?.query?.pages ?? {}) as Array<{
      imageinfo?: { thumburl?: string; width?: number; height?: number; url?: string }[];
    }>;
    const photos = files
      .flatMap((p) => p.imageinfo ?? [])
      .filter((i) => i.thumburl && i.width && i.height)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
      .slice(0, 6)
      .map((i) => i.thumburl as string);
    galleryCache.set(name, photos);
    return photos;
  } catch {
    galleryCache.set(name, []);
    return [];
  }
}

const videoCache = new Map<string, { url: string; caption: string }[]>();

/** Wikimedia Commons'ta kişi adıyla ilişkili videoları arar */
export async function fetchWikiVideos(name: string): Promise<{ url: string; caption: string }[]> {
  const cached = videoCache.get(name);
  if (cached !== undefined) return cached;
  try {
    const base = normalize(name);
    const res = await fetch(
      `${COMMONS_API}?action=query&generator=search&gsrsearch=${encodeURIComponent(
        `filetype:video ${base}`
      )}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json&origin=*`
    );
    const data = await res.json();
    const hits = Object.values(data?.query?.pages ?? {}) as Array<{
      title?: string;
      imageinfo?: { thumburl?: string; url?: string; width?: number; height?: number }[];
    }>;
    const needThumb = hits.some((h) => h.imageinfo?.[0]?.thumburl);
    const videos = hits
      .filter((h) => h.imageinfo?.[0]?.thumburl && h.imageinfo?.[0]?.url && !SKIP_FILE_PATTERN.test(h.title ?? ''))
      .slice(0, 4)
      .map((h) => ({
        url: (h.imageinfo?.[0] as { url: string }).url,
        caption: (h.title ?? '').replace(/^File:/, ''),
      }));
    void needThumb;
    videoCache.set(name, videos);
    return videos;
  } catch {
    videoCache.set(name, []);
    return [];
  }
}
