import { initRouter } from './router.js';
import { initAuthGuard, loadUserProfile, isAuthenticated, updateRoleBadge } from './utils.js';
import { initFirebaseIfReady } from './firebase.js';
import { getFirebase, signOut } from './firebase.js';

// Thème - Forcer le thème sombre
document.documentElement.classList.add('dark');

document.getElementById('year').textContent = String(new Date().getFullYear());

function updateNavByAuth() {
  const isAuth = Boolean(JSON.parse(localStorage.getItem('ms_auth_state') || 'null'));
  const btnLogoutNav = document.getElementById('btn-logout-nav');
  const publicNav = document.getElementById('public-nav');
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const logoLink = document.getElementById('header-logo-link');
  const navLogin = document.getElementById('nav-public-login');
  const navDashboard = document.getElementById('nav-dashboard');
  const isPublicPage = location.hash.startsWith('#/public');
  const isAuthPage = location.hash === '#/auth' || location.hash === '';
  
  // Mettre à jour le lien du logo
  if (logoLink) {
    if (isAuth && !isPublicPage) {
      logoLink.setAttribute('href', '#/home');
    } else {
      logoLink.setAttribute('href', '#/public');
    }
  }
  
  // Mettre à jour la navigation active pour les pages publiques
  if (isPublicPage && publicNav) {
    const navLinks = publicNav.querySelectorAll('a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (location.hash === href || (location.hash === '#/public' && href === '#/public')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  const app = document.getElementById('app');
  const htmlEl = document.documentElement;
  const bodyEl = document.body;
  
  if (isPublicPage) {
    // Pages publiques
    header?.classList.remove('hidden');
    footer?.classList.remove('hidden');
    publicNav?.classList.remove('hidden');
    
    // Permettre le scroll sur les pages publiques
    if (app) {
      app.classList.remove('overflow-hidden');
      app.style.overflow = 'visible';
    }
    if (htmlEl) {
      htmlEl.style.overflow = 'auto';
      htmlEl.style.height = 'auto';
    }
    if (bodyEl) {
      bodyEl.style.overflow = 'auto';
      bodyEl.style.height = 'auto';
    }
    
    // Afficher/masquer les éléments selon l'authentification
    if (isAuth) {
      navLogin?.classList.add('hidden');
      navDashboard?.classList.remove('hidden');
      btnLogoutNav?.classList.remove('hidden');
    } else {
      navLogin?.classList.remove('hidden');
      navDashboard?.classList.add('hidden');
      btnLogoutNav?.classList.add('hidden');
    }
  } else if (isAuth) {
    // Utilisateur connecté sur page privée : masquer header/footer
    header?.classList.add('hidden');
    footer?.classList.add('hidden');
    publicNav?.classList.add('hidden');
    
    if (app) {
      app.classList.add('overflow-hidden');
    }
  } else {
    // Page d'authentification classique
    if (isAuthPage) {
      header?.classList.add('hidden');
      footer?.classList.remove('hidden');
      publicNav?.classList.add('hidden');
      if (htmlEl) {
        htmlEl.style.overflow = 'auto';
        htmlEl.style.height = 'auto';
      }
      if (bodyEl) {
        bodyEl.style.overflow = 'auto';
        bodyEl.style.height = 'auto';
      }
    } else {
      header?.classList.remove('hidden');
      footer?.classList.remove('hidden');
      publicNav?.classList.remove('hidden');
      navLogin?.classList.remove('hidden');
      navDashboard?.classList.add('hidden');
      btnLogoutNav?.classList.add('hidden');
    }
  }
}

// Déconnexion - attaché après chargement DOM
function setupLogout() {
  const btnNav = document.getElementById('btn-logout-nav');
  
  if (!btnNav) {
    setTimeout(setupLogout, 100);
    return;
  }
  
  btnNav.addEventListener('click', async (e) => {
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
    location.hash = '#/public';
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


