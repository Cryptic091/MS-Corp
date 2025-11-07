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

export function hasRole(role) {
  const p = getCachedProfile();
  if (!p) return false;
  if (Array.isArray(p.roles)) return p.roles.includes(role);
  return p.role === role;
}

export async function checkPermission(permission) {
  try {
    const fb = getFirebase();
    if (!fb || !fb.db) return false;
    
    const profile = getCachedProfile();
    if (!profile) return false;
    
    // Convertir le rôle du profil en nom de rôle Firestore
    let roleName = profile.role || 'employe';
    if (roleName === 'admin') roleName = 'Admin';
    else if (roleName === 'employe') roleName = 'Employé';
    
    // Récupérer le rôle depuis Firestore (chercher par nom)
    const rolesQuery = query(collection(fb.db, 'roles'), where('name', '==', roleName));
    const rolesDocs = await getDocs(rolesQuery);
    
    if (rolesDocs.empty) {
      // Si aucun rôle trouvé, pas d'accès
      return false;
    }
    
    const roleData = rolesDocs.docs[0].data();
    return Boolean(roleData.permissions?.[permission]);
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
    const hasEmployes = await checkPermission('employes');
    const hasRoles = await checkPermission('roles');
    const hasVentes = await checkPermission('ventes');
    const hasFinance = await checkPermission('finance');
    const hasLogs = await checkPermission('logs');
    
    // Masquer les liens de navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#/entreprise' || href === '#/entreprise/employes') {
        if (!hasEmployes) link.style.display = 'none';
        else link.style.display = '';
      } else if (href === '#/entreprise/roles') {
        if (!hasRoles) link.style.display = 'none';
        else link.style.display = '';
      } else if (href === '#/entreprise/ventes') {
        if (!hasVentes) link.style.display = 'none';
        else link.style.display = '';
      } else if (href === '#/entreprise/finance') {
        if (!hasFinance) link.style.display = 'none';
        else link.style.display = '';
      } else if (href === '#/entreprise/logs') {
        if (!hasLogs) link.style.display = 'none';
        else link.style.display = '';
      }
    });
  } catch (e) {
    console.error('Erreur mise à jour navigation:', e);
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
  element.style.backgroundImage = "url('images/MScorp.png')";
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  element.textContent = '';
}


