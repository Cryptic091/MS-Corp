import { html, mount, getCachedProfile, loadUserProfile, formatDate, checkPermission, createModal, alertModal, confirmModal, getRoleDisplayName, updateAvatar } from './utils.js';
import { getFirebase, waitForFirebase, collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp, updateDoc, deleteDoc, ref, uploadBytes, getDownloadURL, deleteObject, addLogEntry } from './firebase.js';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Fonction pour formater les nombres avec espaces
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Fonction pour formater les montants
function formatAmount(num) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return integerPart + ',' + parts[1];
}

function extractStoragePath(url, userId) {
  if (!url) return null;
  try {
    const decoded = decodeURIComponent(url.split('/o/')[1]?.split('?')[0] || '');
    if (decoded.startsWith('profile-photos/')) return decoded;
    if (userId) {
      const filename = decoded.split('/').pop();
      return filename ? `profile-photos/${userId}/${filename}` : null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function viewProfile(root, context = 'entreprise') {
  const isEntreprise = context === 'entreprise';
  
  const content = html`
    <section class="fade-in">
      <div class="page-card" style="margin-left: 0;">
        <div class="page-head">
          <div>
            <div class="page-title">Mon Profil</div>
            <div class="page-sub">Informations personnelles et statistiques</div>
          </div>
          <div class="flex gap-2">
            <a href="#/home" class="home-card-link" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a href="#/public" class="rounded px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-sm flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Site Public
            </a>
            <a id="logout-link-profile" href="#/auth" class="rounded px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-sm">Déconnexion</a>
          </div>
        </div>

          <!-- Carte profil principale -->
          <div class="mb-6 p-6 rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
            <div class="flex items-start gap-6 flex-wrap">
              <div class="flex-shrink-0">
                <div id="profile-avatar" class="user-avatar w-24 h-24 text-3xl" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
              </div>
              <div class="flex-1 min-w-0">
                <div id="profile-name" class="text-2xl font-bold mb-1">—</div>
                <div id="profile-email" class="text-slate-600 dark:text-slate-400 mb-3">—</div>
                <div class="flex items-center gap-3 flex-wrap">
                  <div id="profile-role-badge" class="badge-role badge-employe">Employé</div>
                  <div id="profile-status-badge" class="badge-role badge-actif">Actif</div>
                </div>
                <div class="mt-4">
                  <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Accès aux Espaces</div>
                  <div id="profile-spaces-access" class="flex flex-wrap gap-2">
                    <!-- Les espaces accessibles seront injectés dynamiquement -->
                  </div>
                </div>
              </div>
              <div class="flex-shrink-0 text-right">
                <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Membre depuis</div>
                <div id="profile-created" class="font-medium">—</div>
              </div>
            </div>
          </div>

          <!-- Onglets -->
          <div class="tabs-container mb-6">
            <div class="tabs-list" id="profile-tabs-list">
              <!-- Les onglets seront injectés dynamiquement -->
            </div>
          </div>

          <!-- Contenu des onglets -->
          <div id="tab-employe" class="tab-content" style="display: none;">
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-4">Statistiques Employé</h3>
              <div class="stats-grid" id="profile-stats-employe">
                <!-- Les statistiques seront injectées dynamiquement -->
              </div>
            </div>

            <!-- Historique des ventes -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-4">Historique des ventes</h3>
              
              <!-- Ventes validées -->
              <div class="card mb-4">
                <div class="flex items-center gap-2 mb-4">
                  <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-blue-600 dark:text-blue-400">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <h4 class="font-semibold">Ventes validées</h4>
                </div>
                <div class="user-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type de ressource</th>
                        <th>Quantité</th>
                        <th>Montant</th>
                      </tr>
                    </thead>
                    <tbody id="profile-ventes-validees">
                      <tr><td class="py-3 text-center" colspan="4">Chargement…</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Ventes traitées -->
              <div class="card">
                <div class="flex items-center gap-2 mb-4">
                  <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-green-600 dark:text-green-400">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h4 class="font-semibold">Ventes traitées</h4>
                </div>
                <div class="user-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type de ressource</th>
                        <th>Quantité</th>
                        <th>Montant</th>
                      </tr>
                    </thead>
                    <tbody id="profile-ventes-traitees">
                      <tr><td class="py-3 text-center" colspan="4">Chargement…</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div id="tab-parametres" class="tab-content" style="display: none;">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Modifier le mot de passe -->
              <div class="card">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-blue-600 dark:text-blue-400">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    </svg>
                  </div>
                  <h3 class="text-base font-semibold">Mot de passe</h3>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Mot de passe actuel *</label>
                    <input type="password" id="current-password" placeholder="Mot de passe actuel" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Nouveau mot de passe *</label>
                    <input type="password" id="new-password" placeholder="Minimum 6 caractères" minlength="6" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Confirmer *</label>
                    <input type="password" id="confirm-password" placeholder="Confirmer le mot de passe" minlength="6" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <button id="btn-change-password" class="btn-primary w-full text-sm py-2">Modifier</button>
                </div>
              </div>

              <!-- Modifier l'email -->
              <div class="card">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-purple-600 dark:text-purple-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <h3 class="text-base font-semibold">Adresse email</h3>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Nouvelle adresse email *</label>
                    <input type="email" id="new-email" placeholder="nouvelle@email.com" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Mot de passe *</label>
                    <input type="password" id="email-password" placeholder="Confirmer avec votre mot de passe" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <button id="btn-change-email" class="btn-primary w-full text-sm py-2">Modifier</button>
                </div>
              </div>

              <!-- Informations personnelles -->
              <div class="card">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-green-600 dark:text-green-400">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h3 class="text-base font-semibold">Informations</h3>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Nom complet *</label>
                    <input type="text" id="profile-name-input" placeholder="Prénom Nom" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label class="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Téléphone</label>
                    <input type="tel" id="profile-phone-input" placeholder="0612345678" class="w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
                  </div>
                  <button id="btn-update-profile" class="btn-primary w-full text-sm py-2">Mettre à jour</button>
                </div>
              </div>

              <!-- Zone de danger -->
              <div class="card border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                <div class="flex items-center gap-3 mb-3">
                  <div class="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-red-600 dark:text-red-400">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <h3 class="text-base font-semibold text-red-600 dark:text-red-400">Zone de danger</h3>
                </div>
                <div class="space-y-3">
                  <p class="text-xs text-slate-600 dark:text-slate-400">La suppression est irréversible. Toutes vos données seront définitivement supprimées.</p>
                  <button id="btn-delete-account" class="w-full rounded px-3 py-2 bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium">Supprimer mon compte</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  // Gérer la déconnexion
  const logoutLink = document.getElementById('logout-link-profile');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const fb = getFirebase();
      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      try {
        if (fb && authState?.uid) {
          try { 
            await addLogEntry(fb, { 
              type: 'logout', 
              action: 'logout', 
              category: 'authentification',
              message: 'Déconnexion',
              uid: authState.uid
            }); 
          } catch {}
        }
        if (fb && fb.auth) {
          const { signOut } = await import('./firebase.js');
          await signOut(fb.auth);
        }
      } catch (err) {
        console.error('Erreur déconnexion:', err);
      }
      localStorage.removeItem('ms_auth_state');
      location.hash = '#/auth';
    });
  }

  // Charger les données du profil
  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      const currentUserId = authState?.uid;
      
      // Charger le profil
      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }
      
      // Mettre à jour la carte profil principale
      const profileAvatar = document.getElementById('profile-avatar');
      if (profileAvatar) {
        updateAvatar(profileAvatar, profile);
      }
      
      // Mettre à jour la prévisualisation de la photo dans les paramètres
      const photoPreview = document.getElementById('profile-photo-preview');
      if (photoPreview) {
        updateAvatar(photoPreview, profile);
        const btnRemovePhoto = document.getElementById('btn-remove-photo');
        if (btnRemovePhoto) btnRemovePhoto.style.display = profile.photoUrl ? 'block' : 'none';
      }
      const profileName = document.getElementById('profile-name');
      if (profileName) profileName.textContent = profile.name || 'Utilisateur';
      const profileEmail = document.getElementById('profile-email');
      if (profileEmail) profileEmail.textContent = profile.email || '—';
      const profileRoleBadge = document.getElementById('profile-role-badge');
      if (profileRoleBadge) {
        const roleDisplayName = await getRoleDisplayName(profile.role || 'employe');
        profileRoleBadge.textContent = roleDisplayName;
        const badgeClass = (profile.role || 'employe') === 'admin' ? 'badge-admin' : 'badge-employe';
        profileRoleBadge.className = 'badge-role ' + badgeClass;
      }
      const profileStatusBadge = document.getElementById('profile-status-badge');
      if (profileStatusBadge) {
        profileStatusBadge.textContent = profile.active !== false ? 'Actif' : 'Inactif';
        profileStatusBadge.className = 'badge-role ' + (profile.active !== false ? 'badge-actif' : 'badge-inactif');
      }
      const profileCreated = document.getElementById('profile-created');
      if (profileCreated) {
        if (profile.createdAt && profile.createdAt.toDate) {
          profileCreated.textContent = formatDate(profile.createdAt.toDate());
        } else if (profile.createdAt) {
          profileCreated.textContent = formatDate(new Date(profile.createdAt));
        } else {
          profileCreated.textContent = '—';
        }
      }
      
      // Afficher les accès aux espaces
      await displaySpacesAccess(profile);
      
      // Vérifier les permissions pour afficher les onglets
      const hasEmploye = await checkPermission('employe');
      
      // Créer les onglets
      await setupTabs(hasEmploye);
      
      // Remplir les champs de paramètres
      const nameInput = document.getElementById('profile-name-input');
      if (nameInput) nameInput.value = profile.name || '';
      const phoneInput = document.getElementById('profile-phone-input');
      if (phoneInput) phoneInput.value = profile.phone || '';
      
      // Charger les statistiques selon les permissions
      if (hasEmploye) {
        await loadStatsEmploye(fb, currentUserId);
      }
      
      
      // Setup des event listeners pour les paramètres
      setupParametres(fb, currentUserId, profile);
    } catch (e) {
      console.error('Erreur chargement profil:', e);
    }
  })();
}

async function displaySpacesAccess(profile) {
  try {
    const spacesContainer = document.getElementById('profile-spaces-access');
    if (!spacesContainer) return;
    
    const fb = getFirebase();
    if (!fb || !fb.db) return;
    
    // Charger les rôles depuis Firestore
    const rolesSnap = await getDocs(collection(fb.db, 'roles'));
    const rolesCache = rolesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const espacesAccessibles = [];
    
    // Vérifier chaque espace et récupérer le rôle correspondant
    if (profile.roleEntreprise && profile.roleEntreprise !== "" && profile.roleEntreprise !== null) {
      const role = rolesCache.find(r => r.id === profile.roleEntreprise);
      const roleName = role ? role.name : 'Sans rôle';
      espacesAccessibles.push({
        name: 'Entreprise',
        role: roleName,
        color: 'blue'
      });
    }
    
    if (profile.roleEmploye && profile.roleEmploye !== "" && profile.roleEmploye !== null) {
      const role = rolesCache.find(r => r.id === profile.roleEmploye);
      const roleName = role ? role.name : 'Sans rôle';
      espacesAccessibles.push({
        name: 'Employé',
        role: roleName,
        color: 'green'
      });
    }
    
    if (profile.roleIllegale && profile.roleIllegale !== "" && profile.roleIllegale !== null) {
      const role = rolesCache.find(r => r.id === profile.roleIllegale);
      const roleName = role ? role.name : 'Sans rôle';
      espacesAccessibles.push({
        name: 'Illégale',
        role: roleName,
        color: 'red'
      });
    }
    
    if (profile.roleGestionGenerale && profile.roleGestionGenerale !== "" && profile.roleGestionGenerale !== null) {
      const role = rolesCache.find(r => r.id === profile.roleGestionGenerale);
      const roleName = role ? role.name : 'Sans rôle';
      espacesAccessibles.push({
        name: 'Gestion Générale',
        role: roleName,
        color: 'purple'
      });
    }
    
    if (espacesAccessibles.length === 0) {
      spacesContainer.innerHTML = '<span class="text-xs text-slate-400">Aucun espace accessible</span>';
    } else {
      spacesContainer.innerHTML = espacesAccessibles.map(espace => {
        const colorClasses = {
          blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
        };
        return `
          <div class="px-3 py-1.5 rounded-lg text-xs font-medium ${colorClasses[espace.color]} flex items-center gap-2">
            <span>${espace.name}</span>
            <span class="opacity-70">•</span>
            <span class="opacity-80">${espace.role}</span>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.error('Erreur affichage accès espaces:', e);
    const spacesContainer = document.getElementById('profile-spaces-access');
    if (spacesContainer) {
      spacesContainer.innerHTML = '<span class="text-xs text-slate-400">Erreur lors du chargement</span>';
    }
  }
}

async function setupTabs(hasEmploye) {
  const tabsList = document.getElementById('profile-tabs-list');
  if (!tabsList) return;
  
  const tabs = [];
  if (hasEmploye) {
    tabs.push({ id: 'employe', label: 'Employé' });
  }
  tabs.push({ id: 'parametres', label: 'Paramètres' });
  
  tabsList.innerHTML = tabs.map((tab, index) => 
    `<button class="tab-item ${index === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
  ).join('');
  
  // Afficher le premier onglet
  if (tabs.length > 0) {
    showTab(tabs[0].id);
  }
  
  // Event listeners pour les onglets
  tabsList.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabsList.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showTab(tabId);
    });
  });
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  const tabContent = document.getElementById(`tab-${tabId}`);
  if (tabContent) {
    tabContent.style.display = 'block';
  }
}

async function loadStatsEmploye(fb, userId) {
  try {
    const statsContainer = document.getElementById('profile-stats-employe');
    if (!statsContainer) return;
    
    const ventesSnap = await getDocs(query(collection(fb.db, 'ventes'), where('employeId', '==', userId)));
    const ventes = ventesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const totalVentes = ventes.length;
    const enAttente = ventes.filter(v => (v.statut || 'en attente') === 'en attente').length;
    const validees = ventes.filter(v => v.statut === 'valide').length;
    const traitees = ventes.filter(v => v.statut === 'traite').length;
    
    // Charger les ressources pour calculer le salaire
    // Le salaire correspond aux ventes créées par l'employé et validées (statut 'valide')
    const ressourcesSnap = await getDocs(collection(fb.db, 'ressources'));
    const ressources = ressourcesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    let salaireTotal = 0;
    ventes.forEach(v => {
      // Seules les ventes validées comptent pour le salaire
      if (v.statut === 'valide') {
        const ressource = ressources.find(r => r.id === v.typeRessourceId);
        if (ressource) {
          const prixVente = ressource.prixVente || ressource.prix || 0;
          salaireTotal += prixVente * (v.quantite || 0);
        }
      }
    });
    
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg>
        </div>
        <div>
          <div class="stat-label">Total ventes</div>
          <div class="stat-value">${formatNumber(totalVentes)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div>
          <div class="stat-label">En attente</div>
          <div class="stat-value">${formatNumber(enAttente)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div>
          <div class="stat-label">Validées</div>
          <div class="stat-value">${formatNumber(validees)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div>
          <div class="stat-label">Traitées</div>
          <div class="stat-value">${formatNumber(traitees)}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg>
        </div>
        <div>
          <div class="stat-label">Salaire total</div>
          <div class="stat-value">${formatAmount(salaireTotal)} €</div>
        </div>
      </div>
    `;
    
    // Charger l'historique des ventes
    await loadHistoriqueVentes(ventes, ressources);
  } catch (e) {
    console.error('Erreur chargement stats employé:', e);
    const statsContainer = document.getElementById('profile-stats-employe');
    if (statsContainer) {
      statsContainer.innerHTML = '<div class="text-center text-slate-500 dark:text-slate-400 py-4">Erreur lors du chargement</div>';
    }
  }
}

function loadHistoriqueVentes(ventes, ressources) {
  // Ventes validées
  const ventesValidees = ventes.filter(v => v.statut === 'valide');
  const tbodyValidees = document.getElementById('profile-ventes-validees');
  if (tbodyValidees) {
    tbodyValidees.innerHTML = '';
    if (ventesValidees.length === 0) {
      tbodyValidees.innerHTML = '<tr><td class="py-3 text-center" colspan="4">Aucune vente validée</td></tr>';
    } else {
      ventesValidees.forEach(v => {
        const date = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const ressource = ressources.find(r => r.id === v.typeRessourceId) || {};
        const montant = (ressource.prixVente || ressource.prix || 0) * (v.quantite || 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${date.toLocaleDateString('fr-FR')}</td>
          <td>${ressource.nom || '—'}</td>
          <td>${formatNumber(v.quantite || 0)}</td>
          <td class="font-medium">${formatAmount(montant)} €</td>
        `;
        tbodyValidees.appendChild(tr);
      });
    }
  }
  
  // Ventes traitées
  const ventesTraitees = ventes.filter(v => v.statut === 'traite');
  const tbodyTraitees = document.getElementById('profile-ventes-traitees');
  if (tbodyTraitees) {
    tbodyTraitees.innerHTML = '';
    if (ventesTraitees.length === 0) {
      tbodyTraitees.innerHTML = '<tr><td class="py-3 text-center" colspan="4">Aucune vente traitée</td></tr>';
    } else {
      ventesTraitees.forEach(v => {
        const date = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const ressource = ressources.find(r => r.id === v.typeRessourceId) || {};
        const montant = (ressource.prixVente || ressource.prix || 0) * (v.quantite || 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${date.toLocaleDateString('fr-FR')}</td>
          <td>${ressource.nom || '—'}</td>
          <td>${formatNumber(v.quantite || 0)}</td>
          <td class="font-medium">${formatAmount(montant)} €</td>
        `;
        tbodyTraitees.appendChild(tr);
      });
    }
  }
}

function setupParametres(fb, userId, profile) {
  // Modifier le mot de passe
  const btnChangePassword = document.getElementById('btn-change-password');
  if (btnChangePassword) {
    btnChangePassword.addEventListener('click', async () => {
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        alertModal({ title: 'Champs requis', message: 'Veuillez remplir tous les champs.', type: 'warning' });
        return;
      }
      
      if (newPassword.length < 6) {
        alertModal({ title: 'Mot de passe trop court', message: 'Le mot de passe doit contenir au moins 6 caractères.', type: 'warning' });
        return;
      }
      
      if (newPassword !== confirmPassword) {
        alertModal({ title: 'Mots de passe différents', message: 'Les nouveaux mots de passe ne correspondent pas.', type: 'warning' });
        return;
      }
      
      try {
        const { updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js');
        const user = fb.auth.currentUser;
        if (!user || !user.email) {
          alertModal({ title: 'Erreur', message: 'Utilisateur non trouvé.', type: 'danger' });
          return;
        }
        
        // Réauthentifier l'utilisateur
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Mettre à jour le mot de passe
        await updatePassword(user, newPassword);
        
        // Réinitialiser les champs
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        alertModal({ title: 'Succès', message: 'Mot de passe modifié avec succès.', type: 'success' });
      } catch (e) {
        alertModal({ title: 'Erreur', message: e.message || 'Erreur lors de la modification du mot de passe.', type: 'danger' });
      }
    });
  }
  
  // Modifier l'email
  const btnChangeEmail = document.getElementById('btn-change-email');
  if (btnChangeEmail) {
    btnChangeEmail.addEventListener('click', async () => {
      const newEmail = document.getElementById('new-email').value.trim();
      const password = document.getElementById('email-password').value;
      
      if (!newEmail || !password) {
        alertModal({ title: 'Champs requis', message: 'Veuillez remplir tous les champs.', type: 'warning' });
        return;
      }
      
      try {
        const { updateEmail, reauthenticateWithCredential, EmailAuthProvider } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js');
        const user = fb.auth.currentUser;
        if (!user || !user.email) {
          alertModal({ title: 'Erreur', message: 'Utilisateur non trouvé.', type: 'danger' });
          return;
        }
        
        // Réauthentifier l'utilisateur
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        // Mettre à jour l'email
        await updateEmail(user, newEmail);
        
        // Mettre à jour dans Firestore
        await updateDoc(doc(fb.db, 'users', userId), { email: newEmail });
        
        await addLogEntry(fb, { 
          type: 'action', 
          action: 'profile_email_update', 
          category: 'profil',
          message: `Modification de l'email: ${user.email} → ${newEmail}` 
        });
        
        // Réinitialiser les champs
        document.getElementById('new-email').value = '';
        document.getElementById('email-password').value = '';
        
        // Recharger le profil
        localStorage.removeItem('ms_user_profile');
        await loadUserProfile();
        location.reload();
      } catch (e) {
        alertModal({ title: 'Erreur', message: e.message || 'Erreur lors de la modification de l\'email.', type: 'danger' });
      }
    });
  }
  
  // Mettre à jour les informations personnelles
  const btnUpdateProfile = document.getElementById('btn-update-profile');
  if (btnUpdateProfile) {
    btnUpdateProfile.addEventListener('click', async () => {
      const name = document.getElementById('profile-name-input').value.trim();
      const phone = document.getElementById('profile-phone-input').value.trim();
      
      if (!name) {
        alertModal({ title: 'Champ requis', message: 'Le nom complet est requis.', type: 'warning' });
        return;
      }
      
      try {
        const oldProfile = getCachedProfile() || {};
        await updateDoc(doc(fb.db, 'users', userId), { 
          name, 
          phone: phone || null 
        });
        
        await addLogEntry(fb, { 
          type: 'action', 
          action: 'profile_update', 
          category: 'profil',
          message: `Modification du profil: nom "${oldProfile.name || '—'}" → "${name}"${phone !== (oldProfile.phone || '') ? `, téléphone: "${oldProfile.phone || '—'}" → "${phone || '—'}"` : ''}` 
        });
        
        // Recharger le profil
        localStorage.removeItem('ms_user_profile');
        await loadUserProfile();
        
        alertModal({ title: 'Succès', message: 'Profil mis à jour avec succès.', type: 'success', onClose: () => location.reload() });
      } catch (e) {
        alertModal({ title: 'Erreur', message: 'Erreur lors de la mise à jour du profil.', type: 'danger' });
      }
    });
  }
  
  // Supprimer le compte
  const btnDeleteAccount = document.getElementById('btn-delete-account');
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', async () => {
      confirmModal({
        title: 'Supprimer le compte',
        message: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement supprimées.',
        type: 'danger',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
          // Demander le mot de passe dans un modal
          const body = `
            <div class="modal-field">
              <label>Mot de passe *</label>
              <input type="password" id="delete-password" placeholder="Entrez votre mot de passe pour confirmer" required />
            </div>
          `;
          createModal({
            title: 'Confirmer la suppression',
            body,
            confirmText: 'Supprimer définitivement',
            cancelText: 'Annuler',
            onConfirm: async () => {
              try {
                const password = document.getElementById('delete-password').value;
                if (!password) {
                  alertModal({ title: 'Champ requis', message: 'Le mot de passe est requis.', type: 'warning' });
                  return;
                }
                
                const { deleteUser, reauthenticateWithCredential, EmailAuthProvider } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js');
                const user = fb.auth.currentUser;
                if (!user || !user.email) {
                  alertModal({ title: 'Erreur', message: 'Utilisateur non trouvé.', type: 'danger' });
                  return;
                }
                
                // Réauthentifier
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                
                // Supprimer le document utilisateur dans Firestore
                await deleteDoc(doc(fb.db, 'users', userId));
                
                // Supprimer le compte Firebase Auth
                await deleteUser(user);
                
                // Nettoyer le localStorage
                localStorage.removeItem('ms_auth_state');
                localStorage.removeItem('ms_user_profile');
                
                alertModal({ 
                  title: 'Compte supprimé', 
                  message: 'Votre compte a été supprimé avec succès.', 
                  type: 'success',
                  onClose: () => {
                    location.hash = '#/auth';
                  }
                });
              } catch (e) {
                alertModal({ title: 'Erreur', message: e.message || 'Erreur lors de la suppression du compte.', type: 'danger' });
              }
            }
          });
        }
      });
    });
  }
}

