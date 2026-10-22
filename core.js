// ============================================
// core.js — Welcome, Auto-Connect, Auto-Update
// Sync TETAP di masing-masing halaman (beda backend)
// ============================================

// ==== ISI 3 URL APPS SCRIPT ANDA DI SINI (sekali saja) ====
const DEFAULT_URLS = {
  hpt:       'https://script.google.com/macros/s/AKfycbyY2_2eqEiabNCRV2y1eCZ7DLHQIEKQNjZB7TvCR1IN0Qz737ltAsHvo4OImtXIU5WBFA/exec',
  pestisida: 'https://script.google.com/macros/s/AKfycbw08XF1H8bdZ6Oe_oI-F2cCsKxynCVNFs_51rhzEm2AlzeMqkfVApaxmhWBl_Syy7PQ/exec', // ← isi URL Apps Script PESTISIDA di sini
  suhu:      'https://script.google.com/macros/s/AKfycbzLqgDZHfeAjYZK88SupPa3LJs-39_8hsGDgzwmDRiiUdXUobhDUwVdqI1vYNpnd4EaxQ/exec'  // ← isi URL Apps Script SUHU di sini
};

const APP_VERSION_KEY = 'ipm_awb_app_version_v1';
const WELCOMED_KEY    = 'ipm_awb_welcomed_v1';

// ========== WELCOME SCREEN ==========
function isWelcomed() { return localStorage.getItem(WELCOMED_KEY) === '1'; }
function markWelcomed() { localStorage.setItem(WELCOMED_KEY, '1'); }

function showWelcomeScreen() {
  const ws = document.getElementById('welcome-screen');
  if (ws) ws.style.display = 'flex';
  const ah = document.getElementById('app-header');
  if (ah) ah.style.display = 'none';
  const ac = document.getElementById('app-container');
  if (ac) ac.style.display = 'none';
}
function showAppScreen() {
  const ws = document.getElementById('welcome-screen');
  if (ws) ws.style.display = 'none';
  const ah = document.getElementById('app-header');
  if (ah) ah.style.display = '';
  const ac = document.getElementById('app-container');
  if (ac) ac.style.display = '';
}
async function welcomeConnect() {
  const btn = document.getElementById('welcome-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Menyambungkan...'; }
  markWelcomed();

  // Auto-connect semua aplikasi (kalau URL sudah diisi di DEFAULT_URLS)
  if (DEFAULT_URLS.hpt) {
    localStorage.setItem('hpt_script_url', DEFAULT_URLS.hpt);
    localStorage.setItem('hpt_auth', 'true');
  }
  if (DEFAULT_URLS.pestisida) {
    localStorage.setItem('pestisida_script_url', DEFAULT_URLS.pestisida);
    localStorage.setItem('pestisida_auth', 'true');
  }
  if (DEFAULT_URLS.suhu) {
    localStorage.setItem('suhu_url', DEFAULT_URLS.suhu);
  }

  showAppScreen();
}

// ========== VERSION CHECK + AUTO UPDATE ==========
let _updateBtn = null;
function getUpdateBtn() {
  if (_updateBtn) return _updateBtn;
  _updateBtn = document.createElement('button');
  _updateBtn.id = 'globalUpdateBtn';
  _updateBtn.style.cssText = 'position:fixed;top:calc(10px + env(safe-area-inset-top));right:10px;z-index:9998;padding:8px 14px;background:#f59e0b;color:#fff;border:none;border-radius:99px;font-weight:700;font-size:12px;cursor:pointer;display:none;box-shadow:0 2px 10px rgba(0,0,0,0.25);';
  _updateBtn.onclick = manualUpdate;
  document.body.appendChild(_updateBtn);
  return _updateBtn;
}
async function checkVersion() {
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const remote = await res.json();
    const localVer = localStorage.getItem(APP_VERSION_KEY);
    const labelEl = document.getElementById('app-version-label');
    if (labelEl) labelEl.textContent = 'v' + (localVer || remote.version || '?');
    if (!localVer) { localStorage.setItem(APP_VERSION_KEY, remote.version); return; }
    if (localVer === remote.version) return;
    const btn = getUpdateBtn();
    btn.textContent = '🆕 Update v' + remote.version;
    btn.style.display = 'block';
  } catch (e) {}
}
async function performHardReset(newVersion) {
  if (newVersion) localStorage.setItem(APP_VERSION_KEY, newVersion);
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  setTimeout(() => { location.replace(location.pathname + '?v=' + Date.now()); }, 400);
}
async function manualUpdate() {
  const btn = getUpdateBtn();
  if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    const remote = await res.json();
    const localVer = localStorage.getItem(APP_VERSION_KEY);
    if (localVer === remote.version) {
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Update'; btn.style.display = 'none'; }
      return;
    }
    await performHardReset(remote.version);
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = '🔄 Update'; }
  }
}

// ========== SERVICE WORKER (didaftarkan sekali di sini untuk semua halaman) ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('SW gagal:', err));
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  checkVersion();
  setInterval(checkVersion, 30 * 60 * 1000);

  // Welcome hanya untuk halaman yang punya elemen #welcome-screen (index.html)
  if (document.getElementById('welcome-screen')) {
    if (isWelcomed()) showAppScreen();
    else showWelcomeScreen();
  }
});

window.addEventListener('online', () => checkVersion());
