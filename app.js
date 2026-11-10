/**
 * Kesintisiz Saniyelik Title & Dijital Saat Motoru
 * Ultra Minimalist: Yalnızca Saat
 */

// DOM Elementleri
const elHours = document.getElementById('hours');
const elMinutes = document.getElementById('minutes');
const elSeconds = document.getElementById('seconds');

// Kontroller
const btnSound = document.getElementById('btn-sound');
const soundIconOff = document.getElementById('sound-icon-off');
const soundIconOn = document.getElementById('sound-icon-on');
const btnZen = document.getElementById('btn-zen');
const btnFullscreen = document.getElementById('btn-fullscreen');

// Durum değişkenleri
let soundEnabled = false;
let lastSecond = -1;
let audioCtx = null;

/**
 * 2 basamaklı sayı formatlayıcı
 */
function pad2(num) {
  return num < 10 ? '0' + num : String(num);
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
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + 0.02);

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
 * Saati ve sekme başlığını (document.title) güncelleyen ana fonksiyon
 */
function updateClock(forceUpdate = false) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hStr = pad2(hours);
  const mStr = pad2(minutes);
  const sStr = pad2(seconds);

  // KULLANICININ ÖZEL İSTEĞİ:
  // Title kısmında sadece ve sadece saat dakika saniye gözükür
  // Format: "HH:mm:ss" -> Örn: "14:25:08"
  const timeString = `${hStr}:${mStr}:${sStr}`;

  // 1. Sekme başlığını her zaman güncelle (farklı uygulamadayken dahi donmasın)
  if (document.title !== timeString) {
    document.title = timeString;
  }

  // Saniye değiştiğinde tetiklenecek işlemler
  if (seconds !== lastSecond || forceUpdate) {
    // 2. Ekrandaki dijital rakamları güncelle
    if (elHours && elHours.textContent !== hStr) elHours.textContent = hStr;
    if (elMinutes && elMinutes.textContent !== mStr) elMinutes.textContent = mStr;
    if (elSeconds && elSeconds.textContent !== sStr) elSeconds.textContent = sStr;

    // 3. Saniye tik-tak sesi
    if (lastSecond !== -1 && !forceUpdate && soundEnabled) {
      playTickSound();
    }

    lastSecond = seconds;
  }
}

// -------------------------------------------------------------
// Arka Plan Canlı Tutma Motoru (Inaudible Audio Keep-Alive)
// Tarayıcıların (Chrome, Safari, Edge) farklı uygulamalara geçildiğinde
// veya sekmeyi arka plana aldığında zamanlayıcıları ve Web Worker'ı
// dondurmasını (macOS App Nap & Background Throttling) engelleyen sistem.
// -------------------------------------------------------------
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgYCBgIGAgQ==';
let keepAliveAudio = null;

function initAudioKeepAlive() {
  if (keepAliveAudio) return;
  try {
    keepAliveAudio = new Audio(SILENT_AUDIO_URI);
    keepAliveAudio.loop = true;
    keepAliveAudio.volume = 0.001; // İnsan kulağının duyamayacağı seviye, ancak aktif medya akışı sayılır
  } catch (e) {
    // Ses nesnesi oluşturulamazsa geç
  }
}

function startAudioKeepAlive() {
  initAudioKeepAlive();
  if (keepAliveAudio && keepAliveAudio.paused) {
    keepAliveAudio.play().catch(() => {});
  }
}

// İlk kullanıcı etkileşiminde canlı tutucuyu başlat
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

// Ana thread animasyon döngüsü
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

// Yedek setInterval: Arka planda veya diğer uygulamalarda saniye geçişlerini düzenli kontrol eder
setInterval(() => {
  updateClock();
}, 200);

// Sayfa görünürlüğü ve odak değişimleri
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
// Kullanıcı Etkileşimleri (Zen, Ses, Tam Ekran)
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

// Zen modundayken ekrana tıklandığında geri dön
clockHero.addEventListener('click', () => {
  if (document.body.classList.contains('zen-mode')) {
    toggleZenMode(false);
  }
});

// Tam Ekran
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
btnFullscreen.addEventListener('click', toggleFullscreen);

// Klavye Kısayolları (+: Zen Modu, Esc: Zen Çıkış, F: Tam Ekran, M: Ses)
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key;
  const isZenActive = document.body.classList.contains('zen-mode');

  if (key === '+' || key === '=' || e.code === 'NumpadAdd' || key.toLowerCase() === 'z') {
    e.preventDefault();
    toggleZenMode();
  } else if (key === 'Escape') {
    if (isZenActive) {
      toggleZenMode(false);
    }
  } else if (key.toLowerCase() === 'f') {
    toggleFullscreen();
  } else if (key.toLowerCase() === 'm') {
    btnSound.click();
  }
});