import { viewDashboard } from './dashboard.js';
import { viewEntreprise } from './entreprise.js';
import { viewEmploye } from './employe.js';
import { viewAuth } from './auth.js';
import { isAuthenticated, checkPermission, alertModal } from './utils.js';
import { viewHome } from './home.js';
import { viewProfile } from './profile.js';

const app = document.getElementById('app');

// Mapping des routes vers les permissions
const routePermissions = {
  '#/entreprise': 'entreprise',
  '#/entreprise/employes': 'employes',
  '#/entreprise/roles': 'roles',
  '#/entreprise/ventes': 'ventes',
  '#/entreprise/finance': 'finance',
  '#/entreprise/flotte': 'entreprise',
  '#/entreprise/calcul': 'entreprise',
  '#/entreprise/logs': 'logs',
};

const routes = {
  '#/': () => location.replace('#/home'),
  '#/home': () => requireAuth(viewHome),
  '#/dashboard': () => requireAuth(viewDashboard),
  '#/entreprise': () => requireAuthWithPermission(viewEntreprise, 'entreprise'),
  '#/employe': () => requireAuthWithPermission(viewEmploye, 'employe'),
  '#/auth': () => viewAuth(app),
};

async function requireAuthWithPermission(component, permission) {
  if (!isAuthenticated()) {
    location.hash = '#/auth';
    return;
  }
  const hasPermission = await checkPermission(permission);
  if (!hasPermission) {
    alertModal({
      title: 'Accès refusé',
      message: 'Vous n\'avez pas la permission d\'accéder à cette page.',
      type: 'warning'
    });
    location.hash = '#/home';
    return;
  }
  component(app);
}

function requireAuth(component, options = {}) {
  if (!isAuthenticated()) {
    location.hash = '#/auth';
    return;
  }
  component(app, options);
}

async function render() {
  const key = location.hash || '#/';
  
  // Vérifier les routes avec permissions
  if (key.startsWith('#/entreprise')) {
    // Le profil n'a pas besoin de permission spéciale, c'est le profil de l'utilisateur connecté
    if (key === '#/entreprise/profile') {
      if (!isAuthenticated()) {
        location.hash = '#/auth';
        return;
      }
      // Vérifier quand même l'accès à Gestion Entreprise pour afficher la sidebar
      const hasEntrepriseAccess = await checkPermission('entreprise');
      if (!hasEntrepriseAccess) {
        alertModal({
          title: 'Accès refusé',
          message: 'Vous n\'avez pas la permission d\'accéder à Gestion Entreprise.',
          type: 'warning'
        });
        location.hash = '#/home';
        return;
      }
      viewProfile(app, 'entreprise');
      return;
    }
    
    // D'abord vérifier l'accès à Gestion Entreprise
    const hasEntrepriseAccess = await checkPermission('entreprise');
    if (!hasEntrepriseAccess) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à Gestion Entreprise.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    // Ensuite vérifier la permission spécifique à la page
    let permission = 'entreprise';
    if (key.includes('/employes')) permission = 'employes';
    else if (key.includes('/roles')) permission = 'roles';
    else if (key.includes('/ventes')) permission = 'ventes';
    else if (key.includes('/finance')) permission = 'finance';
    else if (key.includes('/flotte')) permission = 'entreprise';
    else if (key.includes('/calcul')) permission = 'entreprise';
    else if (key.includes('/logs')) permission = 'logs';
    
    await requireAuthWithPermission(viewEntreprise, permission);
    return;
  }
  
  if (key.startsWith('#/employe')) {
    if (key === '#/employe/profile') {
      // Le profil n'a pas besoin de permission spéciale, c'est le profil de l'utilisateur connecté
      if (!isAuthenticated()) {
        location.hash = '#/auth';
        return;
      }
      viewProfile(app, 'employe');
      return;
    }
    await requireAuthWithPermission(viewEmploye, 'employe');
    return;
  }
  
  const route = routes[key] || routes['#/'];
  if (typeof route === 'function') {
    await route();
  } else {
    route();
  }
}

export function initRouter() {
  window.addEventListener('hashchange', render);
  render();
}


