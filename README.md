# Ahbap Etkinlik Takvimi

Ahbap gönüllülerinin etkinliklerini gösteren dinamik interaktif web takvimi. Google Sheets tabanlı, çoklu şehir desteği.

## Kullanım

### Canlı Site

```
https://ahbap-turkiye.github.io/etkinlik-takvimi/                    # Varsayılan şehir (Tekirdağ)
https://ahbap-turkiye.github.io/etkinlik-takvimi/?sehir=tekirdag    # Tekirdağ
https://ahbap-turkiye.github.io/etkinlik-takvimi/?sehir=canakkale   # Çanakkale
https://ahbap-turkiye.github.io/etkinlik-takvimi/?sehir=istanbul    # İstanbul
```

### Ay Seçimi

```
?sehir=tekirdag&ay=2026-mart     # Tekirdağ - Mart 2026
?sehir=canakkale&ay=2026-nisan   # Çanakkale - Nisan 2026
?sehir=istanbul&ay=2026-mart     # İstanbul - Mart 2026
```

## Yeni Şehir Ekleme

### 1. Google Sheet Oluştur

İki sayfa içeren bir Google Sheets oluşturun:

#### **Etkinlikler** Sayfası
| yil | ay | gun | id | icon | baslik | kisa | detay | gif |
|-----|-----|-----|-----|------|--------|------|-------|-----|
| 2026 | Mart | 15 | cicek | 🌱 | Çiçek Ekimi | Kısa açıklama | Detaylı açıklama | https://... |

#### **Özel Günler** Sayfası
| yil | ay | gun | tur | baslik | emoji | renk |
|-----|-----|-----|-----|--------|-------|------|
| 2026 | Mart | 8 | ozel | Kadınlar Günü | 👩 | #e91e63 |

**Önemli:**
- Kolon isimleri tam olarak yukarıdaki gibi olmalı (küçük harf, Türkçe karakter yok)
- `ay` kolonu: "Ocak", "Şubat", "Mart" gibi Türkçe ay isimleri
- `tur` kolonu: "ozel" veya "resmi"

### 2. Sheet'i Public Yap

1. Sağ üst → **Paylaş**
2. **"Bağlantıya sahip olan herkes"** → **Görüntüleyici**
3. Sheet ID'yi kopyala: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

### 3. Koda Ekle

`script.js` dosyasında `SEHIRLER` objesine ekleyin:

```javascript
yenisehir: {
    isim: 'Yeni Şehir',
    sheetId: 'BURAYA_SHEET_ID',
    slogan: 'Sevginin ve gerçeğin peşindeyiz',
    favicon: 'images/yenisehir-favicon.png'
}
```

### 4. Favicon Ekle

`images/` klasörüne şehir favicon'u ekleyin:
```
images/yenisehir-favicon.png
```

## Etkinlik Ekleme/Düzenleme

Google Sheets'te direkt düzenleme yapabilirsiniz:

1. İlgili şehrin Google Sheet'ini açın
2. **Etkinlikler** sayfasına yeni satır ekleyin
3. Değişiklik otomatik olarak siteye yansır (cache süresi: ~15 dk)

## Teknolojiler

- HTML5, CSS3, Vanilla JavaScript
- Google Sheets API (opensheet.elk.sh)
- GitHub Pages hosting
- Google Fonts (Poppins)

## Dosya Yapısı

```
etkinlik-takvimi/
├── index.html              # Ana sayfa
├── styles.css              # CSS stilleri
├── script.js               # JavaScript kodu (şehir config burada)
├── images/
│   ├── tekirdag-favicon.png
│   ├── canakkale-favicon.png
│   └── istanbul-favicon.png
├── data/                   # Eski JSON dosyaları (artık kullanılmıyor)
└── README.md
```

## API Kullanımı

Sistem [opensheet.elk.sh](https://opensheet.elk.sh/) kullanarak Google Sheets'i JSON API'ye çevirir:

```
https://opensheet.elk.sh/SHEET_ID/Etkinlikler
https://opensheet.elk.sh/SHEET_ID/Özel Günler
```

## Sheet Yapısı Detayları

### Etkinlikler

- **yil**: Yıl (örn: 2026)
- **ay**: Ay ismi (örn: "Mart")
- **gun**: Gün numarası (1-31)
- **id**: Benzersiz etkinlik ID'si (örn: "quiz")
- **icon**: Emoji (örn: "🎮")
- **baslik**: Etkinlik başlığı
- **kisa**: Kısa açıklama (takvimde görünür)
- **detay**: Detaylı açıklama (modal'da görünür)
- **gif**: Giphy GIF URL'i (opsiyonel)

### Özel Günler

- **yil**: Yıl (örn: 2026)
- **ay**: Ay ismi (örn: "Mart")
- **gun**: Gün numarası (1-31)
- **tur**: "ozel" veya "resmi"
- **baslik**: Özel gün adı
- **emoji**: Emoji (örn: "👩")
- **renk**: Hex renk kodu (örn: "#e91e63")

## Hakkında

**Ahbap**, Türkiye'nin en büyük sivil toplum kuruluşlarından biridir. Gönüllülük esasıyla çalışan Ahbap, toplumsal dayanışmayı güçlendirmek için çeşitli projeler yürütmektedir.

*"Sevginin ve gerçeğin peşindeyiz"*

---

Ahbap Gönüllüleri tarafından hazırlanmıştır.
