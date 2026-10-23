// core.js — Welcome, Auto-Connect, Auto-Update
const DEFAULT_URLS = {
  hpt:       'https://script.google.com/macros/s/AKfycbyY2_2eqEiabNCRV2y1eCZ7DLHQIEKQNjZB7TvCR1IN0Qz737ltAsHvo4OImtXIU5WBFA/exec',
  pestisida: 'https://script.google.com/macros/s/AKfycbw08XF1H8bdZ6Oe_oI-F2cCsKxynCVNFs_51rhzEm2AlzeMqkfVApaxmhWBl_Syy7PQ/exec', // ← isi URL Apps Script PESTISIDA di sini
  suhu:      'https://script.google.com/macros/s/AKfycbzLqgDZHfeAjYZK88SupPa3LJs-39_8hsGDgzwmDRiiUdXUobhDUwVdqI1vYNpnd4EaxQ/exec'  // ← isi URL Apps Script SUHU di sini
};

const APP_VERSION_KEY = 'ipm_awb_app_version_v1';
const WELCOMED_KEY    = 'ipm_awb_welcomed_v1';

// AUTO-INJECT: Memasukkan URL ke localStorage secara paksa saat halaman dimuat
function autoInjectUrls() {
  if (DEFAULT_URLS.hpt && !localStorage.getItem('hpt_script_url')) {
    localStorage.setItem('hpt_script_url', DEFAULT_URLS.hpt);
    localStorage.setItem('hpt_auth', 'true');
  }
  if (DEFAULT_URLS.pestisida && !localStorage.getItem('pestisida_script_url')) {
    localStorage.setItem('pestisida_script_url', DEFAULT_URLS.pestisida);
    localStorage.setItem('pestisida_auth', 'true');
  }
  if (DEFAULT_URLS.suhu && !localStorage.getItem('suhu_url')) {
    localStorage.setItem('suhu_url', DEFAULT_URLS.suhu);
  }
}

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
  autoInjectUrls(); // Panggil inject di sini juga
  showAppScreen();
}

// ========== UPDATE BUTTON ==========
let _updateBtn = null;
function getUpdateBtn() {
  if (_updateBtn) return _updateBtn;
  _updateBtn = document.createElement('button');
  _updateBtn.id = 'globalUpdateBtn';
  _updateBtn.style.cssText = 'position:fixed;top:calc(10px + env(safe-area-inset-top));right:10px;z-index:9998;padding:8px 14px;background:#9ca3af;color:#fff;border:none;border-radius:99px;font-weight:700;font-size:12px;cursor:pointer;display:block;box-shadow:0 2px 10px rgba(0,0,0,0.25);transition:0.3s;';
  _updateBtn.onclick = manualUpdate;
  _updateBtn.textContent = '🔄 Update';
  document.body.appendChild(_updateBtn);
  return _updateBtn;
}

async function checkVersion() {
  const btn = getUpdateBtn();
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const remote = await res.json();
    const localVer = localStorage.getItem(APP_VERSION_KEY);
    const labelEl = document.getElementById('app-version-label');
    if (labelEl) labelEl.textContent = 'v' + (localVer || remote.version || '?');
    
    if (!localVer) { localStorage.setItem(APP_VERSION_KEY, remote.version); return; }
    
    if (localVer === remote.version) {
      btn.textContent = '🔄 Update';
      btn.style.background = '#9ca3af';
      btn.disabled = false;
    } else {
      btn.textContent = '🆕 v' + remote.version;
      btn.style.background = '#f59e0b';
      btn.disabled = false;
    }
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
  btn.disabled = true; btn.textContent = '⏳...';
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    const remote = await res.json();
    const localVer = localStorage.getItem(APP_VERSION_KEY);
    if (localVer === remote.version) {
      btn.disabled = false; btn.textContent = '🔄 Update'; btn.style.background = '#9ca3af';
      return;
    }
    await performHardReset(remote.version);
  } catch (e) {
    btn.disabled = false; btn.textContent = '🔄 Update';
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('SW gagal:', err));
}

window.addEventListener('online', () => {
  window.dispatchEvent(new Event('app-online'));
  checkVersion();
});

document.addEventListener('DOMContentLoaded', () => {
  autoInjectUrls(); // Pastikan URL terisi otomatis saat dibuka
  checkVersion();
  setInterval(checkVersion, 30 * 60 * 1000);

  if (document.getElementById('welcome-screen')) {
    if (isWelcomed()) showAppScreen();
    else showWelcomeScreen();
  }
});
