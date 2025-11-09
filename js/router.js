import { viewDashboard } from './dashboard.js';
import { viewEntreprise } from './entreprise.js';
import { viewEmploye } from './employe.js';
import { viewIllegale } from './illegale.js';
import { viewGestionGenerale } from './gestion-generale.js';
import { viewAuth } from './auth.js';
import { isAuthenticated, checkPermission, alertModal } from './utils.js';
import { viewHome } from './home.js';
import { viewProfile } from './profile.js';
import { viewPublicHome } from './public/home.js';
import { viewPublicVehicules } from './public/vehicules.js';
import { viewPublicLogin } from './public/login.js';

const app = document.getElementById('app');

// Mapping des routes vers les permissions
const routePermissions = {
  '#/entreprise': 'entreprise',
  '#/entreprise/employes': 'employes',
  '#/entreprise/ventes': 'ventes',
  '#/entreprise/finance': 'finance',
  '#/entreprise/flotte': 'entreprise',
  '#/entreprise/calcul': 'entreprise',
  '#/entreprise/logs': 'logs',
};

const routes = {
  '#/': () => location.replace('#/public'),
  '#/public': () => viewPublicHome(app),
  '#/public/vehicules': () => viewPublicVehicules(app),
  '#/public/login': () => viewPublicLogin(app),
  '#/home': () => requireAuth(viewHome),
  '#/dashboard': () => requireAuth(viewDashboard),
  '#/entreprise': () => requireAuthWithPermission(viewEntreprise, 'entreprise'),
  '#/employe': () => requireAuthWithPermission(viewEmploye, 'employe'),
  '#/illegale': () => requireAuthWithPermission(viewIllegale, 'illegale'),
  '#/gestion-generale': () => requireAuthWithPermission(viewGestionGenerale, 'gestion-generale'),
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
  
  // Routes publiques (pas d'authentification requise)
  if (key.startsWith('#/public')) {
    const route = routes[key];
    if (typeof route === 'function') {
      await route();
    } else {
      // Route publique par défaut
      location.replace('#/public');
    }
    return;
  }
  
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
    else if (key.includes('/ventes')) permission = 'ventes';
    else if (key.includes('/finance')) permission = 'finance';
    else if (key.includes('/flotte')) permission = 'flotte';
    else if (key.includes('/calcul')) permission = 'calcul';
    else if (key.includes('/calculatrice')) permission = 'calculatrice';
    else if (key.includes('/logs')) permission = 'logs';
    
    // Vérifier d'abord l'accès à l'espace, puis la permission spécifique de la page
    const hasPagePermission = await checkPermission(permission);
    if (!hasPagePermission) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à cette page.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
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
      const hasEmployeAccess = await checkPermission('employe');
      if (!hasEmployeAccess) {
        alertModal({
          title: 'Accès refusé',
          message: 'Vous n\'avez pas la permission d\'accéder à l\'Espace Employé.',
          type: 'warning'
        });
        location.hash = '#/home';
        return;
      }
      viewProfile(app, 'employe');
      return;
    }
    
    // Vérifier l'accès à l'espace Employé
    const hasEmployeAccess = await checkPermission('employe');
    if (!hasEmployeAccess) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à l\'Espace Employé.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    // Vérifier la permission spécifique à la page
    let permission = 'employe';
    if (key.includes('/ventes') || key === '#/employe') permission = 'employe-ventes';
    else if (key.includes('/flotte')) permission = 'employe-flotte';
    else if (key.includes('/calcul')) permission = 'employe-calcul';
    else if (key.includes('/calculatrice')) permission = 'employe-calculatrice';
    
    const hasPagePermission = await checkPermission(permission);
    if (!hasPagePermission) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à cette page.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    await requireAuthWithPermission(viewEmploye, permission);
    return;
  }
  
  if (key.startsWith('#/illegale')) {
    if (key === '#/illegale/profile') {
      if (!isAuthenticated()) {
        location.hash = '#/auth';
        return;
      }
      const hasIllegaleAccess = await checkPermission('illegale');
      if (!hasIllegaleAccess) {
        alertModal({
          title: 'Accès refusé',
          message: 'Vous n\'avez pas la permission d\'accéder à l\'Espace Illégale.',
          type: 'warning'
        });
        location.hash = '#/home';
        return;
      }
      viewProfile(app, 'illegale');
      return;
    }
    
    // Vérifier l'accès à l'espace Illégale
    const hasIllegaleAccess = await checkPermission('illegale');
    if (!hasIllegaleAccess) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à l\'Espace Illégale.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    // Vérifier la permission spécifique à la page
    let permission = 'illegale-points';
    if (key.includes('/points') || key === '#/illegale') permission = 'illegale-points';
    else if (key.includes('/armes')) permission = 'illegale-armes';
    else if (key.includes('/gestion-points')) permission = 'illegale-gestion-points';
    else if (key.includes('/gestion-armes')) permission = 'illegale-gestion-armes';
    
    const hasPagePermission = await checkPermission(permission);
    if (!hasPagePermission) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à cette page.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    await requireAuthWithPermission(viewIllegale, permission);
    return;
  }
  
  if (key.startsWith('#/gestion-generale')) {
    if (key === '#/gestion-generale/profile') {
      if (!isAuthenticated()) {
        location.hash = '#/auth';
        return;
      }
      const hasGestionAccess = await checkPermission('gestion-generale');
      if (!hasGestionAccess) {
        alertModal({
          title: 'Accès refusé',
          message: 'Vous n\'avez pas la permission d\'accéder à la Gestion Générale.',
          type: 'warning'
        });
        location.hash = '#/home';
        return;
      }
      viewProfile(app, 'gestion-generale');
      return;
    }
    
    // Vérifier l'accès à l'espace Gestion Générale
    const hasGestionAccess = await checkPermission('gestion-generale');
    if (!hasGestionAccess) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à la Gestion Générale.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    // Vérifier la permission spécifique à la page
    let permission = 'gestion-generale-utilisateurs';
    if (key === '#/gestion-generale' || key.includes('/utilisateurs')) permission = 'gestion-generale-utilisateurs';
    else if (key.includes('/roles')) permission = 'gestion-generale-roles';
    
    const hasPagePermission = await checkPermission(permission);
    if (!hasPagePermission) {
      alertModal({
        title: 'Accès refusé',
        message: 'Vous n\'avez pas la permission d\'accéder à cette page.',
        type: 'warning'
      });
      location.hash = '#/home';
      return;
    }
    
    await requireAuthWithPermission(viewGestionGenerale, permission);
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


