// Global değişkenler
let config = null;
let events = {};
let currentEventId = null;

const gunIsimleri = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const ayBilgileri = [
    { key: 'ocak', isim: 'Ocak', ay: 1 }, { key: 'subat', isim: 'Şubat', ay: 2 },
    { key: 'mart', isim: 'Mart', ay: 3 }, { key: 'nisan', isim: 'Nisan', ay: 4 },
    { key: 'mayis', isim: 'Mayıs', ay: 5 }, { key: 'haziran', isim: 'Haziran', ay: 6 },
    { key: 'temmuz', isim: 'Temmuz', ay: 7 }, { key: 'agustos', isim: 'Ağustos', ay: 8 },
    { key: 'eylul', isim: 'Eylül', ay: 9 }, { key: 'ekim', isim: 'Ekim', ay: 10 },
    { key: 'kasim', isim: 'Kasım', ay: 11 }, { key: 'aralik', isim: 'Aralık', ay: 12 }
];

// URL'den ay al veya otomatik belirle
function getAyFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const ay = urlParams.get('ay');
    if (ay) return ay;

    const bugun = new Date();
    const ayIsimleri = ['ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran', 'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik'];
    return `${bugun.getFullYear()}-${ayIsimleri[bugun.getMonth()]}`;
}

// Config yükle
async function loadConfig() {
    try {
        const ay = getAyFromUrl();
        const response = await fetch(`data/${ay}.json`);
        if (!response.ok) throw new Error(`${ay}.json bulunamadı`);
        config = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Config yüklenemedi:', error);
        showEmptyMonthMessage();
    }
}

// Boş ay mesajı
function showEmptyMonthMessage() {
    const [yil, ayKey] = getAyFromUrl().split('-');
    const ayIsmi = ayBilgileri.find(a => a.key === ayKey)?.isim || 'Bu ay';

    document.getElementById('pageTitle').textContent = `Ahbap Tekirdağ - ${ayIsmi} ${yil} Etkinlik Takvimi`;
    document.getElementById('headerTitle').textContent = `Tekirdağ - ${ayIsmi} ${yil} Etkinlik Takvimi`;
    document.getElementById('headerSlogan').textContent = 'Sevginin ve gerçeğin peşindeyiz';
    document.getElementById('currentMonthDisplay').textContent = `${ayIsmi} ${yil}`;
    document.getElementById('footerText').textContent = 'Ahbap Tekirdağ Gönüllüleri';
    document.getElementById('pdfLink').style.display = 'none';

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

    const pdfLink = document.getElementById('pdfLink');
    if (config.pdfDosyasi) {
        pdfLink.href = config.pdfDosyasi;
        pdfLink.download = `Ahbap-${config.ay}-${config.yil}-Takvim.pdf`;
        pdfLink.style.display = 'flex';
    } else {
        pdfLink.style.display = 'none';
    }

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

// Özel gün badge metni
function getOzelGunText(ozelGun) {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) return ozelGun.emoji || ozelGun.baslik;
    if (screenWidth <= 768) return `${ozelGun.baslik.split(' ')[0]} ${ozelGun.emoji || ''}`;
    return `${ozelGun.baslik} ${ozelGun.emoji || ''}`;
}

// Gün kutusu oluştur
function createDayElement(gun, etkinlik, ozelGun, gunIndex, isNextMonth = false) {
    const dayDiv = document.createElement('div');
    let dayClass = 'day';
    if (isNextMonth) dayClass += ' next-month';
    if (gunIndex === 5) dayClass += ' saturday';
    if (gunIndex === 6) dayClass += ' sunday';
    if (etkinlik) dayClass += ' has-event';
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

    if (etkinlik) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        eventDiv.onclick = () => openModal(isNextMonth ? `next-${etkinlik.id}` : etkinlik.id);
        eventDiv.innerHTML = `
            <div class="event-title"><span class="event-icon">${etkinlik.icon}</span> ${etkinlik.baslik}</div>
            <div class="event-desc">${etkinlik.kisa}</div>`;
        dayDiv.appendChild(eventDiv);
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
    config.etkinlikler.forEach(e => etkinlikMap[e.gun] = e);
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

        const nextAyFile = `${newYil}-${ayBilgileri[newIndex].key}`;
        const response = await fetch(`data/${nextAyFile}.json`);
        if (!response.ok) throw new Error(`${nextAyFile}.json bulunamadı`);
        const nextConfig = await response.json();

        const nextEtkinlikMap = {};
        const nextOzelGunlerMap = {};
        nextConfig.etkinlikler.forEach(e => nextEtkinlikMap[e.gun] = e);
        nextConfig.ozelGunler?.forEach(o => nextOzelGunlerMap[o.gun] = o);

        for (let i = 1; i <= kalanBosluk; i++) {
            const etkinlik = nextEtkinlikMap[i];
            const ozelGun = nextOzelGunlerMap[i];

            // Etkinlik varsa events objesine ekle
            if (etkinlik) {
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
            }

            const dayDiv = createDayElement(i, etkinlik, ozelGun, -1, true);
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
    document.getElementById('modalTitle').textContent = event.title;
    document.getElementById('modalDate').textContent = event.date;
    document.getElementById('modalDesc').innerHTML = event.desc.replace(/\n/g, '<br>');
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

    const newUrl = `?ay=${newYil}-${ayBilgileri[newIndex].key}`;
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
