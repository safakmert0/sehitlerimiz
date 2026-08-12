# ŞEHİTLERİMİZ 🇹🇷

Vatan için canını veren **şehitlerimizin** ve vatan savunmasında **gazi** olan kahramanlarımızın hayat hikayelerini, fotoğraflarını ve videolarını toplu ve saygılı bir şekilde sunan **tam teşekküllü mobil uygulama**.

> **Hedef:** Hiçbir şehidi ve gaziyi atlamadan, hepsini anmak.

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| 🔍 **Arama & Filtreleme** | İsim, birlik, memleket araması; Şehit/Gazi filtresi; savaş/operasyon kategorileri (Çanakkale, Sarıkamış, 15 Temmuz, terörle mücadele...) |
| 📖 **Hayat hikayeleri** | Her kahraman için doğum, aile, askerlik, şehadet/gazilik hikayesi |
| 🖼️ **Fotoğraf & video** | Galeriden yüklenen görseller, video oynatıcı |
| 🗺️ **Şehitlik haritası** | Kabir/şehitlik konumu tek dokunuşla haritada |
| ✍️ **Topluluk katkısı** | Herkes kayıt ekleyebilir → **admin onayı** sonrası yayınlanır |
| 🚩 **Bildirim sistemi** | Kullanıcılar yanlış/uygunsuz içeriği bildirir, admin çözer |
| 🕯️ **Anı defteri** | Ziyaretçiler kahramanlarımız için anı ve dua bırakır |
| 📴 **Offline önbellek** | Şehit listesi cihazda saklanır, internetsiz de okunabilir |
| 👑 **Admin paneli** | Bekleyen kayıtlar, medya, bildirimler ve anılar için moderasyon |

---

## Teknoloji Yığını

- **Mobil:** React Native + Expo SDK 57 (iOS + Android), Expo Router
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Offline:** expo-sqlite (yerel önbellek)

---

## Kurulum

### 1. Projeyi indirip bağımlılıkları kurun

```bash
cd sehitlerimiz
npm install --legacy-peer-deps
```

### 2. Supabase projesi oluşturun

1. [supabase.com](https://supabase.com)'da ücretsiz proje oluşturun.
2. **SQL Editor** bölümüne `supabase/schema.sql` içeriğini yapıştırıp çalıştırın.
3. Aynı yerde şu iki komutu da çalıştırın (fotoğraf/video depolama):

```sql
insert into storage.buckets (id, name, public) values ('hero-media', 'hero-media', true);
create policy "media public read" on storage.objects for select using (bucket_id = 'hero-media');
create policy "media auth upload" on storage.objects for insert with check (
  bucket_id = 'hero-media' and auth.role() = 'authenticated'
);
create policy "media admin delete" on storage.objects for delete using (
  bucket_id = 'hero-media' and public.is_admin()
);
```

4. **Project Settings → Data API** bölümünden `URL` ve `anon public key` değerlerini kopyalayın.
5. `.env.example` dosyasını `.env` olarak kopyalayıp değerleri doldurun.

### 3. Demo verisi (isteğe bağlı)

```bash
# SQL Editor'da supabase/seed_demo.sql çalıştırın (Seyit Onbaşı, Ömer Halisdemir vb.)
```

### 4. Admin hesabı atama

SQL Editor'da, kaydettiğiniz kullanıcının e-postası ile:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'sizin@eposta.com');
```

### 5. Uygulamayı başlatın

```bash
npm start          # QR kod ile Expo Go / geliştirme build'i
npm run android    # Android emülatör
```

---

## Toplu Veri İçe Aktarma (hiçbir şehit atlanmasın)

MSB ve TBMM arşivlerinden kamuya açıklanmış şehit listelerini (CSV/JSON) aktarın:

```bash
# .env içinde SUPABASE_SERVICE_ROLE_KEY dolu olmalı (Settings → API → service_role)
node scripts/import_heroes.mjs sehitler.csv --dry-run   # önce simülasyon
node scripts/import_heroes.mjs sehitler.csv             # gerçek içe aktarma
```

**CSV formatı** (noktalı virgül ayraçlı):

```
ad;soyad;rutbe;birlik;dogum_tarihi;dogum_yeri;olay_tarihi;olay_yeri;memleket
Mehmet;Yılmaz;P. Uzm. Çvş.;2. Komando Tugayı;12.05.1994;Adıyaman;23.06.2019;Hakkari;Adıyaman
```

**Önerilen açık veri kaynakları:**

- MSB Şehitlerimiz sayfası: `msb.gov.tr` (resmi açık liste)
- TBMM / Büyükşehir belediyelerinin yayınladığı şehitlik listeleri
- Üniversite ve araştırma kurumlarının derlediği açık veri setleri

> ⚠️ Verileri girerken kaynak belirtmek ve doğruluğundan emin olmak önemlidir; yanlış bilgiler için bildirim sistemi mevcuttur.

---

## Proje Yapısı

```
app/
  (tabs)/index.tsx     → Ana ekran: arama, filtre, liste
  (tabs)/add.tsx       → Şehit/Gazi kaydı ekleme formu
  (tabs)/profile.tsx   → Profil, katkılarım, admin girişi
  hero/[id].tsx        → Detay: hikaye, medya, anı defteri, bildir
  auth/                → Giriş / kayıt
  admin/index.tsx      → Moderatör paneli (4 sekme)
components/            → HeroCard, MediaGallery, TributeItem
lib/                   → supabase, auth, cache, types, theme, utils
supabase/              → schema.sql (şema+RLS), seed_demo.sql
scripts/               → import_heroes.mjs (toplu veri aktarımı)
```

---

## 📊 İstatistik Ekranı

Uygulamanın 2. sekmesinde kayıtlı kahramanların sayıları görüntülenir:

- Toplam / Şehit / Gazi sayıları
- Savaş ve operasyon kategorilerine göre dağılım
- Şehadet yıllarına göre dağılım
- Memleketlere göre ilk 10

> Kurulum: SQL Editor'a `supabase/stats_function.sql` içeriğini yapıştırıp çalıştırın (yalnızca bir kez).

---

## 📦 Android APK derleme ve yayınlama

GitHub Actions içindeki **Android Build + Release (APK)** iş akışı, elle başlatıldığında veya `v*` etiketi gönderildiğinde APK üretir. Etiketli derlemelerde APK, GitHub Release'e de eklenir.

Gerekirse repo ayarlarından şu iki Actions secret'ını ekleyin; yoklarsa uygulama demo verisiyle derlenir:

| Secret adı | Nereden alınır |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

Yeni sürüm yayımlamak için:

```bash
git tag v1.3.1
git push origin v1.3.1
```

İş akışı önce tür ve demo veri denetimini çalıştırır, ardından Android APK'sını derler. Oluşan dosya Actions artefaktlarında; etiketli sürümlerde ayrıca [GitHub Releases](https://github.com/safakmert0/sehitlerimiz/releases) sayfasındadır.

> iOS/IPA için henüz bir CI iş akışı bulunmuyor. Bu hedef eklenecekse Apple Developer hesabı ve ayrı imzalama yapılandırması gerekir.

---

## Güvenlik

- Tüm veriler **Row Level Security** ile korunur (şema içinde tanımlı).
- Herkes yalnızca kendi eklediği ve onaylanmış kayıtları görür/günceller.
- Yayınlama, medya onayı ve bildirim çözümü yalnızca admin rollerine açıktır.
