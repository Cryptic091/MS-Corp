export function html(strings, ...values) {
  const str = String.raw({ raw: strings }, ...values);
  const tpl = document.createElement('template');
  tpl.innerHTML = str.trim();
  return tpl.content;
}

export function mount(el, content) {
  el.innerHTML = '';
  el.appendChild(content);
}

export function isAuthenticated() {
  try {
    const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
    return Boolean(authState && authState.uid);
  } catch {
    return false;
  }
}

export function setAuthState(user) {
  if (!user) localStorage.removeItem('ms_auth_state');
  else localStorage.setItem('ms_auth_state', JSON.stringify(user));
}

import { onAuthStateChanged, getFirebase, getDoc, doc, setDoc, updateDoc, collection, getDocs, query, where } from './firebase.js';

export function initAuthGuard() {
  const fb = getFirebase();
  if (!fb || !fb.auth) return;
  onAuthStateChanged(fb.auth, (user) => {
    if (user) setAuthState({ uid: user.uid, email: user.email || '' });
    else setAuthState(null);
    // Notifie l'application pour mettre à jour la navigation
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user } }));
  });
}

export async function loadUserProfile() {
  const fb = getFirebase();
  const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
  if (!fb || !fb.db || !authState?.uid) return null;
  try {
    const snap = await getDoc(doc(fb.db, 'users', authState.uid));
    if (!snap.exists()) {
      // Si le document n'existe pas, créer un document minimal
      const email = authState.email || '';
      const defaultProfile = {
        email,
        role: 'employe',
        active: true,
        name: email.split('@')[0] || 'Utilisateur'
      };
      try {
        await setDoc(doc(fb.db, 'users', authState.uid), defaultProfile, { merge: true });
        localStorage.setItem('ms_user_profile', JSON.stringify(defaultProfile));
        return defaultProfile;
      } catch (e) {
        console.error('Erreur création profil:', e);
        return null;
      }
    }
    const profile = snap.data();
    let needsUpdate = false;
    // S'assurer que le profil a au moins un email
    if (!profile.email && authState.email) {
      profile.email = authState.email;
      needsUpdate = true;
    }
    // Si pas de nom, utiliser l'email comme nom
    if (!profile.name && profile.email) {
      profile.name = profile.email.split('@')[0];
      needsUpdate = true;
    }
    if (profile.photoUrl === undefined) {
      profile.photoUrl = null;
      needsUpdate = true;
    }
    if (profile.photoPath === undefined) {
      profile.photoPath = null;
      needsUpdate = true;
    }
    if (needsUpdate) {
      try {
        await updateDoc(doc(fb.db, 'users', authState.uid), {
          email: profile.email || null,
          name: profile.name || null,
          photoUrl: profile.photoUrl,
          photoPath: profile.photoPath
        });
      } catch (e) {
        console.warn('Impossible de synchroniser les champs du profil:', e);
      }
    }
    localStorage.setItem('ms_user_profile', JSON.stringify(profile));
    // Déclencher un événement pour mettre à jour les badges de rôle
    window.dispatchEvent(new CustomEvent('profile:updated', { detail: { profile } }));
    return profile;
  } catch (e) {
    console.error('Erreur chargement profil:', e);
    return null;
  }
}

export function getCachedProfile() {
  try { return JSON.parse(localStorage.getItem('ms_user_profile') || 'null'); }
  catch { return null; }
}

// Fonction pour obtenir le nom d'affichage du rôle depuis Firestore
export async function getRoleDisplayName(roleValue) {
  if (!roleValue) return 'Employé';
  
  try {
    const fb = getFirebase();
    if (!fb || !fb.db) {
      // Fallback si Firebase n'est pas disponible
      return roleValue === 'admin' ? 'Administrateur' : 'Employé';
    }
    
    // Convertir le rôle en nom Firestore
    let roleName = roleValue;
    if (roleName === 'admin') roleName = 'Admin';
    else if (roleName === 'employe') roleName = 'Employé';
    
    // Récupérer tous les rôles et trouver celui qui correspond
    const allRoles = await getDocs(collection(fb.db, 'roles'));
    const matchingRole = allRoles.docs.find(doc => {
      const docRoleName = doc.data().name || '';
      return docRoleName.toLowerCase() === roleName.toLowerCase();
    });
    
    if (matchingRole) {
      return matchingRole.data().name || roleName;
    }
    
    // Fallback si le rôle n'est pas trouvé
    return roleValue === 'admin' ? 'Administrateur' : 'Employé';
  } catch (e) {
    console.error('Erreur récupération nom rôle:', e);
    return roleValue === 'admin' ? 'Administrateur' : 'Employé';
  }
}

// Fonction pour mettre à jour le badge de rôle dans la sidebar
export async function updateRoleBadge(badgeElement) {
  if (!badgeElement) return;
  
  try {
    let profile = getCachedProfile();
    if (!profile || !profile.role) {
      // Recharger le profil si nécessaire
      profile = await loadUserProfile() || {};
    }
    
    const roleValue = profile.role || 'employe';
    const roleDisplayName = await getRoleDisplayName(roleValue);
    const badgeClass = roleValue === 'admin' ? 'badge-admin' : 'badge-employe';
    
    badgeElement.textContent = roleDisplayName;
    badgeElement.className = `badge-role ${badgeClass} mt-2 inline-block text-xs`;
  } catch (e) {
    console.error('Erreur mise à jour badge rôle:', e);
  }
}

export function hasRole(role) {
  const p = getCachedProfile();
  if (!p) return false;
  if (Array.isArray(p.roles)) return p.roles.includes(role);
  return p.role === role;
}

// Fonction pour vérifier rapidement les permissions stockées dans le DOM
export function hasStoredPermission(action) {
  try {
    const storedPerms = document.body.getAttribute('data-page-permissions');
    if (storedPerms) {
      const checks = JSON.parse(storedPerms);
      return checks[action] === true;
    }
  } catch (e) {
    // Ignorer les erreurs
  }
  return false;
}

export async function checkPermission(permission) {
  try {
    const fb = getFirebase();
    if (!fb || !fb.db) return false;
    
    const profile = getCachedProfile();
    if (!profile) return false;
    
    // Déterminer quel rôle utiliser selon la permission demandée
    let roleValue = null;
    
    // Mapping des permissions vers les espaces et leurs rôles correspondants
    const permissionToSpace = {
      // Permissions d'accès aux espaces
      'entreprise': 'roleEntreprise',
      'employe': 'roleEmploye',
      'illegale': 'roleIllegale',
      'gestion-generale': 'roleGestionGenerale',
      // Permissions de l'espace Entreprise
      'employes': 'roleEntreprise',
      'ventes': 'roleEntreprise',
      'finance': 'roleEntreprise',
      'flotte': 'roleEntreprise',
      'calcul': 'roleEntreprise',
      'calculatrice': 'roleEntreprise',
      'logs': 'roleEntreprise',
      // Permissions de l'espace Employé
      'employe-ventes': 'roleEmploye',
      'employe-flotte': 'roleEmploye',
      'employe-calcul': 'roleEmploye',
      'employe-calculatrice': 'roleEmploye',
      // Permissions de l'espace Illégale
      'illegale-points': 'roleIllegale',
      'illegale-armes': 'roleIllegale',
      'illegale-gestion-points': 'roleIllegale',
      'illegale-gestion-armes': 'roleIllegale',
      // Permissions de l'espace Gestion Générale
      'gestion-generale-utilisateurs': 'roleGestionGenerale',
      'gestion-generale-roles': 'roleGestionGenerale',
    };
    
    // Récupérer le rôle correspondant à la permission
    const roleField = permissionToSpace[permission];
    if (roleField) {
      roleValue = profile[roleField];
    } else {
      // Fallback : utiliser le rôle par défaut si la permission n'est pas mappée
      roleValue = profile.role || profile.roleEmploye || 'employe';
    }
    
    // Pour les permissions d'accès aux espaces (entreprise, employe, illegale, gestion-generale),
    // une chaîne vide "" ou un rôle non-null signifie que l'utilisateur a accès à l'espace
    // Pour les autres permissions (employes, ventes, etc.), un rôle est requis
    const isSpaceAccessPermission = ['entreprise', 'employe', 'illegale', 'gestion-generale'].includes(permission);
    
    if (isSpaceAccessPermission) {
      // Pour l'accès aux espaces : si le champ existe et n'est pas null, l'utilisateur a accès
      // Une chaîne vide "" signifie accès sans rôle spécifique, mais l'accès est autorisé
      if (roleValue === null || roleValue === undefined) {
        return false;
      }
      // Si roleValue est une chaîne vide "", l'utilisateur a accès mais sans rôle spécifique
      // Dans ce cas, on retourne true pour l'accès à l'espace
      if (roleValue === "") {
        return true;
      }
    } else {
      // Pour les permissions internes aux espaces, un rôle valide est requis
      if (!roleValue || roleValue === "" || roleValue === null || roleValue === undefined) {
        return false;
      }
    }
    
    let roleData = null;
    
    // Vérifier si roleValue est un ID (longue chaîne aléatoire) ou un nom
    // Les IDs Firestore font généralement 20 caractères, les noms sont plus courts
    if (roleValue.length > 15 && !roleValue.includes(' ')) {
      // C'est probablement un ID, récupérer directement par ID
      try {
        const roleDoc = await getDoc(doc(fb.db, 'roles', roleValue));
        if (roleDoc.exists()) {
          roleData = roleDoc.data();
        }
      } catch (e) {
        console.warn('Erreur récupération rôle par ID:', e);
      }
    }
    
    // Si ce n'est pas un ID ou si la récupération par ID a échoué, essayer par nom
    if (!roleData) {
      let roleName = roleValue;
      
      // Si le rôle est 'admin' ou 'employe', convertir en nom Firestore
      // Sinon, utiliser le rôle tel quel (pour les rôles personnalisés)
      if (roleName === 'admin') {
        roleName = 'Admin';
      } else if (roleName === 'employe') {
        roleName = 'Employé';
      }
      
      // Récupérer le rôle depuis Firestore (chercher par nom, insensible à la casse)
      const rolesQuery = query(collection(fb.db, 'roles'), where('name', '==', roleName));
      const rolesDocs = await getDocs(rolesQuery);
      
      if (!rolesDocs.empty) {
        roleData = rolesDocs.docs[0].data();
      } else {
        // Si aucun rôle trouvé avec le nom exact, essayer avec le nom en minuscules
        // pour gérer les cas où le rôle est stocké différemment
        const allRoles = await getDocs(collection(fb.db, 'roles'));
        const matchingRole = allRoles.docs.find(doc => {
          const docRoleName = doc.data().name || '';
          return docRoleName.toLowerCase() === roleName.toLowerCase();
        });
        
        if (matchingRole) {
          roleData = matchingRole.data();
        } else {
          console.warn(`Rôle "${roleName}" non trouvé dans Firestore`);
          return false;
        }
      }
    }
    
    // Vérifier la permission dans le rôle
    // Pour les permissions d'accès aux espaces (entreprise, employe, illegale, gestion-generale),
    // on vérifie directement dans permissions
    // Pour les permissions internes aux espaces (employes, roles, ventes, etc.),
    // elles sont également dans permissions mais gérées par les rôles de l'espace concerné
    return Boolean(roleData?.permissions?.[permission]);
  } catch (e) {
    console.error('Erreur vérification permission:', e);
    return false;
  }
}

export function formatDate(ts) {
  try {
    if (!ts) return '—';
    let date;
    if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts?.toDate === 'function') {
      date = ts.toDate();
    } else if (typeof ts === 'number' || typeof ts === 'string') {
      date = new Date(ts);
    } else {
      return '—';
    }
    if (!date || Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('fr-FR');
  } catch {
    return '—';
  }
}

// Fonction pour masquer les liens de navigation selon les permissions
export async function updateNavPermissions() {
  try {
    // Vérifier toutes les permissions nécessaires
    const hasEntreprise = await checkPermission('entreprise');
    const hasEmployes = await checkPermission('employes');
    const hasVentes = await checkPermission('ventes');
    const hasFinance = await checkPermission('finance');
    const hasFlotte = await checkPermission('flotte');
    const hasCalcul = await checkPermission('calcul');
    const hasCalculatrice = await checkPermission('calculatrice');
    const hasLogs = await checkPermission('logs');
    
    // Permissions Espace Employé
    const hasEmploye = await checkPermission('employe');
    const hasEmployeVentes = await checkPermission('employe-ventes');
    const hasEmployeFlotte = await checkPermission('employe-flotte');
    const hasEmployeCalcul = await checkPermission('employe-calcul');
    const hasEmployeCalculatrice = await checkPermission('employe-calculatrice');
    
    // Permissions Espace Illégale
    const hasIllegale = await checkPermission('illegale');
    const hasIllegalePoints = await checkPermission('illegale-points');
    const hasIllegaleArmes = await checkPermission('illegale-armes');
    const hasIllegaleGestionPoints = await checkPermission('illegale-gestion-points');
    const hasIllegaleGestionArmes = await checkPermission('illegale-gestion-armes');
    
    // Permissions Espace Gestion Générale
    const hasGestionGenerale = await checkPermission('gestion-generale');
    const hasGestionGeneraleUtilisateurs = await checkPermission('gestion-generale-utilisateurs');
    const hasGestionGeneraleRoles = await checkPermission('gestion-generale-roles');
    
    // Masquer les liens de navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Navigation Espace Entreprise
      if (href === '#/entreprise' || href === '#/entreprise/employes') {
        link.style.display = (hasEntreprise && hasEmployes) ? '' : 'none';
      } else if (href === '#/entreprise/ventes') {
        link.style.display = (hasEntreprise && hasVentes) ? '' : 'none';
      } else if (href === '#/entreprise/finance') {
        link.style.display = (hasEntreprise && hasFinance) ? '' : 'none';
      } else if (href === '#/entreprise/flotte') {
        link.style.display = (hasEntreprise && hasFlotte) ? '' : 'none';
      } else if (href === '#/entreprise/calcul') {
        link.style.display = (hasEntreprise && hasCalcul) ? '' : 'none';
      } else if (href === '#/entreprise/calculatrice') {
        link.style.display = (hasEntreprise && hasCalculatrice) ? '' : 'none';
      } else if (href === '#/entreprise/logs') {
        link.style.display = (hasEntreprise && hasLogs) ? '' : 'none';
      }
      // Navigation Espace Employé
      else if (href === '#/employe' || href === '#/employe/ventes') {
        link.style.display = (hasEmploye && hasEmployeVentes) ? '' : 'none';
      } else if (href === '#/employe/flotte') {
        link.style.display = (hasEmploye && hasEmployeFlotte) ? '' : 'none';
      } else if (href === '#/employe/calcul') {
        link.style.display = (hasEmploye && hasEmployeCalcul) ? '' : 'none';
      } else if (href === '#/employe/calculatrice') {
        link.style.display = (hasEmploye && hasEmployeCalculatrice) ? '' : 'none';
      }
      // Navigation Espace Illégale
      else if (href === '#/illegale' || href === '#/illegale/points') {
        link.style.display = (hasIllegale && hasIllegalePoints) ? '' : 'none';
      } else if (href === '#/illegale/armes') {
        link.style.display = (hasIllegale && hasIllegaleArmes) ? '' : 'none';
      } else if (href === '#/illegale/gestion-points') {
        link.style.display = (hasIllegale && hasIllegaleGestionPoints) ? '' : 'none';
      } else if (href === '#/illegale/gestion-armes') {
        link.style.display = (hasIllegale && hasIllegaleGestionArmes) ? '' : 'none';
      }
      // Navigation Espace Gestion Générale
      else if (href === '#/gestion-generale' || href === '#/gestion-generale/utilisateurs') {
        link.style.display = (hasGestionGenerale && hasGestionGeneraleUtilisateurs) ? '' : 'none';
      } else if (href === '#/gestion-generale/roles') {
        link.style.display = (hasGestionGenerale && hasGestionGeneraleRoles) ? '' : 'none';
      }
    });
  } catch (e) {
    console.error('Erreur mise à jour permissions navigation:', e);
  }
}

// Fonction pour appliquer les permissions dans les pages
// Masque/affiche les éléments selon les permissions de l'utilisateur
export async function applyPagePermissions(permissions) {
  try {
    // permissions est un objet avec les clés suivantes :
    // - create: permission pour créer (ex: 'employes', 'ventes')
    // - edit: permission pour modifier
    // - delete: permission pour supprimer
    // - view: permission pour voir (optionnel, par défaut true si on a accès à la page)
    
    const checks = {};
    
    // Vérifier chaque permission
    for (const [action, permission] of Object.entries(permissions)) {
      if (permission) {
        checks[action] = await checkPermission(permission);
      }
    }
    
    // Masquer/afficher les boutons de création
    if (permissions.create !== undefined) {
      const createSelectors = [
        '[data-permission="create"]',
        '#btn-new-user',
        '#btn-new-vente',
        '#btn-new-vente-points',
        '#btn-new-vente-armes',
        '#btn-new-points-illegaux',
        'button[id*="new"]',
        'button[id*="create"]',
        'button:has-text("Nouveau")',
        'button:has-text("Créer")'
      ];
      
      createSelectors.forEach(selector => {
        try {
          const buttons = document.querySelectorAll(selector);
          buttons.forEach(btn => {
            if (checks.create === false) {
              btn.style.display = 'none';
              btn.disabled = true;
            } else {
              btn.style.display = '';
              btn.disabled = false;
            }
          });
        } catch (e) {
          // Ignorer les sélecteurs invalides
        }
      });
    }
    
    // Masquer/afficher les boutons d'édition
    if (permissions.edit !== undefined) {
      const editSelectors = [
        '[data-permission="edit"]',
        '.btn-edit',
        'button.btn-edit',
        'button[id*="edit"]',
        'button:has-text("Modifier")'
      ];
      
      editSelectors.forEach(selector => {
        try {
          const buttons = document.querySelectorAll(selector);
          buttons.forEach(btn => {
            if (checks.edit === false) {
              btn.style.display = 'none';
              btn.disabled = true;
            } else {
              btn.style.display = '';
              btn.disabled = false;
            }
          });
        } catch (e) {
          // Ignorer les sélecteurs invalides
        }
      });
    }
    
    // Masquer/afficher les boutons de suppression
    if (permissions.delete !== undefined) {
      const deleteSelectors = [
        '[data-permission="delete"]',
        '.btn-delete',
        'button.btn-delete',
        'button[id*="delete"]',
        'button:has-text("Supprimer")'
      ];
      
      deleteSelectors.forEach(selector => {
        try {
          const buttons = document.querySelectorAll(selector);
          buttons.forEach(btn => {
            if (checks.delete === false) {
              btn.style.display = 'none';
              btn.disabled = true;
            } else {
              btn.style.display = '';
              btn.disabled = false;
            }
          });
        } catch (e) {
          // Ignorer les sélecteurs invalides
        }
      });
    }
    
    // Masquer/afficher les colonnes d'actions si aucune action n'est disponible
    const hasAnyAction = (permissions.create && checks.create) || 
                        (permissions.edit && checks.edit) || 
                        (permissions.delete && checks.delete);
    
    if (!hasAnyAction && (permissions.create || permissions.edit || permissions.delete)) {
      // Masquer la colonne Actions dans les tableaux
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const headers = table.querySelectorAll('thead th');
        headers.forEach((th, index) => {
          if (th.textContent.trim().toUpperCase().includes('ACTION')) {
            th.style.display = 'none';
            // Masquer aussi les cellules correspondantes
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
              const cells = row.querySelectorAll('td');
              if (cells[index]) {
                cells[index].style.display = 'none';
              }
            });
          }
        });
      });
    }
    
    // Stocker les permissions dans le DOM pour les utiliser lors de la création dynamique d'éléments
    document.body.setAttribute('data-page-permissions', JSON.stringify(checks));
    
    // Créer un observer pour réappliquer les permissions quand de nouveaux éléments sont ajoutés au DOM
    if (!window.pagePermissionsObserver) {
      window.pagePermissionsObserver = new MutationObserver(() => {
        // Réappliquer les permissions après un court délai pour éviter trop d'appels
        if (window.pagePermissionsTimeout) {
          clearTimeout(window.pagePermissionsTimeout);
        }
        window.pagePermissionsTimeout = setTimeout(() => {
          const storedPerms = document.body.getAttribute('data-page-permissions');
          if (storedPerms) {
            try {
              const checks = JSON.parse(storedPerms);
              // Réappliquer les permissions sur les nouveaux éléments
              if (checks.create === false) {
                document.querySelectorAll('.btn-edit, button[id*="new"], button[id*="create"]').forEach(btn => {
                  if (!btn.closest('.modal-overlay')) {
                    btn.style.display = 'none';
                    btn.disabled = true;
                  }
                });
              }
              if (checks.edit === false) {
                document.querySelectorAll('.btn-edit, button[id*="edit"]').forEach(btn => {
                  if (!btn.closest('.modal-overlay')) {
                    btn.style.display = 'none';
                    btn.disabled = true;
                  }
                });
              }
              if (checks.delete === false) {
                document.querySelectorAll('.btn-delete, button[id*="delete"]').forEach(btn => {
                  if (!btn.closest('.modal-overlay')) {
                    btn.style.display = 'none';
                    btn.disabled = true;
                  }
                });
              }
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          }
        }, 100);
      });
      
      window.pagePermissionsObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    return checks;
  } catch (e) {
    console.error('Erreur application permissions page:', e);
    return {};
  }
}

function removeExistingOverlays() {
  document.querySelectorAll('.modal-overlay').forEach(el => {
    if (el && el.parentNode) {
      el.remove();
    }
  });
}

// Modal system
export function createModal({ title, body, onConfirm, onCancel, confirmText = 'Enregistrer', cancelText = 'Annuler', isView = false }) {
  removeExistingOverlays();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modalClass = isView ? 'modal view-modal' : 'modal';
  const bodyClass = isView ? 'modal-body view-body' : 'modal-body';
  const footerHTML = isView ? '' : `
    <div class="modal-footer">
      <button class="rounded px-3 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5" data-cancel>${cancelText}</button>
      <button class="btn-primary" data-confirm>${confirmText}</button>
    </div>
  `;
  overlay.innerHTML = `
    <div class="${modalClass}">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" data-close>
          <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
        </button>
      </div>
      <div class="${bodyClass}">${body}</div>
      ${footerHTML}
    </div>
  `;
  const close = () => {
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  };
  
  // Gérer le bouton de fermeture (X)
  const closeButtons = overlay.querySelectorAll('[data-close]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onCancel) onCancel();
      close();
    });
    const icon = btn.querySelector('.icon, svg');
    if (icon) {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onCancel) onCancel();
        close();
      });
    }
  });
  
  if (!isView) {
    const cancelBtn = overlay.querySelector('[data-cancel]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onCancel) onCancel();
        close();
      });
    }
    const confirmBtn = overlay.querySelector('[data-confirm]');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onConfirm) onConfirm();
        close();
      });
    }
  } else {
    // Pour les modals view, on peut avoir un bouton fermer dans le footer
    if (onConfirm) {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';
      footer.innerHTML = `<button class="btn-primary" data-close-view>${confirmText}</button>`;
      overlay.querySelector('.modal').appendChild(footer);
      const closeViewBtn = footer.querySelector('[data-close-view]');
      if (closeViewBtn) {
        closeViewBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onConfirm) onConfirm();
          close();
        });
      }
    }
  }
  
  // Fermer en cliquant sur l'overlay (mais pas sur le modal lui-même)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (onCancel) onCancel();
      close();
    }
  });
  
  // Empêcher la propagation depuis le modal lui-même
  const modal = overlay.querySelector('.modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  document.body.appendChild(overlay);
  return overlay;
}

// Modal de confirmation
export function confirmModal({ title, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler', type = 'warning' }) {
  removeExistingOverlays();
  const icons = {
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
  };
  const colors = {
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400'
  };
  const bgColors = {
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-green-50 dark:bg-green-900/20'
  };
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" data-close>
          <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
        </button>
      </div>
      <div class="modal-body">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 ${colors[type]} ${bgColors[type]} p-3 rounded-full">
            <span class="icon" style="width: 24px; height: 24px;">${icons[type]}</span>
          </div>
          <div class="flex-1 pt-1">
            <p class="text-slate-700 dark:text-slate-300">${message}</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="rounded px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors" data-cancel>${cancelText}</button>
        <button class="btn-primary px-4 py-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : type === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}" data-confirm>${confirmText}</button>
      </div>
    </div>
  `;
  const close = () => {
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  };
  
  // Gérer le bouton de fermeture (X)
  const closeButtons = overlay.querySelectorAll('[data-close]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onCancel) onCancel();
      close();
    });
    const icon = btn.querySelector('.icon, svg');
    if (icon) {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onCancel) onCancel();
        close();
      });
    }
  });
  
  const cancelBtn = overlay.querySelector('[data-cancel]');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onCancel) onCancel();
      close();
    });
  }
  
  const confirmBtn = overlay.querySelector('[data-confirm]');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onConfirm) onConfirm();
      close();
    });
  }
  
  // Fermer en cliquant sur l'overlay (mais pas sur le modal lui-même)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (onCancel) onCancel();
      close();
    }
  });
  
  // Empêcher la propagation depuis le modal lui-même
  const modal = overlay.querySelector('.modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  document.body.appendChild(overlay);
  return overlay;
}

// Modal d'alerte simple
export function alertModal({ title, message, type = 'info', onClose }) {
  removeExistingOverlays();
  const icons = {
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
  };
  const colors = {
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400'
  };
  const bgColors = {
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-green-50 dark:bg-green-900/20'
  };
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" data-close>
          <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
        </button>
      </div>
      <div class="modal-body">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 ${colors[type]} ${bgColors[type]} p-3 rounded-full">
            <span class="icon" style="width: 24px; height: 24px;">${icons[type]}</span>
          </div>
          <div class="flex-1 pt-1">
            <p class="text-slate-700 dark:text-slate-300">${message}</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary px-4 py-2 w-full" data-close>Fermer</button>
      </div>
    </div>
  `;
  const close = () => {
    if (onClose) onClose();
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  };
  
  // Gérer le bouton de fermeture (X)
  const closeButtons = overlay.querySelectorAll('[data-close]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
    const icon = btn.querySelector('.icon, svg');
    if (icon) {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });
    }
  });
  
  // Fermer en cliquant sur l'overlay (mais pas sur le modal lui-même)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });
  
  // Empêcher la propagation depuis le modal lui-même
  const modal = overlay.querySelector('.modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  document.body.appendChild(overlay);
  return overlay;
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function updateAvatar(element, profile) {
  if (!element) return;
  
  // Si l'utilisateur a une photo de profil, l'utiliser
  if (profile?.photoUrl) {
    element.style.backgroundImage = `url('${profile.photoUrl}')`;
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  element.textContent = '';
  } else {
    // Sinon, utiliser les initiales avec un gradient
    const name = profile?.name || profile?.email || 'MS';
    const initials = getInitials(name);
    element.style.backgroundImage = '';
    element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    element.textContent = initials;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.color = 'white';
    element.style.fontWeight = '600';
  }
}


