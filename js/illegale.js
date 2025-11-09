import { html, mount, getCachedProfile, loadUserProfile, createModal, alertModal, updateAvatar, isAuthenticated, updateRoleBadge, confirmModal, updateNavPermissions, applyPagePermissions } from './utils.js';
import { getFirebase, waitForFirebase, doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where, signOut } from './firebase.js';
import { addLogEntry } from './firebase.js';
import { formatDate } from './utils.js';

export function viewIllegale(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  const hash = location.hash || '#/illegale';
  
  if (hash === '#/illegale/points') {
    viewPointsIllegaux(root);
    return;
  }
  
  if (hash === '#/illegale/armes') {
    viewPacksArmes(root);
    return;
  }
  
  if (hash === '#/illegale/gestion-points') {
    viewGestionPointsIllegaux(root);
    return;
  }
  
  if (hash === '#/illegale/gestion-armes') {
    viewGestionPacksArmes(root);
    return;
  }
  
  // Par défaut, afficher la page des points illégaux
  viewPointsIllegaux(root);
}

function viewPointsIllegaux(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/illegale/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-illegale" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-illegale" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-illegale" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-illegale"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleIllegale"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Illégale</div>
          </a>
          <div class="section-title">Illégale</div>
          <nav class="nav-links">
            <a href="#/illegale/points" id="nav-points-illegale" class="active nav-item"><span class="nav-icon"></span>Points Illégaux</a>
            <a href="#/illegale/armes" id="nav-armes-illegale" class="nav-item"><span class="nav-icon"></span>Armement</a>
            <a href="#/illegale/gestion-points" id="nav-gestion-points-illegale" class="nav-item"><span class="nav-icon"></span>Gestion Points Illégaux</a>
            <a href="#/illegale/gestion-armes" id="nav-gestion-armes-illegale" class="nav-item"><span class="nav-icon"></span>Gestion Pack d'Armes</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-illegale" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Gestion des Points Illégaux</div>
              <div class="page-sub">Vendez et gérez les points illégaux</div>
            </div>
            <button id="btn-new-vente-points" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle vente
            </button>
          </div>

          <!-- Statistiques -->
          <div class="stats-grid mb-6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Total points vendus</div>
                <div id="stat-total-points" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Montant total ventes</div>
                <div id="stat-montant-total-points" class="stat-value">0 €</div>
              </div>
            </div>
          </div>

          <div class="user-table mt-4">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Points</th>
                  <th>Prix unitaire</th>
                  <th>Montant total</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="ventes-points-tbody">
                <tr><td class="py-3 text-center" colspan="7">Chargement…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  // Logout
  document.getElementById('logout-link-illegale')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const fb = getFirebase();
      if (fb && fb.auth) await signOut(fb.auth);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    }
  });

  // Charger le profil utilisateur
  (async () => {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Attendre un peu pour s'assurer que le DOM est monté
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Charger le profil depuis Firestore si le cache est vide
      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }
      
      // Sidebar profile - réessayer plusieurs fois si les éléments ne sont pas trouvés
      let attempts = 0;
      const maxAttempts = 5;
      const updateProfile = () => {
        const avatarEl = document.getElementById('sb-avatar-illegale');
        const nameEl = document.getElementById('sb-name-illegale');
        const emailEl = document.getElementById('sb-email-illegale');
        const roleEl = document.getElementById('sb-role-illegale');
        
        if (avatarEl && nameEl && emailEl) {
          updateAvatar(avatarEl, profile);
          nameEl.textContent = profile.name || profile.email || 'Utilisateur';
          emailEl.textContent = profile.email || '';
          if (roleEl) updateRoleBadge(roleEl);
          return true;
        }
        return false;
      };
      
      while (attempts < maxAttempts && !updateProfile()) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();
      
      // Appliquer les permissions pour les actions de la page
      // Les permissions dépendent de la page actuelle
      const hash = location.hash || '#/illegale/points';
      if (hash.includes('/points')) {
        await applyPagePermissions({
          create: 'illegale-points',
          edit: 'illegale-points',
          delete: 'illegale-points'
        });
      } else if (hash.includes('/armes')) {
        await applyPagePermissions({
          create: 'illegale-armes',
          edit: 'illegale-armes',
          delete: 'illegale-armes'
        });
      } else if (hash.includes('/gestion-points')) {
        await applyPagePermissions({
          create: 'illegale-gestion-points',
          edit: 'illegale-gestion-points',
          delete: 'illegale-gestion-points'
        });
      } else if (hash.includes('/gestion-armes')) {
        await applyPagePermissions({
          create: 'illegale-gestion-armes',
          edit: 'illegale-gestion-armes',
          delete: 'illegale-gestion-armes'
        });
      }
    } catch (e) {
      console.error('Erreur chargement profil:', e);
    }
  })();

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/illegale/points';
  const navPoints = document.getElementById('nav-points-illegale');
  const navArmes = document.getElementById('nav-armes-illegale');
  const navGestionPoints = document.getElementById('nav-gestion-points-illegale');
  const navGestionArmes = document.getElementById('nav-gestion-armes-illegale');
  if (navPoints && navArmes && navGestionPoints && navGestionArmes) {
    // Réinitialiser tous les états actifs
    [navPoints, navArmes, navGestionPoints, navGestionArmes].forEach(nav => nav?.classList.remove('active'));
    
    if (hash === '#/illegale/points') {
      navPoints.classList.add('active');
    } else if (hash === '#/illegale/armes') {
      navArmes.classList.add('active');
    } else if (hash === '#/illegale/gestion-points') {
      navGestionPoints.classList.add('active');
    } else if (hash === '#/illegale/gestion-armes') {
      navGestionArmes.classList.add('active');
    }
  }

  let currentUserId = null;
  let ventesCache = [];

  // Fonction pour formater les nombres avec espaces
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };

  // Charger les ventes
  async function loadVentesPoints() {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const q = query(collection(fb.db, 'ventesPointsIllegaux'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      ventesCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const tbody = document.getElementById('ventes-points-tbody');
      if (!tbody) return;
      
      if (ventesCache.length === 0) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="7">Aucune vente</td></tr>';
        return;
      }
      
      tbody.innerHTML = ventesCache.map(v => {
        const dateStr = v.dateVente ? formatDate(new Date(v.dateVente.seconds * 1000)) : '—';
        const statutClass = v.statut === 'valide' ? 'badge-actif' : v.statut === 'annule' ? 'badge-inactif' : '';
        const statutText = v.statut === 'valide' ? 'Validé' : v.statut === 'annule' ? 'Annulé' : 'En attente';
        return `
          <tr>
            <td>${dateStr}</td>
            <td>${v.nomClient || '—'}</td>
            <td>${v.points || 0}</td>
            <td>${formatAmount(v.prixUnitaire)} €</td>
            <td>${formatAmount(v.montantTotal)} €</td>
            <td><span class="badge-role ${statutClass}">${statutText}</span></td>
            <td>
              <div class="action-buttons">
                <button class="action-btn btn-view-vente-points" data-id="${v.id}" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      
      // Charger les statistiques
      const totalPoints = ventesCache.reduce((sum, v) => sum + (v.points || 0), 0);
      const montantTotal = ventesCache.reduce((sum, v) => sum + (v.montantTotal || 0), 0);
      const statTotalPoints = document.getElementById('stat-total-points');
      const statMontantTotal = document.getElementById('stat-montant-total-points');
      if (statTotalPoints) statTotalPoints.textContent = totalPoints.toLocaleString('fr-FR');
      if (statMontantTotal) statMontantTotal.textContent = formatAmount(montantTotal) + ' €';
    } catch (e) {
      console.error('Erreur chargement ventes points:', e);
      const tbody = document.getElementById('ventes-points-tbody');
      if (tbody) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="7">Erreur lors du chargement</td></tr>';
    }
  }

  // Nouvelle vente
  document.getElementById('btn-new-vente-points')?.addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Date de la vente *</label>
        <input id="modal-date-points" type="date" required />
      </div>
      <div class="modal-field">
        <label>Nom du client *</label>
        <input id="modal-nom-client-points" type="text" required placeholder="Nom du client" />
      </div>
      <div class="modal-field">
        <label>Nombre de points *</label>
        <input id="modal-points" type="number" min="1" required placeholder="100" />
      </div>
      <div class="modal-field">
        <label>Prix unitaire (€) *</label>
        <input id="modal-prix-unitaire-points" type="number" min="0" step="0.01" required placeholder="0.00" />
      </div>
    `;
    createModal({
      title: 'Nouvelle vente de points illégaux',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const dateStr = document.getElementById('modal-date-points').value;
        const nomClient = document.getElementById('modal-nom-client-points').value.trim();
        const points = parseInt(document.getElementById('modal-points').value);
        const prixUnitaire = parseFloat(document.getElementById('modal-prix-unitaire-points').value);
        
        if (!dateStr || !nomClient || !points || isNaN(prixUnitaire)) {
          alertModal({ title: 'Champs requis', message: 'Tous les champs sont requis.', type: 'warning' });
          return;
        }
        
        try {
          const profile = await getCachedProfile();
          const vendeurId = profile?.uid || null;
          const montantTotal = points * prixUnitaire;
          const dateVente = new Date(dateStr);
          
          await addDoc(collection(fb.db, 'ventesPointsIllegaux'), {
            dateVente: dateVente,
            nomClient,
            points,
            prixUnitaire,
            montantTotal,
            vendeurId,
            statut: 'en_attente',
            createdAt: serverTimestamp()
          });
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'vente_points_illegaux_create', 
            category: 'illegale',
            message: `Vente de ${points} points illégaux à ${nomClient}` 
          });
          
          loadVentesPoints();
          alertModal({ title: 'Succès', message: 'Vente créée avec succès.', type: 'success' });
        } catch (e) {
          console.error(e);
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la vente.', type: 'danger' });
        }
      }
    });
    
    // Définir la date d'aujourd'hui par défaut
    document.getElementById('modal-date-points').valueAsDate = new Date();
  });

  // Voir les détails d'une vente
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-view-vente-points');
    if (!btn) return;
    
    const venteId = btn.getAttribute('data-id');
    const vente = ventesCache.find(v => v.id === venteId);
    if (!vente) return;
    
    try {
      const dateStr = vente.dateVente ? formatDate(new Date(vente.dateVente.seconds * 1000)) : '—';
      const statutText = vente.statut === 'valide' ? 'Validé' : vente.statut === 'annule' ? 'Annulé' : 'En attente';
      const body = `
        <div class="view-item">
          <div class="view-item-label">Date de vente</div>
          <div class="view-item-value">${dateStr}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Nom du client</div>
          <div class="view-item-value">${vente.nomClient || '—'}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Nombre de points</div>
          <div class="view-item-value">${vente.points || 0}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Prix unitaire</div>
          <div class="view-item-value">${formatAmount(vente.prixUnitaire)} €</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Montant total</div>
          <div class="view-item-value" style="font-size: 1.25rem; color: #0055A4;">${formatAmount(vente.montantTotal)} €</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Statut</div>
          <div class="view-item-value">${statutText}</div>
        </div>
      `;
      createModal({ title: 'Détails vente', body, confirmText: 'Fermer', onConfirm: () => {}, isView: true });
    } catch (e) { 
      console.error(e); 
    }
  });

  loadVentesPoints();
}

function viewPacksArmes(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/illegale/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-armes" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-armes" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-armes" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-armes"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleIllegale"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Illégale</div>
          </a>
          <div class="section-title">Illégale</div>
          <nav class="nav-links">
            <a href="#/illegale/points" id="nav-points-armes" class="nav-item"><span class="nav-icon"></span>Points Illégaux</a>
            <a href="#/illegale/armes" id="nav-armes-armes" class="active nav-item"><span class="nav-icon"></span>Armement</a>
            <a href="#/illegale/gestion-points" id="nav-gestion-points-armes" class="nav-item"><span class="nav-icon"></span>Gestion Points Illégaux</a>
            <a href="#/illegale/gestion-armes" id="nav-gestion-armes-armes" class="nav-item"><span class="nav-icon"></span>Gestion Pack d'Armes</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-armes" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Armement</div>
              <div class="page-sub">Vendez et comparez les armements</div>
            </div>
            <button id="btn-new-vente-armes" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle vente
            </button>
          </div>

          <!-- Tabs -->
          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item active" data-tab="ventes">Ventes</button>
              <button class="tab-item" data-tab="comparateur">Comparateur</button>
            </div>
          </div>

          <!-- Tab 1: Ventes -->
          <div id="tab-ventes" class="tab-content active">
            <!-- Statistiques -->
            <div class="stats-grid mb-6">
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-label">Total packs vendus</div>
                  <div id="stat-total-packs" class="stat-value">0</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 010 7.75"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-label">Montant total ventes</div>
                  <div id="stat-montant-total-packs" class="stat-value">0 €</div>
                </div>
              </div>
            </div>

            <div class="user-table mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Type de pack</th>
                    <th>Quantité</th>
                    <th>Prix unitaire</th>
                    <th>Montant total</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="ventes-packs-tbody">
                  <tr><td class="py-3 text-center" colspan="8">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab 2: Comparateur -->
          <div id="tab-comparateur" class="tab-content">
            <!-- Instructions -->
            <div class="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p class="text-sm text-blue-900 dark:text-blue-200">
                <strong>Comment utiliser :</strong> Sélectionnez les armements que vous souhaitez comparer dans la liste ci-dessous. 
                Le tableau affichera les ressources nécessaires (Cuivre, Fer, Platinium BG, Platinium HG, Lingo D'or) pour chaque armement.
              </p>
            </div>

            <!-- Filtres -->
            <div class="mb-6 p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Recherche et filtres</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rechercher</label>
                  <input 
                    type="text" 
                    id="comparateur-search-armement" 
                    placeholder="Nom de l'équipement..."
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                  <select 
                    id="comparateur-filter-categorie" 
                    class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Toutes</option>
                    <option value="Arme">Arme</option>
                    <option value="Chargeur">Chargeur</option>
                    <option value="Viseurs">Viseurs</option>
                    <option value="Gilet">Gilet</option>
                    <option value="Autres">Autres</option>
                  </select>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <button 
                  id="comparateur-clear-filters-armement" 
                  class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  Réinitialiser filtres
                </button>
                <button 
                  id="comparateur-clear-all-armement" 
                  class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Vider le comparateur
                </button>
              </div>
            </div>

            <!-- Sélection d'armement -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sélectionner un armement
              </label>
              <div class="relative">
                <select 
                  id="comparateur-select-armement" 
                  class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choisir un armement --</option>
                </select>
                <button 
                  id="comparateur-add-selected-armement" 
                  class="mt-2 w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Ajouter au comparateur
                </button>
              </div>
            </div>

            <!-- Liste des armements sélectionnés -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Armements dans le comparateur (<span id="comparateur-selected-count-armement">0</span>)
              </h4>
              <div id="comparateur-selected-armement" class="space-y-3">
                <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  Aucun armement sélectionné. Utilisez la liste ci-dessus pour ajouter des armements.
                </p>
              </div>
            </div>

            <!-- Tableau de comparaison -->
            <div id="comparateur-table-container-armement" class="hidden">
              <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Comparaison des ressources</h4>
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-white/5">
                      <th class="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Armement</th>
                      <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Quantité</th>
                      <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Cuivre</th>
                      <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Fer</th>
                      <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Platinium BG</th>
                      <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Platinium HG</th>
                      <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Lingo D'or</th>
                      <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="comparateur-tbody-armement"></tbody>
                  <tfoot id="comparateur-totals-armement" class="bg-slate-50 dark:bg-white/5 font-semibold"></tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  // Logout
  document.getElementById('logout-link-armes')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const fb = getFirebase();
      if (fb && fb.auth) await signOut(fb.auth);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    }
  });

  // Charger le profil utilisateur
  (async () => {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Attendre un peu pour s'assurer que le DOM est monté
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Charger le profil depuis Firestore si le cache est vide
      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }
      
      // Sidebar profile - réessayer plusieurs fois si les éléments ne sont pas trouvés
      let attempts = 0;
      const maxAttempts = 5;
      const updateProfile = () => {
        const avatarEl = document.getElementById('sb-avatar-armes');
        const nameEl = document.getElementById('sb-name-armes');
        const emailEl = document.getElementById('sb-email-armes');
        const roleEl = document.getElementById('sb-role-armes');
        
        if (avatarEl && nameEl && emailEl) {
          updateAvatar(avatarEl, profile);
          nameEl.textContent = profile.name || profile.email || 'Utilisateur';
          emailEl.textContent = profile.email || '';
          if (roleEl) updateRoleBadge(roleEl);
          return true;
        }
        return false;
      };
      
      while (attempts < maxAttempts && !updateProfile()) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();
      
      // Appliquer les permissions pour les actions de la page
      // Les permissions dépendent de la page actuelle
      const hash = location.hash || '#/illegale/points';
      if (hash.includes('/points')) {
        await applyPagePermissions({
          create: 'illegale-points',
          edit: 'illegale-points',
          delete: 'illegale-points'
        });
      } else if (hash.includes('/armes')) {
        await applyPagePermissions({
          create: 'illegale-armes',
          edit: 'illegale-armes',
          delete: 'illegale-armes'
        });
      } else if (hash.includes('/gestion-points')) {
        await applyPagePermissions({
          create: 'illegale-gestion-points',
          edit: 'illegale-gestion-points',
          delete: 'illegale-gestion-points'
        });
      } else if (hash.includes('/gestion-armes')) {
        await applyPagePermissions({
          create: 'illegale-gestion-armes',
          edit: 'illegale-gestion-armes',
          delete: 'illegale-gestion-armes'
        });
      }
    } catch (e) {
      console.error('Erreur chargement profil:', e);
    }
  })();

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/illegale/armes';
  const navPoints = document.getElementById('nav-points-armes');
  const navArmes = document.getElementById('nav-armes-armes');
  const navGestionPoints = document.getElementById('nav-gestion-points-armes');
  const navGestionArmes = document.getElementById('nav-gestion-armes-armes');
  if (navPoints && navArmes && navGestionPoints && navGestionArmes) {
    // Réinitialiser tous les états actifs
    [navPoints, navArmes, navGestionPoints, navGestionArmes].forEach(nav => nav?.classList.remove('active'));
    
    if (hash === '#/illegale/points') {
      navPoints.classList.add('active');
    } else if (hash === '#/illegale/armes') {
      navArmes.classList.add('active');
    } else if (hash === '#/illegale/gestion-points') {
      navGestionPoints.classList.add('active');
    } else if (hash === '#/illegale/gestion-armes') {
      navGestionArmes.classList.add('active');
    }
  }

  let ventesCache = [];
  let currentTabArmes = localStorage.getItem('armes-tab') || 'ventes'; // 'ventes' ou 'comparateur'
  let armementsCache = [];
  let comparateurArmements = []; // [{armement, quantite}]
  let filteredArmements = [];

  // Fonction pour formater les nombres avec espaces
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Tab switching
  setTimeout(() => {
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabContent = document.getElementById(`tab-${tabId}`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
        currentTabArmes = tabId;
        localStorage.setItem('armes-tab', tabId);
        
        if (tabId === 'ventes') {
          loadVentesPacks();
        } else if (tabId === 'comparateur') {
          if (armementsCache.length === 0) {
            loadArmements();
          } else {
            updateComparateurDisplay();
          }
        }
      });
    });
    
    // Initialiser l'onglet actif
    const activeTabBtn = document.querySelector(`[data-tab="${currentTabArmes}"]`);
    if (activeTabBtn) {
      activeTabBtn.click();
    }
  }, 100);

  // Charger les ventes
  async function loadVentesPacks() {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const q = query(collection(fb.db, 'ventesPacksArmes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      ventesCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const tbody = document.getElementById('ventes-packs-tbody');
      if (!tbody) return;
      
      if (ventesCache.length === 0) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="8">Aucune vente</td></tr>';
        return;
      }
      
      tbody.innerHTML = ventesCache.map(v => {
        const dateStr = v.dateVente ? formatDate(new Date(v.dateVente.seconds * 1000)) : '—';
        const statutClass = v.statut === 'valide' ? 'badge-actif' : v.statut === 'annule' ? 'badge-inactif' : '';
        const statutText = v.statut === 'valide' ? 'Validé' : v.statut === 'annule' ? 'Annulé' : 'En attente';
        return `
          <tr>
            <td>${dateStr}</td>
            <td>${v.nomClient || '—'}</td>
            <td>${v.typePack || '—'}</td>
            <td>${v.quantite || 0}</td>
            <td>${formatAmount(v.prixUnitaire)} €</td>
            <td>${formatAmount(v.montantTotal)} €</td>
            <td><span class="badge-role ${statutClass}">${statutText}</span></td>
            <td>
              <div class="action-buttons">
                <button class="action-btn btn-view-vente-packs" data-id="${v.id}" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      
      // Charger les statistiques
      const totalPacks = ventesCache.reduce((sum, v) => sum + (v.quantite || 0), 0);
      const montantTotal = ventesCache.reduce((sum, v) => sum + (v.montantTotal || 0), 0);
      const statTotalPacks = document.getElementById('stat-total-packs');
      const statMontantTotal = document.getElementById('stat-montant-total-packs');
      if (statTotalPacks) statTotalPacks.textContent = totalPacks.toLocaleString('fr-FR');
      if (statMontantTotal) statMontantTotal.textContent = formatAmount(montantTotal) + ' €';
    } catch (e) {
      console.error('Erreur chargement ventes packs:', e);
      const tbody = document.getElementById('ventes-packs-tbody');
      if (tbody) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="8">Erreur lors du chargement</td></tr>';
    }
  }

  // Nouvelle vente
  document.getElementById('btn-new-vente-armes')?.addEventListener('click', async () => {
    // Charger les types de packs disponibles
    await waitForFirebase();
    const fb = getFirebase();
    let typesPacks = [];
    try {
      const snapshot = await getDocs(collection(fb.db, 'typesPacksArmes'));
      typesPacks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('Erreur chargement types packs:', e);
    }
    
    const body = `
      <div class="modal-field">
        <label>Date de la vente *</label>
        <input id="modal-date-armes" type="date" required />
      </div>
      <div class="modal-field">
        <label>Nom du client *</label>
        <input id="modal-nom-client-armes" type="text" required placeholder="Nom du client" />
      </div>
      <div class="modal-field">
        <label>Type de pack *</label>
        <select id="modal-type-pack" required>
          <option value="">Sélectionner un type</option>
          ${typesPacks.map(p => `<option value="${p.nom}" data-prix="${p.prixUnitaire || 0}">${p.nom} - ${(p.prixUnitaire || 0).toFixed(2)} €</option>`).join('')}
          <option value="personnalise">Personnalisé</option>
        </select>
      </div>
      <div class="modal-field">
        <label>Quantité *</label>
        <input id="modal-quantite-armes" type="number" min="1" required placeholder="1" />
      </div>
      <div class="modal-field">
        <label>Prix unitaire (€) *</label>
        <input id="modal-prix-unitaire-armes" type="number" min="0" step="0.01" required placeholder="0.00" />
      </div>
    `;
    createModal({
      title: 'Nouvelle vente de pack d\'armes',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const dateStr = document.getElementById('modal-date-armes').value;
        const nomClient = document.getElementById('modal-nom-client-armes').value.trim();
        const typePack = document.getElementById('modal-type-pack').value;
        const quantite = parseInt(document.getElementById('modal-quantite-armes').value);
        const prixUnitaire = parseFloat(document.getElementById('modal-prix-unitaire-armes').value);
        
        if (!dateStr || !nomClient || !typePack || !quantite || isNaN(prixUnitaire)) {
          alertModal({ title: 'Champs requis', message: 'Tous les champs sont requis.', type: 'warning' });
          return;
        }
        
        try {
          const profile = await getCachedProfile();
          const vendeurId = profile?.uid || null;
          const montantTotal = quantite * prixUnitaire;
          const dateVente = new Date(dateStr);
          
          await addDoc(collection(fb.db, 'ventesPacksArmes'), {
            dateVente: dateVente,
            nomClient,
            typePack,
            quantite,
            prixUnitaire,
            montantTotal,
            vendeurId,
            statut: 'en_attente',
            createdAt: serverTimestamp()
          });
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'vente_packs_armes_create', 
            category: 'illegale',
            message: `Vente de ${quantite} pack(s) "${typePack}" à ${nomClient}` 
          });
          
          loadVentesPacks();
          alertModal({ title: 'Succès', message: 'Vente créée avec succès.', type: 'success' });
        } catch (e) {
          console.error(e);
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la vente.', type: 'danger' });
        }
      }
    });
    
    // Définir la date d'aujourd'hui par défaut
    document.getElementById('modal-date-armes').valueAsDate = new Date();
    
    // Mettre à jour le prix unitaire quand le type de pack change
    document.getElementById('modal-type-pack')?.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const prix = selectedOption.getAttribute('data-prix');
      const prixInput = document.getElementById('modal-prix-unitaire-armes');
      if (prix && prixInput) {
        prixInput.value = parseFloat(prix).toFixed(2);
      }
    });
  });

  // Voir les détails d'une vente
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-view-vente-packs');
    if (!btn) return;
    
    const venteId = btn.getAttribute('data-id');
    const vente = ventesCache.find(v => v.id === venteId);
    if (!vente) return;
    
    try {
      const dateStr = vente.dateVente ? formatDate(new Date(vente.dateVente.seconds * 1000)) : '—';
      const statutText = vente.statut === 'valide' ? 'Validé' : vente.statut === 'annule' ? 'Annulé' : 'En attente';
      const body = `
        <div class="view-item">
          <div class="view-item-label">Date de vente</div>
          <div class="view-item-value">${dateStr}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Nom du client</div>
          <div class="view-item-value">${vente.nomClient || '—'}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Type de pack</div>
          <div class="view-item-value">${vente.typePack || '—'}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Quantité</div>
          <div class="view-item-value">${vente.quantite || 0}</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Prix unitaire</div>
          <div class="view-item-value">${formatAmount(vente.prixUnitaire)} €</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Montant total</div>
          <div class="view-item-value" style="font-size: 1.25rem; color: #0055A4;">${formatAmount(vente.montantTotal)} €</div>
        </div>
        <div class="view-item">
          <div class="view-item-label">Statut</div>
          <div class="view-item-value">${statutText}</div>
        </div>
      `;
      createModal({ title: 'Détails vente', body, confirmText: 'Fermer', onConfirm: () => {}, isView: true });
    } catch (e) { 
      console.error(e); 
    }
  });

  // Fonctions du comparateur
  async function loadArmements() {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const q = query(collection(fb.db, 'typesPacksArmes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      armementsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      filteredArmements = [...armementsCache];
      
      updateComparateurSelect();
    } catch (e) {
      console.error('Erreur chargement armements:', e);
    }
  }

  function updateComparateurSelect() {
    const select = document.getElementById('comparateur-select-armement');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Choisir un armement --</option>';
    
    filteredArmements.forEach(a => {
      const isAlreadyAdded = comparateurArmements.some(ca => ca.armement.id === a.id);
      if (!isAlreadyAdded) {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = `${a.categorie || '—'} - ${a.nomEquipement || a.nom || '—'}`;
        select.appendChild(option);
      }
    });
  }

  function updateComparateurDisplay() {
    const selectedContainer = document.getElementById('comparateur-selected-armement');
    const selectedCountEl = document.getElementById('comparateur-selected-count-armement');
    const tableContainer = document.getElementById('comparateur-table-container-armement');
    const tbody = document.getElementById('comparateur-tbody-armement');
    const totalsFoot = document.getElementById('comparateur-totals-armement');
    
    if (!selectedContainer || !selectedCountEl || !tableContainer || !tbody || !totalsFoot) return;
    
    if (selectedCountEl) selectedCountEl.textContent = comparateurArmements.length;
    
    updateComparateurSelect();
    
    if (comparateurArmements.length === 0) {
      selectedContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Aucun armement sélectionné. Utilisez la liste ci-dessus pour ajouter des armements.</p>';
      tableContainer.classList.add('hidden');
      return;
    }
    
    // Afficher les armements sélectionnés
    selectedContainer.innerHTML = comparateurArmements.map((ca, index) => {
      const a = ca.armement;
      return `
        <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white mb-1">${a.categorie || '—'} - ${a.nomEquipement || a.nom || '—'}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">
                Cuivre: ${a.cuivre || 0} • Fer: ${a.fer || 0} • Platinium BG: ${a.platiniumBG || 0} • Platinium HG: ${a.platiniumHG || 0} • Lingo D'or: ${a.lingoDor || 0}
              </div>
            </div>
            <button 
              class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
              onclick="window.removeFromComparateurArmement(${index})"
            >
              Retirer
            </button>
          </div>
          <div class="pt-3 border-t border-slate-200 dark:border-white/10">
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quantité</label>
            <input 
              type="number" 
              min="1" 
              value="${ca.quantite}" 
              class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
              onchange="window.updateComparateurQuantiteArmement(${index}, this.value)"
            />
          </div>
        </div>
      `;
    }).join('');
    
    // Afficher le tableau
    tableContainer.classList.remove('hidden');
    
    // Générer le tableau
    let totalCuivre = 0;
    let totalFer = 0;
    let totalPlatiniumBG = 0;
    let totalPlatiniumHG = 0;
    let totalLingoDor = 0;
    
    tbody.innerHTML = comparateurArmements.map((ca, index) => {
      const a = ca.armement;
      const qty = ca.quantite || 1;
      
      const cuivreTotal = (a.cuivre || 0) * qty;
      const ferTotal = (a.fer || 0) * qty;
      const platiniumBGTotal = (a.platiniumBG || 0) * qty;
      const platiniumHGTotal = (a.platiniumHG || 0) * qty;
      const lingoDorTotal = (a.lingoDor || 0) * qty;
      
      totalCuivre += cuivreTotal;
      totalFer += ferTotal;
      totalPlatiniumBG += platiniumBGTotal;
      totalPlatiniumHG += platiniumHGTotal;
      totalLingoDor += lingoDorTotal;
      
      return `
        <tr class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">
            <div class="font-medium">${a.categorie || '—'}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${a.nomEquipement || a.nom || '—'}</div>
          </td>
          <td class="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">
            <input 
              type="number" 
              min="1" 
              value="${qty}" 
              class="w-16 px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm text-center"
              onchange="window.updateComparateurQuantiteArmement(${index}, this.value)"
            />
          </td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(cuivreTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(ferTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(platiniumBGTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(platiniumHGTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(lingoDorTotal)}</td>
          <td class="px-4 py-3 text-center">
            <button 
              class="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              onclick="window.removeFromComparateurArmement(${index})"
            >
              Retirer
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Générer les totaux
    totalsFoot.innerHTML = `
      <tr class="bg-slate-100 dark:bg-white/10">
        <td class="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">TOTAL</td>
        <td class="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">${comparateurArmements.reduce((sum, ca) => sum + (ca.quantite || 1), 0)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">${formatNumber(totalCuivre)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">${formatNumber(totalFer)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-purple-600 dark:text-purple-400">${formatNumber(totalPlatiniumBG)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-pink-600 dark:text-pink-400">${formatNumber(totalPlatiniumHG)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-yellow-600 dark:text-yellow-400">${formatNumber(totalLingoDor)}</td>
        <td class="px-4 py-3"></td>
      </tr>
    `;
  }

  // Fonction globale pour ajouter un armement au comparateur
  window.addToComparateurArmement = function(armementId) {
    const armement = armementsCache.find(a => a.id === armementId);
    if (!armement) return;
    
    if (comparateurArmements.some(ca => ca.armement.id === armementId)) {
      alertModal({ 
        title: 'Information', 
        message: 'Cet armement est déjà dans le comparateur.', 
        type: 'info' 
      });
      return;
    }
    
    comparateurArmements.push({
      armement: armement,
      quantite: 1
    });
    
    updateComparateurDisplay();
  };

  // Fonction globale pour retirer un armement du comparateur
  window.removeFromComparateurArmement = function(index) {
    comparateurArmements.splice(index, 1);
    updateComparateurDisplay();
  };

  // Fonction globale pour mettre à jour la quantité
  window.updateComparateurQuantiteArmement = function(index, value) {
    const quantite = parseInt(value) || 1;
    if (quantite < 1) return;
    if (comparateurArmements[index]) {
      comparateurArmements[index].quantite = quantite;
      updateComparateurDisplay();
    }
  };

  // Event listeners pour le comparateur
  document.getElementById('comparateur-add-selected-armement')?.addEventListener('click', () => {
    const select = document.getElementById('comparateur-select-armement');
    const armementId = select?.value;
    if (armementId) {
      window.addToComparateurArmement(armementId);
      select.value = '';
    }
  });

  document.getElementById('comparateur-clear-all-armement')?.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir vider le comparateur ?')) {
      comparateurArmements = [];
      updateComparateurDisplay();
    }
  });

  document.getElementById('comparateur-clear-filters-armement')?.addEventListener('click', () => {
    document.getElementById('comparateur-search-armement').value = '';
    document.getElementById('comparateur-filter-categorie').value = '';
    filteredArmements = [...armementsCache];
    updateComparateurSelect();
  });

  // Filtres du comparateur
  const searchInput = document.getElementById('comparateur-search-armement');
  const filterCategorie = document.getElementById('comparateur-filter-categorie');
  
  const applyFilters = () => {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const categorieFilter = filterCategorie?.value || '';
    
    filteredArmements = armementsCache.filter(a => {
      const matchSearch = !query || 
        (a.nomEquipement || a.nom || '').toLowerCase().includes(query) ||
        (a.categorie || '').toLowerCase().includes(query);
      const matchCategorie = !categorieFilter || a.categorie === categorieFilter;
      
      return matchSearch && matchCategorie;
    });
    
    updateComparateurSelect();
  };
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterCategorie) filterCategorie.addEventListener('change', applyFilters);

  loadVentesPacks();
}

function viewGestionPointsIllegaux(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/illegale/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-gestion-points" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-gestion-points" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-gestion-points" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-gestion-points"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleIllegale"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Illégale</div>
          </a>
          <div class="section-title">Illégale</div>
          <nav class="nav-links">
            <a href="#/illegale/points" id="nav-points-gestion-points" class="nav-item"><span class="nav-icon"></span>Points Illégaux</a>
            <a href="#/illegale/armes" id="nav-armes-gestion-points" class="nav-item"><span class="nav-icon"></span>Armement</a>
            <a href="#/illegale/gestion-points" id="nav-gestion-points-gestion-points" class="active nav-item"><span class="nav-icon"></span>Gestion Points Illégaux</a>
            <a href="#/illegale/gestion-armes" id="nav-gestion-armes-gestion-points" class="nav-item"><span class="nav-icon"></span>Gestion Pack d'Armes</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-gestion-points" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Gestion Points Illégaux</div>
              <div class="page-sub">Créez et gérez les types de points illégaux disponibles</div>
            </div>
            <button id="btn-new-points-illegaux" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau type
            </button>
          </div>

          <div class="user-table mt-4">
            <table>
              <thead>
                <tr>
                  <th>Nom du point</th>
                  <th>Coordonnées</th>
                  <th>Image</th>
                  <th>Prix unitaire (€)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="types-points-tbody">
                <tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  // Logout
  document.getElementById('logout-link-gestion-points')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const fb = getFirebase();
      if (fb && fb.auth) await signOut(fb.auth);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    }
  });

  // Charger le profil utilisateur
  (async () => {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Attendre un peu pour s'assurer que le DOM est monté
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Charger le profil depuis Firestore si le cache est vide
      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }
      
      // Sidebar profile - réessayer plusieurs fois si les éléments ne sont pas trouvés
      let attempts = 0;
      const maxAttempts = 5;
      const updateProfile = () => {
        const avatarEl = document.getElementById('sb-avatar-gestion-points');
        const nameEl = document.getElementById('sb-name-gestion-points');
        const emailEl = document.getElementById('sb-email-gestion-points');
        const roleEl = document.getElementById('sb-role-gestion-points');
        
        if (avatarEl && nameEl && emailEl) {
          updateAvatar(avatarEl, profile);
          nameEl.textContent = profile.name || profile.email || 'Utilisateur';
          emailEl.textContent = profile.email || '';
          if (roleEl) updateRoleBadge(roleEl);
          return true;
        }
        return false;
      };
      
      while (attempts < maxAttempts && !updateProfile()) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();
      
      // Appliquer les permissions pour les actions de la page
      // Les permissions dépendent de la page actuelle
      const hash = location.hash || '#/illegale/points';
      if (hash.includes('/points')) {
        await applyPagePermissions({
          create: 'illegale-points',
          edit: 'illegale-points',
          delete: 'illegale-points'
        });
      } else if (hash.includes('/armes')) {
        await applyPagePermissions({
          create: 'illegale-armes',
          edit: 'illegale-armes',
          delete: 'illegale-armes'
        });
      } else if (hash.includes('/gestion-points')) {
        await applyPagePermissions({
          create: 'illegale-gestion-points',
          edit: 'illegale-gestion-points',
          delete: 'illegale-gestion-points'
        });
      } else if (hash.includes('/gestion-armes')) {
        await applyPagePermissions({
          create: 'illegale-gestion-armes',
          edit: 'illegale-gestion-armes',
          delete: 'illegale-gestion-armes'
        });
      }
    } catch (e) {
      console.error('Erreur chargement profil:', e);
    }
  })();

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/illegale/gestion-points';
  const navPoints = document.getElementById('nav-points-gestion-points');
  const navArmes = document.getElementById('nav-armes-gestion-points');
  const navGestionPoints = document.getElementById('nav-gestion-points-gestion-points');
  const navGestionArmes = document.getElementById('nav-gestion-armes-gestion-points');
  if (navPoints && navArmes && navGestionPoints && navGestionArmes) {
    [navPoints, navArmes, navGestionPoints, navGestionArmes].forEach(nav => nav?.classList.remove('active'));
    if (hash === '#/illegale/points') {
      navPoints.classList.add('active');
    } else if (hash === '#/illegale/armes') {
      navArmes.classList.add('active');
    } else if (hash === '#/illegale/gestion-points') {
      navGestionPoints.classList.add('active');
    } else if (hash === '#/illegale/gestion-armes') {
      navGestionArmes.classList.add('active');
    }
  }

  let typesCache = [];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };

  async function loadTypesPoints() {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const q = query(collection(fb.db, 'typesPointsIllegaux'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      typesCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const tbody = document.getElementById('types-points-tbody');
      if (!tbody) return;
      
      if (typesCache.length === 0) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucun type de points illégaux</td></tr>';
        return;
      }
      
      tbody.innerHTML = typesCache.map(t => {
        const images = Array.isArray(t.imageUrls) ? t.imageUrls : (t.imageUrl ? [t.imageUrl] : []);
        const imageHtml = images.length
          ? images.map((url, idx) => {
              const safeUrl = (url || '').replace(/"/g, '&quot;');
              const label = images.length > 1 ? `Image ${idx + 1}` : 'Voir image';
              return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: #0055A4; text-decoration: underline;">${label}</a>`;
            }).join('<br/>')
          : '—';
        return `
        <tr>
          <td>${t.nomPoint || t.nom || '—'}</td>
          <td>${t.coordonnees || '—'}</td>
          <td>${imageHtml}</td>
          <td>${formatAmount(t.prixUnitaire)} €</td>
          <td>${t.description || '—'}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn btn-edit-points" data-id="${t.id}" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
              <button class="action-btn btn-delete-points" data-id="${t.id}" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
            </div>
          </td>
        </tr>
      `;
      }).join('');
    } catch (e) {
      console.error('Erreur chargement types points:', e);
      const tbody = document.getElementById('types-points-tbody');
      if (tbody) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Erreur lors du chargement</td></tr>';
    }
  }

  // Nouveau type
  document.getElementById('btn-new-points-illegaux')?.addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Nom du point illégal *</label>
        <input id="modal-nom-point" type="text" required placeholder="Nom du point illégal" />
      </div>
      <div class="modal-field">
        <label>Coordonnées (7 chiffres) *</label>
        <input id="modal-coordonnees" type="text" required placeholder="1234567" pattern="[0-9]{7}" maxlength="7" />
        <div class="text-xs text-slate-500 mt-1">7 chiffres exactement</div>
      </div>
      <div class="modal-field">
        <label>Liens d'images (un par ligne)</label>
        <textarea id="modal-images-urls" placeholder="https://exemple.com/image-1.jpg\nhttps://exemple.com/image-2.jpg"></textarea>
        <div class="text-xs text-slate-500 mt-1">Laissez vide si aucune image n'est disponible.</div>
      </div>
      <div class="modal-field">
        <label>Prix unitaire (€) *</label>
        <input id="modal-prix-points" type="number" min="0" step="0.01" required placeholder="0.00" />
      </div>
      <div class="modal-field">
        <label>Description</label>
        <textarea id="modal-desc-points" placeholder="Description du type de points"></textarea>
      </div>
    `;
    createModal({
      title: 'Nouveau type de points illégaux',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const nomPoint = document.getElementById('modal-nom-point').value.trim();
        const coordonnees = document.getElementById('modal-coordonnees').value.trim();
        const imagesRaw = document.getElementById('modal-images-urls').value.trim();
        const imageUrls = imagesRaw ? imagesRaw.split(/\n+/).map(url => url.trim()).filter(Boolean) : [];
        const prixUnitaire = parseFloat(document.getElementById('modal-prix-points').value);
        const description = document.getElementById('modal-desc-points').value.trim();
        
        // Validation des coordonnées (7 chiffres)
        if (!/^[0-9]{7}$/.test(coordonnees)) {
          alertModal({ title: 'Erreur de validation', message: 'Les coordonnées doivent contenir exactement 7 chiffres.', type: 'warning' });
          return;
        }
        
        if (!nomPoint || isNaN(prixUnitaire)) {
          alertModal({ title: 'Champs requis', message: 'Le nom du point et le prix unitaire sont requis.', type: 'warning' });
          return;
        }
        
        try {
          await addDoc(collection(fb.db, 'typesPointsIllegaux'), {
            nomPoint,
            coordonnees,
            imageUrl: imageUrls[0] || '',
            imageUrls,
            prixUnitaire,
            description: description || '',
            createdAt: serverTimestamp()
          });
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'type_points_illegaux_create', 
            category: 'illegale',
            message: `Création du type de points illégaux "${nomPoint}"` 
          });
          
          loadTypesPoints();
          alertModal({ title: 'Succès', message: 'Type créé avec succès.', type: 'success' });
        } catch (e) {
          console.error(e);
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création du type.', type: 'danger' });
        }
      }
    });
  });

  // Modifier un type
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-edit-points');
    if (!btn) return;
    
    const typeId = btn.getAttribute('data-id');
    const type = typesCache.find(t => t.id === typeId);
    if (!type) return;
    
    const existingImages = Array.isArray(type.imageUrls) ? type.imageUrls : (type.imageUrl ? [type.imageUrl] : []);
    const imagesValueEscaped = existingImages
      .map(url => (url || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      .join('&#10;');

    const body = `
      <div class="modal-field">
        <label>Nom du point illégal *</label>
        <input id="modal-edit-nom-point" type="text" required value="${((type.nomPoint || type.nom) || '').replace(/"/g, '&quot;')}" />
      </div>
      <div class="modal-field">
        <label>Coordonnées (7 chiffres) *</label>
        <input id="modal-edit-coordonnees" type="text" required placeholder="1234567" pattern="[0-9]{7}" maxlength="7" value="${(type.coordonnees || '').replace(/"/g, '&quot;')}" />
        <div class="text-xs text-slate-500 mt-1">7 chiffres exactement</div>
      </div>
      <div class="modal-field">
        <label>Liens d'images (un par ligne)</label>
        <textarea id="modal-edit-images-urls" placeholder="https://exemple.com/image-1.jpg&#10;https://exemple.com/image-2.jpg">${imagesValueEscaped}</textarea>
        <div class="text-xs text-slate-500 mt-1">Laissez vide si aucune image n'est disponible.</div>
      </div>
      <div class="modal-field">
        <label>Prix unitaire (€) *</label>
        <input id="modal-edit-prix-points" type="number" min="0" step="0.01" required value="${type.prixUnitaire || 0}" />
      </div>
      <div class="modal-field">
        <label>Description</label>
        <textarea id="modal-edit-desc-points">${(type.description || '').replace(/"/g, '&quot;')}</textarea>
      </div>
    `;
    createModal({
      title: 'Modifier le type de points illégaux',
      body,
      confirmText: 'Enregistrer',
      onConfirm: async () => {
        const fb = getFirebase();
        const nomPoint = document.getElementById('modal-edit-nom-point').value.trim();
        const coordonnees = document.getElementById('modal-edit-coordonnees').value.trim();
        const imagesRaw = document.getElementById('modal-edit-images-urls').value.trim();
        const imageUrls = imagesRaw ? imagesRaw.split(/\n+/).map(url => url.trim()).filter(Boolean) : [];
        const prixUnitaire = parseFloat(document.getElementById('modal-edit-prix-points').value);
        const description = document.getElementById('modal-edit-desc-points').value.trim();
        
        // Validation des coordonnées (7 chiffres)
        if (!/^[0-9]{7}$/.test(coordonnees)) {
          alertModal({ title: 'Erreur de validation', message: 'Les coordonnées doivent contenir exactement 7 chiffres.', type: 'warning' });
          return;
        }
        
        if (!nomPoint || isNaN(prixUnitaire)) {
          alertModal({ title: 'Champs requis', message: 'Le nom du point et le prix unitaire sont requis.', type: 'warning' });
          return;
        }
        
        try {
          await updateDoc(doc(fb.db, 'typesPointsIllegaux', typeId), {
            nomPoint,
            coordonnees,
            imageUrl: imageUrls[0] || '',
            imageUrls,
            prixUnitaire,
            description: description || ''
          });
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'type_points_illegaux_update', 
            category: 'illegale',
            message: `Modification du type de points illégaux "${nomPoint}"` 
          });
          
          loadTypesPoints();
          alertModal({ title: 'Succès', message: 'Type modifié avec succès.', type: 'success' });
        } catch (e) {
          console.error(e);
          alertModal({ title: 'Erreur', message: 'Erreur lors de la modification du type.', type: 'danger' });
        }
      }
    });
  });

  // Supprimer un type
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete-points');
    if (!btn) return;
    
    const typeId = btn.getAttribute('data-id');
    const type = typesCache.find(t => t.id === typeId);
    if (!type) return;
    
    const confirmed = await confirmModal({
      title: 'Supprimer le type',
      message: `Êtes-vous sûr de vouloir supprimer le type "${type.nom}" ? Cette action est irréversible.`
    });
    
    if (!confirmed) return;
    
    try {
      const fb = getFirebase();
      await deleteDoc(doc(fb.db, 'typesPointsIllegaux', typeId));
      
      await addLogEntry(fb, { 
        type: 'action', 
        action: 'type_points_illegaux_delete', 
        category: 'illegale',
        message: `Suppression du type de points illégaux "${type.nom}"` 
      });
      
      loadTypesPoints();
      alertModal({ title: 'Succès', message: 'Type supprimé avec succès.', type: 'success' });
    } catch (e) {
      console.error(e);
      alertModal({ title: 'Erreur', message: 'Erreur lors de la suppression du type.', type: 'danger' });
    }
  });

  loadTypesPoints();
}

function viewGestionPacksArmes(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/illegale/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-gestion-armes" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-gestion-armes" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-gestion-armes" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-gestion-armes"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleIllegale"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Illégale</div>
          </a>
          <div class="section-title">Illégale</div>
          <nav class="nav-links">
            <a href="#/illegale/points" id="nav-points-gestion-armes" class="nav-item"><span class="nav-icon"></span>Points Illégaux</a>
            <a href="#/illegale/armes" id="nav-armes-gestion-armes" class="nav-item"><span class="nav-icon"></span>Armement</a>
            <a href="#/illegale/gestion-points" id="nav-gestion-points-gestion-armes" class="nav-item"><span class="nav-icon"></span>Gestion Points Illégaux</a>
            <a href="#/illegale/gestion-armes" id="nav-gestion-armes-gestion-armes" class="active nav-item"><span class="nav-icon"></span>Gestion Pack d'Armes</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-gestion-armes" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Gestion Pack d'Armes</div>
              <div class="page-sub">Créez et gérez les types de packs d'armes disponibles</div>
            </div>
            <button id="btn-new-packs-armes" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau type
            </button>
          </div>

          <!-- Tabs pour les catégories -->
          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item active" data-tab-categorie="all">Tous</button>
              <button class="tab-item" data-tab-categorie="Arme">Arme</button>
              <button class="tab-item" data-tab-categorie="Chargeur">Chargeur</button>
              <button class="tab-item" data-tab-categorie="Viseurs">Viseurs</button>
              <button class="tab-item" data-tab-categorie="Gilet">Gilet</button>
              <button class="tab-item" data-tab-categorie="Autres">Autres</button>
            </div>
          </div>

          <div class="user-table mt-4">
            <table>
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Nom de l'équipement</th>
                  <th>Cuivre</th>
                  <th>Fer</th>
                  <th>Platinium BG</th>
                  <th>Platinium HG</th>
                  <th>Lingo D'or</th>
                  <th>Commentaire</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="types-packs-tbody">
                <tr><td class="py-3 text-center" colspan="9">Chargement…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  // Logout
  document.getElementById('logout-link-gestion-armes')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const fb = getFirebase();
      if (fb && fb.auth) await signOut(fb.auth);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    }
  });

  // Charger le profil utilisateur
  (async () => {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Attendre un peu pour s'assurer que le DOM est monté
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Charger le profil depuis Firestore si le cache est vide
      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }
      
      // Sidebar profile - réessayer plusieurs fois si les éléments ne sont pas trouvés
      let attempts = 0;
      const maxAttempts = 5;
      const updateProfile = () => {
        const avatarEl = document.getElementById('sb-avatar-gestion-armes');
        const nameEl = document.getElementById('sb-name-gestion-armes');
        const emailEl = document.getElementById('sb-email-gestion-armes');
        const roleEl = document.getElementById('sb-role-gestion-armes');
        
        if (avatarEl && nameEl && emailEl) {
          updateAvatar(avatarEl, profile);
          nameEl.textContent = profile.name || profile.email || 'Utilisateur';
          emailEl.textContent = profile.email || '';
          if (roleEl) updateRoleBadge(roleEl);
          return true;
        }
        return false;
      };
      
      while (attempts < maxAttempts && !updateProfile()) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();
      
      // Appliquer les permissions pour les actions de la page
      // Les permissions dépendent de la page actuelle
      const hash = location.hash || '#/illegale/points';
      if (hash.includes('/points')) {
        await applyPagePermissions({
          create: 'illegale-points',
          edit: 'illegale-points',
          delete: 'illegale-points'
        });
      } else if (hash.includes('/armes')) {
        await applyPagePermissions({
          create: 'illegale-armes',
          edit: 'illegale-armes',
          delete: 'illegale-armes'
        });
      } else if (hash.includes('/gestion-points')) {
        await applyPagePermissions({
          create: 'illegale-gestion-points',
          edit: 'illegale-gestion-points',
          delete: 'illegale-gestion-points'
        });
      } else if (hash.includes('/gestion-armes')) {
        await applyPagePermissions({
          create: 'illegale-gestion-armes',
          edit: 'illegale-gestion-armes',
          delete: 'illegale-gestion-armes'
        });
      }
    } catch (e) {
      console.error('Erreur chargement profil:', e);
    }
  })();

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/illegale/gestion-armes';
  const navPoints = document.getElementById('nav-points-gestion-armes');
  const navArmes = document.getElementById('nav-armes-gestion-armes');
  const navGestionPoints = document.getElementById('nav-gestion-points-gestion-armes');
  const navGestionArmes = document.getElementById('nav-gestion-armes-gestion-armes');
  if (navPoints && navArmes && navGestionPoints && navGestionArmes) {
    [navPoints, navArmes, navGestionPoints, navGestionArmes].forEach(nav => nav?.classList.remove('active'));
    if (hash === '#/illegale/points') {
      navPoints.classList.add('active');
    } else if (hash === '#/illegale/armes') {
      navArmes.classList.add('active');
    } else if (hash === '#/illegale/gestion-points') {
      navGestionPoints.classList.add('active');
    } else if (hash === '#/illegale/gestion-armes') {
      navGestionArmes.classList.add('active');
    }
  }

  let typesCache = [];
  let currentCategorieFilter = 'all'; // 'all', 'Arme', 'Chargeur', 'Viseurs', 'Gilet', 'Autres'

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };

  function renderTypesPacks() {
    const tbody = document.getElementById('types-packs-tbody');
    if (!tbody) return;
    
    // Filtrer par catégorie
    let filteredTypes = typesCache;
    if (currentCategorieFilter !== 'all') {
      filteredTypes = typesCache.filter(t => t.categorie === currentCategorieFilter);
    }
    
    if (filteredTypes.length === 0) {
      tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="9">Aucun type de pack d\'armes' + (currentCategorieFilter !== 'all' ? ` dans la catégorie "${currentCategorieFilter}"` : '') + '</td></tr>';
      return;
    }
    
    // Styles sobres avec bordures légères pour les ressources
    const getCellStyle = (value, color) => {
      if (value > 0) {
        return `background-color: rgba(${color}, 0.08); border-left: 3px solid rgba(${color}, 0.4); padding-left: 12px;`;
      }
      return '';
    };
    
    // Styles sobres pour les catégories
    const getCategorieStyle = (cat) => {
      const colors = {
        'Arme': '99, 102, 241',      // Indigo
        'Chargeur': '139, 92, 246',  // Violet
        'Viseurs': '59, 130, 246',   // Bleu
        'Gilet': '236, 72, 153',     // Rose
        'Autres': '100, 116, 139'    // Gris
      };
      const color = colors[cat] || '100, 116, 139';
      if (cat) {
        return `background-color: rgba(${color}, 0.08); border-left: 3px solid rgba(${color}, 0.4); padding-left: 12px;`;
      }
      return '';
    };
    
    tbody.innerHTML = filteredTypes.map(t => {
      const cuivre = t.cuivre || 0;
      const fer = t.fer || 0;
      const platiniumBG = t.platiniumBG || 0;
      const platiniumHG = t.platiniumHG || 0;
      const lingoDor = t.lingoDor || 0;
      const categorie = t.categorie || '';
      
      return `
        <tr>
          <td style="${getCategorieStyle(categorie)}" class="${categorie ? 'font-medium' : ''}">${categorie || '—'}</td>
          <td>${t.nomEquipement || t.nom || '—'}</td>
          <td style="${getCellStyle(cuivre, '249, 115, 22')}" class="${cuivre > 0 ? 'text-center font-medium' : 'text-center'}">${cuivre}</td>
          <td style="${getCellStyle(fer, '100, 116, 139')}" class="${fer > 0 ? 'text-center font-medium' : 'text-center'}">${fer}</td>
          <td style="${getCellStyle(platiniumBG, '59, 130, 246')}" class="${platiniumBG > 0 ? 'text-center font-medium' : 'text-center'}">${platiniumBG}</td>
          <td style="${getCellStyle(platiniumHG, '236, 72, 153')}" class="${platiniumHG > 0 ? 'text-center font-medium' : 'text-center'}">${platiniumHG}</td>
          <td style="${getCellStyle(lingoDor, '234, 179, 8')}" class="${lingoDor > 0 ? 'text-center font-medium' : 'text-center'}">${lingoDor}</td>
          <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.commentaire || t.description || '—'}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn btn-edit-packs" data-id="${t.id}" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
              <button class="action-btn btn-delete-packs" data-id="${t.id}" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadTypesPacks() {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const q = query(collection(fb.db, 'typesPacksArmes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      typesCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      renderTypesPacks();
    } catch (e) {
      console.error('Erreur chargement types packs:', e);
      const tbody = document.getElementById('types-packs-tbody');
      if (tbody) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="9">Erreur lors du chargement</td></tr>';
    }
  }

  // Gestion des onglets de catégories
  setTimeout(() => {
    document.querySelectorAll('[data-tab-categorie]').forEach(btn => {
      btn.addEventListener('click', () => {
        const categorie = btn.getAttribute('data-tab-categorie');
        document.querySelectorAll('[data-tab-categorie]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategorieFilter = categorie;
        renderTypesPacks();
      });
    });
  }, 100);

  // Nouveau type
  document.getElementById('btn-new-packs-armes')?.addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Catégorie *</label>
        <select id="modal-categorie-packs" required>
          <option value="">Sélectionner une catégorie</option>
          <option value="Arme">Arme</option>
          <option value="Chargeur">Chargeur</option>
          <option value="Viseurs">Viseurs</option>
          <option value="Gilet">Gilet</option>
          <option value="Autres">Autres</option>
        </select>
      </div>
      <div class="modal-field">
        <label>Nom de l'équipement *</label>
        <input id="modal-nom-equipement-packs" type="text" required placeholder="Nom de l'équipement" />
      </div>
      <div class="modal-field">
        <label>Cuivre (Nombre)</label>
        <input id="modal-cuivre-packs" type="number" min="0" placeholder="0" value="0" />
      </div>
      <div class="modal-field">
        <label>Fer (Nombre)</label>
        <input id="modal-fer-packs" type="number" min="0" placeholder="0" value="0" />
      </div>
      <div class="modal-field">
        <label>Platinium BG (Nombre)</label>
        <input id="modal-platinium-bg-packs" type="number" min="0" placeholder="0" value="0" />
      </div>
      <div class="modal-field">
        <label>Platinium HG (Nombre)</label>
        <input id="modal-platinium-hg-packs" type="number" min="0" placeholder="0" value="0" />
      </div>
      <div class="modal-field">
        <label>Lingo D'or (Nombre)</label>
        <input id="modal-lingo-dor-packs" type="number" min="0" placeholder="0" value="0" />
      </div>
      <div class="modal-field">
        <label>Commentaire</label>
        <textarea id="modal-commentaire-packs" placeholder="Commentaire"></textarea>
      </div>
    `;
    createModal({
      title: 'Nouveau type de pack d\'armes',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const categorie = document.getElementById('modal-categorie-packs').value.trim();
        const nomEquipement = document.getElementById('modal-nom-equipement-packs').value.trim();
        const cuivre = parseInt(document.getElementById('modal-cuivre-packs').value) || 0;
        const fer = parseInt(document.getElementById('modal-fer-packs').value) || 0;
        const platiniumBG = parseInt(document.getElementById('modal-platinium-bg-packs').value) || 0;
        const platiniumHG = parseInt(document.getElementById('modal-platinium-hg-packs').value) || 0;
        const lingoDor = parseInt(document.getElementById('modal-lingo-dor-packs').value) || 0;
        const commentaire = document.getElementById('modal-commentaire-packs').value.trim();
        
        if (!categorie || !nomEquipement) {
          alertModal({ title: 'Champs requis', message: 'La catégorie et le nom de l\'équipement sont requis.', type: 'warning' });
          return;
        }
        
        try {
          await addDoc(collection(fb.db, 'typesPacksArmes'), {
            categorie,
            nomEquipement,
            cuivre,
            fer,
            platiniumBG,
            platiniumHG,
            lingoDor: lingoDor,
            commentaire: commentaire || '',
            createdAt: serverTimestamp()
          });
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'type_packs_armes_create', 
            category: 'illegale',
            message: `Création du type de pack d'armes "${nomEquipement}"` 
          });
          
          loadTypesPacks();
          alertModal({ title: 'Succès', message: 'Type créé avec succès.', type: 'success' });
        } catch (e) {
          console.error(e);
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création du type.', type: 'danger' });
        }
      }
    });
  });

  // Modifier un type
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-edit-packs');
    if (!btn) return;
    
    const typeId = btn.getAttribute('data-id');
    const type = typesCache.find(t => t.id === typeId);
    if (!type) return;
    
    const body = `
      <div class="modal-field">
        <label>Catégorie *</label>
        <select id="modal-edit-categorie-packs" required>
          <option value="">Sélectionner une catégorie</option>
          <option value="Arme" ${(type.categorie || '') === 'Arme' ? 'selected' : ''}>Arme</option>
          <option value="Chargeur" ${(type.categorie || '') === 'Chargeur' ? 'selected' : ''}>Chargeur</option>
          <option value="Viseurs" ${(type.categorie || '') === 'Viseurs' ? 'selected' : ''}>Viseurs</option>
          <option value="Gilet" ${(type.categorie || '') === 'Gilet' ? 'selected' : ''}>Gilet</option>
          <option value="Autres" ${(type.categorie || '') === 'Autres' ? 'selected' : ''}>Autres</option>
        </select>
      </div>
      <div class="modal-field">
        <label>Nom de l'équipement *</label>
        <input id="modal-edit-nom-equipement-packs" type="text" required value="${((type.nomEquipement || type.nom) || '').replace(/"/g, '&quot;')}" />
      </div>
      <div class="modal-field">
        <label>Cuivre (Nombre)</label>
        <input id="modal-edit-cuivre-packs" type="number" min="0" value="${type.cuivre || 0}" />
      </div>
      <div class="modal-field">
        <label>Fer (Nombre)</label>
        <input id="modal-edit-fer-packs" type="number" min="0" value="${type.fer || 0}" />
      </div>
      <div class="modal-field">
        <label>Platinium BG (Nombre)</label>
        <input id="modal-edit-platinium-bg-packs" type="number" min="0" value="${type.platiniumBG || 0}" />
      </div>
      <div class="modal-field">
        <label>Platinium HG (Nombre)</label>
        <input id="modal-edit-platinium-hg-packs" type="number" min="0" value="${type.platiniumHG || 0}" />
      </div>
      <div class="modal-field">
        <label>Lingo D'or (Nombre)</label>
        <input id="modal-edit-lingo-dor-packs" type="number" min="0" value="${type.lingoDor || 0}" />
      </div>
      <div class="modal-field">
        <label>Commentaire</label>
        <textarea id="modal-edit-commentaire-packs">${(type.commentaire || type.description || '').replace(/"/g, '&quot;')}</textarea>
      </div>
    `;
    createModal({
      title: 'Modifier le type de pack d\'armes',
      body,
      confirmText: 'Enregistrer',
      onConfirm: async () => {
        const fb = getFirebase();
        const categorie = document.getElementById('modal-edit-categorie-packs').value.trim();
        const nomEquipement = document.getElementById('modal-edit-nom-equipement-packs').value.trim();
        const cuivre = parseInt(document.getElementById('modal-edit-cuivre-packs').value) || 0;
        const fer = parseInt(document.getElementById('modal-edit-fer-packs').value) || 0;
        const platiniumBG = parseInt(document.getElementById('modal-edit-platinium-bg-packs').value) || 0;
        const platiniumHG = parseInt(document.getElementById('modal-edit-platinium-hg-packs').value) || 0;
        const lingoDor = parseInt(document.getElementById('modal-edit-lingo-dor-packs').value) || 0;
        const commentaire = document.getElementById('modal-edit-commentaire-packs').value.trim();
        
        if (!categorie || !nomEquipement) {
          alertModal({ title: 'Champs requis', message: 'La catégorie et le nom de l\'équipement sont requis.', type: 'warning' });
          return;
        }
        
        try {
          await updateDoc(doc(fb.db, 'typesPacksArmes', typeId), {
            categorie,
            nomEquipement,
            cuivre,
            fer,
            platiniumBG,
            platiniumHG,
            lingoDor: lingoDor,
            commentaire: commentaire || ''
          });
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'type_packs_armes_update', 
            category: 'illegale',
            message: `Modification du type de pack d'armes "${nomEquipement}"` 
          });
          
          loadTypesPacks();
          alertModal({ title: 'Succès', message: 'Type modifié avec succès.', type: 'success' });
        } catch (e) {
          console.error(e);
          alertModal({ title: 'Erreur', message: 'Erreur lors de la modification du type.', type: 'danger' });
        }
      }
    });
  });

  // Supprimer un type
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete-packs');
    if (!btn) return;
    
    const typeId = btn.getAttribute('data-id');
    const type = typesCache.find(t => t.id === typeId);
    if (!type) return;
    
    const confirmed = await confirmModal({
      title: 'Supprimer le type',
      message: `Êtes-vous sûr de vouloir supprimer le type "${type.nom}" ? Cette action est irréversible.`
    });
    
    if (!confirmed) return;
    
    try {
      const fb = getFirebase();
      await deleteDoc(doc(fb.db, 'typesPacksArmes', typeId));
      
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'type_packs_armes_delete', 
            category: 'illegale',
            message: `Suppression du type de pack d'armes "${type.nomEquipement || type.nom}"` 
          });
      
      loadTypesPacks();
      alertModal({ title: 'Succès', message: 'Type supprimé avec succès.', type: 'success' });
    } catch (e) {
      console.error(e);
      alertModal({ title: 'Erreur', message: 'Erreur lors de la suppression du type.', type: 'danger' });
    }
  });

  loadTypesPacks();
}

function viewComparateurArmement(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/illegale/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-comparateur" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-comparateur" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-comparateur" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-comparateur"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleIllegale"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Illégale</div>
          </a>
          <div class="section-title">Illégale</div>
          <nav class="nav-links">
            <a href="#/illegale/points" id="nav-points-comparateur" class="nav-item"><span class="nav-icon"></span>Points Illégaux</a>
            <a href="#/illegale/armes" id="nav-armes-comparateur" class="nav-item"><span class="nav-icon"></span>Packs d'Armes</a>
            <a href="#/illegale/comparateur-armement" id="nav-comparateur-armement-comparateur" class="active nav-item"><span class="nav-icon"></span>Comparateur d'Armement</a>
            <a href="#/illegale/gestion-points" id="nav-gestion-points-comparateur" class="nav-item"><span class="nav-icon"></span>Gestion Points Illégaux</a>
            <a href="#/illegale/gestion-armes" id="nav-gestion-armes-comparateur" class="nav-item"><span class="nav-icon"></span>Gestion Pack d'Armes</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-comparateur" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Comparateur d'Armement</div>
              <div class="page-sub">Comparez les différents armements et leurs coûts de fabrication</div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-blue-900 dark:text-blue-200">
              <strong>Comment utiliser :</strong> Sélectionnez les armements que vous souhaitez comparer dans la liste ci-dessous. 
              Le tableau affichera les ressources nécessaires (Cuivre, Fer, Platinium BG, Platinium HG, Lingo D'or) pour chaque armement.
            </p>
          </div>

          <!-- Filtres -->
          <div class="mb-6 p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
            <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Recherche et filtres</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rechercher</label>
                <input 
                  type="text" 
                  id="comparateur-search-armement" 
                  placeholder="Nom de l'équipement..."
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie</label>
                <select 
                  id="comparateur-filter-categorie" 
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Toutes</option>
                  <option value="Arme">Arme</option>
                  <option value="Chargeur">Chargeur</option>
                  <option value="Viseurs">Viseurs</option>
                  <option value="Gilet">Gilet</option>
                  <option value="Autres">Autres</option>
                </select>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
              <button 
                id="comparateur-clear-filters-armement" 
                class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
              >
                Réinitialiser filtres
              </button>
              <button 
                id="comparateur-clear-all-armement" 
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Vider le comparateur
              </button>
            </div>
          </div>

          <!-- Sélection d'armement -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sélectionner un armement
            </label>
            <div class="relative">
              <select 
                id="comparateur-select-armement" 
                class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choisir un armement --</option>
              </select>
              <button 
                id="comparateur-add-selected-armement" 
                class="mt-2 w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Ajouter au comparateur
              </button>
            </div>
          </div>

          <!-- Liste des armements sélectionnés -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Armements dans le comparateur (<span id="comparateur-selected-count-armement">0</span>)
            </h4>
            <div id="comparateur-selected-armement" class="space-y-3">
              <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                Aucun armement sélectionné. Utilisez la liste ci-dessus pour ajouter des armements.
              </p>
            </div>
          </div>

          <!-- Tableau de comparaison -->
          <div id="comparateur-table-container-armement" class="hidden">
            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Comparaison des ressources</h4>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-white/5">
                    <th class="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Armement</th>
                    <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Quantité</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Cuivre</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Fer</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Platinium BG</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Platinium HG</th>
                    <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Lingo D'or</th>
                    <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Actions</th>
                  </tr>
                </thead>
                <tbody id="comparateur-tbody-armement"></tbody>
                <tfoot id="comparateur-totals-armement" class="bg-slate-50 dark:bg-white/5 font-semibold"></tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  // Logout
  document.getElementById('logout-link-comparateur')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const fb = getFirebase();
      if (fb && fb.auth) await signOut(fb.auth);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    }
  });

  // Charger le profil utilisateur
  (async () => {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }
      
      let attempts = 0;
      const maxAttempts = 5;
      const updateProfile = () => {
        const avatarEl = document.getElementById('sb-avatar-comparateur');
        const nameEl = document.getElementById('sb-name-comparateur');
        const emailEl = document.getElementById('sb-email-comparateur');
        const roleEl = document.getElementById('sb-role-comparateur');
        
        if (avatarEl && nameEl && emailEl) {
          updateAvatar(avatarEl, profile);
          nameEl.textContent = profile.name || profile.email || 'Utilisateur';
          emailEl.textContent = profile.email || '';
          if (roleEl) updateRoleBadge(roleEl);
          return true;
        }
        return false;
      };
      
      while (attempts < maxAttempts && !updateProfile()) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();
      
      // Appliquer les permissions pour les actions de la page
      // Les permissions dépendent de la page actuelle
      const hash = location.hash || '#/illegale/points';
      if (hash.includes('/points')) {
        await applyPagePermissions({
          create: 'illegale-points',
          edit: 'illegale-points',
          delete: 'illegale-points'
        });
      } else if (hash.includes('/armes')) {
        await applyPagePermissions({
          create: 'illegale-armes',
          edit: 'illegale-armes',
          delete: 'illegale-armes'
        });
      } else if (hash.includes('/gestion-points')) {
        await applyPagePermissions({
          create: 'illegale-gestion-points',
          edit: 'illegale-gestion-points',
          delete: 'illegale-gestion-points'
        });
      } else if (hash.includes('/gestion-armes')) {
        await applyPagePermissions({
          create: 'illegale-gestion-armes',
          edit: 'illegale-gestion-armes',
          delete: 'illegale-gestion-armes'
        });
      }
    } catch (e) {
      console.error('Erreur chargement profil:', e);
    }
  })();

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/illegale/comparateur-armement';
  const navPoints = document.getElementById('nav-points-comparateur');
  const navArmes = document.getElementById('nav-armes-comparateur');
  const navComparateur = document.getElementById('nav-comparateur-armement-comparateur');
  const navGestionPoints = document.getElementById('nav-gestion-points-comparateur');
  const navGestionArmes = document.getElementById('nav-gestion-armes-comparateur');
  if (navPoints && navArmes && navComparateur && navGestionPoints && navGestionArmes) {
    [navPoints, navArmes, navComparateur, navGestionPoints, navGestionArmes].forEach(nav => nav?.classList.remove('active'));
    if (hash === '#/illegale/points') {
      navPoints.classList.add('active');
    } else if (hash === '#/illegale/armes') {
      navArmes.classList.add('active');
    } else if (hash === '#/illegale/comparateur-armement') {
      navComparateur.classList.add('active');
    } else if (hash === '#/illegale/gestion-points') {
      navGestionPoints.classList.add('active');
    } else if (hash === '#/illegale/gestion-armes') {
      navGestionArmes.classList.add('active');
    }
  }

  let armementsCache = [];
  let comparateurArmements = []; // [{armement, quantite}]
  let filteredArmements = [];

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Charger les armements
  async function loadArmements() {
    try {
      await waitForFirebase();
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const q = query(collection(fb.db, 'typesPacksArmes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      armementsCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      filteredArmements = [...armementsCache];
      
      updateComparateurSelect();
    } catch (e) {
      console.error('Erreur chargement armements:', e);
    }
  }

  // Mettre à jour le select
  function updateComparateurSelect() {
    const select = document.getElementById('comparateur-select-armement');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Choisir un armement --</option>';
    
    filteredArmements.forEach(a => {
      const isAlreadyAdded = comparateurArmements.some(ca => ca.armement.id === a.id);
      if (!isAlreadyAdded) {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = `${a.categorie || '—'} - ${a.nomEquipement || a.nom || '—'}`;
        select.appendChild(option);
      }
    });
  }

  // Mettre à jour l'affichage du comparateur
  function updateComparateurDisplay() {
    const selectedContainer = document.getElementById('comparateur-selected-armement');
    const selectedCountEl = document.getElementById('comparateur-selected-count-armement');
    const tableContainer = document.getElementById('comparateur-table-container-armement');
    const tbody = document.getElementById('comparateur-tbody-armement');
    const totalsFoot = document.getElementById('comparateur-totals-armement');
    
    if (!selectedContainer || !selectedCountEl || !tableContainer || !tbody || !totalsFoot) return;
    
    if (selectedCountEl) selectedCountEl.textContent = comparateurArmements.length;
    
    updateComparateurSelect();
    
    if (comparateurArmements.length === 0) {
      selectedContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Aucun armement sélectionné. Utilisez la liste ci-dessus pour ajouter des armements.</p>';
      tableContainer.classList.add('hidden');
      return;
    }
    
    // Afficher les armements sélectionnés
    selectedContainer.innerHTML = comparateurArmements.map((ca, index) => {
      const a = ca.armement;
      return `
        <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white mb-1">${a.categorie || '—'} - ${a.nomEquipement || a.nom || '—'}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">
                Cuivre: ${a.cuivre || 0} • Fer: ${a.fer || 0} • Platinium BG: ${a.platiniumBG || 0} • Platinium HG: ${a.platiniumHG || 0} • Lingo D'or: ${a.lingoDor || 0}
              </div>
            </div>
            <button 
              class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
              onclick="window.removeFromComparateurArmement(${index})"
            >
              Retirer
            </button>
          </div>
          <div class="pt-3 border-t border-slate-200 dark:border-white/10">
            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quantité</label>
            <input 
              type="number" 
              min="1" 
              value="${ca.quantite}" 
              class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
              onchange="window.updateComparateurQuantiteArmement(${index}, this.value)"
            />
          </div>
        </div>
      `;
    }).join('');
    
    // Afficher le tableau
    tableContainer.classList.remove('hidden');
    
    // Générer le tableau
    let totalCuivre = 0;
    let totalFer = 0;
    let totalPlatiniumBG = 0;
    let totalPlatiniumHG = 0;
    let totalLingoDor = 0;
    
    tbody.innerHTML = comparateurArmements.map((ca, index) => {
      const a = ca.armement;
      const qty = ca.quantite || 1;
      
      const cuivreTotal = (a.cuivre || 0) * qty;
      const ferTotal = (a.fer || 0) * qty;
      const platiniumBGTotal = (a.platiniumBG || 0) * qty;
      const platiniumHGTotal = (a.platiniumHG || 0) * qty;
      const lingoDorTotal = (a.lingoDor || 0) * qty;
      
      totalCuivre += cuivreTotal;
      totalFer += ferTotal;
      totalPlatiniumBG += platiniumBGTotal;
      totalPlatiniumHG += platiniumHGTotal;
      totalLingoDor += lingoDorTotal;
      
      return `
        <tr class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">
            <div class="font-medium">${a.categorie || '—'}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${a.nomEquipement || a.nom || '—'}</div>
          </td>
          <td class="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">
            <input 
              type="number" 
              min="1" 
              value="${qty}" 
              class="w-16 px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm text-center"
              onchange="window.updateComparateurQuantiteArmement(${index}, this.value)"
            />
          </td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(cuivreTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(ferTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(platiniumBGTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(platiniumHGTotal)}</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(lingoDorTotal)}</td>
          <td class="px-4 py-3 text-center">
            <button 
              class="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              onclick="window.removeFromComparateurArmement(${index})"
            >
              Retirer
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Générer les totaux
    totalsFoot.innerHTML = `
      <tr class="bg-slate-100 dark:bg-white/10">
        <td class="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">TOTAL</td>
        <td class="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">${comparateurArmements.reduce((sum, ca) => sum + (ca.quantite || 1), 0)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">${formatNumber(totalCuivre)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">${formatNumber(totalFer)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-purple-600 dark:text-purple-400">${formatNumber(totalPlatiniumBG)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-pink-600 dark:text-pink-400">${formatNumber(totalPlatiniumHG)}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-yellow-600 dark:text-yellow-400">${formatNumber(totalLingoDor)}</td>
        <td class="px-4 py-3"></td>
      </tr>
    `;
  }

  // Fonction globale pour ajouter un armement au comparateur
  window.addToComparateurArmement = function(armementId) {
    const armement = armementsCache.find(a => a.id === armementId);
    if (!armement) return;
    
    if (comparateurArmements.some(ca => ca.armement.id === armementId)) {
      alertModal({ 
        title: 'Information', 
        message: 'Cet armement est déjà dans le comparateur.', 
        type: 'info' 
      });
      return;
    }
    
    comparateurArmements.push({
      armement: armement,
      quantite: 1
    });
    
    updateComparateurDisplay();
  };

  // Fonction globale pour retirer un armement du comparateur
  window.removeFromComparateurArmement = function(index) {
    comparateurArmements.splice(index, 1);
    updateComparateurDisplay();
  };

  // Fonction globale pour mettre à jour la quantité
  window.updateComparateurQuantiteArmement = function(index, value) {
    const quantite = parseInt(value) || 1;
    if (quantite < 1) return;
    if (comparateurArmements[index]) {
      comparateurArmements[index].quantite = quantite;
      updateComparateurDisplay();
    }
  };

  // Event listeners
  document.getElementById('comparateur-add-selected-armement')?.addEventListener('click', () => {
    const select = document.getElementById('comparateur-select-armement');
    const armementId = select?.value;
    if (armementId) {
      window.addToComparateurArmement(armementId);
      select.value = '';
    }
  });

  document.getElementById('comparateur-clear-all-armement')?.addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir vider le comparateur ?')) {
      comparateurArmements = [];
      updateComparateurDisplay();
    }
  });

  document.getElementById('comparateur-clear-filters-armement')?.addEventListener('click', () => {
    document.getElementById('comparateur-search-armement').value = '';
    document.getElementById('comparateur-filter-categorie').value = '';
    filteredArmements = [...armementsCache];
    updateComparateurSelect();
  });

  // Filtres
  const searchInput = document.getElementById('comparateur-search-armement');
  const filterCategorie = document.getElementById('comparateur-filter-categorie');
  
  const applyFilters = () => {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const categorieFilter = filterCategorie?.value || '';
    
    filteredArmements = armementsCache.filter(a => {
      const matchSearch = !query || 
        (a.nomEquipement || a.nom || '').toLowerCase().includes(query) ||
        (a.categorie || '').toLowerCase().includes(query);
      const matchCategorie = !categorieFilter || a.categorie === categorieFilter;
      
      return matchSearch && matchCategorie;
    });
    
    updateComparateurSelect();
  };
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterCategorie) filterCategorie.addEventListener('change', applyFilters);

  // Initialiser
  loadArmements();
}

