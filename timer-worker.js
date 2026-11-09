// Web Worker: Arka plan sekmelerinde ve diğer uygulamalara geçildiğinde
// tarayıcının setInterval kısıtlamasına (throttling / App Nap) takılmadan
// saniyenin tam vaktinde title ve saati kesintisiz güncellemesini sağlar.

let intervalId = null;

self.onmessage = function (e) {
  if (e.data === 'start') {
    if (!intervalId) {
      // 200ms aralıkla kontrol ederek saniye geçişini gecikmesiz yakalar
      intervalId = setInterval(() => {
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
