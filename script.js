// Global değişkenler
let config = null;
let events = {};
let currentEventId = null;
let currentSehir = null;

// Şehir konfigürasyonları - Her şehir için ayrı Google Sheet ID
const SEHIRLER = {
    tekirdag: {
        isim: 'Tekirdağ',
        sheetId: '1N_CdZ9Tt21S32AchnxsLhVtFax9z3KWBGdkUgvRuCb8',
        slogan: 'Sevginin ve gerçeğin peşindeyiz'
    },
    canakkale: {
        isim: 'Çanakkale',
        sheetId: '', // Çanakkale Sheet ID'si eklenecek
        slogan: 'Sevginin ve gerçeğin peşindeyiz'
    },
    istanbul: {
        isim: 'İstanbul',
        sheetId: '1Qt91vORC3IfHbXH0jzmmuj-gU7OIj-yV0N-tDrvE634',
        slogan: 'Sevginin ve gerçeğin peşindeyiz'
    }
    // Yeni şehir eklemek için buraya ekle
};

// Tüm şehirler için ortak favicon
const COMMON_FAVICON = 'ahbap.png';

// Varsayılan şehir (URL'de şehir belirtilmezse)
const DEFAULT_SEHIR = 'tekirdag';

// Google Sheets URL oluşturucu
function getSheetUrls(sheetId) {
    return {
        etkinlikler: `https://opensheet.elk.sh/${sheetId}/Etkinlikler`,
        ozelGunler: `https://opensheet.elk.sh/${sheetId}/Özel Günler`
    };
}

// URL'den şehir al
function getSehirFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const sehir = urlParams.get('sehir');
    if (sehir && SEHIRLER[sehir]) return sehir;
    return DEFAULT_SEHIR;
}

const gunIsimleri = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const ayBilgileri = [
    { key: 'ocak', isim: 'Ocak', ay: 1 }, { key: 'subat', isim: 'Şubat', ay: 2 },
    { key: 'mart', isim: 'Mart', ay: 3 }, { key: 'nisan', isim: 'Nisan', ay: 4 },
    { key: 'mayis', isim: 'Mayıs', ay: 5 }, { key: 'haziran', isim: 'Haziran', ay: 6 },
    { key: 'temmuz', isim: 'Temmuz', ay: 7 }, { key: 'agustos', isim: 'Ağustos', ay: 8 },
    { key: 'eylul', isim: 'Eylül', ay: 9 }, { key: 'ekim', isim: 'Ekim', ay: 10 },
    { key: 'kasim', isim: 'Kasım', ay: 11 }, { key: 'aralik', isim: 'Aralık', ay: 12 }
];

// Ayın ilk gününü hesapla (Pazartesi=1, Pazar=7)
function getAyinIlkGunu(yil, ayNumarasi) {
    const date = new Date(yil, ayNumarasi - 1, 1);
    let gun = date.getDay(); // 0=Pazar, 1=Pazartesi...
    return gun === 0 ? 7 : gun; // Pazar'ı 7 yap (takvimimiz Pazartesi başlıyor)
}

// Ayın gün sayısını hesapla
function getAyinGunSayisi(yil, ayNumarasi) {
    return new Date(yil, ayNumarasi, 0).getDate();
}

// URL'den ay al veya otomatik belirle
function getAyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const ay = urlParams.get('ay');
    if (ay) return ay;

    const bugun = new Date();
    const ayIsimleri = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
    return `${bugun.getFullYear()}-${ayIsimleri[bugun.getMonth()]}`;
}

// Google Sheets'ten veri çek ve config oluştur
async function loadConfig() {
    try {
        // Şehir bilgisini al
        currentSehir = getSehirFromUrl();
        const sehirConfig = SEHIRLER[currentSehir];

        // Sheet ID kontrolü
        if (!sehirConfig.sheetId) {
            showSehirNotConfigured(sehirConfig.isim);
            return;
        }

        const sheetUrls = getSheetUrls(sehirConfig.sheetId);

        const [yil, ayKey] = getAyFromUrl().split('-');
        const ayInfo = ayBilgileri.find(a => a.key === ayKey);
        const ayIsmi = ayInfo?.isim || 'Ocak';
        const ayNumarasi = ayInfo?.ay || 1;

        // Favicon güncelle (ortak favicon kullan)
        updateFavicon(COMMON_FAVICON);

        // Etkinlikler ve özel günleri paralel çek
        const [etkinliklerRes, ozelGunlerRes] = await Promise.all([
            fetch(sheetUrls.etkinlikler),
            fetch(sheetUrls.ozelGunler)
        ]);

        const tumEtkinlikler = await etkinliklerRes.json();
        const tumOzelGunler = await ozelGunlerRes.json();

        // Bu ay ve yıla ait etkinlikleri filtrele
        const ayEtkinlikleri = tumEtkinlikler.filter(e =>
            e.ay === ayIsmi && String(e.yil) === yil
        );

        const ayOzelGunleri = tumOzelGunler.filter(o =>
            o.ay === ayIsmi && String(o.yil) === yil
        );

        // Eğer bu ay için etkinlik yoksa boş ay mesajı göster
        if (ayEtkinlikleri.length === 0 && ayOzelGunleri.length === 0) {
            showEmptyMonthMessage();
            return;
        }

        // Şehir ismini config'den al
        const sehir = sehirConfig.isim;

        // Config objesini oluştur
        config = {
            sehir: sehir,
            ay: ayIsmi,
            yil: parseInt(yil),
            ayinIlkGunu: getAyinIlkGunu(parseInt(yil), ayNumarasi),
            ayinGunSayisi: getAyinGunSayisi(parseInt(yil), ayNumarasi),
            slogan: sehirConfig.slogan,
            footer: `Ahbap ${sehir} Gönüllüleri`,
            konum: sehir,
            etkinlikler: ayEtkinlikleri.map(e => ({
                id: e.id,
                gun: parseInt(e.gun),
                icon: e.icon,
                baslik: e.baslik,
                kisa: e.kisa,
                detay: e.detay,
                gif: e.gif
            })),
            ozelGunler: ayOzelGunleri.map(o => ({
                gun: parseInt(o.gun),
                tur: o.tur,
                baslik: o.baslik,
                emoji: o.emoji,
                renk: o.renk
            }))
        };

        initializeApp();
    } catch (error) {
        console.error('Veri yüklenemedi:', error);
        showEmptyMonthMessage();
    }
}

// Favicon güncelle
function updateFavicon(faviconPath) {
    if (!faviconPath) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = faviconPath;
}

// Şehir yapılandırılmamış mesajı
function showSehirNotConfigured(sehirIsmi) {
    const sehirConfig = SEHIRLER[currentSehir] || SEHIRLER[DEFAULT_SEHIR];

    document.getElementById('pageTitle').textContent = `Ahbap ${sehirIsmi} - Etkinlik Takvimi`;
    document.getElementById('headerTitle').textContent = `${sehirIsmi} Etkinlik Takvimi`;
    document.getElementById('headerSlogan').textContent = sehirConfig.slogan;
    document.getElementById('currentMonthDisplay').textContent = '';
    document.getElementById('footerText').textContent = `Ahbap ${sehirIsmi} Gönüllüleri`;
    document.getElementById('pdfBtn').style.display = 'none';

    document.getElementById('calendarDays').innerHTML = `
        <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🔧</div>
            <h3 style="color: var(--text-dark); margin-bottom: 10px; font-size: 1.5rem;">${sehirIsmi} Takvimi Henüz Hazır Değil</h3>
            <p style="color: var(--text-medium); margin-bottom: 30px; max-width: 500px;">
                Bu şehir için Google Sheet yapılandırması henüz tamamlanmamış. Lütfen daha sonra tekrar deneyin.
            </p>
        </div>`;
}

// Boş ay mesajı
function showEmptyMonthMessage() {
    const sehirConfig = SEHIRLER[currentSehir] || SEHIRLER[DEFAULT_SEHIR];
    const sehirIsmi = sehirConfig.isim;
    const [yil, ayKey] = getAyFromUrl().split('-');
    const ayIsmi = ayBilgileri.find(a => a.key === ayKey)?.isim || 'Bu ay';

    document.getElementById('pageTitle').textContent = `Ahbap ${sehirIsmi} - ${ayIsmi} ${yil} Etkinlik Takvimi`;
    document.getElementById('headerTitle').textContent = `${sehirIsmi} - ${ayIsmi} ${yil} Etkinlik Takvimi`;
    document.getElementById('headerSlogan').textContent = sehirConfig.slogan;
    document.getElementById('currentMonthDisplay').textContent = `${ayIsmi} ${yil}`;
    document.getElementById('footerText').textContent = `Ahbap ${sehirIsmi} Gönüllüleri`;
    document.getElementById('pdfBtn').style.display = 'none';

    document.getElementById('calendarDays').innerHTML = `
        <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">📅</div>
            <h3 style="color: var(--text-dark); margin-bottom: 10px; font-size: 1.5rem;">Bu Ay Henüz Etkinlik Yok</h3>
            <p style="color: var(--text-medium); margin-bottom: 30px; max-width: 500px;">
                ${ayIsmi} ${yil} için henüz etkinlik planlanmamış. Diğer ayları görüntülemek için yukarıdaki ok tuşlarını kullanabilirsiniz.
            </p>
        </div>`;
}

// Uygulamayı başlat
async function initializeApp() {
    // Events objesini temizle
    events = {};

    document.getElementById('pageTitle').textContent = `Ahbap ${config.sehir} - ${config.ay} ${config.yil} Etkinlik Takvimi`;
    document.getElementById('headerTitle').textContent = `${config.sehir} - ${config.ay} ${config.yil} Etkinlik Takvimi`;
    document.getElementById('headerSlogan').textContent = config.slogan;
    document.getElementById('currentMonthDisplay').textContent = `${config.ay} ${config.yil}`;
    document.getElementById('footerText').textContent = config.footer;

    // PDF butonu artık her zaman görünür (dinamik oluşturuluyor)

    // Events objesini oluştur
    config.etkinlikler.forEach(etkinlik => {
        const ayNumarasi = String(ayBilgileri.find(a => a.isim === config.ay).ay).padStart(2, '0');
        const gunStr = String(etkinlik.gun).padStart(2, '0');
        const calendarDate = `${config.yil}${ayNumarasi}${gunStr}`;
        const gunIsmi = getGunIsmi(etkinlik.gun);

        events[etkinlik.id] = {
            title: `${etkinlik.icon} ${etkinlik.baslik}`,
            date: `${etkinlik.gun} ${config.ay} ${config.yil} - ${gunIsmi}`,
            calendarDate: calendarDate,
            desc: etkinlik.detay,
            gif: etkinlik.gif
        };
    });

    await buildCalendar();
}

// Gün ismini al
function getGunIsmi(gun, ayConfig = config) {
    const ilkGunIndex = ayConfig.ayinIlkGunu - 1;
    const gunIndex = (ilkGunIndex + gun - 1) % 7;
    return gunIsimleri[gunIndex];
}

// Markdown formatını HTML'e çevir
function formatMarkdown(text) {
    if (!text) return text;
    // Sıralama önemli: önce çift karakterli formatlar
    // **bold** -> <strong>bold</strong>
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // __underline__ -> <u>underline</u>
    text = text.replace(/__(.+?)__/g, '<u>$1</u>');
    // [text](url) -> <a href="url" target="_blank">text</a>
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // *italic* -> <em>italic</em>
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // _italic_ -> <em>italic</em> (tek alt çizgi)
    text = text.replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');
    return text;
}

// Özel gün badge metni
function getOzelGunText(ozelGun) {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) return ozelGun.emoji || ozelGun.baslik;
    if (screenWidth <= 768) return `${ozelGun.baslik.split(' ')[0]} ${ozelGun.emoji || ''}`;
    return `${ozelGun.baslik} ${ozelGun.emoji || ''}`;
}

// Gün kutusu oluştur
function createDayElement(gun, etkinlikler, ozelGun, gunIndex, isNextMonth = false) {
    const dayDiv = document.createElement('div');
    let dayClass = 'day';
    if (isNextMonth) dayClass += ' next-month';
    if (gunIndex === 5) dayClass += ' saturday';
    if (gunIndex === 6) dayClass += ' sunday';
    if (etkinlikler && etkinlikler.length > 0) dayClass += ' has-event';
    if (ozelGun) dayClass += ' ozel-gun';
    dayDiv.className = dayClass;

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = gun;
    if (ozelGun) {
        dayNumber.style.background = ozelGun.renk;
        dayNumber.style.color = 'white';
    }
    dayDiv.appendChild(dayNumber);

    if (ozelGun) {
        const ozelGunDiv = document.createElement('div');
        ozelGunDiv.className = 'ozel-gun-badge';
        ozelGunDiv.textContent = getOzelGunText(ozelGun);
        ozelGunDiv.style.color = ozelGun.renk;
        dayDiv.appendChild(ozelGunDiv);
    }

    // Birden fazla etkinlik olabilir
    if (etkinlikler && etkinlikler.length > 0) {
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';

        // Birden fazla etkinlik varsa çoklu modu etkinleştir
        const cokluEtkinlik = etkinlikler.length > 1;
        if (cokluEtkinlik) {
            eventsContainer.classList.add('multiple-events');
        }

        etkinlikler.forEach(etkinlik => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.onclick = () => openModal(isNextMonth ? `next-${etkinlik.id}` : etkinlik.id);

            // Çoklu etkinlik varsa kısa açıklamayı gösterme
            if (cokluEtkinlik) {
                eventDiv.innerHTML = `
                    <div class="event-title"><span class="event-icon">${etkinlik.icon}</span> ${formatMarkdown(etkinlik.baslik)}</div>`;
            } else {
                eventDiv.innerHTML = `
                    <div class="event-title"><span class="event-icon">${etkinlik.icon}</span> ${formatMarkdown(etkinlik.baslik)}</div>
                    <div class="event-desc">${formatMarkdown(etkinlik.kisa)}</div>`;
            }
            eventsContainer.appendChild(eventDiv);
        });

        dayDiv.appendChild(eventsContainer);
    }

    return dayDiv;
}

// Takvimi oluştur
async function buildCalendar() {
    const container = document.getElementById('calendarDays');

    const boslukSayisi = config.ayinIlkGunu - 1;
    const toplamGun = boslukSayisi + config.ayinGunSayisi;
    const gereklisatir = Math.ceil(toplamGun / 7);
    container.style.gridTemplateRows = `repeat(${gereklisatir}, minmax(100px, 1fr))`;

    let animationIndex = 0;
    const allDays = [];

    // Boş günler
    for (let i = 0; i < boslukSayisi; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day empty';
        allDays.push(emptyDay);
    }

    // Etkinlik ve özel günleri indexle
    const etkinlikMap = {};
    const ozelGunlerMap = {};
    // Aynı güne birden fazla etkinlik olabilir, array kullan
    config.etkinlikler.forEach(e => {
        if (!etkinlikMap[e.gun]) etkinlikMap[e.gun] = [];
        etkinlikMap[e.gun].push(e);
    });
    config.ozelGunler?.forEach(o => ozelGunlerMap[o.gun] = o);

    // Ayın günleri
    for (let gun = 1; gun <= config.ayinGunSayisi; gun++) {
        const gunIndex = (boslukSayisi + gun - 1) % 7;
        const dayDiv = createDayElement(gun, etkinlikMap[gun], ozelGunlerMap[gun], gunIndex);
        dayDiv.style.animationDelay = `${0.4 + (0.05 * animationIndex)}s`;
        animationIndex++;
        allDays.push(dayDiv);
    }

    // Bir sonraki ayın günleri
    const kalanBosluk = (7 - (toplamGun % 7)) % 7;
    if (kalanBosluk > 0 && kalanBosluk < 7) {
        const nextMonthDays = await loadNextMonthEvents(kalanBosluk, animationIndex);
        allDays.push(...nextMonthDays);
    }

    // Tüm günleri bir seferde DOM'a ekle
    container.innerHTML = '';
    allDays.forEach(day => container.appendChild(day));
}

// Bir sonraki ayın etkinliklerini yükle
async function loadNextMonthEvents(kalanBosluk, startAnimationIndex) {
    const nextMonthDays = [];

    try {
        const [yil, ayKey] = getAyFromUrl().split('-');
        const currentIndex = ayBilgileri.findIndex(a => a.key === ayKey);
        let newIndex = currentIndex + 1;
        let newYil = parseInt(yil);

        if (newIndex > 11) { newIndex = 0; newYil++; }

        const nextAyIsmi = ayBilgileri[newIndex].isim;
        const nextAyNumarasi = ayBilgileri[newIndex].ay;

        // Google Sheets'ten verileri çek (cache'den gelecek muhtemelen)
        const sehirConfig = SEHIRLER[currentSehir];
        const sheetUrls = getSheetUrls(sehirConfig.sheetId);

        const [etkinliklerRes, ozelGunlerRes] = await Promise.all([
            fetch(sheetUrls.etkinlikler),
            fetch(sheetUrls.ozelGunler)
        ]);

        const tumEtkinlikler = await etkinliklerRes.json();
        const tumOzelGunler = await ozelGunlerRes.json();

        // Sonraki aya ait verileri filtrele
        const nextEtkinlikler = tumEtkinlikler.filter(e =>
            e.ay === nextAyIsmi && String(e.yil) === String(newYil)
        );
        const nextOzelGunler = tumOzelGunler.filter(o =>
            o.ay === nextAyIsmi && String(o.yil) === String(newYil)
        );

        // Config objesi oluştur
        const nextConfig = {
            ay: nextAyIsmi,
            yil: newYil,
            ayinIlkGunu: getAyinIlkGunu(newYil, nextAyNumarasi),
            ayinGunSayisi: getAyinGunSayisi(newYil, nextAyNumarasi),
            etkinlikler: nextEtkinlikler.map(e => ({
                id: e.id,
                gun: parseInt(e.gun),
                icon: e.icon,
                baslik: e.baslik,
                kisa: e.kisa,
                detay: e.detay,
                gif: e.gif
            })),
            ozelGunler: nextOzelGunler.map(o => ({
                gun: parseInt(o.gun),
                tur: o.tur,
                baslik: o.baslik,
                emoji: o.emoji,
                renk: o.renk
            }))
        };

        const nextEtkinlikMap = {};
        const nextOzelGunlerMap = {};
        // Aynı güne birden fazla etkinlik olabilir
        nextConfig.etkinlikler.forEach(e => {
            if (!nextEtkinlikMap[e.gun]) nextEtkinlikMap[e.gun] = [];
            nextEtkinlikMap[e.gun].push(e);
        });
        nextConfig.ozelGunler?.forEach(o => nextOzelGunlerMap[o.gun] = o);

        for (let i = 1; i <= kalanBosluk; i++) {
            const etkinlikler = nextEtkinlikMap[i];
            const ozelGun = nextOzelGunlerMap[i];

            // Etkinlikler varsa events objesine ekle
            if (etkinlikler && etkinlikler.length > 0) {
                etkinlikler.forEach(etkinlik => {
                    const ayNumarasi = String(ayBilgileri.find(a => a.isim === nextConfig.ay).ay).padStart(2, '0');
                    const gunStr = String(i).padStart(2, '0');
                    const calendarDate = `${nextConfig.yil}${ayNumarasi}${gunStr}`;
                    const gunIsmi = getGunIsmi(i, nextConfig);

                    const eventId = `next-${etkinlik.id}`;
                    events[eventId] = {
                        title: `${etkinlik.icon} ${etkinlik.baslik}`,
                        date: `${i} ${nextConfig.ay} ${nextConfig.yil} - ${gunIsmi}`,
                        calendarDate: calendarDate,
                        desc: etkinlik.detay,
                        gif: etkinlik.gif
                    };
                });
            }

            const dayDiv = createDayElement(i, etkinlikler, ozelGun, -1, true);
            dayDiv.style.animationDelay = `${0.4 + (0.05 * (startAnimationIndex + i - 1))}s`;
            nextMonthDays.push(dayDiv);
        }
    } catch (error) {
        for (let i = 1; i <= kalanBosluk; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day next-month';
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            dayDiv.style.animationDelay = `${0.4 + (0.05 * (startAnimationIndex + i - 1))}s`;
            dayDiv.appendChild(dayNumber);
            nextMonthDays.push(dayDiv);
        }
    }

    return nextMonthDays;
}

// Modal
function openModal(eventId) {
    currentEventId = eventId;
    const event = events[eventId];
    document.getElementById('modalTitle').innerHTML = event.title;
    document.getElementById('modalDate').textContent = event.date;
    // Satır atlamaları işle: \n (gerçek), \\n (literal), || (özel ayraç)
    let desc = event.desc
        .replace(/\\n/g, '<br>')  // \\n -> <br>
        .replace(/\n/g, '<br>')   // \n -> <br>
        .replace(/\|\|/g, '<br>'); // || -> <br>
    document.getElementById('modalDesc').innerHTML = formatMarkdown(desc);
    document.getElementById('modalAnimation').innerHTML = event.gif ?
        `<div class="modal-gif"><img src="${event.gif}" alt="Etkinlik animasyonu"></div>` : '';
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Takvime ekle - Google Calendar
function addToCalendar() {
    const event = events[currentEventId];

    // Google Calendar URL formatı
    const startDate = event.calendarDate;
    const endDate = event.calendarDate;

    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}T120000Z/${endDate}T140000Z&details=${encodeURIComponent(event.desc)}&location=${encodeURIComponent(config.konum)}`;

    window.open(googleCalendarUrl, '_blank');
}

// Takvime Ekle dropdown
function addAllToCalendar() {}

function toggleCalendarDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('calendarDropdown');
    const isOpen = dropdown.classList.contains('open');

    if (!isOpen) {
        const ayNumarasi = String(ayBilgileri.find(a => a.isim === config.ay).ay).padStart(2, '0');
        dropdown.innerHTML = `<div class="calendar-dropdown-header">Etkinliği seç ve ekle</div>` +
            config.etkinlikler.map(etkinlik => {
                const gunStr = String(etkinlik.gun).padStart(2, '0');
                const calendarDate = `${config.yil}${ayNumarasi}${gunStr}`;
                const title = `${etkinlik.icon} ${etkinlik.baslik}`;
                const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${calendarDate}T120000Z/${calendarDate}T140000Z&details=${encodeURIComponent(etkinlik.detay)}&location=${encodeURIComponent(config.konum)}`;
                return `<a href="${url}" target="_blank">${title}<span class="event-date">${etkinlik.gun} ${config.ay}</span></a>`;
            }).join('');
    }

    dropdown.classList.toggle('open', !isOpen);
}

document.addEventListener('click', () => {
    document.getElementById('calendarDropdown')?.classList.remove('open');
});

// Ay değiştir
async function changeMonth(direction) {
    const [yil, ayKey] = getAyFromUrl().split('-');
    const currentIndex = ayBilgileri.findIndex(a => a.key === ayKey);
    let newIndex = currentIndex + direction;
    let newYil = parseInt(yil);

    if (newIndex < 0) { newIndex = 11; newYil--; }
    else if (newIndex > 11) { newIndex = 0; newYil++; }

    // Şehir parametresini koru
    const sehir = getSehirFromUrl();
    const newUrl = `?sehir=${sehir}&ay=${newYil}-${ayBilgileri[newIndex].key}`;
    window.history.pushState({}, '', newUrl);
    await loadConfig();
}

// Event listeners
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
window.addEventListener('popstate', () => loadConfig());

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (config) buildCalendar(); }, 250);
});

document.addEventListener('DOMContentLoaded', loadConfig);

// PDF Oluştur (Print dialog)
function generatePDF() {
    window.print();
}
