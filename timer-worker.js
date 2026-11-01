// Web Worker: Arka plan sekmelerinde bile tarayıcının setInterval kısıtlamasına (throttling) takılmadan
// saniyenin tam vaktinde title ve saati güncellemesini sağlar.

let intervalId = null;

self.onmessage = function (e) {
  if (e.data === 'start') {
    if (!intervalId) {
      // Her 100ms'de kontrol ederek saniye geçişini sıfır gecikmeyle yakalar
      intervalId = setInterval(() => {
        self.postMessage({ type: 'tick', timestamp: Date.now() });
      }, 100);
    }
  } else if (e.data === 'stop') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
