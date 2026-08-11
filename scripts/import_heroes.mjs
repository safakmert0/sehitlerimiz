#!/usr/bin/env node
/**
 * ŞEHİTLERİMİZ — Resmi Açık Veri Import Scripti
 *
 * MSB/TBMM ve kamuya açık kaynaklardan derlenmiş şehit listelerini
 * (CSV veya JSON) Supabase'e aktarır.
 *
 * Kullanım:
 *   node scripts/import_heroes.mjs <veri-dosyası> [--dry-run]
 *
 * Veri dosyası formatı (CSV):
 *   ad;soyad;rutbe;birlik;dogum_tarihi;dogum_yeri;olay_tarihi;olay_yeri;memleket
 *
 * Örnek CSV satırı:
 *   Mehmet;Yılmaz;P. Uzm. Çvş.;2. Komando Tugayı;12.05.1994;Adıyaman;23.06.2019;Hakkari;Adıyaman
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('EXPO_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const filePath = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

function parseDate(s) {
  if (!s) return null;
  s = s.trim();
  // DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD desteklenir
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

async function getConflictId(name) {
  const { data } = await supabase.from('conflicts').select('id').eq('name', name).single();
  if (data) return data.id;
  const { data: inserted } = await supabase.from('conflicts').insert({ name }).select('id').single();
  return inserted?.id ?? null;
}

async function main() {
  if (!filePath) {
    console.error('Kullanım: node scripts/import_heroes.mjs <veri-dosyası> [--dry-run]');
    process.exit(1);
  }

  const raw = readFileSync(filePath, 'utf-8');
  const isCsv = filePath.toLowerCase().endsWith('.csv');
  let rows = [];

  if (isCsv) {
    const lines = raw.split('\n').filter((l) => l.trim());
    for (const line of lines.slice(1)) {
      const [ad, soyad, rutbe, birlik, dogumTarihi, dogumYeri, olayTarihi, olayYeri, memleket] =
        line.split(';').map((c) => c?.trim() ?? '');
      if (!ad || !soyad) continue;
      rows.push({
        full_name: `${ad} ${soyad}`.trim(),
        rank: rutbe || null,
        unit: birlik || null,
        birth_date: parseDate(dogumTarihi),
        birth_place: memleket || dogumYeri || null,
        death_date: parseDate(olayTarihi),
        death_place: olayYeri || null,
      });
    }
  } else {
    rows = JSON.parse(raw);
  }

  const conflictId = await getConflictId('Terörle Mücadele');
  let inserted = 0;

  for (const r of rows) {
    const record = {
      full_name: r.full_name ?? `${r.ad ?? ''} ${r.soyad ?? ''}`.trim(),
      rank: r.rank ?? r.rutbe ?? null,
      unit: r.unit ?? r.birlik ?? null,
      birth_date: r.birth_date ?? parseDate(r.dogum_tarihi),
      birth_place: r.birth_place ?? r.dogum_yeri ?? r.memleket ?? null,
      death_date: r.death_date ?? parseDate(r.olay_tarihi ?? r.sehadet_tarihi),
      death_place: r.death_place ?? r.olay_yeri ?? null,
      conflict_id: conflictId,
      is_martyr: true,
      is_veteran: false,
      status: 'approved',
      summary: null,
      story: null,
    };

    if (!record.full_name) continue;

    if (dryRun) {
      inserted++;
      continue;
    }

    const { error } = await supabase.from('heroes').insert(record);
    if (error) {
      console.error('Ekleme hatası:', record.full_name, error.message);
    } else {
      inserted++;
    }
    if (inserted % 100 === 0) console.log(`${inserted} kayıt eklendi...`);
  }

  console.log(
    dryRun
      ? `[dry-run] ${inserted} kayıt işlenecek (veritabanına yazılmadı).`
      : `Tamamlandı: ${inserted} şehit kaydı eklendi.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
