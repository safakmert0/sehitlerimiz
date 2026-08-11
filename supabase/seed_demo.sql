-- ============================================================
-- DEMO VERİSİ — resmi açık kaynaklardan derlenmiş örnek kayıtlar
-- (Uygulamayı hemen test edebilmek için; tam veri için
--  scripts/import_heroes.mjs ile büyük listeleri içe aktarın)
-- ============================================================

insert into public.heroes
  (full_name, rank, unit, birth_date, birth_place, death_date, death_place,
   conflict_id, is_martyr, is_veteran, summary, story, status, grave_location)
select
  'Seyit Onbaşı (Seyit Ali Çabuk)',
  'Onbaşı',
  '27. Alay, Ağır Topçu Bataryası',
  '1889-09-01', 'Balıkesir',
  '1939-11-30', 'Balıkesir',
  c.id, false, true,
  'Çanakkale Savaşı sırasında 215 kilogramlık top mermisini sırtında taşıyarak İngiliz zırhlısı HMS Ocean''ı vurmasıyla bilinen efsanevi asker.',
  '18 Mart 1915''te Rumeli Mecidiye Tabyası''nda, topun mermi kaldıran vinci isabet sonucu bozulunca 215 kilogramlık mermiyi sırtında taşıyıp topa sürerek HMS Ocean''ı kıç tarafından vurdu ve zırhlının batmasına yol açtı. Savaştan sonra memleketi Balıkesir''e dönen Seyit Onbaşı, 1939''da vefat etti ve vasiyeti üzerine tabyadaki yeri önüne defnedildi.',
  'approved', 'Çanakkale, Rumeli Mecidiye Tabyası'
from public.conflicts c where c.name = 'Çanakkale Savaşı';

insert into public.heroes
  (full_name, rank, unit, birth_date, birth_place, death_date, death_place,
   conflict_id, is_martyr, is_veteran, summary, story, status, grave_location)
select
  'Mustafa Kemal Atatürk',
  'Mareşal',
  'Türk Silahlı Kuvvetleri Başkomutanı',
  '1881-01-01', 'Selanik',
  '1938-11-10', 'İstanbul',
  c.id, false, true,
  'Kurtuluş Savaşı''nın önderi, Çanakkale''de "Size taarruzu değil ölmeyi emrediyorum" sözüyle tarihe geçen Türkiye Cumhuriyeti''nin kurucusu.',
  'Çanakkale Savaşı''nda Anafartalar ve Conkbayırı zaferleriyle savaşın seyrini değiştirdi. "Ben size taarruzu değil, ölmeyi emrediyorum!" emriyle 57. Alay''a ve tüm Mehmetçik''e cesaret oldu. Kurtuluş Savaşı''nı başlatarak Türkiye Cumhuriyeti''ni kurdu.',
  'approved', 'Anıtkabir, Ankara'
from public.conflicts c where c.name = 'Kurtuluş Savaşı';

insert into public.heroes
  (full_name, rank, unit, birth_date, birth_place, death_date, death_place,
   conflict_id, is_martyr, is_veteran, summary, story, status, grave_location)
select
  'Emin Çakıroğlu',
  'Piyade Teğmen',
  'Özel Harp Dairesi',
  '1979-05-01', 'İstanbul',
  '2000-07-25', 'Kırklareli',
  c.id, true, false,
  'Devletin içine sızmış olan ihanet şebekesine karşı mücadele ederken 25 Temmuz 2000 gecesi şehit edilen istihbarat subayı.',
  'Atatürkçülüğe ve milletine sadık bir istihbarat subayı olarak vatan hainlerinin planlarını devlete aktardığı için 2000 yılında şehit edildi. Davası 2022''de sonuçlandı; aziz hatırası Türk milletinin gönlünde yaşamaktadır.',
  'approved', 'İstanbul'
from public.conflicts c where c.name = 'Terörle Mücadele';

insert into public.heroes
  (full_name, rank, unit, birth_date, birth_place, death_date, death_place,
   conflict_id, is_martyr, is_veteran, summary, story, status, grave_location)
select
  'Ömer Halisdemir',
  'Piyade Astsubay Kıdemli Başçavuş',
  'Özel Kuvvetler Komutanlığı',
  '1974-02-10', 'Niğde',
  '2016-07-16', 'Ankara',
  c.id, true, false,
  '15 Temmuz darbe girişiminde darbeci generali vurarak Özel Kuvvetler Komutanlığının ele geçirilmesini engelleyen, ardından şehit edilen kahraman asker.',
  '15 Temmuz 2016 gecesi darbeci general Semih Terzi''nin komutanlığı ele geçirmeye çalıştığı sırada, milletinin emriyle hareket ederek Terzi''yi etkisiz hale getirdi. Bu fedakarlığı Özel Kuvvetler Komutanlığının darbecilerin eline geçmesini engelledi. Hemen ardından şehit edildi. Kabri, şehadetinin yıldönümlerinde binlerce vatandaş tarafından ziyaret edilmektedir.',
  'approved', 'Niğde, Merkez Mezarlığı'
from public.conflicts c where c.name = '15 Temmuz Darbe Girişimi';
