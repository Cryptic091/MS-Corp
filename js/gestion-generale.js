import { html, mount, getCachedProfile, loadUserProfile, createModal, alertModal, updateAvatar, isAuthenticated, updateRoleBadge, checkPermission, updateNavPermissions } from './utils.js';
import { getFirebase, waitForFirebase, doc, getDoc, collection, getDocs, query, orderBy, where, signOut, updateDoc, setDoc, addDoc, deleteDoc, serverTimestamp, createUserWithEmailAndPassword } from './firebase.js';
import { addLogEntry } from './firebase.js';
import { formatDate } from './utils.js';

// Fonction pour afficher la page Rôles dans Gestion Générale
async function viewRolesGestionGenerale(root) {
  const content = html`
    <div class="page-card">
      <div class="page-head">
        <div>
          <div class="page-title">Rôles & Permissions</div>
          <div class="page-sub">Gérez les rôles et permissions par espace</div>
        </div>
      </div>
      
      <!-- Onglets pour chaque espace -->
      <div class="tabs-container mb-4">
        <div class="tabs-list" id="roles-tabs-list-gestion">
          <button class="tab-item active" data-space="entreprise">Rôle - Perm | Entreprise</button>
          <button class="tab-item" data-space="employe">Rôle - Perm | Employé</button>
          <button class="tab-item" data-space="illegale">Rôle - Perm | Illégale</button>
          <button class="tab-item" data-space="gestion-generale">Rôle - Perm | Gestion Générale</button>
        </div>
      </div>
      
      <!-- Contenu des onglets -->
      <div id="tab-content-gestion-entreprise" class="tab-content active">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Rôles disponibles (Entreprise)</h3>
              <button id="btn-new-role-gestion-entreprise" class="btn-primary text-sm py-1.5 px-3 flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau rôle
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody id="roles-tbody-gestion-entreprise">
                  <tr><td class="py-3 text-center" colspan="2">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3 class="font-medium mb-4">Permissions (Entreprise)</h3>
            <div class="space-y-3 text-sm" style="max-height: 70vh; overflow-y: auto;">
              <div class="text-xs opacity-70 mb-3 p-2 bg-blue-50 dark:bg-slate-800 rounded">Sélectionnez un rôle dans la table pour éditer ses permissions.</div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Accès Espaces</div>
                <div class="perm-card"><span>Accès Gestion Entreprise</span><div id="perm-gestion-entreprise" class="switch" data-perm="entreprise"></div></div>
              </div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Pages Espace Entreprise</div>
                <div class="perm-card"><span>Gestion Employé</span><div id="perm-gestion-employes" class="switch" data-perm="employes"></div></div>
                <div class="perm-card"><span>Gestion Vente</span><div id="perm-gestion-ventes" class="switch" data-perm="ventes"></div></div>
                <div class="perm-card"><span>Gestion Finance</span><div id="perm-gestion-finance" class="switch" data-perm="finance"></div></div>
                <div class="perm-card"><span>Gestion Flotte</span><div id="perm-gestion-flotte" class="switch" data-perm="flotte"></div></div>
                <div class="perm-card"><span>Calculateur CA</span><div id="perm-gestion-calcul" class="switch" data-perm="calcul"></div></div>
                <div class="perm-card"><span>Calculatrice</span><div id="perm-gestion-calculatrice" class="switch" data-perm="calculatrice"></div></div>
                <div class="perm-card"><span>Logs</span><div id="perm-gestion-logs" class="switch" data-perm="logs"></div></div>
              </div>
              
              <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <button id="btn-save-perms-gestion-entreprise" class="btn-primary w-full" disabled>Enregistrer les permissions</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="tab-content-gestion-employe" class="tab-content" style="display: none;">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Rôles disponibles (Employé)</h3>
              <button id="btn-new-role-gestion-employe" class="btn-primary text-sm py-1.5 px-3 flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau rôle
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody id="roles-tbody-gestion-employe">
                  <tr><td class="py-3 text-center" colspan="2">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3 class="font-medium mb-4">Permissions (Employé)</h3>
            <div class="space-y-3 text-sm" style="max-height: 70vh; overflow-y: auto;">
              <div class="text-xs opacity-70 mb-3 p-2 bg-green-50 dark:bg-slate-800 rounded">Sélectionnez un rôle dans la table pour éditer ses permissions.</div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Accès Espaces</div>
                <div class="perm-card"><span>Accès Espace Employé</span><div id="perm-gestion-employe" class="switch" data-perm="employe"></div></div>
              </div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Pages Espace Employé</div>
                <div class="perm-card"><span>Vente</span><div id="perm-gestion-employe-ventes" class="switch" data-perm="employe-ventes"></div></div>
                <div class="perm-card"><span>Flotte</span><div id="perm-gestion-employe-flotte" class="switch" data-perm="employe-flotte"></div></div>
                <div class="perm-card"><span>Calculateur CA</span><div id="perm-gestion-employe-calcul" class="switch" data-perm="employe-calcul"></div></div>
                <div class="perm-card"><span>Calculatrice</span><div id="perm-gestion-employe-calculatrice" class="switch" data-perm="employe-calculatrice"></div></div>
              </div>
              
              <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <button id="btn-save-perms-gestion-employe" class="btn-primary w-full" disabled>Enregistrer les permissions</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="tab-content-gestion-illegale" class="tab-content" style="display: none;">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Rôles disponibles (Illégale)</h3>
              <button id="btn-new-role-gestion-illegale" class="btn-primary text-sm py-1.5 px-3 flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau rôle
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody id="roles-tbody-gestion-illegale">
                  <tr><td class="py-3 text-center" colspan="2">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3 class="font-medium mb-4">Permissions (Illégale)</h3>
            <div class="space-y-3 text-sm" style="max-height: 70vh; overflow-y: auto;">
              <div class="text-xs opacity-70 mb-3 p-2 bg-red-50 dark:bg-slate-800 rounded">Sélectionnez un rôle dans la table pour éditer ses permissions.</div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Accès Espaces</div>
                <div class="perm-card"><span>Accès Espace Illégale</span><div id="perm-gestion-illegale" class="switch" data-perm="illegale"></div></div>
              </div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Pages Espace Illégale</div>
                <div class="perm-card"><span>Points Illégaux</span><div id="perm-gestion-illegale-points" class="switch" data-perm="illegale-points"></div></div>
                <div class="perm-card"><span>Armement</span><div id="perm-gestion-illegale-armes" class="switch" data-perm="illegale-armes"></div></div>
                <div class="perm-card"><span>Gestion Points Illégaux</span><div id="perm-gestion-illegale-gestion-points" class="switch" data-perm="illegale-gestion-points"></div></div>
                <div class="perm-card"><span>Gestion Pack d'Armes</span><div id="perm-gestion-illegale-gestion-armes" class="switch" data-perm="illegale-gestion-armes"></div></div>
              </div>
              
              <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <button id="btn-save-perms-gestion-illegale" class="btn-primary w-full" disabled>Enregistrer les permissions</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="tab-content-gestion-gestion-generale" class="tab-content" style="display: none;">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium">Rôles disponibles (Gestion Générale)</h3>
              <button id="btn-new-role-gestion-gestion-generale" class="btn-primary text-sm py-1.5 px-3 flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau rôle
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody id="roles-tbody-gestion-gestion-generale">
                  <tr><td class="py-3 text-center" colspan="2">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h3 class="font-medium mb-4">Permissions (Gestion Générale)</h3>
            <div class="space-y-3 text-sm" style="max-height: 70vh; overflow-y: auto;">
              <div class="text-xs opacity-70 mb-3 p-2 bg-purple-50 dark:bg-slate-800 rounded">Sélectionnez un rôle dans la table pour éditer ses permissions.</div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Accès Espaces</div>
                <div class="perm-card"><span>Accès Gestion Générale</span><div id="perm-gestion-gestion-generale" class="switch" data-perm="gestion-generale"></div></div>
              </div>
              
              <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Pages Espace Gestion Générale</div>
                <div class="perm-card"><span>Utilisateurs</span><div id="perm-gestion-gestion-generale-utilisateurs" class="switch" data-perm="gestion-generale-utilisateurs"></div></div>
                <div class="perm-card"><span>Rôles</span><div id="perm-gestion-gestion-generale-roles" class="switch" data-perm="gestion-generale-roles"></div></div>
              </div>
              
              <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <button id="btn-save-perms-gestion-gestion-generale" class="btn-primary w-full" disabled>Enregistrer les permissions</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const pageCard = root.querySelector('.page-card');
  if (pageCard) {
    pageCard.innerHTML = '';
    pageCard.appendChild(content);
  } else {
    root.querySelector('.content .page-card').innerHTML = '';
    root.querySelector('.content .page-card').appendChild(content);
  }

  let rolesCache = [];
  let selectedRoleId = null;
  let currentSpaceGestion = 'entreprise';
  let draggedRowGestion = null;
  const dragDropInitializedGestion = new Set();

  // Fonction pour créer un rôle dans un espace spécifique
  function createRoleForSpaceGestion(space) {
    const body = `
      <div class="modal-field">
        <label>Nom du rôle *</label>
        <input id="modal-role-name-gestion" type="text" required placeholder="Manager" />
      </div>
      <div class="modal-field">
        <label>Description</label>
        <textarea id="modal-role-desc-gestion" placeholder="Description du rôle"></textarea>
      </div>
    `;
    const spaceNames = {
      'entreprise': 'Entreprise',
      'employe': 'Employé',
      'illegale': 'Illégale',
      'gestion-generale': 'Gestion Générale'
    };
    createModal({
      title: `Nouveau rôle (Espace ${spaceNames[space] || space})`,
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const name = document.getElementById('modal-role-name-gestion').value.trim();
        const desc = document.getElementById('modal-role-desc-gestion').value.trim();
        if (!name) {
          alertModal({ title: 'Champ requis', message: 'Le nom du rôle est requis.', type: 'warning' });
          return;
        }
        try {
          const maxOrder = rolesCache.length > 0 ? Math.max(...rolesCache.map(r => r.order || 0)) : -1;
          
          // Créer les permissions selon l'espace
          const permissions = {
            entreprise: space === 'entreprise',
            employe: space === 'employe',
            illegale: space === 'illegale',
            'gestion-generale': space === 'gestion-generale',
            // Permissions Espace Entreprise
            employes: space === 'entreprise' ? false : undefined, 
            ventes: space === 'entreprise' ? false : undefined, 
            finance: space === 'entreprise' ? false : undefined, 
            flotte: space === 'entreprise' ? false : undefined,
            calcul: space === 'entreprise' ? false : undefined,
            calculatrice: space === 'entreprise' ? false : undefined,
            logs: space === 'entreprise' ? false : undefined,
            // Permissions Espace Employé
            'employe-ventes': space === 'employe' ? false : undefined,
            'employe-flotte': space === 'employe' ? false : undefined,
            'employe-calcul': space === 'employe' ? false : undefined,
            'employe-calculatrice': space === 'employe' ? false : undefined,
            // Permissions Espace Illégale
            'illegale-points': space === 'illegale' ? false : undefined,
            'illegale-armes': space === 'illegale' ? false : undefined,
            'illegale-gestion-points': space === 'illegale' ? false : undefined,
            'illegale-gestion-armes': space === 'illegale' ? false : undefined,
            // Permissions Espace Gestion Générale
            'gestion-generale-utilisateurs': space === 'gestion-generale' ? false : undefined,
            'gestion-generale-roles': space === 'gestion-generale' ? false : undefined
          };
          
          // Nettoyer les permissions undefined
          Object.keys(permissions).forEach(key => {
            if (permissions[key] === undefined) {
              delete permissions[key];
            }
          });
          
          await addDoc(collection(fb.db, 'roles'), { 
            name, 
            description: desc,
            order: maxOrder + 1,
            permissions
          });
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'role_create', 
            category: 'roles',
            message: `Création du rôle "${name}" (Espace ${space})` 
          });
          
          // Recharger les rôles et réafficher
          const snap = await getDocs(collection(fb.db, 'roles'));
          rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          rolesCache.sort((a, b) => (a.order || 0) - (b.order || 0));
          renderRolesForSpaceGestion(space);
          
          alertModal({ title: 'Succès', message: 'Rôle créé avec succès.', type: 'success' });
        } catch { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création du rôle.', type: 'danger' });
        }
      }
    });
  }

  // Boutons nouveau rôle par espace
  document.getElementById('btn-new-role-gestion-entreprise').addEventListener('click', () => {
    createRoleForSpaceGestion('entreprise');
  });

  document.getElementById('btn-new-role-gestion-employe').addEventListener('click', () => {
    createRoleForSpaceGestion('employe');
  });

  document.getElementById('btn-new-role-gestion-illegale').addEventListener('click', () => {
    createRoleForSpaceGestion('illegale');
  });

  document.getElementById('btn-new-role-gestion-gestion-generale').addEventListener('click', () => {
    createRoleForSpaceGestion('gestion-generale');
  });

  // Gestion des onglets
  const tabButtons = document.querySelectorAll('#roles-tabs-list-gestion .tab-item');
  const tabContents = document.querySelectorAll('[id^="tab-content-gestion-"]');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const space = btn.getAttribute('data-space');
      currentSpaceGestion = space;
      
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      tabContents.forEach(content => {
        const contentSpace = content.id.replace('tab-content-gestion-', '');
        if (contentSpace === space) {
          content.style.display = '';
          content.classList.add('active');
        } else {
          content.style.display = 'none';
          content.classList.remove('active');
        }
      });
      
      selectedRoleId = null;
      const allSaveBtns = document.querySelectorAll('[id^="btn-save-perms-gestion-"]');
      allSaveBtns.forEach(btn => btn.disabled = true);
      
      renderRolesForSpaceGestion(space);
    });
  });

  // Toggle switches
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('.switch');
    if (sw && sw.id && sw.id.startsWith('perm-gestion-')) {
      if (!selectedRoleId) {
        alertModal({ 
          title: 'Sélection requise', 
          message: 'Veuillez d\'abord sélectionner un rôle dans la table pour modifier ses permissions.', 
          type: 'warning' 
        });
        return;
      }
      e.stopPropagation();
      sw.classList.toggle('on');
    }
  });

  // Save permissions pour chaque espace
  document.getElementById('btn-save-perms-gestion-entreprise').addEventListener('click', async () => {
    if (!selectedRoleId) return;
    const fb = getFirebase();
    const role = rolesCache.find(r => r.id === selectedRoleId);
    const existingPerms = role?.permissions || {};
    const perms = {
      ...existingPerms,
      entreprise: document.getElementById('perm-gestion-entreprise').classList.contains('on'),
      employes: document.getElementById('perm-gestion-employes').classList.contains('on'),
      ventes: document.getElementById('perm-gestion-ventes').classList.contains('on'),
      finance: document.getElementById('perm-gestion-finance').classList.contains('on'),
      flotte: document.getElementById('perm-gestion-flotte').classList.contains('on'),
      calcul: document.getElementById('perm-gestion-calcul').classList.contains('on'),
      calculatrice: document.getElementById('perm-gestion-calculatrice').classList.contains('on'),
      logs: document.getElementById('perm-gestion-logs').classList.contains('on')
    };
    try {
      await setDoc(doc(fb.db, 'roles', selectedRoleId), { permissions: perms }, { merge: true });
      await addLogEntry(fb, { 
        type: 'action', 
        action: 'role_permissions_update', 
        category: 'roles',
        message: `Mise à jour des permissions du rôle "${role?.name || selectedRoleId}" (Espace Entreprise)` 
      });
      if (role) role.permissions = perms;
      renderRolesForSpaceGestion('entreprise');
      alertModal({ title: 'Succès', message: 'Permissions du rôle mises à jour avec succès.', type: 'success' });
    } catch { 
      alertModal({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des permissions.', type: 'danger' });
    }
  });

  document.getElementById('btn-save-perms-gestion-employe').addEventListener('click', async () => {
    if (!selectedRoleId) return;
    const fb = getFirebase();
    const role = rolesCache.find(r => r.id === selectedRoleId);
    const existingPerms = role?.permissions || {};
    const perms = {
      ...existingPerms,
      employe: document.getElementById('perm-gestion-employe').classList.contains('on'),
      'employe-ventes': document.getElementById('perm-gestion-employe-ventes').classList.contains('on'),
      'employe-flotte': document.getElementById('perm-gestion-employe-flotte').classList.contains('on'),
      'employe-calcul': document.getElementById('perm-gestion-employe-calcul').classList.contains('on'),
      'employe-calculatrice': document.getElementById('perm-gestion-employe-calculatrice').classList.contains('on')
    };
    try {
      await setDoc(doc(fb.db, 'roles', selectedRoleId), { permissions: perms }, { merge: true });
      await addLogEntry(fb, { 
        type: 'action', 
        action: 'role_permissions_update', 
        category: 'roles',
        message: `Mise à jour des permissions du rôle "${role?.name || selectedRoleId}" (Espace Employé)` 
      });
      if (role) role.permissions = perms;
      renderRolesForSpaceGestion('employe');
      alertModal({ title: 'Succès', message: 'Permissions du rôle mises à jour avec succès.', type: 'success' });
    } catch { 
      alertModal({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des permissions.', type: 'danger' });
    }
  });

  document.getElementById('btn-save-perms-gestion-illegale').addEventListener('click', async () => {
    if (!selectedRoleId) return;
    const fb = getFirebase();
    const role = rolesCache.find(r => r.id === selectedRoleId);
    const existingPerms = role?.permissions || {};
    const perms = {
      ...existingPerms,
      illegale: document.getElementById('perm-gestion-illegale').classList.contains('on'),
      'illegale-points': document.getElementById('perm-gestion-illegale-points').classList.contains('on'),
      'illegale-armes': document.getElementById('perm-gestion-illegale-armes').classList.contains('on'),
      'illegale-gestion-points': document.getElementById('perm-gestion-illegale-gestion-points').classList.contains('on'),
      'illegale-gestion-armes': document.getElementById('perm-gestion-illegale-gestion-armes').classList.contains('on')
    };
    try {
      await setDoc(doc(fb.db, 'roles', selectedRoleId), { permissions: perms }, { merge: true });
      await addLogEntry(fb, { 
        type: 'action', 
        action: 'role_permissions_update', 
        category: 'roles',
        message: `Mise à jour des permissions du rôle "${role?.name || selectedRoleId}" (Espace Illégale)` 
      });
      if (role) role.permissions = perms;
      renderRolesForSpaceGestion('illegale');
      alertModal({ title: 'Succès', message: 'Permissions du rôle mises à jour avec succès.', type: 'success' });
    } catch { 
      alertModal({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des permissions.', type: 'danger' });
    }
  });

  document.getElementById('btn-save-perms-gestion-gestion-generale').addEventListener('click', async () => {
    if (!selectedRoleId) return;
    const fb = getFirebase();
    const role = rolesCache.find(r => r.id === selectedRoleId);
    const existingPerms = role?.permissions || {};
    const perms = {
      ...existingPerms,
      'gestion-generale': document.getElementById('perm-gestion-gestion-generale').classList.contains('on'),
      'gestion-generale-utilisateurs': document.getElementById('perm-gestion-gestion-generale-utilisateurs').classList.contains('on'),
      'gestion-generale-roles': document.getElementById('perm-gestion-gestion-generale-roles').classList.contains('on')
    };
    try {
      await setDoc(doc(fb.db, 'roles', selectedRoleId), { permissions: perms }, { merge: true });
      await addLogEntry(fb, { 
        type: 'action', 
        action: 'role_permissions_update', 
        category: 'roles',
        message: `Mise à jour des permissions du rôle "${role?.name || selectedRoleId}" (Espace Gestion Générale)` 
      });
      if (role) role.permissions = perms;
      renderRolesForSpaceGestion('gestion-generale');
      alertModal({ title: 'Succès', message: 'Permissions du rôle mises à jour avec succès.', type: 'success' });
    } catch { 
      alertModal({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des permissions.', type: 'danger' });
    }
  });

  // Drag and drop functionality pour chaque espace
  function initDragAndDropGestion(space) {
    const tbodyId = `roles-tbody-gestion-${space}`;
    const tbody = document.getElementById(tbodyId);
    if (!tbody || dragDropInitializedGestion.has(tbodyId)) return;
    dragDropInitializedGestion.add(tbodyId);

    tbody.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (!draggedRowGestion) return;
      
      const afterElement = getDragAfterElementGestion(tbody, e.clientY);
      if (afterElement == null) {
        tbody.appendChild(draggedRowGestion);
      } else {
        tbody.insertBefore(draggedRowGestion, afterElement);
      }
    });

    tbody.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (!draggedRowGestion) return;
      
      const rows = Array.from(tbody.querySelectorAll('tr[draggable="true"]'));
      const newOrder = rows.map((row, index) => ({
        id: row.getAttribute('data-role-id'),
        order: index
      }));

      try {
        const fb = getFirebase();
        if (!fb || !fb.db) return;
        
        const updates = newOrder.map(({ id, order }) => {
          const role = rolesCache.find(r => r.id === id);
          if (role) {
            role.order = order;
            return updateDoc(doc(fb.db, 'roles', id), { order });
          }
          return Promise.resolve();
        });

        await Promise.all(updates);
        rolesCache.sort((a, b) => (a.order || 0) - (b.order || 0));
        await addLogEntry(fb, { 
          type: 'action', 
          action: 'role_order_update', 
          category: 'roles',
          message: `Réordonnancement des rôles (Espace ${space})` 
        });
        renderRolesForSpaceGestion(space);
      } catch (err) {
        alertModal({ title: 'Erreur', message: 'Erreur lors du réordonnancement des rôles.', type: 'danger' });
      }
    });
  }

  function getDragAfterElementGestion(container, y) {
    const draggableElements = [...container.querySelectorAll('tr[draggable="true"]:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function renderRolesForSpaceGestion(space) {
    const tbodyId = `roles-tbody-gestion-${space}`;
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    tbody.innerHTML = '';
    // Trier les rôles par ordre avant de filtrer
    const sortedRoles = [...rolesCache].sort((a, b) => (a.order || 0) - (b.order || 0));
    const filteredRoles = sortedRoles.filter(r => {
      const perms = r.permissions || {};
      if (space === 'entreprise') return perms.entreprise === true;
      if (space === 'employe') return perms.employe === true;
      if (space === 'illegale') return perms.illegale === true;
      if (space === 'gestion-generale') return perms['gestion-generale'] === true;
      return false;
    });
    
    filteredRoles.forEach(r => {
      const tr = document.createElement('tr');
      const selected = r.id === selectedRoleId ? 'style="outline: 2px solid rgba(59,130,246,0.6); outline-offset: -2px;"' : '';
      tr.setAttribute('data-role-id', r.id);
      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="drag-handle" style="cursor: grab; opacity: 0.5; display: inline-flex; align-items: center; user-select: none;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="12" r="1"></circle>
                <circle cx="9" cy="5" r="1"></circle>
                <circle cx="9" cy="19" r="1"></circle>
                <circle cx="15" cy="12" r="1"></circle>
                <circle cx="15" cy="5" r="1"></circle>
                <circle cx="15" cy="19" r="1"></circle>
              </svg>
            </span>
            <span class="font-medium">${r.name || '—'}</span>
          </div>
        </td>
        <td class="text-sm text-slate-600 dark:text-slate-400">${r.description || '—'}</td>
      `;
      tr.setAttribute('draggable', 'true');
      if (selected) tr.setAttribute('style', selected.replace('style="','').replace('"',''));
      tr.style.cursor = 'pointer';
      
      // Drag event listeners
      const dragHandle = tr.querySelector('.drag-handle');
      
      tr.addEventListener('dragstart', (e) => {
        const clickedBtn = e.target.closest('button');
        if (clickedBtn) {
          e.preventDefault();
          return false;
        }
        draggedRowGestion = tr;
        tr.classList.add('dragging');
        tr.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        if (dragHandle) {
          dragHandle.style.cursor = 'grabbing';
        }
      });
      
      tr.addEventListener('dragend', (e) => {
        tr.classList.remove('dragging');
        tr.style.opacity = '';
        draggedRowGestion = null;
        if (dragHandle) {
          dragHandle.style.cursor = 'grab';
        }
      });
      
      tr.addEventListener('click', (e) => {
        // Ne pas sélectionner si on clique sur le drag handle
        if (e.target.closest('.drag-handle')) return;
        // Ne pas sélectionner si on clique sur un bouton
        if (e.target.closest('button')) return;
        
        selectedRoleId = r.id;
        const perms = r.permissions || {};
        const setSwitch = (id, value) => {
          const el = document.getElementById(id);
          if (el) {
            if (value) {
              el.classList.add('on');
            } else {
              el.classList.remove('on');
            }
          }
        };
        
        if (space === 'entreprise') {
          setSwitch('perm-gestion-entreprise', Boolean(perms.entreprise));
          setSwitch('perm-gestion-employes', Boolean(perms.employes));
          setSwitch('perm-gestion-ventes', Boolean(perms.ventes));
          setSwitch('perm-gestion-finance', Boolean(perms.finance));
          setSwitch('perm-gestion-flotte', Boolean(perms.flotte));
          setSwitch('perm-gestion-calcul', Boolean(perms.calcul));
          setSwitch('perm-gestion-calculatrice', Boolean(perms.calculatrice));
          setSwitch('perm-gestion-logs', Boolean(perms.logs));
          document.getElementById('btn-save-perms-gestion-entreprise').disabled = false;
        } else if (space === 'employe') {
          setSwitch('perm-gestion-employe', Boolean(perms.employe));
          setSwitch('perm-gestion-employe-ventes', Boolean(perms['employe-ventes']));
          setSwitch('perm-gestion-employe-flotte', Boolean(perms['employe-flotte']));
          setSwitch('perm-gestion-employe-calcul', Boolean(perms['employe-calcul']));
          setSwitch('perm-gestion-employe-calculatrice', Boolean(perms['employe-calculatrice']));
          document.getElementById('btn-save-perms-gestion-employe').disabled = false;
        } else if (space === 'illegale') {
          setSwitch('perm-gestion-illegale', Boolean(perms.illegale));
          setSwitch('perm-gestion-illegale-points', Boolean(perms['illegale-points']));
          setSwitch('perm-gestion-illegale-armes', Boolean(perms['illegale-armes']));
          setSwitch('perm-gestion-illegale-gestion-points', Boolean(perms['illegale-gestion-points']));
          setSwitch('perm-gestion-illegale-gestion-armes', Boolean(perms['illegale-gestion-armes']));
          document.getElementById('btn-save-perms-gestion-illegale').disabled = false;
        } else if (space === 'gestion-generale') {
          setSwitch('perm-gestion-gestion-generale', Boolean(perms['gestion-generale']));
          setSwitch('perm-gestion-gestion-generale-utilisateurs', Boolean(perms['gestion-generale-utilisateurs']));
          setSwitch('perm-gestion-gestion-generale-roles', Boolean(perms['gestion-generale-roles']));
          document.getElementById('btn-save-perms-gestion-gestion-generale').disabled = false;
        }
        
        renderRolesForSpaceGestion(space);
      });
      tbody.appendChild(tr);
    });
    
    const spaceNames = {
      'entreprise': 'Entreprise',
      'employe': 'Employé',
      'illegale': 'Illégale',
      'gestion-generale': 'Gestion Générale'
    };
    
    if (!filteredRoles.length) {
      tbody.innerHTML = `<tr><td class="py-3 text-center" colspan="2">Aucun rôle de l'espace ${spaceNames[space] || space}</td></tr>`;
    }
    
    // Initialiser drag and drop pour ce tbody
    initDragAndDropGestion(space);
  }

  // Charger les rôles
  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const snap = await getDocs(collection(fb.db, 'roles'));
      rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rolesCache.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      renderRolesForSpaceGestion('entreprise');
    } catch (e) {
      console.error('Erreur chargement rôles:', e);
    }
  })();
}

export function viewGestionGenerale(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  const hash = location.hash || '#/gestion-generale';
  
  // TODO: Ajouter ici les autres sous-pages si nécessaire (ex: espaces)

  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/gestion-generale/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-gestion" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-gestion" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-gestion" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div id="sb-role-gestion" class="badge-role badge-admin mt-2 inline-block text-xs">Gestion Générale</div>
          </a>
          <div class="section-title">Gestion Générale</div>
          <nav class="nav-links">
            <a href="#/gestion-generale" id="nav-utilisateurs-gestion" class="active nav-item"><span class="nav-icon"></span>Utilisateurs</a>
            <a href="#/gestion-generale/roles" id="nav-roles-gestion" class="nav-item"><span class="nav-icon"></span>Rôles</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-gestion" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Gestion Générale</div>
              <div class="page-sub">Gérez les utilisateurs et leurs accès aux espaces</div>
            </div>
            <div class="flex gap-2">
              <button id="btn-new-user-gestion" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvel utilisateur
              </button>
              <button id="btn-refresh-gestion" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"></path></svg></span> Actualiser
              </button>
            </div>
          </div>

          <!-- Statistiques globales -->
          <div class="stats-grid mb-6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <div class="stat-label">Total utilisateurs</div>
                <div id="stat-total-users-gestion" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <div class="stat-label">Utilisateurs actifs</div>
                <div id="stat-active-users-gestion" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <div>
                <div class="stat-label">Espaces actifs</div>
                <div id="stat-espaces-actifs-gestion" class="stat-value">5</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Accès Entreprise</div>
                <div id="stat-acces-entreprise-gestion" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <div class="stat-label">Accès Illégale</div>
                <div id="stat-acces-illegale-gestion" class="stat-value">0</div>
              </div>
            </div>
          </div>

          <!-- Liste des utilisateurs avec leurs accès -->
          <div class="card mb-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="search-bar flex-1">
                <span class="search-icon icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                <input id="user-search-gestion" type="text" placeholder="Rechercher un utilisateur..." class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" />
              </div>
              <select id="espace-filter-gestion" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm">
                <option value="">Tous les espaces</option>
                <option value="entreprise">Entreprise</option>
                <option value="employe">Employé</option>
                <option value="illegale">Illégale</option>
                <option value="gestion-generale">Gestion Générale</option>
              </select>
            </div>
          </div>

          <div class="user-table">
            <table>
              <thead>
                <tr>
                  <th>UTILISATEUR</th>
                  <th>CONTACT</th>
                  <th>RÔLE</th>
                  <th>ACCÈS ESPACES</th>
                  <th>STATUT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody id="users-gestion-tbody">
                <tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  const logoutLink = document.getElementById('logout-link-gestion');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      let fb = getFirebase();
      try {
        if (!fb) {
          fb = await waitForFirebase();
        }
        if (fb) {
          await addLogEntry(fb, { 
            type: 'logout', 
            action: 'logout', 
            category: 'authentification',
            message: 'Déconnexion' 
          });
          if (fb.auth) {
            await signOut(fb.auth);
          }
        }
      } catch (err) {
        console.error('Erreur déconnexion:', err);
      }
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    });
  }

  // Gérer l'état actif des liens de navigation et le routage
  const hashNav = location.hash || '#/gestion-generale';
  const navUtilisateurs = document.getElementById('nav-utilisateurs-gestion');
  const navRoles = document.getElementById('nav-roles-gestion');
  if (hashNav === '#/gestion-generale/roles') {
    // Afficher la page Rôles
    viewRolesGestionGenerale(root);
    if (navRoles) navRoles.classList.add('active');
    if (navUtilisateurs) navUtilisateurs.classList.remove('active');
    return;
  } else {
    // Page Utilisateurs par défaut
    if (navUtilisateurs) navUtilisateurs.classList.add('active');
    if (navRoles) navRoles.classList.remove('active');
  }

  let usersCache = [];
  let rolesCache = [];

  // Fonction pour formater les nombres
  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  // Créer automatiquement les rôles basés sur les espaces
  async function ensureSpaceRoles() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const spaceRoles = [
        {
          name: 'Espace Entreprise',
          description: 'Accès à l\'espace Entreprise uniquement',
          permissions: {
            entreprise: true,
            employe: false,
            illegale: false,
            'gestion-generale': false
          }
        },
        {
          name: 'Espace Employé',
          description: 'Accès à l\'espace Employé uniquement',
          permissions: {
            entreprise: false,
            employe: true,
            illegale: false,
            'gestion-generale': false
          }
        },
        {
          name: 'Espace Illégale',
          description: 'Accès à l\'espace Illégale uniquement',
          permissions: {
            entreprise: false,
            employe: false,
            illegale: true,
            'gestion-generale': false
          }
        },
        {
          name: 'Espace Gestion Générale',
          description: 'Accès à l\'espace Gestion Générale uniquement',
          permissions: {
            entreprise: false,
            employe: false,
            illegale: false,
            'gestion-generale': true
          }
        },
        {
          name: 'Espace All',
          description: 'Accès à tous les espaces',
          permissions: {
            entreprise: true,
            employe: true,
            illegale: true,
            'gestion-generale': true
          }
        }
      ];
      
      const existingRolesSnap = await getDocs(collection(fb.db, 'roles'));
      const existingRoles = existingRolesSnap.docs.map(d => d.data().name);
      
      for (const roleData of spaceRoles) {
        if (!existingRoles.includes(roleData.name)) {
          const roleQuery = query(collection(fb.db, 'roles'), where('name', '==', roleData.name));
          const roleSnap = await getDocs(roleQuery);
          
          if (roleSnap.empty) {
            await addDoc(collection(fb.db, 'roles'), {
              ...roleData,
              createdAt: serverTimestamp()
            });
          }
        }
      }
    } catch (e) {
      console.error('Erreur création rôles automatiques:', e);
    }
  }

  // Afficher les utilisateurs
  function displayUsers(users) {
    const tbody = document.getElementById('users-gestion-tbody');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucun utilisateur trouvé</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => {
      // Récupérer les rôles par espace (ignorer les chaînes vides "")
      const roleGestionGenerale = user.roleGestionGenerale && user.roleGestionGenerale !== "" ? rolesCache.find(r => r.id === user.roleGestionGenerale) : null;
      const roleEntreprise = user.roleEntreprise && user.roleEntreprise !== "" ? rolesCache.find(r => r.id === user.roleEntreprise) : null;
      const roleEmploye = user.roleEmploye && user.roleEmploye !== "" ? rolesCache.find(r => r.id === user.roleEmploye) : null;
      const roleIllegale = user.roleIllegale && user.roleIllegale !== "" ? rolesCache.find(r => r.id === user.roleIllegale) : null;
      
      // Construire la liste des rôles par espace
      const rolesParEspace = [];
      if (roleEntreprise) rolesParEspace.push(`${roleEntreprise.name || '—'} <span class="text-xs opacity-70">(Entreprise)</span>`);
      if (roleEmploye) rolesParEspace.push(`${roleEmploye.name || '—'} <span class="text-xs opacity-70">(Employé)</span>`);
      if (roleIllegale) rolesParEspace.push(`${roleIllegale.name || '—'} <span class="text-xs opacity-70">(Illégale)</span>`);
      if (roleGestionGenerale) rolesParEspace.push(`${roleGestionGenerale.name || '—'} <span class="text-xs opacity-70">(Gestion Générale)</span>`);
      
      const rolesDisplay = rolesParEspace.length > 0 
        ? `<div class="flex flex-col gap-1">${rolesParEspace.map(r => `<span class="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${r}</span>`).join('')}</div>`
        : '<span class="text-xs text-slate-400">—</span>';
      
      // Construire la liste des espaces accessibles (basée sur les rôles)
      // Un utilisateur a accès à un espace s'il a un rôle pour cet espace (même si c'est une chaîne vide "")
      const espacesAccessibles = [];
      if (user.roleEntreprise !== null && user.roleEntreprise !== undefined) espacesAccessibles.push('<span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Entreprise</span>');
      if (user.roleEmploye !== null && user.roleEmploye !== undefined) espacesAccessibles.push('<span class="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Employé</span>');
      if (user.roleIllegale !== null && user.roleIllegale !== undefined) espacesAccessibles.push('<span class="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Illégale</span>');
      if (user.roleGestionGenerale !== null && user.roleGestionGenerale !== undefined) espacesAccessibles.push('<span class="px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">Gestion Générale</span>');
      
      const espacesDisplay = espacesAccessibles.length > 0 
        ? `<div class="flex flex-wrap gap-1">${espacesAccessibles.join('')}</div>`
        : '<span class="text-xs text-slate-400">—</span>';

      const statusBadge = user.active !== false 
        ? '<span class="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Actif</span>'
        : '<span class="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Inactif</span>';

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-white/5">
          <td>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                ${getInitials(user.name || user.email)}
              </div>
              <div>
                <div class="font-medium">${user.name || '—'}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">${user.email || '—'}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="text-sm">${user.phone || '—'}</div>
          </td>
          <td>
            ${rolesDisplay}
          </td>
          <td>
            ${espacesDisplay}
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <div class="action-buttons flex gap-2">
              <button class="btn-edit-user action-btn text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" data-user-id="${user.id}">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-delete-user action-btn text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" data-user-id="${user.id}">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filtrer les utilisateurs
  function applyFilters() {
    const searchTerm = (document.getElementById('user-search-gestion')?.value || '').toLowerCase();
    const espaceFilter = document.getElementById('espace-filter-gestion')?.value || '';

    let filtered = usersCache.filter(user => {
      const matchesSearch = !searchTerm || 
        (user.name || '').toLowerCase().includes(searchTerm) ||
        (user.email || '').toLowerCase().includes(searchTerm) ||
        (user.phone || '').includes(searchTerm);

      let matchesEspace = true;
      if (espaceFilter) {
        // Vérifier si l'utilisateur a un rôle pour cet espace
        if (espaceFilter === 'entreprise') {
          matchesEspace = !!user.roleEntreprise;
        } else if (espaceFilter === 'employe') {
          matchesEspace = !!user.roleEmploye;
        } else if (espaceFilter === 'illegale') {
          matchesEspace = !!user.roleIllegale;
        } else if (espaceFilter === 'gestion-generale') {
          matchesEspace = !!user.roleGestionGenerale;
        }
      }

      return matchesSearch && matchesEspace;
    });

    displayUsers(filtered);
    
    // Mettre à jour les statistiques
    const totalUsers = usersCache.length;
    const activeUsers = usersCache.filter(u => u.active !== false).length;
    const entrepriseUsers = usersCache.filter(u => !!u.roleEntreprise).length;
    const illegaleUsers = usersCache.filter(u => !!u.roleIllegale).length;

    const statTotal = document.getElementById('stat-total-users-gestion');
    const statActive = document.getElementById('stat-active-users-gestion');
    const statEntreprise = document.getElementById('stat-acces-entreprise-gestion');
    const statIllegale = document.getElementById('stat-acces-illegale-gestion');

    if (statTotal) statTotal.textContent = formatNumber(totalUsers);
    if (statActive) statActive.textContent = formatNumber(activeUsers);
    if (statEntreprise) statEntreprise.textContent = formatNumber(entrepriseUsers);
    if (statIllegale) statIllegale.textContent = formatNumber(illegaleUsers);
  }

  // Charger les utilisateurs
  async function loadUsers() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      const snap = await getDocs(collection(fb.db, 'users'));
      usersCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyFilters();
    } catch (e) {
      console.error('Erreur chargement utilisateurs:', e);
    }
  }

  // Charger les rôles
  async function loadRoles() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      const snap = await getDocs(collection(fb.db, 'roles'));
      rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Erreur chargement rôles:', e);
    }
  }

  // Event listeners
  const searchInput = document.getElementById('user-search-gestion');
  const espaceFilter = document.getElementById('espace-filter-gestion');
  const refreshBtn = document.getElementById('btn-refresh-gestion');

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (espaceFilter) {
    espaceFilter.addEventListener('change', applyFilters);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadRoles();
      await loadUsers();
    });
  }

  // Gestion de la création d'utilisateur
  const btnNewUser = document.getElementById('btn-new-user-gestion');
  if (btnNewUser) {
    btnNewUser.addEventListener('click', () => {
      const body = `
        <div class="modal-field">
          <label>Nom complet *</label>
          <input id="modal-name-new" type="text" required placeholder="Jean Dupont" />
        </div>
        <div class="modal-field">
          <label>Email *</label>
          <input id="modal-email-new" type="email" required placeholder="jean.dupont@example.com" />
        </div>
        <div class="modal-field">
          <label>Téléphone</label>
          <input id="modal-phone-new" type="tel" placeholder="0612345678" />
        </div>
        <div class="modal-field">
          <label>Accès Espaces *</label>
          <div class="mb-3 mt-3">
            <label class="relative flex items-center p-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 cursor-pointer transition-all hover:border-indigo-400 dark:hover:border-indigo-500 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 group" id="label-acces-all-new">
              <input type="checkbox" id="modal-acces-all-new" value="all" class="sr-only peer" />
              <div class="flex items-center gap-3 flex-1">
                <div class="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 flex items-center justify-center transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 dark:peer-checked:bg-indigo-500 dark:peer-checked:border-indigo-500 group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
                  <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-semibold text-slate-900 dark:text-white">Accès All</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Tous les espaces</div>
                </div>
              </div>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="relative flex items-center p-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 group" id="label-acces-entreprise-new">
              <input type="checkbox" id="modal-acces-entreprise-new" value="entreprise" class="sr-only peer" />
              <div class="flex items-center gap-3 flex-1">
                <div class="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 flex items-center justify-center transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 dark:peer-checked:bg-blue-500 dark:peer-checked:border-blue-500 group-hover:border-blue-400 dark:group-hover:border-blue-500">
                  <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-900 dark:text-white">Entreprise</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Gestion d'entreprise</div>
                </div>
              </div>
            </label>
            <label class="relative flex items-center p-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer transition-all hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 group" id="label-acces-employe-new">
              <input type="checkbox" id="modal-acces-employe-new" value="employe" class="sr-only peer" />
              <div class="flex items-center gap-3 flex-1">
                <div class="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 flex items-center justify-center transition-all peer-checked:bg-green-600 peer-checked:border-green-600 dark:peer-checked:bg-green-500 dark:peer-checked:border-green-500 group-hover:border-green-400 dark:group-hover:border-green-500">
                  <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-900 dark:text-white">Employé</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Espace employé</div>
                </div>
              </div>
            </label>
            <label class="relative flex items-center p-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer transition-all hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 group" id="label-acces-illegale-new">
              <input type="checkbox" id="modal-acces-illegale-new" value="illegale" class="sr-only peer" />
              <div class="flex items-center gap-3 flex-1">
                <div class="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 flex items-center justify-center transition-all peer-checked:bg-red-600 peer-checked:border-red-600 dark:peer-checked:bg-red-500 dark:peer-checked:border-red-500 group-hover:border-red-400 dark:group-hover:border-red-500">
                  <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-900 dark:text-white">Illégale</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Points & armement</div>
                </div>
              </div>
            </label>
            <label class="relative flex items-center p-3 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer transition-all hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 group" id="label-acces-gestion-generale-new">
              <input type="checkbox" id="modal-acces-gestion-generale-new" value="gestion-generale" class="sr-only peer" />
              <div class="flex items-center gap-3 flex-1">
                <div class="w-5 h-5 rounded border-2 border-slate-300 dark:border-white/20 flex items-center justify-center transition-all peer-checked:bg-purple-600 peer-checked:border-purple-600 dark:peer-checked:bg-purple-500 dark:peer-checked:border-purple-500 group-hover:border-purple-400 dark:group-hover:border-purple-500">
                  <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-900 dark:text-white">Gestion Générale</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Administration</div>
                </div>
              </div>
            </label>
          </div>
          <p class="text-xs text-slate-500 mt-3">Sélectionnez au moins un espace.</p>
        </div>
        <div class="modal-field" id="field-role-gestion-generale-new" style="display: none;">
          <label>Rôle (Espace Gestion Générale)</label>
          <select id="modal-role-gestion-generale-new">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div class="modal-field" id="field-role-entreprise-new" style="display: none;">
          <label>Rôle (Espace Entreprise)</label>
          <select id="modal-role-entreprise-new">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div class="modal-field" id="field-role-employe-new" style="display: none;">
          <label>Rôle (Espace Employé)</label>
          <select id="modal-role-employe-new">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div class="modal-field" id="field-role-illegale-new" style="display: none;">
          <label>Rôle (Espace Illégale)</label>
          <select id="modal-role-illegale-new">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Mot de passe initial *</label>
          <input id="modal-password-new" type="password" required placeholder="Minimum 6 caractères" minlength="6" />
          <p class="text-xs text-slate-500 mt-1">Communiquez ce mot de passe à l'utilisateur.</p>
        </div>
      `;
      const modal = createModal({
        title: 'Nouvel utilisateur',
        body,
        confirmText: 'Créer',
        onConfirm: async () => {
          const fb = getFirebase();
          const name = document.getElementById('modal-name-new').value.trim();
          const email = document.getElementById('modal-email-new').value.trim().toLowerCase();
          const phone = document.getElementById('modal-phone-new').value.trim();
          const password = document.getElementById('modal-password-new').value;
          
          // Récupérer les espaces sélectionnés
          const accesAll = document.getElementById('modal-acces-all-new').checked;
          const accesEntreprise = accesAll || document.getElementById('modal-acces-entreprise-new').checked;
          const accesEmploye = accesAll || document.getElementById('modal-acces-employe-new').checked;
          const accesIllegale = accesAll || document.getElementById('modal-acces-illegale-new').checked;
          const accesGestionGenerale = accesAll || document.getElementById('modal-acces-gestion-generale-new').checked;
          
          // Récupérer les rôles sélectionnés pour chaque espace
          const roleGestionGenerale = accesGestionGenerale ? (document.getElementById('modal-role-gestion-generale-new').value || null) : null;
          const roleEntreprise = accesEntreprise ? (document.getElementById('modal-role-entreprise-new').value || null) : null;
          const roleEmploye = accesEmploye ? (document.getElementById('modal-role-employe-new').value || null) : null;
          const roleIllegale = accesIllegale ? (document.getElementById('modal-role-illegale-new').value || null) : null;
          
          const selectedEspaces = [];
          if (accesEntreprise) selectedEspaces.push('entreprise');
          if (accesEmploye) selectedEspaces.push('employe');
          if (accesIllegale) selectedEspaces.push('illegale');
          if (accesGestionGenerale) selectedEspaces.push('gestion-generale');
          
          if (!name || !email) {
            alertModal({ title: 'Champs requis', message: 'Veuillez remplir tous les champs obligatoires.', type: 'warning' });
            return;
          }
          
          if (selectedEspaces.length === 0) {
            alertModal({ title: 'Champs requis', message: 'Veuillez sélectionner au moins un espace.', type: 'warning' });
            return;
          }
          
          // Les rôles sont optionnels - pas de validation nécessaire
          
          if (password.length < 6) {
            alertModal({ title: 'Erreur', message: 'Le mot de passe doit contenir au moins 6 caractères.', type: 'error' });
            return;
          }
          
          try {
            // Créer l'utilisateur dans Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(fb.auth, email, password);
            const uid = userCredential.user.uid;
            
            // Créer le document utilisateur dans Firestore avec les rôles par espace
            const userData = {
              name,
              email,
              phone: phone || null,
              active: true,
              createdAt: serverTimestamp()
            };
            
            // Sauvegarder les espaces selon les sélections (même si aucun rôle n'est sélectionné)
            // Si un espace est sélectionné, on sauvegarde le rôle (ou "" si aucun rôle choisi pour indiquer l'accès)
            if (accesGestionGenerale) {
              userData.roleGestionGenerale = roleGestionGenerale || "";
            }
            if (accesEntreprise) {
              userData.roleEntreprise = roleEntreprise || "";
            }
            if (accesEmploye) {
              userData.roleEmploye = roleEmploye || "";
            }
            if (accesIllegale) {
              userData.roleIllegale = roleIllegale || "";
            }
            
            await setDoc(doc(fb.db, 'users', uid), userData);
            
            await addLogEntry(fb, {
              type: 'action',
              action: 'user_create',
              category: 'gestion-generale',
              message: `Création de l'utilisateur "${name}"`
            });
            
            alertModal({
              title: 'Succès',
              message: 'Utilisateur créé avec succès',
              type: 'success'
            });
            
            await loadUsers();
          } catch (err) {
            console.error('Erreur création utilisateur:', err);
            let errorMsg = 'Erreur lors de la création de l\'utilisateur';
            if (err.code === 'auth/email-already-in-use') {
              errorMsg = 'Cet email est déjà utilisé';
            } else if (err.code === 'auth/invalid-email') {
              errorMsg = 'Email invalide';
            } else if (err.code === 'auth/weak-password') {
              errorMsg = 'Mot de passe trop faible';
            }
            alertModal({ title: 'Erreur', message: errorMsg, type: 'error' });
          }
        }
      });
      
      // Fonction pour mettre à jour l'affichage des champs de rôles selon les espaces sélectionnés (pour création)
      function updateRoleFieldsVisibilityNew() {
        const accesAll = document.getElementById('modal-acces-all-new')?.checked || false;
        const accesEntreprise = accesAll || document.getElementById('modal-acces-entreprise-new')?.checked || false;
        const accesEmploye = accesAll || document.getElementById('modal-acces-employe-new')?.checked || false;
        const accesIllegale = accesAll || document.getElementById('modal-acces-illegale-new')?.checked || false;
        const accesGestionGenerale = accesAll || document.getElementById('modal-acces-gestion-generale-new')?.checked || false;
        
        // Afficher/masquer les champs de rôles selon les espaces sélectionnés
        const fieldGestionGenerale = document.getElementById('field-role-gestion-generale-new');
        const fieldEntreprise = document.getElementById('field-role-entreprise-new');
        const fieldEmploye = document.getElementById('field-role-employe-new');
        const fieldIllegale = document.getElementById('field-role-illegale-new');
        
        if (fieldGestionGenerale) fieldGestionGenerale.style.display = accesGestionGenerale ? 'block' : 'none';
        if (fieldEntreprise) fieldEntreprise.style.display = accesEntreprise ? 'block' : 'none';
        if (fieldEmploye) fieldEmploye.style.display = accesEmploye ? 'block' : 'none';
        if (fieldIllegale) fieldIllegale.style.display = accesIllegale ? 'block' : 'none';
        
        // Remplir les listes déroulantes de rôles pour chaque espace
        const rolesGestionGenerale = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['gestion-generale'] === true;
        });
        const rolesEntreprise = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['entreprise'] === true;
        });
        const rolesEmploye = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['employe'] === true;
        });
        const rolesIllegale = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['illegale'] === true;
        });
        
        // Remplir les selects
        const selectGestionGenerale = document.getElementById('modal-role-gestion-generale-new');
        const selectEntreprise = document.getElementById('modal-role-entreprise-new');
        const selectEmploye = document.getElementById('modal-role-employe-new');
        const selectIllegale = document.getElementById('modal-role-illegale-new');
        
        if (selectGestionGenerale) {
          selectGestionGenerale.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesGestionGenerale.map(role => `<option value="${role.id}">${role.name || '—'}</option>`).join('');
        }
        if (selectEntreprise) {
          selectEntreprise.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesEntreprise.map(role => `<option value="${role.id}">${role.name || '—'}</option>`).join('');
        }
        if (selectEmploye) {
          selectEmploye.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesEmploye.map(role => `<option value="${role.id}">${role.name || '—'}</option>`).join('');
        }
        if (selectIllegale) {
          selectIllegale.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesIllegale.map(role => `<option value="${role.id}">${role.name || '—'}</option>`).join('');
        }
      }
      
      // Ajouter les gestionnaires d'événements pour mettre à jour les styles des labels et la liste des rôles
      setTimeout(() => {
        const checkboxes = ['modal-acces-all-new', 'modal-acces-entreprise-new', 'modal-acces-employe-new', 'modal-acces-illegale-new', 'modal-acces-gestion-generale-new'];
        const labelMap = {
          'modal-acces-all-new': { label: 'label-acces-all-new', color: 'indigo' },
          'modal-acces-entreprise-new': { label: 'label-acces-entreprise-new', color: 'blue' },
          'modal-acces-employe-new': { label: 'label-acces-employe-new', color: 'green' },
          'modal-acces-illegale-new': { label: 'label-acces-illegale-new', color: 'red' },
          'modal-acces-gestion-generale-new': { label: 'label-acces-gestion-generale-new', color: 'purple' }
        };
        
        const allCheckbox = document.getElementById('modal-acces-all-new');
        const spaceCheckboxes = ['modal-acces-entreprise-new', 'modal-acces-employe-new', 'modal-acces-illegale-new', 'modal-acces-gestion-generale-new'];
        
        // Fonction pour mettre à jour le style d'une checkbox
        function updateCheckboxStyle(checkboxId, labelId, color, isChecked) {
          const checkbox = document.getElementById(checkboxId);
          const label = document.getElementById(labelId);
          if (!checkbox || !label) return;
          
          const checkboxIcon = label.querySelector('.w-5.h-5');
          const svgIcon = label.querySelector('svg');
          
          if (isChecked) {
            // Mettre à jour le label
            if (color === 'indigo') {
              label.classList.remove('border-slate-200', 'dark:border-white/10');
              label.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-500/10');
            } else {
              label.classList.remove('border-slate-200', 'dark:border-white/10', 'bg-white', 'dark:bg-white/5');
              label.classList.add(`border-${color}-500`, `bg-${color}-50`, `dark:bg-${color}-500/10`);
            }
            // Mettre à jour la checkbox
            if (checkboxIcon) {
              checkboxIcon.classList.remove('border-slate-300', 'dark:border-white/20');
              checkboxIcon.classList.add(`bg-${color}-600`, `border-${color}-600`, `dark:bg-${color}-500`, `dark:border-${color}-500`);
            }
            // Afficher la coche
            if (svgIcon) {
              svgIcon.classList.remove('opacity-0');
              svgIcon.classList.add('opacity-100');
            }
          } else {
            // Mettre à jour le label
            if (color === 'indigo') {
              label.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-500/10');
              label.classList.add('border-slate-200', 'dark:border-white/10');
            } else {
              label.classList.remove(`border-${color}-500`, `bg-${color}-50`, `dark:bg-${color}-500/10`);
              label.classList.add('border-slate-200', 'dark:border-white/10', 'bg-white', 'dark:bg-white/5');
            }
            // Mettre à jour la checkbox
            if (checkboxIcon) {
              checkboxIcon.classList.remove(`bg-${color}-600`, `border-${color}-600`, `dark:bg-${color}-500`, `dark:border-${color}-500`);
              checkboxIcon.classList.add('border-slate-300', 'dark:border-white/20');
            }
            // Cacher la coche
            if (svgIcon) {
              svgIcon.classList.remove('opacity-100');
              svgIcon.classList.add('opacity-0');
            }
          }
        }
        
        // Gestionnaire pour "Accès All" - coche automatiquement tous les espaces
        if (allCheckbox) {
          allCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            updateCheckboxStyle('modal-acces-all-new', 'label-acces-all-new', 'indigo', isChecked);
            
            // Cocher/décocher automatiquement tous les espaces
            const entrepriseCheckbox = document.getElementById('modal-acces-entreprise-new');
            const employeCheckbox = document.getElementById('modal-acces-employe-new');
            const illegaleCheckbox = document.getElementById('modal-acces-illegale-new');
            const gestionGeneraleCheckbox = document.getElementById('modal-acces-gestion-generale-new');
            
            if (entrepriseCheckbox) {
              entrepriseCheckbox.checked = isChecked;
              updateCheckboxStyle('modal-acces-entreprise-new', 'label-acces-entreprise-new', 'blue', isChecked);
            }
            if (employeCheckbox) {
              employeCheckbox.checked = isChecked;
              updateCheckboxStyle('modal-acces-employe-new', 'label-acces-employe-new', 'green', isChecked);
            }
            if (illegaleCheckbox) {
              illegaleCheckbox.checked = isChecked;
              updateCheckboxStyle('modal-acces-illegale-new', 'label-acces-illegale-new', 'red', isChecked);
            }
            if (gestionGeneraleCheckbox) {
              gestionGeneraleCheckbox.checked = isChecked;
              updateCheckboxStyle('modal-acces-gestion-generale-new', 'label-acces-gestion-generale-new', 'purple', isChecked);
            }
            
            updateRoleFieldsVisibilityNew();
          });
        }
        
        // Gestionnaires pour les espaces individuels
        spaceCheckboxes.forEach(id => {
          const checkbox = document.getElementById(id);
          const labelInfo = labelMap[id];
          if (checkbox && labelInfo) {
            checkbox.addEventListener('change', (e) => {
              updateCheckboxStyle(id, labelInfo.label, labelInfo.color, e.target.checked);
              updateRoleFieldsVisibilityNew();
            });
          }
        });
        
        // Initialiser l'affichage des champs de rôles
        updateRoleFieldsVisibilityNew();
        
        // Initialiser les styles pour les checkboxes pré-cochées (si nécessaire)
        if (allCheckbox && allCheckbox.checked) {
          updateCheckboxStyle('modal-acces-all-new', 'label-acces-all-new', 'indigo', true);
        }
        spaceCheckboxes.forEach(id => {
          const checkbox = document.getElementById(id);
          const labelInfo = labelMap[id];
          if (checkbox && checkbox.checked && labelInfo) {
            updateCheckboxStyle(id, labelInfo.label, labelInfo.color, true);
          }
        });
        
        // Initialiser la liste des rôles
        updateRoleSelect();
      }, 100);
    });
  }

  // Gestion des actions utilisateur (modifier, supprimer)
  const page = document.querySelector('.page-card');
  page.addEventListener('click', async (e) => {
    const container = e.target.closest('.action-buttons');
    if (!container) return;
    
    const userId = container.querySelector('.action-btn')?.dataset?.userId;
    if (!userId) return;
    
    const user = usersCache.find(u => u.id === userId);
    if (!user) return;

    if (e.target.closest('.btn-edit-user')) {
      // Récupérer les rôles actuels de l'utilisateur
      const hasRoleGestionGenerale = !!user.roleGestionGenerale;
      const hasRoleEntreprise = !!user.roleEntreprise;
      const hasRoleEmploye = !!user.roleEmploye;
      const hasRoleIllegale = !!user.roleIllegale;
      
      const body = `
        <div class="modal-field">
          <label>Nom complet *</label>
          <input id="modal-name-edit" type="text" required value="${user.name || ''}" />
        </div>
        <div class="modal-field">
          <label>Email *</label>
          <input id="modal-email-edit" type="email" required value="${user.email || ''}" />
        </div>
        <div class="modal-field">
          <label>Téléphone</label>
          <input id="modal-phone-edit" type="tel" value="${user.phone || ''}" />
        </div>
        
        <div class="modal-field">
          <label class="text-sm font-semibold mb-3 block">Accès aux Espaces *</label>
          <div class="grid grid-cols-2 gap-3">
            <label id="label-acces-all-edit" for="modal-acces-all-edit" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <div class="relative flex items-center">
                <input type="checkbox" id="modal-acces-all-edit" class="sr-only" />
                <div class="w-5 h-5 border-2 border-slate-300 dark:border-white/20 rounded flex items-center justify-center transition-colors">
                  <svg class="w-3 h-3 text-white opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span class="text-sm font-medium">Tous les espaces</span>
            </label>
            
            <label id="label-acces-entreprise-edit" for="modal-acces-entreprise-edit" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <div class="relative flex items-center">
                <input type="checkbox" id="modal-acces-entreprise-edit" class="sr-only" />
                <div class="w-5 h-5 border-2 border-slate-300 dark:border-white/20 rounded flex items-center justify-center transition-colors">
                  <svg class="w-3 h-3 text-white opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span class="text-sm font-medium">Entreprise</span>
            </label>
            
            <label id="label-acces-employe-edit" for="modal-acces-employe-edit" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <div class="relative flex items-center">
                <input type="checkbox" id="modal-acces-employe-edit" class="sr-only" />
                <div class="w-5 h-5 border-2 border-slate-300 dark:border-white/20 rounded flex items-center justify-center transition-colors">
                  <svg class="w-3 h-3 text-white opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span class="text-sm font-medium">Employé</span>
            </label>
            
            <label id="label-acces-illegale-edit" for="modal-acces-illegale-edit" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <div class="relative flex items-center">
                <input type="checkbox" id="modal-acces-illegale-edit" class="sr-only" />
                <div class="w-5 h-5 border-2 border-slate-300 dark:border-white/20 rounded flex items-center justify-center transition-colors">
                  <svg class="w-3 h-3 text-white opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span class="text-sm font-medium">Illégale</span>
            </label>
            
            <label id="label-acces-gestion-generale-edit" for="modal-acces-gestion-generale-edit" class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              <div class="relative flex items-center">
                <input type="checkbox" id="modal-acces-gestion-generale-edit" class="sr-only" />
                <div class="w-5 h-5 border-2 border-slate-300 dark:border-white/20 rounded flex items-center justify-center transition-colors">
                  <svg class="w-3 h-3 text-white opacity-0 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span class="text-sm font-medium">Gestion Générale</span>
            </label>
          </div>
        </div>
        
        <div id="field-role-gestion-generale-edit" class="modal-field" style="display: none;">
          <label>Rôle (Espace Gestion Générale)</label>
          <select id="modal-role-gestion-generale-edit">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div id="field-role-entreprise-edit" class="modal-field" style="display: none;">
          <label>Rôle (Espace Entreprise)</label>
          <select id="modal-role-entreprise-edit">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div id="field-role-employe-edit" class="modal-field" style="display: none;">
          <label>Rôle (Espace Employé)</label>
          <select id="modal-role-employe-edit">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        <div id="field-role-illegale-edit" class="modal-field" style="display: none;">
          <label>Rôle (Espace Illégale)</label>
          <select id="modal-role-illegale-edit">
            <option value="">Aucun rôle</option>
          </select>
        </div>
        
        <div class="modal-field">
          <label>Statut</label>
          <select id="modal-active-edit">
            <option value="true" ${user.active !== false ? 'selected' : ''}>Actif</option>
            <option value="false" ${user.active === false ? 'selected' : ''}>Inactif</option>
          </select>
        </div>
      `;
      const modal = createModal({
        title: 'Modifier l\'utilisateur',
        body,
        confirmText: 'Enregistrer',
        onConfirm: async () => {
          const fb = getFirebase();
          const name = document.getElementById('modal-name-edit').value.trim();
          const email = document.getElementById('modal-email-edit').value.trim().toLowerCase();
          const phone = document.getElementById('modal-phone-edit').value.trim();
          const active = document.getElementById('modal-active-edit').value === 'true';
          
          // Récupérer les espaces sélectionnés
          const accesAll = document.getElementById('modal-acces-all-edit').checked;
          const accesEntreprise = accesAll || document.getElementById('modal-acces-entreprise-edit').checked;
          const accesEmploye = accesAll || document.getElementById('modal-acces-employe-edit').checked;
          const accesIllegale = accesAll || document.getElementById('modal-acces-illegale-edit').checked;
          const accesGestionGenerale = accesAll || document.getElementById('modal-acces-gestion-generale-edit').checked;
          
          // Récupérer les rôles sélectionnés pour chaque espace
          const roleGestionGenerale = accesGestionGenerale ? (document.getElementById('modal-role-gestion-generale-edit').value || null) : null;
          const roleEntreprise = accesEntreprise ? (document.getElementById('modal-role-entreprise-edit').value || null) : null;
          const roleEmploye = accesEmploye ? (document.getElementById('modal-role-employe-edit').value || null) : null;
          const roleIllegale = accesIllegale ? (document.getElementById('modal-role-illegale-edit').value || null) : null;
          
          const selectedEspaces = [];
          if (accesEntreprise) selectedEspaces.push('entreprise');
          if (accesEmploye) selectedEspaces.push('employe');
          if (accesIllegale) selectedEspaces.push('illegale');
          if (accesGestionGenerale) selectedEspaces.push('gestion-generale');
          
          if (!name || !email) {
            alertModal({ title: 'Champs requis', message: 'Veuillez remplir tous les champs obligatoires.', type: 'warning' });
            return;
          }
          
          if (selectedEspaces.length === 0) {
            alertModal({ title: 'Champs requis', message: 'Veuillez sélectionner au moins un espace.', type: 'warning' });
            return;
          }
          
          // Les rôles sont optionnels - pas de validation nécessaire
          
          try {
            // Mettre à jour l'utilisateur avec les rôles par espace
            const userData = {
              name,
              email,
              phone: phone || null,
              active
            };
            
            // Mettre à jour les rôles selon les espaces sélectionnés
            // Si un espace est sélectionné, on garde le rôle (ou une chaîne vide "" si aucun rôle choisi pour indiquer l'accès)
            // Si un espace n'est pas sélectionné, on met le rôle à null pour supprimer l'accès
            if (accesGestionGenerale) {
              // Si un rôle est sélectionné, on le sauvegarde, sinon on met "" pour indiquer l'accès sans rôle
              userData.roleGestionGenerale = roleGestionGenerale || "";
            } else {
              userData.roleGestionGenerale = null;
            }
            if (accesEntreprise) {
              userData.roleEntreprise = roleEntreprise || "";
            } else {
              userData.roleEntreprise = null;
            }
            if (accesEmploye) {
              userData.roleEmploye = roleEmploye || "";
            } else {
              userData.roleEmploye = null;
            }
            if (accesIllegale) {
              userData.roleIllegale = roleIllegale || "";
            } else {
              userData.roleIllegale = null;
            }
            
            await updateDoc(doc(fb.db, 'users', userId), userData);
            
            // Mettre à jour le cache du profil si c'est l'utilisateur connecté
            const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
            if (authState && authState.uid === userId) {
              // Recharger le profil pour mettre à jour le cache
              await loadUserProfile();
              // Déclencher un événement pour mettre à jour la navigation
              window.dispatchEvent(new CustomEvent('profile:updated'));
            }
            
            await addLogEntry(fb, {
              type: 'action',
              action: 'user_update',
              category: 'gestion-generale',
              message: `Modification de l'utilisateur "${name}"`
            });
            
            alertModal({
              title: 'Succès',
              message: 'Utilisateur modifié avec succès',
              type: 'success'
            });
            
            await loadUsers();
          } catch (err) {
            console.error('Erreur modification utilisateur:', err);
            alertModal({ title: 'Erreur', message: 'Erreur lors de la modification de l\'utilisateur', type: 'error' });
          }
        }
      });
      
      // Fonction pour mettre à jour l'affichage des champs de rôles selon les espaces sélectionnés (pour édition)
      function updateRoleFieldsVisibilityEdit() {
        const accesAll = document.getElementById('modal-acces-all-edit')?.checked || false;
        const accesEntreprise = accesAll || document.getElementById('modal-acces-entreprise-edit')?.checked || false;
        const accesEmploye = accesAll || document.getElementById('modal-acces-employe-edit')?.checked || false;
        const accesIllegale = accesAll || document.getElementById('modal-acces-illegale-edit')?.checked || false;
        const accesGestionGenerale = accesAll || document.getElementById('modal-acces-gestion-generale-edit')?.checked || false;
        
        // Afficher/masquer les champs de rôles selon les espaces sélectionnés
        const fieldGestionGenerale = document.getElementById('field-role-gestion-generale-edit');
        const fieldEntreprise = document.getElementById('field-role-entreprise-edit');
        const fieldEmploye = document.getElementById('field-role-employe-edit');
        const fieldIllegale = document.getElementById('field-role-illegale-edit');
        
        if (fieldGestionGenerale) fieldGestionGenerale.style.display = accesGestionGenerale ? 'block' : 'none';
        if (fieldEntreprise) fieldEntreprise.style.display = accesEntreprise ? 'block' : 'none';
        if (fieldEmploye) fieldEmploye.style.display = accesEmploye ? 'block' : 'none';
        if (fieldIllegale) fieldIllegale.style.display = accesIllegale ? 'block' : 'none';
        
        // Remplir les listes déroulantes de rôles pour chaque espace
        const rolesGestionGenerale = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['gestion-generale'] === true;
        });
        const rolesEntreprise = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['entreprise'] === true;
        });
        const rolesEmploye = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['employe'] === true;
        });
        const rolesIllegale = rolesCache.filter(role => {
          const perms = role.permissions || {};
          return perms['illegale'] === true;
        });
        
        // Remplir les selects avec les valeurs actuelles de l'utilisateur
        const selectGestionGenerale = document.getElementById('modal-role-gestion-generale-edit');
        const selectEntreprise = document.getElementById('modal-role-entreprise-edit');
        const selectEmploye = document.getElementById('modal-role-employe-edit');
        const selectIllegale = document.getElementById('modal-role-illegale-edit');
        
        if (selectGestionGenerale && accesGestionGenerale) {
          const currentRoleId = user.roleGestionGenerale || '';
          selectGestionGenerale.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesGestionGenerale.map(role => `<option value="${role.id}" ${role.id === currentRoleId ? 'selected' : ''}>${role.name || '—'}</option>`).join('');
        }
        if (selectEntreprise && accesEntreprise) {
          const currentRoleId = user.roleEntreprise || '';
          selectEntreprise.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesEntreprise.map(role => `<option value="${role.id}" ${role.id === currentRoleId ? 'selected' : ''}>${role.name || '—'}</option>`).join('');
        }
        if (selectEmploye && accesEmploye) {
          const currentRoleId = user.roleEmploye || '';
          selectEmploye.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesEmploye.map(role => `<option value="${role.id}" ${role.id === currentRoleId ? 'selected' : ''}>${role.name || '—'}</option>`).join('');
        }
        if (selectIllegale && accesIllegale) {
          const currentRoleId = user.roleIllegale || '';
          selectIllegale.innerHTML = '<option value="">Aucun rôle</option>' +
            rolesIllegale.map(role => `<option value="${role.id}" ${role.id === currentRoleId ? 'selected' : ''}>${role.name || '—'}</option>`).join('');
        }
      }
      
      // Ajouter les gestionnaires d'événements pour mettre à jour les styles des labels et l'affichage des rôles
      setTimeout(() => {
        // Pré-cocher les espaces selon les rôles actuels de l'utilisateur
        // Un utilisateur a accès à un espace s'il a un rôle pour cet espace
        const hasRoleGestionGenerale = !!user.roleGestionGenerale;
        const hasRoleEntreprise = !!user.roleEntreprise;
        const hasRoleEmploye = !!user.roleEmploye;
        const hasRoleIllegale = !!user.roleIllegale;
        const hasAllRoles = hasRoleGestionGenerale && hasRoleEntreprise && hasRoleEmploye && hasRoleIllegale;
        
        const allCheckbox = document.getElementById('modal-acces-all-edit');
        const entrepriseCheckbox = document.getElementById('modal-acces-entreprise-edit');
        const employeCheckbox = document.getElementById('modal-acces-employe-edit');
        const illegaleCheckbox = document.getElementById('modal-acces-illegale-edit');
        const gestionGeneraleCheckbox = document.getElementById('modal-acces-gestion-generale-edit');
        
        // Fonction pour mettre à jour le style d'une checkbox
        function updateCheckboxStyleEdit(checkboxId, labelId, color, isChecked) {
          const checkbox = document.getElementById(checkboxId);
          const label = document.getElementById(labelId);
          if (!checkbox || !label) return;
          
          const checkboxIcon = label.querySelector('.w-5.h-5');
          const svgIcon = label.querySelector('svg');
          
          if (isChecked) {
            // Mettre à jour le label
            if (color === 'indigo') {
              label.classList.remove('border-slate-200', 'dark:border-white/10');
              label.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-500/10');
            } else {
              label.classList.remove('border-slate-200', 'dark:border-white/10', 'bg-white', 'dark:bg-white/5');
              label.classList.add(`border-${color}-500`, `bg-${color}-50`, `dark:bg-${color}-500/10`);
            }
            // Mettre à jour la checkbox
            if (checkboxIcon) {
              checkboxIcon.classList.remove('border-slate-300', 'dark:border-white/20');
              checkboxIcon.classList.add(`bg-${color}-600`, `border-${color}-600`, `dark:bg-${color}-500`, `dark:border-${color}-500`);
            }
            // Afficher la coche
            if (svgIcon) {
              svgIcon.classList.remove('opacity-0');
              svgIcon.classList.add('opacity-100');
            }
          } else {
            // Mettre à jour le label
            if (color === 'indigo') {
              label.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-500/10');
              label.classList.add('border-slate-200', 'dark:border-white/10');
            } else {
              label.classList.remove(`border-${color}-500`, `bg-${color}-50`, `dark:bg-${color}-500/10`);
              label.classList.add('border-slate-200', 'dark:border-white/10', 'bg-white', 'dark:bg-white/5');
            }
            // Mettre à jour la checkbox
            if (checkboxIcon) {
              checkboxIcon.classList.remove(`bg-${color}-600`, `border-${color}-600`, `dark:bg-${color}-500`, `dark:border-${color}-500`);
              checkboxIcon.classList.add('border-slate-300', 'dark:border-white/20');
            }
            // Cacher la coche
            if (svgIcon) {
              svgIcon.classList.remove('opacity-100');
              svgIcon.classList.add('opacity-0');
            }
          }
        }
        
        // Pré-cocher tous les espaces selon les rôles actuels
        if (allCheckbox && hasAllRoles) {
          allCheckbox.checked = true;
          updateCheckboxStyleEdit('modal-acces-all-edit', 'label-acces-all-edit', 'indigo', true);
        }
        if (entrepriseCheckbox) {
          entrepriseCheckbox.checked = hasRoleEntreprise;
          updateCheckboxStyleEdit('modal-acces-entreprise-edit', 'label-acces-entreprise-edit', 'blue', hasRoleEntreprise);
        }
        if (employeCheckbox) {
          employeCheckbox.checked = hasRoleEmploye;
          updateCheckboxStyleEdit('modal-acces-employe-edit', 'label-acces-employe-edit', 'green', hasRoleEmploye);
        }
        if (illegaleCheckbox) {
          illegaleCheckbox.checked = hasRoleIllegale;
          updateCheckboxStyleEdit('modal-acces-illegale-edit', 'label-acces-illegale-edit', 'red', hasRoleIllegale);
        }
        if (gestionGeneraleCheckbox) {
          gestionGeneraleCheckbox.checked = hasRoleGestionGenerale;
          updateCheckboxStyleEdit('modal-acces-gestion-generale-edit', 'label-acces-gestion-generale-edit', 'purple', hasRoleGestionGenerale);
        }
        
        // Initialiser l'affichage des champs de rôles
        updateRoleFieldsVisibilityEdit();
        
        const checkboxes = ['modal-acces-all-edit', 'modal-acces-entreprise-edit', 'modal-acces-employe-edit', 'modal-acces-illegale-edit', 'modal-acces-gestion-generale-edit'];
        const labelMap = {
          'modal-acces-all-edit': { label: 'label-acces-all-edit', color: 'indigo' },
          'modal-acces-entreprise-edit': { label: 'label-acces-entreprise-edit', color: 'blue' },
          'modal-acces-employe-edit': { label: 'label-acces-employe-edit', color: 'green' },
          'modal-acces-illegale-edit': { label: 'label-acces-illegale-edit', color: 'red' },
          'modal-acces-gestion-generale-edit': { label: 'label-acces-gestion-generale-edit', color: 'purple' }
        };
        
        const spaceCheckboxes = ['modal-acces-entreprise-edit', 'modal-acces-employe-edit', 'modal-acces-illegale-edit', 'modal-acces-gestion-generale-edit'];
        
        // Gestionnaire pour "Accès All" - coche automatiquement tous les espaces
        if (allCheckbox) {
          allCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            updateCheckboxStyleEdit('modal-acces-all-edit', 'label-acces-all-edit', 'indigo', isChecked);
            
            // Cocher/décocher automatiquement tous les espaces
            if (entrepriseCheckbox) {
              entrepriseCheckbox.checked = isChecked;
              updateCheckboxStyleEdit('modal-acces-entreprise-edit', 'label-acces-entreprise-edit', 'blue', isChecked);
            }
            if (employeCheckbox) {
              employeCheckbox.checked = isChecked;
              updateCheckboxStyleEdit('modal-acces-employe-edit', 'label-acces-employe-edit', 'green', isChecked);
            }
            if (illegaleCheckbox) {
              illegaleCheckbox.checked = isChecked;
              updateCheckboxStyleEdit('modal-acces-illegale-edit', 'label-acces-illegale-edit', 'red', isChecked);
            }
            if (gestionGeneraleCheckbox) {
              gestionGeneraleCheckbox.checked = isChecked;
              updateCheckboxStyleEdit('modal-acces-gestion-generale-edit', 'label-acces-gestion-generale-edit', 'purple', isChecked);
            }
            
            updateRoleFieldsVisibilityEdit();
          });
        }
        
        // Gestionnaires pour les espaces individuels
        spaceCheckboxes.forEach(id => {
          const checkbox = document.getElementById(id);
          const labelInfo = labelMap[id];
          if (checkbox && labelInfo) {
            checkbox.addEventListener('change', (e) => {
              updateCheckboxStyleEdit(id, labelInfo.label, labelInfo.color, e.target.checked);
              updateRoleFieldsVisibilityEdit();
            });
          }
        });
        
        // Initialiser les styles pour les checkboxes pré-cochées
        if (allCheckbox && allCheckbox.checked) {
          updateCheckboxStyleEdit('modal-acces-all-edit', 'label-acces-all-edit', 'indigo', true);
        }
        spaceCheckboxes.forEach(id => {
          const checkbox = document.getElementById(id);
          const labelInfo = labelMap[id];
          if (checkbox && checkbox.checked && labelInfo) {
            updateCheckboxStyleEdit(id, labelInfo.label, labelInfo.color, true);
          }
        });
        
        // Initialiser l'affichage des champs de rôles
        updateRoleFieldsVisibilityEdit();
      }, 100);
    }
    
    if (e.target.closest('.btn-delete-user')) {
      createModal({
        title: 'Supprimer l\'utilisateur',
        body: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
          try {
            const fb = getFirebase();
            if (!fb || !fb.db) return;
            
            // Supprimer le document utilisateur dans Firestore
            await deleteDoc(doc(fb.db, 'users', userId));
            
            // Note: On ne supprime pas l'utilisateur de Firebase Auth pour éviter les problèmes de sécurité
            // L'utilisateur pourra toujours se connecter mais n'aura plus accès à l'application
            
            await addLogEntry(fb, {
              type: 'action',
              action: 'user_delete',
              category: 'gestion-generale',
              message: `Suppression de l'utilisateur "${user.name}"`
            });
            
            alertModal({
              title: 'Succès',
              message: 'Utilisateur supprimé avec succès',
              type: 'success'
            });
            
            await loadUsers();
          } catch (err) {
            console.error('Erreur suppression utilisateur:', err);
            alertModal({ title: 'Erreur', message: 'Erreur lors de la suppression de l\'utilisateur', type: 'error' });
          }
        }
      });
    }
  });

  // Charger le profil et les données
  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Charger le profil
      let p = getCachedProfile();
      if (!p || !p.name) {
        p = await loadUserProfile() || {};
      }
      
      // Sidebar profile
      const av = document.getElementById('sb-avatar-gestion');
      updateAvatar(av, p);
      const nm = document.getElementById('sb-name-gestion');
      if (nm) nm.textContent = p.name || 'Utilisateur';
      const em = document.getElementById('sb-email-gestion');
      if (em) em.textContent = p.email || '';
      const rb = document.getElementById('sb-role-gestion');
      if (rb) await updateRoleBadge(rb);

      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();

      await ensureSpaceRoles();
      await loadRoles();
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
  })();
}
