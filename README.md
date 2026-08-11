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

## 📦 Derleme (iOS + Android)

Derlemeler **EAS Build** (Expo bulutu) + **GitHub Actions** ile yapılır; yerel bilgisayarda Android SDK / Xcode gerekmez.

### 1. GitHub'a gönderilen repo

Uygulama şu repoda: **https://github.com/safakmert0/sehitlerimiz**

### 2. GitHub Secrets ekleyin

Repo sayfasında **Settings → Secrets and variables → Actions** bölümüne ekleyin:

| Secret adı | Nereden alınır |
|---|---|
| `EXPO_TOKEN` | [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) (Expo hesabı gerekli, ücretsiz) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

### 3. Derlemeyi başlatın

Repo sayfasında **Actions → "EAS Build (iOS + Android)" → Run workflow** seçin:

- `all` = hem iOS hem Android
- Profil `preview` = APK (Android) + iç test (iOS) → doğrudan telefona kurulabilir
- Profil `production` = Play Store (AAB) + App Store sürümü

### 4. İlk sefere özel gereksinimler

- **iOS**: Apple Developer hesabı gereklidir (yıllık $99). EAS ilk iOS derlemesinde sizden Apple kimliği ister:
  ```
  npx eas-cli credentials --platform ios
  ```
  (Windows/Mac herhangi bir makineden bir kez yapılır.)
- **Android (Play Store)**: [Google Play Console](https://play.google.com/console) (tek seferlik $25). Mağazaya yüklemek için `production` profiliyle AAB derleyin.
- **Test için**: `preview` profili APK üretir, GitHub'da indirme linki çıkar.

### 5. Versiyonlar

`git tag v1.0.0` etiketi oluşturup push ederseniz derleme otomatik başlar ve **APK + IPA otomatik olarak GitHub Release sayfasına yüklenir**:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

Derlenen dosyaları **https://github.com/safakmert0/sehitlerimiz/releases** sayfasında bulabilirsiniz.

### 6. Hazır APK

**v1.0.0 sürümü zaten derlendi ve Release'e yüklendi:** [APK'yi indirin](https://github.com/safakmert0/sehitlerimiz/releases/tag/v1.0.0) → telefona kopyalayın → kurun.

> Telefonda "Bilinmeyen kaynaklardan yükleme" iznini açmanız gerekebilir.
> Bu sürüm **demo verileriyle** çalışır (Supabase bağlantısı olmadan da tamamen kullanılabilir).

### 7. İmza anahtarı (ÖNEMLİ)

Uygulama `sehitlerimiz.keystore` ile imzalanmıştır. Google Play'e yüklenecek sürümler aynı imzayı taşımalıdır.
Bu dosyayı **güvenli bir yere yedekleyin** (kaybolursa uygulama güncellenemez):

- Yerel: `android/app/keystore/sehitlerimiz.keystore`
- Parola: `sehitlerimiz2026` (üretim öncesi mutlaka değiştirin)

> ⚠️ Alternatif: EAS Build kendi imzasını üretir; Play Store'a geçerken EAS imzasını kullanmak daha güvenlidir (Play App Signing ile anahtar kaybı riski ortadan kalkar).

### 8. IPA (iOS) notu

IPA yalnızca iki yolla üretilebilir:
1. **EAS Build** (önerilen): `EXPO_TOKEN` + Apple Developer hesabı eklendikten sonra workflow ile otomatik üretilir ve Release'e yüklenir.
2. **Mac + Xcode** ile yerel derleme (Linux üzerinde üretilemez).

Apple Developer hesabı olmadan IPA üretimi teknik olarak imkansızdır (Apple imza zorunluluğu).

---

## Güvenlik

- Tüm veriler **Row Level Security** ile korunur (şema içinde tanımlı).
- Herkes yalnızca kendi eklediği ve onaylanmış kayıtları görür/günceller.
- Yayınlama, medya onayı ve bildirim çözümü yalnızca admin rollerine açıktır.
