import { initRouter } from './router.js';
import { initAuthGuard, loadUserProfile, isAuthenticated } from './utils.js';
import { initFirebaseIfReady } from './firebase.js';
import { getFirebase, signOut } from './firebase.js';

// Thème
const btnTheme = document.getElementById('btn-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;

function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

function loadTheme() {
  const t = localStorage.getItem('theme');
  if (t) return applyTheme(t);
  applyTheme(prefersDark.matches ? 'dark' : 'light');
}

btnTheme?.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});

document.getElementById('year').textContent = String(new Date().getFullYear());

function updateNavByAuth() {
  const isAuth = Boolean(JSON.parse(localStorage.getItem('ms_auth_state') || 'null'));
  const btnLogout = document.getElementById('btn-logout');
  const btnTheme = document.getElementById('btn-theme');
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const isAuthPage = location.hash === '#/auth' || location.hash === '';
  
  if (isAuth) {
    btnLogout?.classList.remove('hidden');
    btnTheme?.classList.remove('hidden');
    header?.classList.add('hidden');
    footer?.classList.add('hidden');
  } else {
    btnLogout?.classList.add('hidden');
    btnTheme?.classList.add('hidden');
    if (isAuthPage) {
      header?.classList.add('hidden');
      footer?.classList.remove('hidden');
    } else {
      header?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    }
  }
}

// Déconnexion - attaché après chargement DOM
function setupLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) {
    setTimeout(setupLogout, 100);
    return;
  }
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const fb = getFirebase();
    const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
    try {
      if (fb && authState?.uid) {
        const mod = await import('./firebase.js');
        try { await mod.addDoc(mod.collection(fb.db, 'logs'), { type: 'logout', uid: authState.uid, message: 'Déconnexion', createdAt: mod.serverTimestamp() }); } catch {}
      }
      if (fb && fb.auth) await signOut(fb.auth);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
    localStorage.removeItem('ms_auth_state');
    updateNavByAuth();
    location.hash = '#/auth';
  });
}
setupLogout();

// Initialisation
loadTheme();
initFirebaseIfReady();
initAuthGuard();
initRouter();

updateNavByAuth();
// Charger le profil au démarrage si l'utilisateur est déjà connecté
(async () => {
  if (isAuthenticated()) {
    await loadUserProfile();
  }
})();

window.addEventListener('auth:changed', updateNavByAuth);
window.addEventListener('hashchange', updateNavByAuth);
window.addEventListener('auth:changed', async (e) => {
  if (e.detail.user) {
    await loadUserProfile();
    if (location.hash === '#/auth' || !location.hash || location.hash === '#/') {
      location.hash = '#/home';
    }
  } else {
    localStorage.removeItem('ms_user_profile');
    location.hash = '#/auth';
  }
});


