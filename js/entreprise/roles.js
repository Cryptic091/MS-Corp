import { html, mount, createModal, getCachedProfile, loadUserProfile, updateNavPermissions, alertModal, updateAvatar, isAuthenticated, updateRoleBadge } from '../utils.js';
import { getFirebase, waitForFirebase, collection, getDocs, addDoc, setDoc, doc, updateDoc, deleteDoc, signOut } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

export function viewRoles(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/entreprise/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div id="sb-role" class="badge-role badge-employe mt-2 inline-block text-xs">Employé</div>
          </a>
          <div class="section-title">Entreprise</div>
          <nav class="nav-links">
            <a href="#/entreprise" class="nav-item"><span class="nav-icon"></span>Gestion Employé</a>
            <a href="#/entreprise/roles" class="active nav-item"><span class="nav-icon"></span>Rôle & Permission</a>
            <a href="#/entreprise/ventes" class="nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
            <a href="#/entreprise/flotte" class="nav-item"><span class="nav-icon"></span>Gestion Flotte</a>
            <a href="#/entreprise/calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/entreprise/logs" class="nav-item"><span class="nav-icon"></span>Logs</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-ent" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Rôles & Permissions</div>
              <div class="page-sub">Définissez les rôles et contrôlez l'accès</div>
            </div>
            <div class="flex gap-2">
              <button id="btn-new-role" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau rôle
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div class="card">
              <h3 class="font-medium mb-4">Rôles disponibles</h3>
              <div class="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="roles-tbody">
                    <tr><td class="py-3 text-center" colspan="3">Chargement…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <h3 class="font-medium mb-4">Permissions</h3>
              <div class="space-y-3 text-sm">
                <div class="text-xs opacity-70 mb-3 p-2 bg-blue-50 dark:bg-slate-800 rounded">Sélectionnez un rôle dans la table pour éditer ses permissions.</div>
                
                <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                  <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Accès Espaces</div>
                  <div class="perm-card"><span>Accès Gestion Entreprise</span><div id="perm-entreprise" class="switch" data-perm="entreprise"></div></div>
                  <div class="perm-card"><span>Accès Espace Employé</span><div id="perm-employe" class="switch" data-perm="employe"></div></div>
                </div>
                
                <div class="border-b border-slate-200 dark:border-white/10 pb-2">
                  <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Pages Gestion Entreprise</div>
                  <div class="perm-card"><span>Gestion Employé</span><div id="perm-employes" class="switch" data-perm="employes"></div></div>
                  <div class="perm-card"><span>Rôle & Permission</span><div id="perm-roles" class="switch" data-perm="roles"></div></div>
                  <div class="perm-card"><span>Gestion Vente</span><div id="perm-ventes" class="switch" data-perm="ventes"></div></div>
                  <div class="perm-card"><span>Gestion Finance</span><div id="perm-finance" class="switch" data-perm="finance"></div></div>
                  <div class="perm-card"><span>Logs</span><div id="perm-logs" class="switch" data-perm="logs"></div></div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button id="btn-save-perms" class="btn-primary w-full" disabled>Enregistrer les permissions</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  const logoutLink = document.getElementById('logout-link-ent');
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

  // Toggle switches visual
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('.switch');
    if (sw) sw.classList.toggle('on');
  });

  // New role creation (basic)
  document.getElementById('btn-new-role').addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Nom du rôle *</label>
        <input id="modal-role-name" type="text" required placeholder="Manager" />
      </div>
      <div class="modal-field">
        <label>Description</label>
        <textarea id="modal-role-desc" placeholder="Description du rôle"></textarea>
      </div>
    `;
    createModal({
      title: 'Nouveau rôle',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const name = document.getElementById('modal-role-name').value.trim();
        const desc = document.getElementById('modal-role-desc').value.trim();
        if (!name) {
          alertModal({ title: 'Champ requis', message: 'Le nom du rôle est requis.', type: 'warning' });
          return;
        }
        try {
          const maxOrder = rolesCache.length > 0 ? Math.max(...rolesCache.map(r => r.order || 0)) : -1;
          await addDoc(collection(fb.db, 'roles'), { 
            name, 
            description: desc,
            order: maxOrder + 1,
            permissions: { 
              entreprise: false, 
              employe: false,
              employes: false, 
              roles: false, 
              ventes: false, 
              finance: false, 
              logs: false 
            } 
          });
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'role_create', 
            category: 'roles',
            message: `Création du rôle "${name}"` 
          });
          alertModal({ title: 'Succès', message: 'Rôle créé avec succès.', type: 'success', onClose: () => location.reload() });
        } catch { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création du rôle.', type: 'danger' });
        }
      }
    });
  });

  // Save permissions (for default role policy)
  document.getElementById('btn-save-perms').addEventListener('click', async () => {
    if (!selectedRoleId) return;
    const fb = getFirebase();
    const perms = {
      entreprise: document.getElementById('perm-entreprise').classList.contains('on'),
      employe: document.getElementById('perm-employe').classList.contains('on'),
      employes: document.getElementById('perm-employes').classList.contains('on'),
      roles: document.getElementById('perm-roles').classList.contains('on'),
      ventes: document.getElementById('perm-ventes').classList.contains('on'),
      finance: document.getElementById('perm-finance').classList.contains('on'),
      logs: document.getElementById('perm-logs').classList.contains('on'),
    };
    try {
      await setDoc(doc(fb.db, 'roles', selectedRoleId), { permissions: perms }, { merge: true });
      const role = rolesCache.find(r => r.id === selectedRoleId);
      await addLogEntry(fb, { 
        type: 'action', 
        action: 'role_permissions_update', 
        category: 'roles',
        message: `Mise à jour des permissions du rôle "${role?.name || selectedRoleId}"` 
      });
      // Mettre à jour le cache
      if (role) role.permissions = perms;
      alertModal({ title: 'Succès', message: 'Permissions du rôle mises à jour avec succès.', type: 'success' });
    } catch { 
      alertModal({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des permissions.', type: 'danger' });
    }
  });

  let rolesCache = [];
  let selectedRoleId = null;
  let draggedRow = null;
  let dragDropInitialized = false;

  // Drag and drop functionality
  function initDragAndDrop() {
    const tbody = document.getElementById('roles-tbody');
    if (!tbody || dragDropInitialized) return;
    dragDropInitialized = true;

    tbody.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (!draggedRow) return;
      
      const afterElement = getDragAfterElement(tbody, e.clientY);
      if (afterElement == null) {
        tbody.appendChild(draggedRow);
      } else {
        tbody.insertBefore(draggedRow, afterElement);
      }
    });

    tbody.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (!draggedRow) return;
      
      const rows = Array.from(tbody.querySelectorAll('tr[draggable="true"]'));
      const newOrder = rows.map((row, index) => ({
        id: row.getAttribute('data-role-id'),
        order: index
      }));

      // Mettre à jour l'ordre dans le cache et Firestore
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
          message: 'Réordonnancement des rôles' 
        });
        renderRoles();
      } catch (err) {
        alertModal({ title: 'Erreur', message: 'Erreur lors du réordonnancement des rôles.', type: 'danger' });
      }
    });
  }

  function getDragAfterElement(container, y) {
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

  function renderRoles() {
    const tbody = document.getElementById('roles-tbody');
    tbody.innerHTML = '';
    rolesCache.forEach(r => {
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
            ${r.name}
          </div>
        </td>
        <td>${r.description || '—'}</td>
        <td>
          <div class="action-buttons" data-role-id="${r.id}">
            <button class="action-btn btn-edit-role" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
            <button class="action-btn btn-delete-role" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
          </div>
        </td>`;
      tr.setAttribute('draggable', 'true');
      tr.setAttribute('data-role-id', r.id);
      if (selected) tr.setAttribute('style', selected.replace('style="','').replace('"',''));
      
      // Drag event listeners
      const dragHandle = tr.querySelector('.drag-handle');
      
      // Gérer le drag seulement depuis la poignée
      tr.addEventListener('dragstart', (e) => {
        // Ne permettre le drag que depuis la poignée ou la ligne (pas les boutons)
        const clickedBtn = e.target.closest('.action-btn');
        const clickedActions = e.target.closest('.action-buttons');
        if (clickedBtn || clickedActions) {
          e.preventDefault();
          return false;
        }
        draggedRow = tr;
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
        draggedRow = null;
        const handle = tr.querySelector('.drag-handle');
        if (handle) {
          handle.style.cursor = 'grab';
        }
      });
      
      tbody.appendChild(tr);
    });
    if (!rolesCache.length) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="3">Aucun rôle</td></tr>';
    initDragAndDrop();
  }

  // Edit/Delete role handlers
  document.addEventListener('click', async (e) => {
    // Vérifier si c'est un bouton d'action (edit ou delete)
    const editBtn = e.target.closest('.btn-edit-role');
    const deleteBtn = e.target.closest('.btn-delete-role');
    const container = editBtn?.closest('.action-buttons') || deleteBtn?.closest('.action-buttons');
    
    if (editBtn || deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = container ? container.getAttribute('data-role-id') : null;
      if (!id) {
        alertModal({ title: 'Erreur', message: 'ID du rôle introuvable.', type: 'danger' });
        return;
      }
      
      const fb = getFirebase();
      if (!fb || !fb.db) {
        alertModal({ title: 'Erreur', message: 'Firebase n\'est pas initialisé.', type: 'danger' });
        return;
      }
      
      const role = rolesCache.find(r => r.id === id);
      if (!role) return;
      
      if (editBtn) {
        const body = `
          <div class="modal-field">
            <label>Nom du rôle *</label>
            <input id="modal-edit-role-name" type="text" value="${(role.name || '').replace(/"/g, '&quot;')}" required />
          </div>
          <div class="modal-field">
            <label>Description</label>
            <textarea id="modal-edit-role-desc">${(role.description || '').replace(/"/g, '&quot;')}</textarea>
          </div>
        `;
        createModal({
          title: 'Modifier rôle',
          body,
          confirmText: 'Enregistrer',
          onConfirm: async () => {
            const name = document.getElementById('modal-edit-role-name').value.trim();
            const desc = document.getElementById('modal-edit-role-desc').value.trim();
            if (!name) {
              alertModal({ title: 'Champ requis', message: 'Le nom du rôle est requis.', type: 'warning' });
              return;
            }
            try {
              await updateDoc(doc(fb.db, 'roles', id), { name, description: desc });
              // Mettre à jour le cache
              Object.assign(role, { name, description: desc });
              // Recharger les rôles depuis Firestore pour être sûr
              const snap = await getDocs(collection(fb.db, 'roles'));
              rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              rolesCache.sort((a, b) => (a.order || 0) - (b.order || 0));
              await addLogEntry(fb, { 
                type: 'action', 
                action: 'role_update', 
                category: 'roles',
                message: `Modification du rôle "${name}"` 
              });
              renderRoles();
              alertModal({ title: 'Succès', message: 'Rôle modifié avec succès.', type: 'success' });
            } catch (err) {
              const errorMsg = err.message || err.code || 'Erreur inconnue';
              alertModal({ title: 'Erreur', message: `Erreur lors de la modification du rôle: ${errorMsg}`, type: 'danger' });
            }
          }
        });
        return;
      }
      
      if (deleteBtn) {
        createModal({
          title: 'Supprimer rôle',
          body: `<p>Êtes-vous sûr de vouloir supprimer le rôle <strong>${(role.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong> ?</p><p class="text-sm text-slate-500 mt-2">Cette action est irréversible.</p>`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          type: 'danger',
          onConfirm: async () => {
            try {
              const roleName = role.name || id;
              await deleteDoc(doc(fb.db, 'roles', id));
              await addLogEntry(fb, { 
                type: 'action', 
                action: 'role_delete', 
                category: 'roles',
                message: `Suppression du rôle "${roleName}"` 
              });
              // Recharger les rôles depuis Firestore pour être sûr
              const snap = await getDocs(collection(fb.db, 'roles'));
              rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              rolesCache.sort((a, b) => (a.order || 0) - (b.order || 0));
              if (selectedRoleId === id) {
                selectedRoleId = null;
                const btnSave = document.getElementById('btn-save-perms');
                if (btnSave) btnSave.disabled = true;
              }
              renderRoles();
              alertModal({ title: 'Succès', message: 'Rôle supprimé avec succès.', type: 'success' });
            } catch (err) {
              const errorMsg = err.message || err.code || 'Erreur inconnue';
              alertModal({ title: 'Erreur', message: `Erreur lors de la suppression du rôle: ${errorMsg}`, type: 'danger' });
            }
          }
        });
        return;
      }
    }
    
    // Si on clique sur une ligne (mais pas sur les boutons), sélectionner pour éditer les permissions
    const row = e.target.closest('#roles-tbody tr');
    if (row && !container && !editBtn && !deleteBtn) {
      selectedRoleId = row.getAttribute('data-role-id');
      const role = rolesCache.find(r => r.id === selectedRoleId);
      if (role) {
        const perms = role.permissions || {};
        // Définir correctement l'état des switches
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
        setSwitch('perm-entreprise', Boolean(perms.entreprise));
        setSwitch('perm-employe', Boolean(perms.employe));
        setSwitch('perm-employes', Boolean(perms.employes));
        setSwitch('perm-roles', Boolean(perms.roles));
        setSwitch('perm-ventes', Boolean(perms.ventes));
        setSwitch('perm-finance', Boolean(perms.finance));
        setSwitch('perm-logs', Boolean(perms.logs));
        document.getElementById('btn-save-perms').disabled = false;
        renderRoles();
      }
    }
  });

  // Load roles from Firestore
  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Charger le profil depuis Firestore si le cache est vide
      let p = getCachedProfile();
      if (!p || !p.name) {
        p = await loadUserProfile() || {};
      }
      
      // Sidebar profile
      const av = document.getElementById('sb-avatar'); updateAvatar(av, p);
      const nm = document.getElementById('sb-name'); if (nm) nm.textContent = p.name || 'Utilisateur';
      const em = document.getElementById('sb-email'); if (em) em.textContent = p.email || '';
      const rb = document.getElementById('sb-role'); 
      if (rb) await updateRoleBadge(rb);
      
      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();

      const snap = await getDocs(collection(fb.db, 'roles'));
      rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Trier par ordre si disponible
      rolesCache.sort((a, b) => (a.order || 0) - (b.order || 0));
      // Add default roles if empty
      if (!rolesCache.length) {
        await addDoc(collection(fb.db, 'roles'), { 
          name: 'Admin', 
          description: 'Accès complet',
          order: 0,
          permissions: { 
            entreprise: true, 
            employe: true,
            employes: true, 
            roles: true, 
            ventes: true, 
            finance: true, 
            logs: true 
          } 
        });
        await addDoc(collection(fb.db, 'roles'), { 
          name: 'Employé', 
          description: 'Accès limité',
          order: 1,
          permissions: { 
            entreprise: false, 
            employe: true,
            employes: false, 
            roles: false, 
            ventes: false, 
            finance: false, 
            logs: false 
          } 
        });
        const snap2 = await getDocs(collection(fb.db, 'roles'));
        rolesCache = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
        rolesCache.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      renderRoles();
    } catch {}
  })();
}
