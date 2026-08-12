# Şehitlerimiz ve Gazilerimiz

[![Android Build](https://github.com/safakmert0/sehitlerimiz/actions/workflows/eas-build.yml/badge.svg)](https://github.com/safakmert0/sehitlerimiz/actions/workflows/eas-build.yml)
[![Son sürüm](https://img.shields.io/github/v/release/safakmert0/sehitlerimiz?display_name=tag&sort=semver)](https://github.com/safakmert0/sehitlerimiz/releases)

Şehitlerimizin ve gazilerimizin hatıralarını saygılı, erişilebilir ve doğrulanabilir biçimde sunmak için geliştirilmiş mobil uygulama. Uygulama; arama, tarihî kategori, biyografi, medya, anı defteri ve topluluk moderasyonunu tek bir deneyimde birleştirir.

> Bu proje, kişilere ilişkin verilerde doğruluk ve saygıyı tasarımın temel ilkesi kabul eder. Kaynağı kişi bazında doğrulanmayan ayrıntılar yayımlanmamalıdır.
>
> Bu depo bağımsız bir açık kaynak projesidir; herhangi bir kamu kurumu veya resmî arşiv hizmeti değildir.

## Öne çıkanlar

| Alan | Uygulamadaki karşılığı |
| --- | --- |
| Keşif | İsim, birlik ve memleket araması; şehit/gazi ve savaş/operasyon filtreleri |
| Kayıt sayfası | Biyografi, tarih, mezar/şehitlik konumu, fotoğraf ve video alanları |
| Anma deneyimi | Anı defteri, internet kaynakları, fotoğraf/video galerisi ve harita yönlendirmesi |
| Güvenilir katkı | Yeni kayıt, medya ve anılar moderatör onayından sonra yayımlanır |
| Moderasyon | Bekleyen içerikler, yanlış bilgi bildirimleri ve telif/uygunsuz içerik incelemesi |
| Erişilebilirlik | Supabase yapılandırılmadan çalışan demo modu ve daha önce alınmış liste verileri için cihaz içi önbellek |
| İstatistik | Kayıtların kategori, şehadet yılı ve memlekete göre dağılımı |

## Veri ilkeleri

Bu proje bir hatıra alanıdır; verinin eksik ya da tahmine dayalı olması kabul edilebilir bir yayın standardı değildir.

- Kişi bazında doğrulanmayan doğum günü, şehadet yeri, biyografi ve medya bilgileri boş bırakılır.
- Her yeni kaydın güvenilir kamu kaynağıyla karşılaştırılması beklenir.
- Topluluk katkıları ve medya dosyaları, moderatör onayı olmadan herkese açık değildir.
- Yanlış, eksik, saldırgan veya telif ihtilaflı içerik uygulama içinden bildirilebilir.
- Toplu içe aktarma yalnızca yönetici tarafından önceden gözden geçirilmiş veri setleri için kullanılmalıdır.

## Teknoloji

- **Mobil:** React Native, Expo SDK 57 ve Expo Router
- **Veri ve kimlik:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Yerel kullanım:** Expo SQLite ile çevrim dışı liste önbelleği
- **Medya:** Expo Image, Image Picker, Video ve Audio
- **Dağıtım:** GitHub Actions ile Android APK derlemesi

## Hızlı başlangıç

Önce bağımlılıkları kurun ve uygulamayı demo verisiyle başlatın. Supabase ortam değişkenleri olmadan uygulama demo modunda çalışır.

```bash
git clone https://github.com/safakmert0/sehitlerimiz.git
cd sehitlerimiz
npm ci --legacy-peer-deps
npm start
```

Android emülatörde çalıştırmak için:

```bash
npm run android
```

Yayın öncesi zorunlu yerel kontroller:

```bash
npm run check
npx expo-doctor
```

`npm run check`, TypeScript denetimini ve demo/15 Temmuz veri setindeki kayıt sayısı, benzersiz kimlik ve kategori tutarlılığını kontrol eder. Bu kontrol, tüm kayıtların tarihsel doğruluğunu tek başına garanti etmez.

## Supabase ile tam kurulum

Demo modundan canlı veri moduna geçmek için:

1. Supabase üzerinde bir proje oluşturun.
2. [supabase/schema.sql](supabase/schema.sql) dosyasını SQL Editor'da çalıştırın.
3. İstatistik ekranı için [supabase/stats_function.sql](supabase/stats_function.sql) dosyasını bir kez çalıştırın.
4. `hero-media` adlı, public okuma izinli bir Storage bucket oluşturun ve medya politikalarını ekleyin.
5. Ortam dosyasını hazırlayın:

```bash
cp .env.example .env
```

`.env` içinde aşağıdaki değişkenleri doldurun:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Medya Storage politikaları için:

```sql
insert into storage.buckets (id, name, public) values ('hero-media', 'hero-media', true);

create policy "media public read" on storage.objects
for select using (bucket_id = 'hero-media');

create policy "media auth upload" on storage.objects
for insert with check (bucket_id = 'hero-media' and auth.role() = 'authenticated');

create policy "media admin delete" on storage.objects
for delete using (bucket_id = 'hero-media' and public.is_admin());
```

Bir kullanıcıyı yönetici yapmak için, kayıt olduktan sonra SQL Editor'da:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'yonetici@ornek.com');
```

> `SUPABASE_SERVICE_ROLE_KEY` yalnızca yönetici makinesindeki içe aktarma işlemleri içindir. Bu anahtarı mobil uygulamaya, Git deposuna veya istemci tarafına eklemeyin.

## Katkı ve moderasyon akışı

```text
Topluluk katkısı → bekleyen kayıt/medya/anı → moderatör incelemesi → yayın veya ret gerekçesi
```

Canlı modda kullanıcılar yeni şehit/gazi kaydı, fotoğraf, video ve anı ekleyebilir. İçerik önce `pending` durumunda kalır; moderatör panelinden onaylandığında herkese açık olur. Mevcut kayıtlardaki hatalar için bildirim oluşturulabilir.

Katkı gönderirken lütfen şunlara dikkat edin:

- Kaynağı açıkça not edin ve mümkünse resmi/kamuya açık bir kayıtla çapraz kontrol edin.
- Kişiye ait olmayan temsili görselleri profil fotoğrafı olarak kullanmayın.
- Kesin olmayan bilgileri eklemek yerine alanı boş bırakın.
- Fotoğraf/video için kaynak, lisans veya kullanım iznini not edin; telif hakkı ya da aile mahremiyeti bakımından şüpheli medyayı yüklemeyin.

## Toplu veri içe aktarma

[scripts/import_heroes.mjs](scripts/import_heroes.mjs), güvenilir ve önceden incelenmiş CSV/JSON veri setlerini Supabase'e aktarmak için tasarlanmıştır. İlk adım her zaman simülasyon olmalıdır:

```bash
node scripts/import_heroes.mjs sehitler.csv --dry-run
node scripts/import_heroes.mjs sehitler.csv
```

Beklenen CSV başlığı ve örnek satır:

```text
ad;soyad;rutbe;birlik;dogum_tarihi;dogum_yeri;olay_tarihi;olay_yeri;memleket
Mehmet;Yılmaz;P. Uzm. Çvş.;2. Komando Tugayı;12.05.1994;Adıyaman;23.06.2019;Hakkari;Adıyaman
```

Bu işlem için yalnızca yerel yönetici ortamında aşağıdaki değişkenler gerekir:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Proje yapısı

```text
app/
  (tabs)/       Ana liste, istatistikler, katkı formu ve profil
  hero/[id].tsx Kişi detayı, medya, kaynaklar, anılar ve bildirim
  admin/        Kayıt, medya, bildirim ve anı moderasyonu
  auth/         Giriş ve kayıt ekranları
components/     Tekrar kullanılan kart ve galeri bileşenleri
lib/            Kimlik, Supabase, önbellek, demo veri, tema ve yardımcılar
supabase/       Şema, demo veri ve istatistik fonksiyonu
scripts/        Veri denetimi ve toplu içe aktarma araçları
```

## Android APK yayınlama

GitHub Actions içindeki [Android Build + Release (APK)](https://github.com/safakmert0/sehitlerimiz/actions/workflows/eas-build.yml) iş akışı, elle başlatıldığında veya `v*` biçiminde bir etiket gönderildiğinde APK üretir.

Yeni sürüm için önce `package.json` ve `app.json` sürümlerini güncelleyin, sonra etiketi gönderin:

```bash
git tag v1.3.2
git push origin v1.3.2
```

İş akışı şunları yapar:

1. Bağımlılıkları kurar.
2. Tür ve demo veri denetimlerini çalıştırır.
3. Android release APK'sını derler.
4. APK'yı Actions artefaktı olarak yükler.
5. Etiketli başarılı derlemede APK'yı GitHub Release'e ekler.

Canlı Supabase bağlantısı kullanmak için repo ayarlarına şu Actions secret'larını ekleyin; eklenmezse APK demo moduyla derlenir:

| Secret | Değer |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → anon public key |

Yayımlanan sürümler ve APK indirmeleri: [GitHub Releases](https://github.com/safakmert0/sehitlerimiz/releases)

> Mevcut CI iş akışı Android APK üretir. iOS dağıtımı için Apple Developer hesabı ve ayrı imzalama yapılandırması gerekir.
>
> İş akışı yalnızca elle başlatıldığında veya `v*` etiketi gönderildiğinde çalışır; pull request'ler için ayrı bir doğrulama iş akışı henüz yoktur.

## Güvenlik

- Şema, Row Level Security ile onaylanmamış kayıtları herkese kapatır.
- Kullanıcılar yalnızca kendi bekleyen katkılarını güncelleyebilir.
- Yayınlama, medya onayı ve bildirim çözümü moderatör/yönetici rolü gerektirir.
- Ortam değişkenleri `.env` içinde tutulur; `.env` ve imzalama dosyaları Git tarafından izlenmez.

## Katkıda bulunma

Bir geliştirme veya dokümantasyon katkısı için önce bir issue açın ya da mevcut issue'yu seçin. Küçük ve odaklı bir dal açın, `npm run check` komutunu çalıştırın ve değişikliğin amacıyla doğrulama sonucunu pull request açıklamasına ekleyin.

## Lisans

Lisans bilgisi için [LICENSE](LICENSE) dosyasına bakın.
