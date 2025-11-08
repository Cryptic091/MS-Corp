import { initRouter } from './router.js';
import { initAuthGuard, loadUserProfile, isAuthenticated, updateRoleBadge } from './utils.js';
import { initFirebaseIfReady } from './firebase.js';
import { getFirebase, signOut } from './firebase.js';

// Thème - Forcer le thème sombre
document.documentElement.classList.add('dark');

document.getElementById('year').textContent = String(new Date().getFullYear());

function updateNavByAuth() {
  const isAuth = Boolean(JSON.parse(localStorage.getItem('ms_auth_state') || 'null'));
  const btnLogout = document.getElementById('btn-logout');
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const isAuthPage = location.hash === '#/auth' || location.hash === '';
  
  if (isAuth) {
    btnLogout?.classList.remove('hidden');
    header?.classList.add('hidden');
    footer?.classList.add('hidden');
  } else {
    btnLogout?.classList.add('hidden');
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
        try { 
          await mod.addLogEntry(fb, { 
            type: 'logout', 
            action: 'logout', 
            category: 'authentification',
            message: 'Déconnexion',
            uid: authState.uid
          }); 
        } catch {}
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

// Écouter les mises à jour de profil pour mettre à jour les badges de rôle
window.addEventListener('profile:updated', async () => {
  // Mettre à jour tous les badges de rôle dans les sidebars
  const roleBadges = document.querySelectorAll('#sb-role, #sb-role-calc');
  for (const badge of roleBadges) {
    await updateRoleBadge(badge);
  }
  
  // Mettre à jour le badge dans la card profile sur la page home
  const profileCardBadge = document.getElementById('profile-card-badge');
  if (profileCardBadge) {
    const { getCachedProfile, getRoleDisplayName } = await import('./utils.js');
    const profile = getCachedProfile();
    if (profile && profile.role) {
      const roleDisplayName = await getRoleDisplayName(profile.role);
      profileCardBadge.textContent = roleDisplayName;
    }
  }
});


