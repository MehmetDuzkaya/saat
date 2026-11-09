/**
 * Kesintisiz Saniyelik Title & Dijital Saat Motoru
 */

// DOM Elementleri
const elHours = document.getElementById('hours');
const elMinutes = document.getElementById('minutes');
const elSeconds = document.getElementById('seconds');
const elMilliseconds = document.getElementById('milliseconds');
const elDayName = document.getElementById('day-name');
const elFullDate = document.getElementById('full-date');
const elSecondCircle = document.getElementById('second-circle');
const elSecondBar = document.getElementById('second-bar');
const elSecondsCounterText = document.getElementById('seconds-counter-text');
const elTabTitlePreview = document.getElementById('tab-title-preview');
const elDynamicFavicon = document.getElementById('dynamic-favicon');

// Kontroller
const btnSound = document.getElementById('btn-sound');
const soundIconOff = document.getElementById('sound-icon-off');
const soundIconOn = document.getElementById('sound-icon-on');
const btnZen = document.getElementById('btn-zen');
const btnFullscreen = document.getElementById('btn-fullscreen');
const themeButtons = document.querySelectorAll('.theme-dot');

// Durum değişkenleri
let soundEnabled = false;
let lastSecond = -1;
let audioCtx = null;

// Türkçe Gün ve Ay İsimleri
const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

/**
 * 2 basamaklı sayı formatlayıcı
 */
function pad2(num) {
  return num < 10 ? '0' + num : String(num);
}

function pad3(num) {
  if (num < 10) return '00' + num;
  if (num < 100) return '0' + num;
  return String(num);
}

/**
 * Web Audio API ile hafif mekanik saat tık sesi üretir
 */
function playTickSound() {
  if (!soundEnabled) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.025);
  } catch (e) {
    // Ses izni verilmemişse sessizce geç
  }
}

/**
 * Dinamik SVG Favicon oluşturucu: Sekmede akrep, yelkovan ve saniye çizer
 */
function updateFavicon(hours, minutes, seconds) {
  try {
    const hrAngle = ((hours % 12) + minutes / 60) * 30;
    const minAngle = (minutes + seconds / 60) * 6;
    const secAngle = seconds * 6;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#090d16" stroke="#38bdf8" stroke-width="1.8"/>
        <!-- Akrep -->
        <line x1="16" y1="16" x2="${16 + 7 * Math.sin(hrAngle * Math.PI / 180)}" y2="${16 - 7 * Math.cos(hrAngle * Math.PI / 180)}" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Yelkovan -->
        <line x1="16" y1="16" x2="${16 + 10 * Math.sin(minAngle * Math.PI / 180)}" y2="${16 - 10 * Math.cos(minAngle * Math.PI / 180)}" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Saniye -->
        <line x1="16" y1="16" x2="${16 + 11.5 * Math.sin(secAngle * Math.PI / 180)}" y2="${16 - 11.5 * Math.cos(secAngle * Math.PI / 180)}" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="1.5" fill="#38bdf8"/>
      </svg>
    `.trim();

    const encoded = encodeURIComponent(svg);
    elDynamicFavicon.href = `data:image/svg+xml,${encoded}`;
  } catch (err) {
    // Favicon hata verirse yoksay
  }
}

/**
 * Saati ve özellikle sekme başlığını (document.title) güncelleyen ana fonksiyon
 */
function updateClock(forceUpdate = false) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  const hStr = pad2(hours);
  const mStr = pad2(minutes);
  const sStr = pad2(seconds);

  // KULLANICININ ÖZEL İSTEĞİ:
  // Title kısmında sadece ve sadece saat dakika saniye gözükür (ne site adı ne logo ne ekstra metin)
  // Format: "HH:mm:ss" -> Örn: "14:25:08"
  const timeString = `${hStr}:${mStr}:${sStr}`;

  // 1. Sekme başlığını her halükarda güncelle (farklı uygulamadayken bile asla donmasın)
  if (document.title !== timeString) {
    document.title = timeString;
  }

  // Saniye değiştiğinde veya zorunlu güncellemede tetiklenecek işlemler
  if (seconds !== lastSecond || forceUpdate) {
    // 2. Ekrandaki dijital rakamları güncelle
    if (elHours.textContent !== hStr) elHours.textContent = hStr;
    if (elMinutes.textContent !== mStr) elMinutes.textContent = mStr;
    if (elSeconds.textContent !== sStr) elSeconds.textContent = sStr;

    // 3. Önizleme ve sayaç metinleri
    if (elTabTitlePreview.textContent !== timeString) {
      elTabTitlePreview.textContent = timeString;
    }
    elSecondsCounterText.textContent = `${seconds} / 60`;

    // 4. Tarih ve Gün (günde bir değişir)
    elDayName.textContent = DAYS_TR[now.getDay()];
    elFullDate.textContent = `${now.getDate()} ${MONTHS_TR[now.getMonth()]} ${now.getFullYear()}`;

    // 5. Dinamik Favicon
    updateFavicon(hours, minutes, seconds);

    // 6. Saniye tik-tak sesi
    if (lastSecond !== -1 && !forceUpdate && soundEnabled) {
      playTickSound();
    }

    lastSecond = seconds;
  }

  // Sayfa gizliyse (başka bir uygulamaya geçildiğinde veya sekme arkadayken)
  // milisaniye ve dairesel SVG hesaplarını atlayarak CPU bütçesini korur.
  // Bu sayede tarayıcının agresif arka plan kısıtlama mekanizması tetiklenmez.
  if (document.hidden) {
    return;
  }

  // Milisaniye ekranda akıcı gösterilir
  elMilliseconds.textContent = pad3(milliseconds);

  // Saniye ilerleme göstergeleri (Daire ve Çizgi)
  // Saniyenin kesirli değeri (smooth akış için)
  const fractionalSecond = seconds + milliseconds / 1000;
  const progressRatio = fractionalSecond / 60;

  // Dairesel SVG İlerlemesi (Çevre = 2 * PI * 160 ≈ 1005.309)
  const circumference = 2 * Math.PI * 160;
  const offset = circumference * (1 - progressRatio);
  elSecondCircle.style.strokeDashoffset = offset;

  // Lineer bar
  elSecondBar.style.width = `${(progressRatio * 100).toFixed(2)}%`;
}

// -------------------------------------------------------------
// Arka Plan Canlı Tutma Motoru (Inaudible Audio Keep-Alive)
// Tarayıcıların (Chrome, Safari, Edge) farklı uygulamalara geçildiğinde
// veya sekmeyi arka plana aldığında zamanlayıcıları ve Web Worker'ı
// dondurmasını (macOS App Nap & Background Throttling) engelleyen sistem.
// -------------------------------------------------------------
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgQ==';
let keepAliveAudio = null;

function initAudioKeepAlive() {
  if (keepAliveAudio) return;
  try {
    keepAliveAudio = new Audio(SILENT_AUDIO_URI);
    keepAliveAudio.loop = true;
    keepAliveAudio.volume = 0.001; // Duyulamaz seviyede, ancak tarayıcıya aktif medya akışı sinyali verir
  } catch (e) {
    // Ses nesnesi oluşturulamazsa sessizce geç
  }
}

function startAudioKeepAlive() {
  initAudioKeepAlive();
  if (keepAliveAudio && keepAliveAudio.paused) {
    keepAliveAudio.play().catch(() => {
      // Tarayıcı autoplay politikası ilk tıklamaya kadar izin vermeyebilir
    });
  }
}

// İlk kullanıcı etkileşiminde (tıklama, tuş basımı vb.) canlı tutucuyu başlat
['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
  window.addEventListener(evt, () => {
    startAudioKeepAlive();
  }, { passive: true });
});

// Sayfa ilk yüklendiğinde de hemen çalıştırmayı dene
startAudioKeepAlive();

// -------------------------------------------------------------
// Web Worker ile Arka Planda Kısıtlanmayan Hassas Zaman Takibi
// (Hem harici dosya hem de file:// için inline Blob worker desteği)
// -------------------------------------------------------------
let worker = null;

function initWorker() {
  // 1. Harici dosyadan worker başlatmayı dene
  try {
    worker = new Worker('timer-worker.js');
  } catch (err) {
    // 2. file:// veya CORS durumunda inline Blob Worker oluşturmayı dene
    try {
      const workerBlobCode = `
        let intervalId = null;
        self.onmessage = function (e) {
          if (e.data === 'start') {
            if (!intervalId) {
              intervalId = setInterval(function () {
                self.postMessage({ type: 'tick', timestamp: Date.now() });
              }, 200);
            }
          } else if (e.data === 'stop') {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        };
      `;
      const blob = new Blob([workerBlobCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
    } catch (e2) {
      worker = null;
    }
  }

  if (worker) {
    worker.onmessage = function (e) {
      if (e.data && e.data.type === 'tick') {
        updateClock();
      }
    };
    worker.postMessage('start');
  }
}

initWorker();

// Ana thread animasyon döngüsü (ekranda 60fps pürüzsüz milisaniye için)
function loop() {
  if (!document.hidden) {
    updateClock();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Tam saniye geçişlerinde tetiklenen hassas zamanlayıcı (drift önleyici)
function scheduleNextSecondTick() {
  const now = Date.now();
  const delay = 1000 - (now % 1000) + 5;
  setTimeout(() => {
    updateClock();
    scheduleNextSecondTick();
  }, delay);
}
scheduleNextSecondTick();

// Yedek setInterval: Kullanıcı sekmeyi arka plana aldığında veya diğer uygulamalara geçtiğinde
// saniye geçişlerini düzenli olarak kontrol eder
setInterval(() => {
  updateClock();
}, 200);

// Sayfa görünürlüğü ve odak değişimleri:
// Kullanıcı farklı bir uygulamadan geri döndüğünde veya ekrana tıkladığında
// saat anında en güncel değere sıfır gecikmeyle eşitlenir
document.addEventListener('visibilitychange', () => {
  startAudioKeepAlive();
  updateClock(true);
});

window.addEventListener('focus', () => {
  startAudioKeepAlive();
  updateClock(true);
});

window.addEventListener('pageshow', () => {
  startAudioKeepAlive();
  updateClock(true);
});

// İlk yükleme anında hemen güncelle
updateClock(true);

// -------------------------------------------------------------
// Kullanıcı Etkileşimleri (Tema, Zen, Ses, Tam Ekran)
// -------------------------------------------------------------

// Ses Aç/Kapat
btnSound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundIconOff.style.display = 'none';
    soundIconOn.style.display = 'block';
    btnSound.classList.add('active');
    playTickSound();
  } else {
    soundIconOff.style.display = 'block';
    soundIconOn.style.display = 'none';
    btnSound.classList.remove('active');
  }
});

const zenIconOpen = document.getElementById('zen-icon-open');
const zenIconClose = document.getElementById('zen-icon-close');
const zenExitHint = document.getElementById('zen-exit-hint');
const clockHero = document.querySelector('.clock-hero');
let zenHintTimeout = null;

// Minimal Zen Modu
function toggleZenMode(forceState) {
  const isZen = typeof forceState === 'boolean'
    ? document.body.classList.toggle('zen-mode', forceState)
    : document.body.classList.toggle('zen-mode');

  if (isZen) {
    if (zenIconOpen) zenIconOpen.style.display = 'none';
    if (zenIconClose) zenIconClose.style.display = 'block';
    btnZen.setAttribute('title', 'Geri Dön (+ veya Esc)');

    // Çıkış ipucunu geçici olarak göster
    if (zenExitHint) {
      zenExitHint.classList.add('show');
      clearTimeout(zenHintTimeout);
      zenHintTimeout = setTimeout(() => {
        zenExitHint.classList.remove('show');
      }, 3500);
    }
  } else {
    if (zenIconOpen) zenIconOpen.style.display = 'block';
    if (zenIconClose) zenIconClose.style.display = 'none';
    btnZen.setAttribute('title', 'Minimal Zen Modu (+ veya Z)');
    if (zenExitHint) zenExitHint.classList.remove('show');
    clearTimeout(zenHintTimeout);
  }
}

btnZen.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleZenMode();
});

// Zen modundayken saat alanına veya ekrana tıklandığında anında geri dön
clockHero.addEventListener('click', () => {
  if (document.body.classList.contains('zen-mode')) {
    toggleZenMode(false);
  }
});

// Tam Ekran
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => { });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
btnFullscreen.addEventListener('click', toggleFullscreen);

// Klavye Kısayolları (+: Zen Modu, Esc: Zen/Tam Ekran Çıkış, F: Tam Ekran, M: Ses)
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key;
  const isZenActive = document.body.classList.contains('zen-mode');

  // + tuşu (Numpad +, klavye +, veya Shift ile basılan +)
  if (key === '+' || key === '=' || e.code === 'NumpadAdd' || key.toLowerCase() === 'z') {
    e.preventDefault();
    toggleZenMode();
  } else if (key === 'Escape') {
    // Esc tuşu ile Zen modundan anında çık
    if (isZenActive) {
      toggleZenMode(false);
    }
  } else if (key.toLowerCase() === 'f') {
    toggleFullscreen();
  } else if (key.toLowerCase() === 'm') {
    btnSound.click();
  }
});

// Tema Değiştirme
themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    themeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const theme = btn.getAttribute('data-theme');

    // Var olan temaları temizle
    document.body.className = theme;
    localStorage.setItem('clock_theme', theme);
  });
});

// Kaydedilmiş tema varsa uygula
const savedTheme = localStorage.getItem('clock_theme');
if (savedTheme) {
  document.body.className = savedTheme;
  themeButtons.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-theme') === savedTheme);
  });
}
