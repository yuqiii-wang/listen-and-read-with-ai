// /common/polyfills.js (Corrected Version)

(function() {
  // Use globalThis which is the standard way to get the global object
  // across all environments (browser, native, etc.)
  if (typeof globalThis === 'undefined') {
    // Fallback for extremely old environments, though unlikely to be needed in uni-app
    return;
  }

  let lastTime = 0;
  // Vendor prefixes are mostly for browsers, but including them is harmless
  const vendors = ['ms', 'moz', 'webkit', 'o'];
  for (let x = 0; x < vendors.length && !globalThis.requestAnimationFrame; ++x) {
    globalThis.requestAnimationFrame = globalThis[vendors[x] + 'RequestAnimationFrame'];
    globalThis.cancelAnimationFrame = globalThis[vendors[x] + 'CancelAnimationFrame'] || globalThis[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = function(callback, element) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      // setTimeout is available globally without needing a prefix
      const id = setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = function(id) {
      // clearTimeout is also globally available
      clearTimeout(id);
    };
  }
}());