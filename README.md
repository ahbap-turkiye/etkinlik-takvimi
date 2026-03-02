# Ahbap Tekirdağ - 2026 Etkinlik Takvimi

Ahbap Tekirdağ gönüllülerinin 2026 yılı etkinliklerini gösteren dinamik interaktif web takvimi.

## Etkinlikler

### Şubat 2026
- **1 Şubat** - Kitap Arkadaşım: Küçük Prens kitabı okuma ve sohbet
- **8 Şubat** - Gönüllü Tanışma & 6 Şubat Depremini Anma: Yeni gönüllülere sunum ve AFAD eğitimi
- **15 Şubat** - Kediler Günü: Sokak hayvanlarına yuva yapımı ve mama dağıtımı
- **21 Şubat** - Sevgiye İlmek: İftar sonrası örgü etkinliği

### Mart 2026
- **1 Mart** - Quiz Night: Kahkaha, takım ruhu ve bol eğlencenin bir araya geldiği sosyal buluşma
- **8 Mart** - Mart Bileklikleri Atölyesi: Kadınlar Günü'ne özel Martenitsa yapımı
- **15 Mart** - Çiçek Ekimi & Yemek: Dünya Çiçek Ekimi Günü, tohum değiş tokuşu ve akşam yemeği
- **28 Mart** - Tiyatro Gecesi: Dünya Tiyatro Günü'ne özel tiyatro izleme

### Nisan 2026
- **4 Nisan** - Kitap Arkadaşım: Kütüphane Haftası'na özel "İnsan Ne İle Yaşar" kitap sohbeti

## Özellikler

- **Dinamik Ay Sistemi**: URL parametresi ile farklı ayları görüntüleme
- **Responsive Tasarım**: Mobil, tablet, masaüstü uyumlu
- **Animasyonlu Arka Plan**: Kalp animasyonları
- **Etkinlik Detayları**: Modal pencere ile detaylı bilgi
- **Takvim Entegrasyonu**: Google Calendar ve .ics dosyası desteği
- **Touch Desteği**: iOS ve Android uyumlu

## Kullanım

### Canlı Site
- Güncel Ay (Otomatik): [https://ahbap-tekirdag.github.io/etkinlik-takvimi/](https://ahbap-tekirdag.github.io/etkinlik-takvimi/)
- Şubat 2026: [https://ahbap-tekirdag.github.io/etkinlik-takvimi/?ay=2026-subat](https://ahbap-tekirdag.github.io/etkinlik-takvimi/?ay=2026-subat)
- Mart 2026: [https://ahbap-tekirdag.github.io/etkinlik-takvimi/?ay=2026-mart](https://ahbap-tekirdag.github.io/etkinlik-takvimi/?ay=2026-mart)
- Nisan 2026: [https://ahbap-tekirdag.github.io/etkinlik-takvimi/?ay=2026-nisan](https://ahbap-tekirdag.github.io/etkinlik-takvimi/?ay=2026-nisan)

### Yeni Ay Ekleme

1. `data/` klasörüne yeni JSON dosyası ekleyin (örn: `2026-mayis.json`)
2. Aşağıdaki yapıyı kullanın:

```json
{
  "sehir": "Tekirdağ",
  "ay": "Mayıs",
  "yil": 2026,
  "ayinIlkGunu": 5,
  "ayinGunSayisi": 31,
  "footer": "Ahbap Tekirdağ Gönüllüleri",
  "slogan": "Sevginin ve gerçeğin peşindeyiz",
  "pdfDosyasi": "",
  "konum": "Tekirdağ",
  "etkinlikler": [
    {
      "id": "etkinlik-id",
      "gun": 15,
      "icon": "🎉",
      "baslik": "Etkinlik Başlığı",
      "kisa": "Kısa açıklama",
      "detay": "Detaylı açıklama",
      "gif": "https://media.giphy.com/..."
    }
  ]
}
```

3. `index.html` dosyasında ay seçicisine yeni ayı ekleyin:
```html
<a href="?ay=2026-mayis" class="month-link">Mayıs</a>
```

## Teknolojiler

- HTML5
- CSS3 (Animasyonlar, Flexbox, Grid)
- Vanilla JavaScript
- Google Fonts (Poppins)

## Dosya Yapısı

```
etkinlik-takvimi/
├── index.html           # Ana sayfa
├── styles.css          # CSS stilleri
├── script.js           # JavaScript kodu
├── config.json         # Geriye dönük uyumluluk (Şubat)
├── data/
│   ├── 2026-subat.json # Şubat ayı etkinlikleri
│   ├── 2026-mart.json  # Mart ayı etkinlikleri
│   └── 2026-nisan.json # Nisan ayı etkinlikleri
└── README.md
```

## Hakkında

**Ahbap**, Türkiye'nin en büyük sivil toplum kuruluşlarından biridir. Gönüllülük esasıyla çalışan Ahbap, toplumsal dayanışmayı güçlendirmek için çeşitli projeler yürütmektedir.

*"Sevginin ve gerçeğin peşindeyiz"*

---

Ahbap Tekirdağ Gönüllüleri tarafından hazırlanmıştır.
