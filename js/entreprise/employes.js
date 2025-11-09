import { html, mount, createModal, getCachedProfile, loadUserProfile, updateNavPermissions, alertModal, updateAvatar, formatDate, isAuthenticated, updateRoleBadge, applyPagePermissions, hasStoredPermission, checkPermission } from '../utils.js';
import { getFirebase, getAdminFirebaseAuth, waitForFirebase, collection, getDocs, query, where, setDoc, doc, updateDoc, deleteDoc, serverTimestamp, signOut, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, addDoc } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function splitFullName(fullName = '') {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { prenom: '', nom: '' };
  }
  if (parts.length === 1) {
    return { prenom: parts[0], nom: '' };
  }
  return {
    prenom: parts[0],
    nom: parts.slice(1).join(' ')
  };
}

export function viewEmployes(root) {
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
            <div
              id="sb-role"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleEntreprise"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Entreprise</div>
          <nav class="nav-links">
            <a href="#/entreprise" class="active nav-item"><span class="nav-icon"></span>Gestion Employé</a>
            <a href="#/entreprise/centrale" class="nav-item"><span class="nav-icon"></span>Suivi Effectif</a>
            <a href="#/entreprise/ventes" class="nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
            <a href="#/entreprise/flotte" class="nav-item"><span class="nav-icon"></span>Gestion Flotte</a>
            <a href="#/entreprise/calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/entreprise/calculatrice" class="nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/entreprise/logs" class="nav-item"><span class="nav-icon"></span>Logs</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
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
            <div class="page-title">Gestion des Utilisateurs</div>
            <div class="page-sub">Gérez les comptes utilisateurs de l'entreprise</div>
          </div>
          <div class="flex gap-2 flex-wrap justify-end">
            <button id="btn-refresh" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"></path></svg></span> Actualiser
            </button>
            <button id="btn-new-vente-par-employe" class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle vente par employé
            </button>
            <button id="btn-new-user" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvel utilisateur
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span></div>
            <div class="stat-content">
              <div class="stat-label">Total utilisateurs</div>
              <div id="stat-total" class="stat-value">—</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span></div>
            <div class="stat-content">
              <div class="stat-label">Utilisateurs actifs</div>
              <div id="stat-active" class="stat-value">—</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l5 5 4-4 4 4 5-5v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg></span></div>
            <div class="stat-content">
              <div class="stat-label">Administrateurs</div>
              <div id="stat-admin" class="stat-value">—</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87"></path><path d="M16 3.13a4 4 0 010 7.75"></path></svg></span></div>
            <div class="stat-content">
              <div class="stat-label">Employés</div>
              <div id="stat-employe" class="stat-value">—</div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="flex items-center gap-3">
            <div class="search-bar">
              <span class="search-icon icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
              <input id="user-search" type="text" placeholder="Rechercher un utilisateur..." class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm" />
            </div>
            <select id="role-filter" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm">
              <option value="">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="employe">Employé</option>
            </select>
            <select id="status-filter" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm">
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
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
                <th>STATUT</th>
                <th>DATE CRÉATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              <tr><td class="py-3" colspan="6" class="text-center">Chargement…</td></tr>
            </tbody>
          </table>
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

let cache = [];
let rolesCache = [];
let rolesById = new Map();
const ROLE_OPTION_NONE = '__none__';
const ROLE_OPTION_EMPTY = '__empty__';
let ressourcesVenteCache = [];

  const delegatedSaleBtn = document.getElementById('btn-new-vente-par-employe');
  if (delegatedSaleBtn) {
    delegatedSaleBtn.addEventListener('click', async () => {
      try {
        let fbInstance = getFirebase();
        if (!fbInstance || !fbInstance.db) {
          fbInstance = await waitForFirebase();
        }

        if (!fbInstance || !fbInstance.db) {
          alertModal({ title: 'Erreur', message: 'Connexion à la base de données indisponible.', type: 'danger' });
          return;
        }

        if (!ressourcesVenteCache || !ressourcesVenteCache.length) {
          const resSnap = await getDocs(collection(fbInstance.db, 'ressources'));
          ressourcesVenteCache = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        let employesDisponibles = Array.isArray(cache) && cache.length ? cache.slice() : [];
        if (!employesDisponibles.length) {
          const usersSnap = await getDocs(collection(fbInstance.db, 'users'));
          employesDisponibles = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          cache = employesDisponibles;
        }

        employesDisponibles = employesDisponibles.filter(u => u.active !== false);

        if (!employesDisponibles.length) {
          alertModal({ title: 'Aucun employé', message: 'Aucun employé actif n’a été trouvé pour enregistrer une vente.', type: 'warning' });
          return;
        }

        if (!ressourcesVenteCache.length) {
          alertModal({ title: 'Aucune ressource', message: 'Aucune ressource disponible pour enregistrer une vente.', type: 'warning' });
          return;
        }

        const body = `
          <div class="modal-field">
            <label>Employé concerné *</label>
            <select id="modal-employe-vente" required></select>
            <div id="modal-employe-vente-info" class="text-sm text-slate-500 dark:text-slate-400 mt-2"></div>
          </div>
          <div class="modal-field">
            <label>Date de la vente *</label>
            <input id="modal-date-delegue" type="date" required />
          </div>
          <div class="modal-field">
            <label>Type de ressource *</label>
            <select id="modal-ressource-delegue" required></select>
          </div>
          <div class="modal-field">
            <label>Nombre de ressources *</label>
            <input id="modal-quantite-delegue" type="number" min="1" required placeholder="1" />
          </div>
        `;

        createModal({
          title: 'Nouvelle vente par employé',
          body,
          confirmText: 'Créer',
          onConfirm: async () => {
            const dateStr = document.getElementById('modal-date-delegue').value;
            const ressourceId = document.getElementById('modal-ressource-delegue').value;
            const quantite = parseInt(document.getElementById('modal-quantite-delegue').value, 10);
            const employeId = document.getElementById('modal-employe-vente').value;

            if (!employeId || !dateStr || !ressourceId || Number.isNaN(quantite) || quantite <= 0) {
              alertModal({ title: 'Champs requis', message: 'Employé, date, ressource et quantité sont requis.', type: 'warning' });
              return;
            }

            const selectedEmploye = employesDisponibles.find(u => u.id === employeId) || null;
            const selectedRessource = ressourcesVenteCache.find(r => r.id === ressourceId) || null;

            if (!selectedRessource) {
              alertModal({ title: 'Ressource introuvable', message: 'La ressource sélectionnée est introuvable.', type: 'danger' });
              return;
            }

            const { prenom, nom } = splitFullName(selectedEmploye?.name || '');
            const telephone = selectedEmploye?.phone || '';
            const tailleObjet = selectedRessource?.tailleObjet || 1;

            try {
              const dateVente = new Date(dateStr);
              await addDoc(collection(fbInstance.db, 'ventes'), {
                dateVente,
                typeRessourceId: ressourceId,
                quantite,
                tailleObjet,
                employeId,
                prenom,
                nom,
                telephone,
                statut: 'en attente',
                createdAt: serverTimestamp()
              });

              await addLogEntry(fbInstance, { 
                type: 'action', 
                action: 'vente_create_deleguee', 
                category: 'ventes',
                message: `Création d'une vente pour ${selectedEmploye?.name || selectedEmploye?.email || employeId}: ${quantite} x ${selectedRessource?.nom || ressourceId}` 
              });

              alertModal({ 
                title: 'Succès', 
                message: `Vente enregistrée pour ${selectedEmploye?.name || selectedEmploye?.email || 'l\'employé sélectionné'}.`, 
                type: 'success' 
              });
            } catch (error) {
              console.error('Erreur création vente déléguée (Gestion Employé):', error);
              alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la vente.', type: 'danger' });
            }
          }
        });

        const selEmploye = document.getElementById('modal-employe-vente');
        const selRessource = document.getElementById('modal-ressource-delegue');
        const infoEmploye = document.getElementById('modal-employe-vente-info');
        const dateInput = document.getElementById('modal-date-delegue');

        if (selEmploye) {
          const sortedEmployes = [...employesDisponibles].sort((a, b) => {
            const nameA = (a.name || a.email || '').toLowerCase();
            const nameB = (b.name || b.email || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          selEmploye.innerHTML = sortedEmployes
            .map(u => `<option value="${u.id}">${(u.name || u.email || u.id)}</option>`)
            .join('');

          if (infoEmploye) {
            infoEmploye.style.whiteSpace = 'pre-line';
            const updateInfo = () => {
              const selected = sortedEmployes.find(u => u.id === selEmploye.value) || null;
              if (!selected) {
                infoEmploye.textContent = 'Sélectionnez un employé pour afficher ses informations.';
                return;
              }
              infoEmploye.textContent = [
                `Nom complet : ${selected.name || '—'}`,
                `Email : ${selected.email || '—'}`,
                `Téléphone : ${selected.phone || '—'}`
              ].join('\n');
            };
            selEmploye.addEventListener('change', updateInfo);
            updateInfo();
          }
        }

        if (selRessource) {
          const sortedRessources = [...ressourcesVenteCache].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
          selRessource.innerHTML = sortedRessources
            .map(r => `<option value="${r.id}">${r.nom || r.id}</option>`)
            .join('');
        }

        if (dateInput) {
          dateInput.valueAsDate = new Date();
        }
      } catch (error) {
        console.error('Erreur lors de l’ouverture du modal de vente déléguée (Gestion Employé):', error);
        alertModal({ title: 'Erreur', message: 'Impossible d’ouvrir la création de vente déléguée.', type: 'danger' });
      }
    });
  }

function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

function getRoleDisplayInfo(scopeLabel, roleId) {
  const hasAccess = roleId !== null && roleId !== undefined;
  if (!hasAccess) {
    return {
      scope: scopeLabel,
      text: 'Pas d\'accès',
      className: 'badge-inactif'
    };
  }

  if (roleId === '') {
    return {
      scope: scopeLabel,
      text: 'Sans rôle',
      className: 'badge-employe'
    };
  }

  const roleData = rolesById.get(roleId) || null;
  if (roleData) {
    return {
      scope: scopeLabel,
      text: roleData.name || 'Rôle',
      className: 'badge-employe'
    };
  }

  return {
    scope: scopeLabel,
    text: 'Rôle introuvable',
    className: 'badge-inactif'
  };
}

function renderRoleBadges(roleEntrepriseId, roleEmployeId) {
  const entreprise = getRoleDisplayInfo('Entreprise', roleEntrepriseId);
  const employe = getRoleDisplayInfo('Employé', roleEmployeId);

  const renderBadge = (info) => `
    <span class="badge-role ${info.className}">
      ${info.text}
      <span style="margin-left: 0.35rem; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.8;">(${info.scope})</span>
    </span>
  `;

  return `
    <div class="flex flex-col gap-1">
      ${renderBadge(entreprise)}
      ${renderBadge(employe)}
    </div>
  `;
}

function roleValueToOption(value, includeNoAccess = true) {
  if ((value === null || value === undefined) && includeNoAccess) {
    return ROLE_OPTION_NONE;
  }
  if (value === '') {
    return ROLE_OPTION_EMPTY;
  }
  return value ?? (includeNoAccess ? ROLE_OPTION_NONE : ROLE_OPTION_EMPTY);
}

function optionToRoleValue(option, includeNoAccess = true) {
  if (option === ROLE_OPTION_NONE) {
    return includeNoAccess ? null : undefined;
  }
  if (option === ROLE_OPTION_EMPTY) {
    return '';
  }
  return option;
}

function buildRoleOptions(roles, { includeNoAccess = true, includeEmpty = true, currentValue = null } = {}) {
  const options = [];
  const currentToken = roleValueToOption(currentValue, includeNoAccess);
  if (includeNoAccess) {
    options.push(`<option value="${ROLE_OPTION_NONE}" ${currentToken === ROLE_OPTION_NONE ? 'selected' : ''}>Pas d'accès</option>`);
  }
  if (includeEmpty) {
    options.push(`<option value="${ROLE_OPTION_EMPTY}" ${currentToken === ROLE_OPTION_EMPTY ? 'selected' : ''}>Sans rôle</option>`);
  }
  if (roles.length > 0) {
    options.push(...roles.map(role => `<option value="${role.id}" ${currentToken === role.id ? 'selected' : ''}>${role.name}</option>`));
  }
  if (options.length === 0) {
    options.push('<option value="">Aucun rôle disponible</option>');
  }
  return options.join('');
}

  function renderRows(list) {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';
    
    // Vérifier les permissions une seule fois pour toutes les lignes
    const hasEdit = hasStoredPermission('edit');
    const hasDelete = hasStoredPermission('delete');
    
    list.forEach(u => {
      const tr = document.createElement('tr');
      const initials = getInitials(u.name || u.email);
      const isActive = u.active !== false;
      tr.innerHTML = `
        <td>
          <div class="user-info">
            <div class="user-avatar">${initials}</div>
            <div class="user-details">
              <div class="user-name">${u.name || '—'}</div>
              <div class="user-handle">@${(u.email || '').split('@')[0] || '—'}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="contact-info">
            <div class="contact-item">
              <span class="contact-icon icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3,7 12,13 21,7"></polyline></svg></span>
              <span>${u.email || '—'}</span>
            </div>
            ${u.phone ? `<div class=\"contact-item\"><span class=\"contact-icon icon\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 013.1 4.18 2 2 0 015.05 2h3a2 2 0 012 1.72 12.66 12.66 0 00.7 2.81 2 2 0 01-.45 2.11L9 9a16 16 0 006 6l1.36-1.36a2 2 0 012.11-.45 12.66 12.66 0 002.81.7A2 2 0 0122 16.92z\"></path></svg></span><span>${u.phone}</span></div>` : ''}
          </div>
        </td>
        <td>
          ${renderRoleBadges(u.roleEntreprise, u.roleEmploye)}
        </td>
        <td>
          <span class="badge-role ${isActive ? 'badge-actif' : 'badge-inactif'}">${isActive ? 'actif' : 'inactif'}</span>
        </td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
          <div class="action-buttons" data-user-id="${u.id || ''}" data-user-email="${u.email || ''}">
            ${hasEdit ? `<button class="action-btn btn-edit" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>` : ''}
            ${hasDelete ? `<button class="action-btn btn-delete" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>` : ''}
            <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
    if (!list.length) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucun utilisateur</td></tr>';
    
    // Update stats - accès espaces Entreprise et Employé
    const hasAccess = (value) => value !== null && value !== undefined;
    document.getElementById('stat-total').textContent = String(cache.length);
    document.getElementById('stat-active').textContent = String(cache.filter(u => u.active !== false).length);
    document.getElementById('stat-admin').textContent = String(cache.filter(u => hasAccess(u.roleEntreprise)).length);
    document.getElementById('stat-employe').textContent = String(cache.filter(u => hasAccess(u.roleEmploye)).length);
  }

  function applyFilters() {
    const q = (document.getElementById('user-search')?.value || '').toLowerCase();
    const rf = document.getElementById('role-filter')?.value || '';
    const sf = document.getElementById('status-filter')?.value || '';
    const filtered = cache.filter(u => {
      const match = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      // Filtrer par rôle sélectionné
      let roleMatch = true;
      if (rf) {
        const [scope, identifier] = rf.includes(':') ? rf.split(':') : ['legacy', rf];
        if (scope === 'entreprise') {
          if (identifier === '__empty__') {
            roleMatch = u.roleEntreprise === '';
          } else if (identifier === '__none__') {
            roleMatch = u.roleEntreprise === null || u.roleEntreprise === undefined;
          } else {
            roleMatch = u.roleEntreprise === identifier;
          }
        } else if (scope === 'employe') {
          if (identifier === '__empty__') {
            roleMatch = u.roleEmploye === '';
          } else if (identifier === '__none__') {
            roleMatch = u.roleEmploye === null || u.roleEmploye === undefined;
          } else {
            roleMatch = u.roleEmploye === identifier;
          }
        } else {
          // Compatibilité avec l'ancien filtre basé sur le nom du rôle Entreprise
          const roleEntrepriseId = u.roleEntreprise;
          if (roleEntrepriseId && roleEntrepriseId !== "" && roleEntrepriseId !== null) {
            const roleData = rolesById.get(roleEntrepriseId);
            if (roleData) {
              roleMatch = (roleData.name || '').toLowerCase() === identifier.toLowerCase();
            } else {
              roleMatch = false;
            }
          } else {
            roleMatch = false;
          }
        }
      }
      const statusMatch = !sf || (sf === 'actif' && u.active !== false) || (sf === 'inactif' && u.active === false);
      return match && roleMatch && statusMatch;
    });
    renderRows(filtered);
  }

  // global switch toggle (for modals)
  document.addEventListener('click', (e) => { const sw = e.target.closest('.switch'); if (sw) sw.classList.toggle('on'); });

  document.addEventListener('input', (e) => {
    if (e.target && ['user-search', 'role-filter', 'status-filter'].includes(e.target.id)) applyFilters();
  });

  document.getElementById('btn-refresh').addEventListener('click', async () => {
    const fb = getFirebase();
    if (!fb || !fb.db) return;
    try {
      const snap = await getDocs(collection(fb.db, 'users'));
      cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyFilters();
    } catch {}
  });

  document.getElementById('btn-new-user').addEventListener('click', async () => {
    // Vérifier la permission avant d'ouvrir le modal
    const hasCreate = hasStoredPermission('create') || await checkPermission('employes');
    if (!hasCreate) {
      alertModal({ 
        title: 'Permission refusée', 
        message: 'Vous n\'avez pas la permission de créer des utilisateurs.', 
        type: 'warning' 
      });
      return;
    }
    const body = `
      <div class="modal-field">
        <label>Nom complet *</label>
        <input id="modal-name" type="text" required placeholder="Jean Dupont" />
      </div>
      <div class="modal-field">
        <label>Email (peut être fictif, optionnel)</label>
        <input id="modal-email" type="text" placeholder="jean.dupont@entreprise.com ou laissez vide pour générer" />
        <p class="text-xs text-slate-500 mt-1">L'email peut être fictif. Si vide, un email sera généré automatiquement à partir du nom.</p>
      </div>
      <div class="modal-field">
        <label>Téléphone</label>
        <input id="modal-phone" type="tel" placeholder="0612345678" />
      </div>
      <div class="modal-field">
        <label>Rôle (Espace Entreprise) *</label>
        <select id="modal-role-entreprise" required></select>
        <p class="text-xs text-slate-500 mt-1">Définit les permissions dans l'espace Entreprise.</p>
      </div>
      <div class="modal-field">
        <label>Rôle (Espace Employé)</label>
        <select id="modal-role-employe"></select>
        <p class="text-xs text-slate-500 mt-1">Définit les permissions dans l'espace Employé. Choisissez "Pas d'accès" pour retirer l'accès.</p>
      </div>
      <div class="modal-field">
        <label>Mot de passe initial *</label>
        <input id="modal-temp-password" type="text" required placeholder="Ex: Az123456" />
        <p class="text-xs text-slate-500 mt-1">Communiquez ce mot de passe à l'utilisateur.</p>
      </div>
    `;
    createModal({
      title: 'Nouvel utilisateur',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const name = document.getElementById('modal-name').value.trim();
        let emailRaw = document.getElementById('modal-email').value.trim();
        const phone = document.getElementById('modal-phone').value.trim();
        const roleEntrepriseSelection = document.getElementById('modal-role-entreprise').value;
        const roleEmployeSelection = document.getElementById('modal-role-employe')?.value ?? ROLE_OPTION_NONE;
        const tempPassword = document.getElementById('modal-temp-password').value.trim();
        
        if (!name) {
          alertModal({ title: 'Champs requis', message: 'Le nom est requis.', type: 'warning' });
          return;
        }
        
        // Générer un email automatique si vide ou invalide
        if (!emailRaw) {
          const nameSlug = name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '.')
            .substring(0, 30);
          const timestamp = Date.now().toString().slice(-6);
          emailRaw = `${nameSlug}.${timestamp}@entreprise.local`;
        }
        
        // Normaliser l'email (en minuscules) et s'assurer qu'il a un format valide
        let email = emailRaw.toLowerCase().trim();
        
        // Si l'email n'a pas le format @, ajouter un domaine fictif
        if (!email.includes('@')) {
          email = `${email}@entreprise.local`;
        }
        
        // S'assurer que l'email a au moins un format basique valide pour Firebase
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          const nameSlug = name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '.')
            .substring(0, 30);
          const timestamp = Date.now().toString().slice(-6);
          email = `${nameSlug}.${timestamp}@entreprise.local`;
        }
        if (!tempPassword) {
          alertModal({ title: 'Mot de passe requis', message: 'Veuillez renseigner un mot de passe provisoire.', type: 'warning' });
          return;
        }
        if (!roleEntrepriseSelection) {
          alertModal({ title: 'Rôle requis', message: 'Veuillez sélectionner un rôle pour l\'espace Entreprise.', type: 'warning' });
          return;
        }
        const roleEntrepriseValue = optionToRoleValue(roleEntrepriseSelection, false);
        if (roleEntrepriseValue === undefined) {
          alertModal({ title: 'Rôle invalide', message: 'Sélection de rôle Entreprise incorrecte.', type: 'warning' });
          return;
        }
        const roleEmployeValue = optionToRoleValue(roleEmployeSelection, true);
        try {
          let fbInstance = fb;
          if (!fbInstance || !fbInstance.auth) {
            fbInstance = await waitForFirebase();
          }
          if (!fbInstance || !fbInstance.auth || !fbInstance.db) {
            alertModal({ title: 'Firebase indisponible', message: 'Impossible de créer le compte pour le moment.', type: 'danger' });
            return;
          }

          const adminFb = getAdminFirebaseAuth();
          if (!adminFb || !adminFb.auth) {
            alertModal({ title: 'Service indisponible', message: 'Impossible d’ouvrir la session administrative de création. Réessayez plus tard.', type: 'danger' });
            return;
          }

          if (tempPassword.length < 6) {
            alertModal({ title: 'Mot de passe trop court', message: 'Le mot de passe doit contenir au moins 6 caractères.', type: 'warning' });
            return;
          }

          // Vérifier si l'email existe déjà dans Firebase Auth
          // Si l'email existe déjà, générer un nouvel email unique
          let finalEmail = email;
          let attempts = 0;
          const maxAttempts = 5;
          
          while (attempts < maxAttempts) {
            try {
              const signInMethods = await fetchSignInMethodsForEmail(fbInstance.auth, finalEmail);
              if (signInMethods && signInMethods.length > 0) {
                // Email existe déjà, générer un nouveau avec un suffixe unique
                const baseEmail = email.split('@')[0];
                const domain = email.split('@')[1] || 'entreprise.local';
                const uniqueSuffix = Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 5);
                finalEmail = `${baseEmail}.${uniqueSuffix}@${domain}`;
                attempts++;
              } else {
                // Email disponible, utiliser celui-ci
                break;
              }
            } catch (checkError) {
              // Si la vérification échoue, continuer avec l'email actuel
              break;
            }
          }
          
          email = finalEmail;

          const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
          const createdBy = authState?.uid || null;

          const roleEntrepriseId = typeof roleEntrepriseValue === 'string' ? roleEntrepriseValue : '';
          const roleEmployeId = typeof roleEmployeValue === 'string' ? roleEmployeValue : roleEmployeValue === '' ? '' : null;
          
          const cred = await createUserWithEmailAndPassword(adminFb.auth, email, tempPassword);
          await setDoc(doc(fbInstance.db, 'users', cred.user.uid), {
            name,
            email,
            phone: phone || null,
            roleEntreprise: roleEntrepriseId || "",
            roleEmploye: roleEmployeId !== undefined ? roleEmployeId : null,
            active: true,
            initialPassword: tempPassword,
            createdAt: serverTimestamp(),
            createdBy
          });

          cache.push({
            id: cred.user.uid,
            name,
            email,
            phone,
            roleEntreprise: roleEntrepriseId || "",
            roleEmploye: roleEmployeId !== undefined ? roleEmployeId : null,
            active: true,
            initialPassword: tempPassword,
            createdAt: new Date()
          });
          applyFilters();
          const entrepriseLabel = getRoleDisplayInfo('Entreprise', roleEntrepriseId || '').text;
          const employeLabel = getRoleDisplayInfo('Employé', roleEmployeId !== undefined ? roleEmployeId : null).text;
          await addLogEntry(fbInstance, { 
            type: 'action', 
            action: 'user_create', 
            category: 'utilisateurs',
            message: `Création de l'utilisateur "${name || email}" (${email}) - Entreprise: ${entrepriseLabel} | Employé: ${employeLabel}` 
          });

          try {
            await signOut(adminFb.auth);
          } catch (signOutError) {
            console.warn('Impossible de fermer la session secondaire de création:', signOutError);
          }
          alertModal({ title: 'Succès', message: `Utilisateur créé avec succès.<br><strong>Mot de passe :</strong> ${tempPassword}`, type: 'success' });
        } catch (e) { 
          let message = 'Erreur lors de la création de l\'utilisateur.';
          if (e?.code === 'auth/email-already-in-use') {
            message = `Un compte existe déjà avec l'adresse email "${email}" dans Firebase Authentication. Veuillez vérifier dans la console Firebase (Authentication > Users) et supprimer le compte existant si nécessaire, ou utiliser une autre adresse email.`;
          } else if (e?.code === 'auth/invalid-email') {
            message = `L'adresse email "${email}" n'est pas valide.`;
          } else if (e?.code === 'auth/weak-password') {
            message = 'Le mot de passe est trop faible.';
          } else if (e?.message) {
            message = `${e.message} (Email utilisé: "${email}")`;
          } else {
            message = `Erreur inconnue. Email utilisé: "${email}"`;
          }
          alertModal({ title: 'Erreur', message, type: 'danger' });
        }
      }
    });
    // Remplir la liste des rôles depuis la BDD - uniquement les rôles de l'espace Entreprise
    const entrepriseSelect = document.getElementById('modal-role-entreprise');
    const employeSelect = document.getElementById('modal-role-employe');
    if (entrepriseSelect || employeSelect) {
      if (!rolesCache || rolesCache.length === 0) {
        try {
          const fbInstance = getFirebase();
          if (fbInstance?.db) {
            const rs = await getDocs(collection(fbInstance.db, 'roles'));
            rolesCache = rs.docs.map(d => ({ id: d.id, ...d.data() }));
            rolesById = new Map(rolesCache.map(r => [r.id, r]));
          }
        } catch (err) {
          console.error('Erreur chargement rôles:', err);
        }
      }
    }
    if (entrepriseSelect) {
      const entrepriseRoles = rolesCache.filter(r => r.permissions && r.permissions.entreprise === true);
      entrepriseSelect.innerHTML = buildRoleOptions(entrepriseRoles, { includeNoAccess: false, includeEmpty: true, currentValue: '' });
    }
    if (employeSelect) {
      const employeRoles = rolesCache.filter(r => r.permissions && r.permissions.employe === true);
      employeSelect.innerHTML = buildRoleOptions(employeRoles, { includeNoAccess: true, includeEmpty: true, currentValue: null });
    }
    const tempField = document.getElementById('modal-temp-password');
    if (tempField) {
      tempField.value = generateTempPassword();
    }
  });

  // Delegated actions for edit/delete/view
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    
    // Vérifier les permissions avant d'exécuter les actions
    if (btn.classList.contains('btn-edit')) {
      const hasEdit = hasStoredPermission('edit') || await checkPermission('employes');
      if (!hasEdit) {
        alertModal({ 
          title: 'Permission refusée', 
          message: 'Vous n\'avez pas la permission de modifier les utilisateurs.', 
          type: 'warning' 
        });
        return;
      }
    }
    if (btn.classList.contains('btn-delete')) {
      const hasDelete = hasStoredPermission('delete') || await checkPermission('employes');
      if (!hasDelete) {
        alertModal({ 
          title: 'Permission refusée', 
          message: 'Vous n\'avez pas la permission de supprimer les utilisateurs.', 
          type: 'warning' 
        });
        return;
      }
    }
    const container = btn.closest('.action-buttons');
    const fb = getFirebase();
    const id = container?.getAttribute('data-user-id');
    const email = container?.getAttribute('data-user-email');
    const user = cache.find(u => u.id === id) || {};
    if (btn.classList.contains('btn-view')) {
      const initials = (user.name || (user.email||'').split('@')[0] || '??').slice(0,2).toUpperCase();
      const body = `
        <div class="view-highlight">
          <div class="view-icon">${initials}</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${user.name || '—'}</div>
          <div style="color: rgb(100,116,139);">${user.email || '—'}</div>
        </div>
        <div class="view-grid">
          <div class="view-section">
            <div class="view-section-title">Informations personnelles</div>
            <div class="view-item">
              <div class="view-item-label">Nom complet</div>
              <div class="view-item-value">${user.name || '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Email</div>
              <div class="view-item-value">${user.email || '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Téléphone</div>
              <div class="view-item-value">${user.phone || '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Mot de passe initial</div>
              <div class="view-item-value">${user.initialPassword || user.tempPassword || '—'}</div>
            </div>
          </div>
          <div class="view-section">
            <div class="view-section-title">Rôle & Statut</div>
            <div class="view-item">
              <div class="view-item-label">Rôle (Espace Entreprise)</div>
              <div class="view-item-value">
                ${(() => {
                  const value = user.roleEntreprise;
                  const info = getRoleDisplayInfo('Entreprise', value);
                  return `<span class="view-badge badge-role ${info.className}">${info.text}</span>`;
                })()}
              </div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Rôle (Espace Employé)</div>
              <div class="view-item-value">
                ${(() => {
                  const value = user.roleEmploye;
                  const info = getRoleDisplayInfo('Employé', value);
                  return `<span class="view-badge badge-role ${info.className}">${info.text}</span>`;
                })()}
              </div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Statut</div>
              <div class="view-item-value">
                <span class="view-badge badge-role ${user.active !== false ? 'badge-actif' : 'badge-inactif'}">${user.active !== false ? 'Actif' : 'Inactif'}</span>
              </div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Date création</div>
              <div class="view-item-value">${formatDate(user.createdAt)}</div>
            </div>
          </div>
        </div>
      `;
      createModal({ title: 'Détails utilisateur', body, confirmText: 'Fermer', onConfirm: () => {}, isView: true });
      return;
    }
    if (btn.classList.contains('btn-edit')) {
      const body = `
        <div class="modal-field">
          <label>Nom complet *</label>
          <input id="modal-edit-name" type="text" value="${user.name || ''}" required />
        </div>
        <div class="modal-field">
          <label>Email *</label>
          <input id="modal-edit-email" type="email" value="${user.email || ''}" required />
        </div>
        <div class="modal-field">
          <label>Téléphone</label>
          <input id="modal-edit-phone" type="tel" value="${user.phone || ''}" />
        </div>
        <div class="modal-field">
          <label>Rôle (Espace Entreprise) *</label>
          <select id="modal-edit-role-entreprise" required></select>
        </div>
        <div class="modal-field">
          <label>Rôle (Espace Employé)</label>
          <select id="modal-edit-role-employe"></select>
        </div>
        <div class="modal-field">
          <label class="block mb-2">Utilisateur actif</label>
          <div id="modal-edit-active" class="switch ${user.active !== false ? 'on' : ''}"></div>
        </div>
      `;
      createModal({
        title: 'Modifier utilisateur',
        body,
        onConfirm: async () => {
          const name = document.getElementById('modal-edit-name').value.trim();
          const email = document.getElementById('modal-edit-email').value.trim();
          const phone = document.getElementById('modal-edit-phone').value.trim();
          const roleEntrepriseSelection = document.getElementById('modal-edit-role-entreprise').value;
          const roleEmployeSelection = document.getElementById('modal-edit-role-employe')?.value ?? ROLE_OPTION_NONE;
          const active = document.getElementById('modal-edit-active').classList.contains('on');
          if (!name || !email) {
            alertModal({ title: 'Champs requis', message: 'Nom et email sont requis.', type: 'warning' });
            return;
          }
          if (!roleEntrepriseSelection) {
            alertModal({ title: 'Rôle requis', message: 'Veuillez sélectionner un rôle pour l\'espace Entreprise.', type: 'warning' });
            return;
          }
          const roleEntrepriseValue = optionToRoleValue(roleEntrepriseSelection, false);
          if (roleEntrepriseValue === undefined) {
            alertModal({ title: 'Rôle invalide', message: 'Sélection de rôle Entreprise incorrecte.', type: 'warning' });
            return;
          }
          const roleEmployeValue = optionToRoleValue(roleEmployeSelection, true);
          try {
            const roleEntrepriseId = typeof roleEntrepriseValue === 'string' ? roleEntrepriseValue : '';
            const roleEmployeId = typeof roleEmployeValue === 'string'
              ? roleEmployeValue
              : roleEmployeValue === '' ? '' : null;
            
            await updateDoc(doc(fb.db, 'users', id), { 
              name, 
              email, 
              phone: phone || null, 
              roleEntreprise: roleEntrepriseId || "", 
              roleEmploye: roleEmployeId !== undefined ? roleEmployeId : null,
              active 
            });
            
            // Si c'est l'utilisateur connecté qui a été modifié, invalider le cache du profil
            const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
            if (authState?.uid === id) {
              localStorage.removeItem('ms_user_profile');
            }
            
            // Recharger les données depuis Firestore pour s'assurer de la synchronisation
            const snap = await getDocs(collection(fb.db, 'users'));
            cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Recharger aussi les rôles pour avoir les noms à jour
            try {
              const rs = await getDocs(collection(fb.db, 'roles'));
              rolesCache = rs.docs.map(d => ({ id: d.id, ...d.data() }));
              rolesById = new Map(rolesCache.map(r => [r.id, r]));
            } catch (err) {
              console.error('Erreur rechargement rôles:', err);
            }
            // Appliquer les filtres actuels pour réafficher avec les bonnes données
            applyFilters();
            
            // Si c'est l'utilisateur connecté qui a été modifié, recharger le profil et déclencher l'événement
            if (authState?.uid === id) {
              // Recharger le profil depuis Firestore
              const updatedProfile = await loadUserProfile();
              if (updatedProfile) {
                // L'événement profile:updated sera déclenché automatiquement par loadUserProfile
                // Mettre à jour le badge de rôle dans la sidebar
                const rb = document.getElementById('sb-role');
                if (rb) await updateRoleBadge(rb);
              }
            }
            
            const entrepriseLabel = getRoleDisplayInfo('Entreprise', roleEntrepriseId || '').text;
            const employeLabel = getRoleDisplayInfo('Employé', roleEmployeId !== undefined ? roleEmployeId : null).text;
            await addLogEntry(fb, { 
              type: 'action', 
              action: 'user_update', 
              category: 'utilisateurs',
              message: `Modification de l'utilisateur "${name || email}" - Entreprise: ${entrepriseLabel} | Employé: ${employeLabel}` 
            });
            alertModal({ title: 'Succès', message: 'Utilisateur modifié avec succès.', type: 'success' });
          } catch (err) {
            console.error('Erreur modification utilisateur:', err);
            alertModal({ title: 'Erreur', message: `Erreur lors de la modification de l'utilisateur: ${err.message || 'Erreur inconnue'}`, type: 'danger' });
          }
        }
      });
      // remplir rôles - s'assurer que rolesCache est chargé
      // Utiliser setTimeout pour s'assurer que le DOM est mis à jour
      setTimeout(async () => {
        const entrepriseSelect = document.getElementById('modal-edit-role-entreprise');
        const employeSelect = document.getElementById('modal-edit-role-employe');
        if (!rolesCache || rolesCache.length === 0) {
          try {
            const rs = await getDocs(collection(fb.db, 'roles'));
            rolesCache = rs.docs.map(d => ({ id: d.id, ...d.data() }));
            rolesById = new Map(rolesCache.map(r => [r.id, r]));
          } catch (err) {
            console.error('Erreur chargement rôles:', err);
          }
        }
        if (entrepriseSelect) {
          const entrepriseRoles = rolesCache.filter(r => r.permissions && r.permissions.entreprise === true);
          entrepriseSelect.innerHTML = buildRoleOptions(entrepriseRoles, { includeNoAccess: false, includeEmpty: true, currentValue: user.roleEntreprise ?? '' });
        }
        if (employeSelect) {
          const employeRoles = rolesCache.filter(r => r.permissions && r.permissions.employe === true);
          employeSelect.innerHTML = buildRoleOptions(employeRoles, { includeNoAccess: true, includeEmpty: true, currentValue: user.roleEmploye ?? null });
        }
      }, 10);
      return;
    }
    if (btn.classList.contains('btn-delete')) {
      createModal({
        title: 'Supprimer utilisateur',
        body: `<p>Êtes-vous sûr de vouloir supprimer <strong>${user.name || email}</strong> ?</p><p class="text-sm text-slate-500 mt-2">Cette action est irréversible.</p>`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        onConfirm: async () => {
          try {
            await deleteDoc(doc(fb.db, 'users', id));
            cache = cache.filter(u => u.id !== id);
            renderRows(cache);
            await addLogEntry(fb, { 
              type: 'action', 
              action: 'user_delete', 
              category: 'utilisateurs',
              message: `Suppression de l'utilisateur "${user.name || email}" (${email})` 
            });
            alertModal({ title: 'Succès', message: 'Utilisateur supprimé avec succès.', type: 'success' });
          } catch { 
            alertModal({ title: 'Erreur', message: 'Erreur lors de la suppression de l\'utilisateur.', type: 'danger' });
          }
        }
      });
      return;
    }
  });

  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Charger le profil depuis Firestore si le cache est vide
      let p = getCachedProfile();
      if (!p || !p.name) {
        p = await loadUserProfile() || {};
      }
      
      // Sidebar profile data
      const initials = (p.name || (p.email||'').split('@')[0] || 'MS').slice(0,2).toUpperCase();
      const av = document.getElementById('sb-avatar'); updateAvatar(av, p);
      const nm = document.getElementById('sb-name'); if (nm) nm.textContent = p.name || 'Utilisateur';
      const em = document.getElementById('sb-email'); if (em) em.textContent = p.email || '';
      const rb = document.getElementById('sb-role'); 
      if (rb) await updateRoleBadge(rb);

      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();
      
      // Appliquer les permissions pour les actions de la page
      await applyPagePermissions({
        create: 'employes',
        edit: 'employes',
        delete: 'employes'
      });

      // roles for selects/filters
      try {
        const rs = await getDocs(collection(fb.db, 'roles'));
        rolesCache = rs.docs.map(d => ({ id: d.id, ...d.data() }));
        rolesById = new Map(rolesCache.map(r => [r.id, r]));
        const rf = document.getElementById('role-filter');
        if (rf) {
          const entrepriseRoles = rolesCache.filter(r => r.permissions && r.permissions.entreprise === true);
          const employeRoles = rolesCache.filter(r => r.permissions && r.permissions.employe === true);
          
          const entrepriseOptions = entrepriseRoles.length > 0
            ? `<optgroup label="Espace Entreprise">
                <option value="entreprise:${ROLE_OPTION_EMPTY}">Sans rôle</option>
                <option value="entreprise:${ROLE_OPTION_NONE}">Pas d'accès</option>
                ${entrepriseRoles.map(r => `<option value="entreprise:${r.id}">${r.name}</option>`).join('')}
              </optgroup>`
            : '';
          
          const employeOptions = employeRoles.length > 0
            ? `<optgroup label="Espace Employé">
                <option value="employe:${ROLE_OPTION_EMPTY}">Sans rôle</option>
                <option value="employe:${ROLE_OPTION_NONE}">Pas d'accès</option>
                ${employeRoles.map(r => `<option value="employe:${r.id}">${r.name}</option>`).join('')}
              </optgroup>`
            : '';

          rf.innerHTML = `<option value="">Tous les rôles</option>${entrepriseOptions}${employeOptions}` || '<option value="">Aucun rôle disponible</option>';
        }
      } catch {}

      const snap = await getDocs(collection(fb.db, 'users'));
      cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderRows(cache);
    } catch (e) {}
  })();
}
