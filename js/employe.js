import { html, mount, getCachedProfile, loadUserProfile, createModal, alertModal, updateAvatar, isAuthenticated, updateRoleBadge, updateNavPermissions, applyPagePermissions } from './utils.js';
import { getFirebase, waitForFirebase, doc, getDoc, collection, getDocs, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where, signOut } from './firebase.js';
import { addLogEntry } from './firebase.js';
import { formatDate } from './utils.js';

export function viewEmploye(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  const hash = location.hash || '#/employe';
  
  if (hash === '#/employe/calcul') {
    viewCalculEmploye(root);
    return;
  }
  
  if (hash === '#/employe/centrale') {
    location.hash = '#/employe/suivi-effectif';
    return;
  }
  
  if (hash === '#/employe/calculatrice') {
    viewCalculatriceEmploye(root);
    return;
  }

  if (hash === '#/employe/flotte') {
    viewFlotteEmploye(root);
    return;
  }

  if (hash === '#/employe/suivi-effectif') {
    viewSuiviEffectifEmploye(root);
    return;
  }
  
  // Par défaut, afficher la page des ventes
  viewVentesEmploye(root);
}

function viewVentesEmploye(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/employe/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
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
              data-role-field="roleEmploye"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Employé</div>
            <nav class="nav-links">
            <a href="#/employe" id="nav-vente" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/centrale" id="nav-centrale" class="nav-item" style="display:none;"><span class="nav-icon"></span>Prise de service</a>
            <a href="#/employe/suivi-effectif" id="nav-suivi-effectif" class="nav-item"><span class="nav-icon"></span>Suivi effectif</a>
            <a href="#/employe/flotte" id="nav-flotte" class="nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/employe/calculatrice" id="nav-calculatrice" class="nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-emp" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Gestion des Ventes</div>
              <div class="page-sub">Saisissez vos ventes</div>
            </div>
            <button id="btn-new-vente-emp" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle vente
            </button>
          </div>

          <!-- Statistiques -->
          <div class="stats-grid mb-6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Total ventes</div>
                <div id="stat-total-ventes-emp" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div>
                <div class="stat-label">En attente</div>
                <div id="stat-en-attente-emp" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <div class="stat-label">Validées</div>
                <div id="stat-validees-emp" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <div class="stat-label">Traitées</div>
                <div id="stat-traitees-emp" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
              <div>
                <div class="stat-label">Annulées</div>
                <div id="stat-annulees-emp" class="stat-value">0</div>
              </div>
            </div>
          </div>

          <div class="user-table mt-4">
            <table>
              <thead>
                <tr>
                <th>Date</th>
                <th>Type de ressource</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Montant total</th>
                <th>Statut</th>
                <th>Actions</th>
                </tr>
              </thead>
              <tbody id="ventes-emp-tbody">
              <tr><td class="py-3 text-center" colspan="7">Chargement…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  const logoutLink = document.getElementById('logout-link-emp');
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

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/employe';
  const navVente = document.getElementById('nav-vente');
  const navFlotte = document.getElementById('nav-flotte');
  const navCalcul = document.getElementById('nav-calcul');
  const navCalculatrice = document.getElementById('nav-calculatrice');
  const navSuiviEffectif = document.getElementById('nav-suivi-effectif');
  const navItems = [navVente, navFlotte, navCalcul, navCalculatrice, navSuiviEffectif].filter(Boolean);
  navItems.forEach(item => item.classList.remove('active'));
  switch (hash) {
    case '#/employe/flotte':
      navFlotte?.classList.add('active');
      break;
    case '#/employe/calcul':
      navCalcul?.classList.add('active');
      break;
    case '#/employe/calculatrice':
      navCalculatrice?.classList.add('active');
      break;
    case '#/employe/suivi-effectif':
      navSuiviEffectif?.classList.add('active');
      break;
    default:
      navVente?.classList.add('active');
      break;
  }

  let ressourcesCache = [];
  let currentUserId = null;

  // Fonction pour formater les nombres avec espaces (1 000, 10 000, etc.)
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

  // Formattage des statuts (majuscule/minuscule correctes)
  function formatStatus(raw) {
    const s = (raw || '').toLowerCase();
    if (s === 'en attente') return 'En attente';
    if (s === 'valide') return 'Validé';
    if (s === 'annule') return 'Annulé';
    if (s === 'traite') return 'Traité';
    return raw || '—';
  }

  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      currentUserId = authState?.uid;
      
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
      
      // Appliquer les permissions pour les actions de la page
      await applyPagePermissions({
        create: 'employe-ventes',
        edit: 'employe-ventes',
        delete: 'employe-ventes'
      });

      // Load ressources
      const resSnap = await getDocs(collection(fb.db, 'ressources'));
      ressourcesCache = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      loadVentes();
    } catch (e) { console.error(e); }
  })();

  async function loadStats(ventes) {
    try {
      if (!ventes || ventes.length === 0) {
        document.getElementById('stat-total-ventes-emp').textContent = '0';
        document.getElementById('stat-en-attente-emp').textContent = '0';
        document.getElementById('stat-validees-emp').textContent = '0';
        document.getElementById('stat-traitees-emp').textContent = '0';
        document.getElementById('stat-annulees-emp').textContent = '0';
        return;
      }

      // Calculer les statistiques par statut
      const totalVentes = ventes.length;
      const enAttente = ventes.filter(v => (v.statut || 'en attente') === 'en attente').length;
      const validees = ventes.filter(v => v.statut === 'valide').length;
      const traitees = ventes.filter(v => v.statut === 'traite').length;
      const annulees = ventes.filter(v => v.statut === 'annule').length;

      // Mettre à jour l'affichage
      document.getElementById('stat-total-ventes-emp').textContent = formatNumber(totalVentes);
      document.getElementById('stat-en-attente-emp').textContent = formatNumber(enAttente);
      document.getElementById('stat-validees-emp').textContent = formatNumber(validees);
      document.getElementById('stat-traitees-emp').textContent = formatNumber(traitees);
      document.getElementById('stat-annulees-emp').textContent = formatNumber(annulees);
    } catch (e) { console.error('Erreur chargement stats:', e); }
  }

  async function loadVentes() {
    try {
      const fb = getFirebase();
      if (!currentUserId) return;
      const snap = await getDocs(query(collection(fb.db, 'ventes'), where('employeId', '==', currentUserId)));
      const tbody = document.getElementById('ventes-emp-tbody');
      tbody.innerHTML = '';
      if (!snap.size) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="7">Aucune vente</td></tr>';
        loadStats([]);
        return;
      }
      snap.forEach(d => {
        const v = d.data();
        const date = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId) || {};
        const prixUnitaire = ressource.prixVente || ressource.prix || 0;
        const montantTotal = prixUnitaire * (v.quantite || 0);
        const statut = v.statut || 'en attente';
        const statutFormatted = formatStatus(statut);
        let badgeClass = 'badge-employe';
        if (statut === 'valide') badgeClass = 'badge-actif';
        else if (statut === 'annule') badgeClass = 'badge-inactif';
        else if (statut === 'traite') badgeClass = 'badge-admin';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${date.toLocaleDateString('fr-FR')}</td>
          <td>${ressource.nom || '—'}</td>
          <td>${v.quantite || 0}</td>
          <td>${formatAmount(prixUnitaire)} €</td>
          <td>${formatAmount(montantTotal)} €</td>
          <td><span class="badge-role ${badgeClass}">${statutFormatted}</span></td>
          <td>
            <div class="action-buttons" data-vente-id="${d.id}">
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
      // Charger les statistiques après le chargement des ventes
      loadStats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  }

  // New vente
  document.getElementById('btn-new-vente-emp').addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Date de la vente *</label>
        <input id="modal-date-emp" type="date" required />
      </div>
      <div class="modal-field">
        <label>Type de ressource *</label>
        <select id="modal-ressource-emp" required></select>
      </div>
      <div class="modal-field">
        <label>Nombre de ressources *</label>
        <input id="modal-quantite-emp" type="number" min="1" required placeholder="1" />
      </div>
      
    `;
    createModal({
      title: 'Nouvelle vente',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const dateStr = document.getElementById('modal-date-emp').value;
        const ressourceId = document.getElementById('modal-ressource-emp').value;
        const quantite = parseInt(document.getElementById('modal-quantite-emp').value);
        if (!dateStr || !ressourceId || !quantite) {
          alertModal({ title: 'Champs requis', message: 'Date, type de ressource et nombre sont requis.', type: 'warning' });
          return;
        }
        // Récupérer automatiquement la taille depuis la ressource sélectionnée
        const selectedRessource = ressourcesCache.find(r => r.id === ressourceId);
        const tailleObjet = selectedRessource?.tailleObjet || 1;
        try {
          // Récupérer les infos de l'utilisateur
          let prenom = '', nom = '', telephone = '';
          if (currentUserId) {
            try {
              const userDoc = await getDoc(doc(fb.db, 'users', currentUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const fullName = userData.name || '';
                // Séparer prénom et nom (format: "Prénom Nom")
                const nameParts = fullName.trim().split(/\s+/);
                if (nameParts.length >= 2) {
                  prenom = nameParts[0];
                  nom = nameParts.slice(1).join(' ');
                } else if (nameParts.length === 1) {
                  prenom = nameParts[0];
                  nom = '';
                }
                telephone = userData.phone || '';
              }
            } catch (e) {
              console.error('Erreur récupération utilisateur:', e);
            }
          }
          
          const dateVente = new Date(dateStr);
          await addDoc(collection(fb.db, 'ventes'), {
            dateVente: dateVente,
            typeRessourceId: ressourceId,
            quantite,
            tailleObjet,
            employeId: currentUserId,
            prenom,
            nom,
            telephone,
            statut: 'en attente',
            createdAt: serverTimestamp()
          });
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'vente_create', 
            category: 'ventes',
            message: `Création d'une vente: ${quantite} x ${selectedRessource?.nom || ressourceId}` 
          });
          await loadVentes();
          alertModal({ title: 'Succès', message: 'Vente créée avec succès.', type: 'success' });
        } catch (e) { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la vente.', type: 'danger' });
          console.error(e); 
        }
      }
    });
    const sel = document.getElementById('modal-ressource-emp');
    if (sel) {
      sel.innerHTML = ressourcesCache.map(r => `<option value="${r.id}">${r.nom}</option>`).join('') || '<option disabled>Aucune ressource disponible</option>';
    }
    document.getElementById('modal-date-emp').valueAsDate = new Date();
  });

  // View vente
  const page = document.querySelector('.page-card');
  page.addEventListener('click', async (e) => {
    const container = e.target.closest('.action-buttons');
    if (!container) return;
    const venteId = container.getAttribute('data-vente-id');
    if (!venteId) return;
    if (e.target.closest('.btn-view')) {
      try {
        const fb = getFirebase();
        const venteDoc = await getDoc(doc(fb.db, 'ventes', venteId));
        if (!venteDoc.exists()) return;
        const v = venteDoc.data();
        const date = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId) || {};
        const montantTotal = (ressource.prixVente || ressource.prix || 0) * (v.quantite || 0);
        const statut = v.statut || 'en attente';
        const statutFormatted = formatStatus(statut);
        let badgeClass = 'badge-employe';
        if (statut === 'valide') badgeClass = 'badge-actif';
        else if (statut === 'annule') badgeClass = 'badge-inactif';
        else if (statut === 'traite') badgeClass = 'badge-admin';
        const body = `
          <div class="view-highlight">
            <div class="view-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></div>
            <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${formatAmount(montantTotal)} €</div>
            <div style="color: rgb(100,116,139);">Vente du ${date.toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="view-grid">
            <div class="view-section">
              <div class="view-section-title">Informations vente</div>
              <div class="view-item">
                <div class="view-item-label">Date de la vente</div>
                <div class="view-item-value">${date.toLocaleDateString('fr-FR')}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Type de ressource</div>
                <div class="view-item-value">${ressource.nom || '—'}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Nombre de ressources</div>
                <div class="view-item-value">${v.quantite || 0}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Prix unitaire</div>
                <div class="view-item-value">${(ressource.prixVente || ressource.prix || 0).toFixed(2)} €</div>
              </div>
            </div>
            <div class="view-section">
              <div class="view-section-title">Détails</div>
              
              <div class="view-item">
                <div class="view-item-label">Employé</div>
                <div class="view-item-value">${(v.prenom || '')} ${(v.nom || '')}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Téléphone</div>
                <div class="view-item-value">${v.telephone || '—'}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Statut</div>
                <div class="view-item-value">
                  <span class="view-badge badge-role ${badgeClass}">${statutFormatted}</span>
                </div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Montant total</div>
                <div class="view-item-value" style="font-size: 1.25rem; color: #0055A4;">${formatAmount(montantTotal)} €</div>
              </div>
            </div>
          </div>
        `;
        createModal({ title: 'Détails vente', body, confirmText: 'Fermer', onConfirm: () => {}, isView: true });
      } catch (e) { console.error(e); }
    }
  });
}

function viewCalculEmploye(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/employe/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-calc" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-calc" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-calc" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-calc"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleEmploye"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente-calc" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/centrale" id="nav-centrale-calc" class="nav-item" style="display:none;"><span class="nav-icon"></span>Prise de service</a>
            <a href="#/employe/suivi-effectif" id="nav-suivi-effectif-calc" class="nav-item"><span class="nav-icon"></span>Suivi effectif</a>
            <a href="#/employe/flotte" id="nav-flotte-calc" class="nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul-calc" class="active nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/employe/calculatrice" id="nav-calculatrice-calc" class="nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-emp-calc" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Calculateur de Chiffre d'Affaires</div>
              <div class="page-sub">Estimez votre chiffre d'affaires potentiel selon vos ressources</div>
            </div>
          </div>

          <div class="card mb-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Paramètres de calcul</h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">Sélectionnez une ressource et indiquez la quantité disponible pour calculer le chiffre d'affaires potentiel.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="modal-field">
                <label>Type de ressource *</label>
                <select id="calc-ressource-emp" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" required>
                  <option value="">Sélectionnez une ressource</option>
                </select>
              </div>
              
              <div class="modal-field">
                <label>Quantité disponible *</label>
                <input id="calc-quantite-emp" type="number" min="1" step="1" required placeholder="0" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" />
              </div>
            </div>

            <div class="mt-4">
              <button id="btn-calculer-emp" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span>
                Calculer
              </button>
            </div>
          </div>

          <div id="calc-results-emp" class="hidden">
            <div class="stats-grid mb-6">
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-label">Ressource sélectionnée</div>
                  <div id="calc-ressource-nom-emp" class="stat-value text-sm">—</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-label">Prix unitaire (vente)</div>
                  <div id="calc-prix-unitaire-emp" class="stat-value">0 €</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-label">Quantité</div>
                  <div id="calc-quantite-display-emp" class="stat-value">0</div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <div class="stat-label">Chiffre d'affaires potentiel</div>
                  <div id="calc-ca-total-emp" class="stat-value" style="font-size: 1.5rem; color: #0055A4;">0 €</div>
                </div>
              </div>
            </div>

            <div class="card">
              <h3 class="text-lg font-semibold mb-4">Détails du calcul</h3>
              <div class="view-grid">
                <div class="view-section">
                  <div class="view-section-title">Informations ressource</div>
                  <div class="view-item">
                    <div class="view-item-label">Nom de la ressource</div>
                    <div id="detail-ressource-nom-emp" class="view-item-value">—</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Prix de vente unitaire</div>
                    <div id="detail-prix-vente-emp" class="view-item-value">0 €</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Prix en bourse</div>
                    <div id="detail-prix-bourse-emp" class="view-item-value">0 €</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Taille objet (stockage)</div>
                    <div id="detail-taille-emp" class="view-item-value">0</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Légalité</div>
                    <div id="detail-legalite-emp" class="view-item-value">
                      <span class="badge-role badge-employe">—</span>
                    </div>
                  </div>
                </div>
                <div class="view-section">
                  <div class="view-section-title">Calcul</div>
                  <div class="view-item">
                    <div class="view-item-label">Quantité disponible</div>
                    <div id="detail-quantite-emp" class="view-item-value">0</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Formule</div>
                    <div class="view-item-value text-sm">Quantité × Prix de vente</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Chiffre d'affaires</div>
                    <div id="detail-ca-emp" class="view-item-value" style="font-size: 1.25rem; color: #0055A4; font-weight: 700;">0 €</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Avec prix bourse</div>
                    <div id="detail-ca-bourse-emp" class="view-item-value" style="font-size: 1.1rem; color: #667eea;">0 €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  const logoutLink = document.getElementById('logout-link-emp-calc');
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

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/employe/calcul';
  const navVente = document.getElementById('nav-vente-calc');
  const navFlotte = document.getElementById('nav-flotte-calc');
  const navCalcul = document.getElementById('nav-calcul-calc');
  const navCalculatrice = document.getElementById('nav-calculatrice-calc');
  const navSuiviEffectif = document.getElementById('nav-suivi-effectif-calc');
  const navItems = [navVente, navFlotte, navCalcul, navCalculatrice, navSuiviEffectif].filter(Boolean);
  navItems.forEach(item => item.classList.remove('active'));
  switch (hash) {
    case '#/employe/flotte':
      navFlotte?.classList.add('active');
      break;
    case '#/employe/calculatrice':
      navCalculatrice?.classList.add('active');
      break;
    case '#/employe/suivi-effectif':
      navSuiviEffectif?.classList.add('active');
      break;
    case '#/employe/calcul':
      navCalcul?.classList.add('active');
      break;
    default:
      navVente?.classList.add('active');
      break;
  }

  let ressourcesCache = [];

  // Fonction pour formater les montants
  function formatAmount(num) {
    if (num === null || num === undefined || isNaN(num)) return '0,00';
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return integerPart + ',' + parts[1];
  }

  // Charger le profil et les ressources
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
      const av = document.getElementById('sb-avatar-calc');
      updateAvatar(av, p);
      const nm = document.getElementById('sb-name-calc');
      if (nm) nm.textContent = p.name || 'Utilisateur';
      const em = document.getElementById('sb-email-calc');
      if (em) em.textContent = p.email || '';
      const rb = document.getElementById('sb-role-calc');
      if (rb) await updateRoleBadge(rb);

      // Charger les ressources
      const resSnap = await getDocs(collection(fb.db, 'ressources'));
      ressourcesCache = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Remplir le select
      const select = document.getElementById('calc-ressource-emp');
      if (select) {
        select.innerHTML = '<option value="">Sélectionnez une ressource</option>' +
          ressourcesCache.map(r => `<option value="${r.id}">${r.nom || 'Sans nom'}</option>`).join('');
      }
    } catch (e) {
      console.error('Erreur chargement:', e);
    }
  })();

  // Calculer
  document.getElementById('btn-calculer-emp').addEventListener('click', () => {
    const ressourceId = document.getElementById('calc-ressource-emp').value;
    const quantite = parseFloat(document.getElementById('calc-quantite-emp').value);

    if (!ressourceId || !quantite || quantite <= 0) {
      alertModal({ 
        title: 'Informations manquantes', 
        message: 'Pour effectuer le calcul, veuillez :<br><br>• Sélectionner un type de ressource<br>• Entrer une quantité supérieure à zéro', 
        type: 'warning' 
      });
      return;
    }

    const ressource = ressourcesCache.find(r => r.id === ressourceId);
    if (!ressource) {
      alertModal({ 
        title: 'Ressource introuvable', 
        message: 'La ressource sélectionnée n\'a pas pu être trouvée dans la base de données.', 
        type: 'danger' 
      });
      return;
    }

    const prixVente = ressource.prixVente || 0;
    const prixBourse = ressource.prixBourse || 0;
    const caTotal = quantite * prixVente;
    const caBourse = quantite * prixBourse;

    // Afficher les résultats
    document.getElementById('calc-results-emp').classList.remove('hidden');
    
    // Stats
    document.getElementById('calc-ressource-nom-emp').textContent = ressource.nom || '—';
    document.getElementById('calc-prix-unitaire-emp').textContent = formatAmount(prixVente) + ' €';
    document.getElementById('calc-quantite-display-emp').textContent = quantite.toLocaleString('fr-FR');
    document.getElementById('calc-ca-total-emp').textContent = formatAmount(caTotal) + ' €';

    // Détails
    document.getElementById('detail-ressource-nom-emp').textContent = ressource.nom || '—';
    document.getElementById('detail-prix-vente-emp').textContent = formatAmount(prixVente) + ' €';
    document.getElementById('detail-prix-bourse-emp').textContent = formatAmount(prixBourse) + ' €';
    document.getElementById('detail-taille-emp').textContent = (ressource.tailleObjet || 0).toFixed(2);
    const legaliteBadge = document.querySelector('#detail-legalite-emp .badge-role');
    if (legaliteBadge) {
      legaliteBadge.textContent = ressource.legalite === 'illegal' ? 'Illégale' : 'Légale';
      legaliteBadge.className = 'badge-role ' + (ressource.legalite === 'illegal' ? 'badge-inactif' : 'badge-actif');
    }
    document.getElementById('detail-quantite-emp').textContent = quantite.toLocaleString('fr-FR');
    document.getElementById('detail-ca-emp').textContent = formatAmount(caTotal) + ' €';
    document.getElementById('detail-ca-bourse-emp').textContent = formatAmount(caBourse) + ' €';
  });
}

function viewFlotteEmploye(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/employe/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-flotte" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-flotte" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-flotte" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-flotte"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleEmploye"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente-flotte" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/centrale" id="nav-centrale-flotte" class="nav-item" style="display:none;"><span class="nav-icon"></span>Prise de service</a>
            <a href="#/employe/suivi-effectif" id="nav-suivi-effectif-flotte" class="nav-item"><span class="nav-icon"></span>Suivi effectif</a>
            <a href="#/employe/flotte" id="nav-flotte-flotte" class="active nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul-flotte" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/employe/calculatrice" id="nav-calculatrice-flotte" class="nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-emp-flotte" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Gestion de la Flotte</div>
              <div class="page-sub">Consultez les véhicules de l'entreprise</div>
            </div>
          </div>

          <!-- Statistiques -->
          <div class="stats-grid mb-6">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"></path>
                  <polygon points="12 15 17 21 7 21 12 15"></polygon>
                </svg>
              </div>
              <div>
                <div class="stat-label">Total véhicules</div>
                <div id="stat-total-vehicules-emp" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Places totales</div>
                <div id="stat-places-totales-emp" class="stat-value">0</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Valeur totale</div>
                <div id="stat-valeur-totale-emp" class="stat-value">0 €</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </div>
              <div>
                <div class="stat-label">Assurances actives</div>
                <div id="stat-assurances-actives-emp" class="stat-value">0</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item active" data-tab="flotte-emp">Flotte</button>
              <button class="tab-item" data-tab="comparateur-emp">Comparateur véhicule</button>
            </div>
          </div>

          <!-- Tab 1: Flotte -->
          <div id="tab-flotte-emp" class="tab-content active">
          <!-- Toggle vue card/tableau -->
          <div class="flex items-center justify-between mb-4 mt-6">
            <h3 class="font-medium text-lg">Véhicules</h3>
            <div class="flex items-center gap-2">
              <button id="btn-view-table-emp" class="view-toggle-btn active flex items-center gap-2 px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors" title="Vue tableau">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Tableau
              </button>
              <button id="btn-view-card-emp" class="view-toggle-btn flex items-center gap-2 px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors" title="Vue cartes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Cartes
              </button>
            </div>
          </div>

          <!-- Vue Tableau -->
          <div id="flotte-table-view-emp" class="flotte-view">
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Date d'achat</th>
                    <th>Véhicule</th>
                    <th>Prix véhicule</th>
                    <th>Assurance</th>
                    <th>Renouvellement</th>
                    <th>Montant total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="flotte-emp-tbody">
                  <tr><td class="py-3 text-center" colspan="7">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Vue Cartes -->
          <div id="flotte-card-view-emp" class="flotte-view hidden">
            <div id="flotte-empty-card-emp" class="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
              Chargement…
            </div>
            <div id="flotte-cards-emp" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div>
            </div>
          </div>

          <!-- Tab 2: Comparateur véhicule -->
          <div id="tab-comparateur-emp" class="tab-content">
            <div class="card mt-6">
              <h3 class="font-medium text-lg mb-4">Comparateur de véhicules</h3>
              
              <!-- Instructions -->
              <div class="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p class="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Comment utiliser :</strong> Utilisez les filtres ci-dessous pour trouver rapidement les véhicules, puis sélectionnez-les pour les ajouter au comparateur. 
                  Vous pouvez définir une quantité pour chaque véhicule et comparer leurs caractéristiques.
                </p>
              </div>

              <!-- Filtres de recherche avancés -->
              <div class="mb-6 p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Recherche et filtres</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <!-- Recherche -->
                  <div class="lg:col-span-2">
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Rechercher
                    </label>
                    <input 
                      type="text" 
                      id="comparateur-search-emp" 
                      placeholder="Marque, modèle..."
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <!-- Filtre Type -->
                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Type/Marque
                    </label>
                    <select 
                      id="comparateur-filter-type-emp" 
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Tous</option>
                    </select>
                  </div>

                  <!-- Filtre Prix -->
                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Prix max
                    </label>
                    <input 
                      type="number" 
                      id="comparateur-filter-prix-emp" 
                      placeholder="Prix maximum"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <!-- Boutons d'action rapide -->
                <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button 
                    id="comparateur-add-all-emp" 
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Ajouter tous les résultats
                  </button>
                  <button 
                    id="comparateur-clear-filters-emp" 
                    class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    Réinitialiser filtres
                  </button>
                  <button 
                    id="comparateur-clear-all-emp" 
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Vider le comparateur
                  </button>
                </div>
              </div>

              <!-- Liste déroulante des véhicules -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sélectionner un véhicule
                </label>
                <div class="relative">
                  <select 
                    id="comparateur-select-emp" 
                    class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Choisir un véhicule --</option>
                  </select>
                  <button 
                    id="comparateur-add-selected-emp" 
                    class="mt-2 w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Ajouter au comparateur
                  </button>
                </div>
              </div>

              <!-- Liste des véhicules filtrés avec cases à cocher -->
              <div id="comparateur-filtered-list-emp" class="mb-6 hidden">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Véhicules disponibles (<span id="comparateur-filtered-count-emp">0</span>)
                  </h4>
                  <div class="flex items-center gap-2">
                    <button 
                      id="comparateur-select-all-emp" 
                      class="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                    >
                      Tout sélectionner
                    </button>
                    <button 
                      id="comparateur-add-selected-multiple-emp" 
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Ajouter sélectionnés
                    </button>
                  </div>
                </div>
                <div id="comparateur-filtered-items-emp" class="max-h-80 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-lg p-3 space-y-2 bg-white dark:bg-white/5"></div>
              </div>

              <!-- Liste des véhicules sélectionnés -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Véhicules dans le comparateur (<span id="comparateur-selected-count-emp">0</span>)
                </h4>
                <div id="comparateur-selected-emp" class="space-y-3">
                  <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Aucun véhicule sélectionné. Utilisez les filtres ci-dessus pour ajouter des véhicules.
                  </p>
                </div>
              </div>

              <!-- Tableau de comparaison -->
              <div id="comparateur-table-container-emp" class="hidden">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Comparaison</h4>
                <div class="overflow-x-auto">
                  <table class="w-full border-collapse">
                    <thead>
                      <tr class="bg-slate-50 dark:bg-white/5">
                        <th class="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Véhicule</th>
                        <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Quantité</th>
                        <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Prix unitaire</th>
                        <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Prix total</th>
                        <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Places totales</th>
                        <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Assurance sélectionnée</th>
                        <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Montant assurance</th>
                        <th class="px-4 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Total avec assurance</th>
                        <th class="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="comparateur-tbody-emp"></tbody>
                    <tfoot id="comparateur-totals-emp" class="bg-slate-50 dark:bg-white/5 font-semibold">
                      <!-- Les totaux seront générés ici -->
                    </tfoot>
                  </table>
                </div>
              </div>

              <!-- Résumé global -->
              <div id="comparateur-summary-emp" class="hidden mt-6 grid grid-cols-1 md:grid-cols-7 gap-4">
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Total véhicules</div>
                  <div id="summary-total-vehicules-emp" class="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Prix total</div>
                  <div id="summary-prix-total-emp" class="text-2xl font-bold text-blue-600 dark:text-blue-400">0 €</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Places totales</div>
                  <div id="summary-places-totales-emp" class="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Assurances totales</div>
                  <div id="summary-assurances-totales-emp" class="text-2xl font-bold text-purple-600 dark:text-purple-400">0 €</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Total avec assurances</div>
                  <div id="summary-total-avec-assurances-emp" class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0 €</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Frais de paiement</div>
                  <div id="summary-frais-paiement-emp" class="text-2xl font-bold text-orange-600 dark:text-orange-400">0 €</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Total final</div>
                  <div id="summary-total-final-emp" class="text-2xl font-bold text-red-600 dark:text-red-400">0 €</div>
                </div>
              </div>
              
              <!-- Sélection du mode de paiement -->
              <div class="mt-6">
                <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Mode de paiement</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Option Espèce -->
                  <label 
                    for="paiement-espece-emp"
                    class="comparateur-paiement-card relative p-5 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer transition-all hover:shadow-lg hover:border-green-400 dark:hover:border-green-500 group"
                    onclick="document.getElementById('paiement-espece-emp').checked = true; window.updateComparateurPaiementEmp('espece');"
                  >
                    <input 
                      type="radio" 
                      name="comparateur-paiement-emp" 
                      value="espece" 
                      id="paiement-espece-emp"
                      class="sr-only"
                      checked
                      onchange="window.updateComparateurPaiementEmp('espece')"
                    />
                    <div class="flex items-start gap-4">
                      <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <h5 class="font-semibold text-slate-900 dark:text-white text-base">Espèce</h5>
                          <div class="comparateur-paiement-check w-5 h-5 rounded-full border-2 border-slate-300 dark:border-white/30 flex items-center justify-center transition-all">
                            <svg class="w-3 h-3 text-white hidden" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Paiement en espèces</p>
                        <div class="flex items-center gap-2">
                          <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            +3% de frais
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  <!-- Option Carte bancaire -->
                  <label 
                    for="paiement-carte-emp"
                    class="comparateur-paiement-card relative p-5 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 cursor-pointer transition-all hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 group"
                    onclick="document.getElementById('paiement-carte-emp').checked = true; window.updateComparateurPaiementEmp('carte');"
                  >
                    <input 
                      type="radio" 
                      name="comparateur-paiement-emp" 
                      value="carte" 
                      id="paiement-carte-emp"
                      class="sr-only"
                      onchange="window.updateComparateurPaiementEmp('carte')"
                    />
                    <div class="flex items-start gap-4">
                      <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <h5 class="font-semibold text-slate-900 dark:text-white text-base">Carte bancaire</h5>
                          <div class="comparateur-paiement-check w-5 h-5 rounded-full border-2 border-slate-300 dark:border-white/30 flex items-center justify-center transition-all">
                            <svg class="w-3 h-3 text-white hidden" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                          </div>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Paiement par carte</p>
                        <div class="flex items-center gap-2">
                          <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            +4% de frais
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  mount(root, content);

  const logoutLink = document.getElementById('logout-link-emp-flotte');
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

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/employe/flotte';
  const navVente = document.getElementById('nav-vente-flotte');
  const navFlotte = document.getElementById('nav-flotte-flotte');
  const navCalcul = document.getElementById('nav-calcul-flotte');
  const navCalculatrice = document.getElementById('nav-calculatrice-flotte');
  const navCentrale = document.getElementById('nav-centrale-flotte');
  const navSuiviEffectif = document.getElementById('nav-suivi-effectif-flotte');
  const navItems = [navVente, navFlotte, navCalcul, navCalculatrice, navCentrale, navSuiviEffectif].filter(Boolean);
  navItems.forEach(item => item.classList.remove('active'));
  switch (hash) {
    case '#/employe/flotte':
      navFlotte?.classList.add('active');
      break;
    case '#/employe/calcul':
      navCalcul?.classList.add('active');
      break;
    case '#/employe/calculatrice':
      navCalculatrice?.classList.add('active');
      break;
    case '#/employe/centrale':
      navCentrale?.classList.add('active');
      break;
    case '#/employe/suivi-effectif':
      navSuiviEffectif?.classList.add('active');
      break;
    default:
      navVente?.classList.add('active');
      break;
  }

  let flotteCache = [];
  let flotteComparateurCache = []; // Cache pour tous les véhicules disponibles (pour le comparateur)
  let currentViewEmp = localStorage.getItem('flotte-view-emp') || 'table'; // 'table' ou 'card'
  let currentTabEmp = localStorage.getItem('flotte-tab-emp') || 'flotte-emp'; // 'flotte-emp' ou 'comparateur-emp'
  let comparateurVehiculesEmp = []; // [{vehicule, quantite, assuranceTier}]
  let comparateurFilteredVehiculesEmp = [];
  let comparateurModePaiementEmp = 'espece'; // 'espece' (3%) ou 'carte' (4%)

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

  // Toggle vue card/tableau
  function switchViewEmp(view) {
    currentViewEmp = view;
    localStorage.setItem('flotte-view-emp', view);
    
    const tableView = document.getElementById('flotte-table-view-emp');
    const cardView = document.getElementById('flotte-card-view-emp');
    const btnTable = document.getElementById('btn-view-table-emp');
    const btnCard = document.getElementById('btn-view-card-emp');
    
    if (view === 'table') {
      tableView?.classList.remove('hidden');
      cardView?.classList.add('hidden');
      btnTable?.classList.add('active');
      btnCard?.classList.remove('active');
    } else {
      tableView?.classList.add('hidden');
      cardView?.classList.remove('hidden');
      btnTable?.classList.remove('active');
      btnCard?.classList.add('active');
      loadFlotteCardsEmp();
    }
  }

  document.getElementById('btn-view-table-emp')?.addEventListener('click', () => switchViewEmp('table'));
  document.getElementById('btn-view-card-emp')?.addEventListener('click', () => switchViewEmp('card'));
  
  // Initialiser la vue
  switchViewEmp(currentViewEmp);

  // Charger le profil et la flotte
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
      const av = document.getElementById('sb-avatar-flotte');
      updateAvatar(av, p);
      const nm = document.getElementById('sb-name-flotte');
      if (nm) nm.textContent = p.name || 'Utilisateur';
      const em = document.getElementById('sb-email-flotte');
      if (em) em.textContent = p.email || '';
      const rb = document.getElementById('sb-role-flotte');
      if (rb) await updateRoleBadge(rb);

      loadFlotte();
      loadStats();
      loadFlotteComparateur(); // Charger tous les véhicules pour le comparateur
    } catch (e) { 
      console.error(e); 
    }
  })();

  // Gestion des onglets
  const tabButtons = document.querySelectorAll('.tabs-list .tab-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Mettre à jour l'état actif des boutons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Afficher/masquer les contenus
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${tabId}`) {
          content.classList.add('active');
        }
      });
      
      currentTabEmp = tabId;
      localStorage.setItem('flotte-tab-emp', tabId);
      
      // Initialiser le comparateur si on passe sur cet onglet
      if (tabId === 'comparateur-emp') {
        setTimeout(() => setupComparateurEmp(), 100);
      }
    });
  });
  
  // Initialiser l'onglet actif
  const activeTab = localStorage.getItem('flotte-tab-emp') || 'flotte-emp';
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === activeTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  tabContents.forEach(content => {
    if (content.id === `tab-${activeTab}`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // Charger tous les véhicules disponibles pour le comparateur
  async function loadFlotteComparateur() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const snap = await getDocs(query(collection(fb.db, 'flotte'), orderBy('createdAt', 'desc')));
      // Charger tous les véhicules sources (sans vehiculeSourceId) pour le comparateur
      flotteComparateurCache = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(v => !v.vehiculeSourceId); // Seulement les véhicules sources
      
      // Si on est sur l'onglet comparateur, l'initialiser
      if (currentTabEmp === 'comparateur-emp') {
        setTimeout(() => setupComparateurEmp(), 100);
      }
    } catch (e) {
      console.error('Erreur chargement flotte comparateur:', e);
    }
  }

  // ========== COMPARATEUR VÉHICULE EMPLOYÉ ==========
  
  function setupComparateurEmp() {
    // Remplir le select des types
    const typeSelect = document.getElementById('comparateur-filter-type-emp');
    if (typeSelect && flotteComparateurCache.length > 0) {
      const types = [...new Set(flotteComparateurCache.map(v => v.type).filter(Boolean))].sort();
      typeSelect.innerHTML = '<option value="">Tous</option>';
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
      });
    }
    
    // Remplir le select des véhicules
    updateComparateurSelectEmp();
    
    // Event listeners pour les filtres
    const searchInput = document.getElementById('comparateur-search-emp');
    const filterType = document.getElementById('comparateur-filter-type-emp');
    const filterPrix = document.getElementById('comparateur-filter-prix-emp');
    
    const applyFilters = () => {
      const query = (searchInput?.value || '').toLowerCase().trim();
      const typeFilter = filterType?.value || '';
      const prixFilter = parseFloat(filterPrix?.value) || Infinity;
      
      comparateurFilteredVehiculesEmp = flotteComparateurCache.filter(v => {
        const matchSearch = !query || 
          (v.type || '').toLowerCase().includes(query) ||
          (v.modele || '').toLowerCase().includes(query);
        const matchType = !typeFilter || v.type === typeFilter;
        const matchPrix = (v.prixAchat || 0) <= prixFilter;
        
        return matchSearch && matchType && matchPrix;
      });
      
      updateComparateurFilteredListEmp();
      updateComparateurSelectEmp();
    };
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (filterPrix) filterPrix.addEventListener('input', applyFilters);
    
    // Bouton ajouter depuis le select
    const addSelectedBtn = document.getElementById('comparateur-add-selected-emp');
    if (addSelectedBtn) {
      addSelectedBtn.addEventListener('click', () => {
        const select = document.getElementById('comparateur-select-emp');
        const vehiculeId = select?.value;
        if (vehiculeId) {
          window.addToComparateurEmp(vehiculeId);
          if (select) select.value = '';
        }
      });
    }
    
    // Bouton ajouter tous les résultats
    const addAllBtn = document.getElementById('comparateur-add-all-emp');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', () => {
        comparateurFilteredVehiculesEmp.forEach(v => {
          if (!comparateurVehiculesEmp.some(cv => cv.vehicule.id === v.id)) {
            comparateurVehiculesEmp.push({ vehicule: v, quantite: 1, assuranceTier: null });
          }
        });
        updateComparateurDisplayEmp();
      });
    }
    
    // Bouton réinitialiser filtres
    const clearFiltersBtn = document.getElementById('comparateur-clear-filters-emp');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterType) filterType.value = '';
        if (filterPrix) filterPrix.value = '';
        applyFilters();
      });
    }
    
    // Bouton vider le comparateur
    const clearAllBtn = document.getElementById('comparateur-clear-all-emp');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir vider le comparateur ?')) {
          comparateurVehiculesEmp = [];
          updateComparateurDisplayEmp();
        }
      });
    }
    
    // Bouton tout sélectionner
    const selectAllBtn = document.getElementById('comparateur-select-all-emp');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#comparateur-filtered-items-emp input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
      });
    }
    
    // Bouton ajouter sélectionnés
    const addSelectedMultipleBtn = document.getElementById('comparateur-add-selected-multiple-emp');
    if (addSelectedMultipleBtn) {
      addSelectedMultipleBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#comparateur-filtered-items-emp input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
          const vehiculeId = cb.value;
          if (!comparateurVehiculesEmp.some(cv => cv.vehicule.id === vehiculeId)) {
            const vehicule = flotteComparateurCache.find(v => v.id === vehiculeId);
            if (vehicule) {
              comparateurVehiculesEmp.push({ vehicule: vehicule, quantite: 1, assuranceTier: null });
            }
          }
        });
        updateComparateurDisplayEmp();
        // Décocher toutes les cases
        document.querySelectorAll('#comparateur-filtered-items-emp input[type="checkbox"]').forEach(cb => cb.checked = false);
      });
    }
    
    // Initialiser avec tous les véhicules
    comparateurFilteredVehiculesEmp = [...flotteComparateurCache];
    updateComparateurFilteredListEmp();
    updateComparateurDisplayEmp();
  }
  
  function updateComparateurSelectEmp() {
    const select = document.getElementById('comparateur-select-emp');
    if (!select) return;
    
    // Garder l'option par défaut
    select.innerHTML = '<option value="">-- Choisir un véhicule --</option>';
    
    // Ajouter les véhicules filtrés (non déjà ajoutés)
    comparateurFilteredVehiculesEmp.forEach(v => {
      const isAlreadyAdded = comparateurVehiculesEmp.some(cv => cv.vehicule.id === v.id);
      if (!isAlreadyAdded) {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.type || '—'} ${v.modele || '—'} - ${formatAmount(v.prixAchat || 0)} €`;
        select.appendChild(option);
      }
    });
  }
  
  function updateComparateurFilteredListEmp() {
    const container = document.getElementById('comparateur-filtered-list-emp');
    const itemsContainer = document.getElementById('comparateur-filtered-items-emp');
    const countEl = document.getElementById('comparateur-filtered-count-emp');
    
    if (!container || !itemsContainer || !countEl) return;
    
    if (comparateurFilteredVehiculesEmp.length === 0) {
      container.classList.add('hidden');
      return;
    }
    
    container.classList.remove('hidden');
    countEl.textContent = comparateurFilteredVehiculesEmp.length;
    
    itemsContainer.innerHTML = comparateurFilteredVehiculesEmp.map(v => {
      const isAlreadyAdded = comparateurVehiculesEmp.some(cv => cv.vehicule.id === v.id);
      const hasAssurances = v.assuranceTier1 || v.assuranceTier2 || v.assuranceTier3 || v.assuranceTier4;
      
      return `
        <div class="comparateur-vehicle-item p-4 rounded-xl border ${isAlreadyAdded ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5'} hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-start gap-4 cursor-pointer" onclick="if(!this.querySelector('input').disabled) this.querySelector('input').click()">
          <label class="custom-checkbox-wrapper flex-shrink-0 mt-0.5 cursor-pointer">
            <input 
              type="checkbox" 
              value="${v.id}" 
              id="comparateur-checkbox-emp-${v.id}"
              class="custom-checkbox-input"
              ${isAlreadyAdded ? 'disabled checked' : ''}
              onchange="event.stopPropagation(); this.closest('.comparateur-vehicle-item').classList.toggle('selected', this.checked);"
            />
            <span class="custom-checkbox ${isAlreadyAdded ? 'checked disabled' : ''}"></span>
          </label>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm text-slate-900 dark:text-white truncate">${v.type || '—'} ${v.modele || '—'}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span class="font-medium text-blue-600 dark:text-blue-400">${formatAmount(v.prixAchat || 0)} €</span>
                  <span class="mx-1">•</span>
                  <span>${formatNumber(v.nombrePlaces || 0)} places</span>
                </div>
              </div>
              ${isAlreadyAdded ? '<span class="text-xs text-green-600 dark:text-green-400 font-semibold flex-shrink-0">✓ Ajouté</span>' : ''}
            </div>
            ${hasAssurances ? `
            <div class="mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Assurances disponibles:</div>
              <div class="flex flex-wrap gap-1.5">
                ${v.assuranceTier1 ? `<span class="px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">T1: ${formatAmount(v.assuranceTier1)} €</span>` : ''}
                ${v.assuranceTier2 ? `<span class="px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">T2: ${formatAmount(v.assuranceTier2)} €</span>` : ''}
                ${v.assuranceTier3 ? `<span class="px-2 py-0.5 rounded text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">T3: ${formatAmount(v.assuranceTier3)} €</span>` : ''}
                ${v.assuranceTier4 ? `<span class="px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">T4: ${formatAmount(v.assuranceTier4)} €</span>` : ''}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Fonction globale pour ajouter un véhicule au comparateur
  window.addToComparateurEmp = function(vehiculeId) {
    const vehicule = flotteComparateurCache.find(v => v.id === vehiculeId);
    if (!vehicule) return;
    
    // Vérifier si déjà ajouté
    if (comparateurVehiculesEmp.some(cv => cv.vehicule.id === vehiculeId)) {
      alertModal({ 
        title: 'Information', 
        message: 'Ce véhicule est déjà dans le comparateur.', 
        type: 'info' 
      });
      return;
    }
    
    comparateurVehiculesEmp.push({
      vehicule: vehicule,
      quantite: 1,
      assuranceTier: null
    });
    
    updateComparateurDisplayEmp();
  };
  
  function updateComparateurDisplayEmp() {
    const selectedContainer = document.getElementById('comparateur-selected-emp');
    const selectedCountEl = document.getElementById('comparateur-selected-count-emp');
    const tableContainer = document.getElementById('comparateur-table-container-emp');
    const summaryContainer = document.getElementById('comparateur-summary-emp');
    const tbody = document.getElementById('comparateur-tbody-emp');
    const totalsFoot = document.getElementById('comparateur-totals-emp');
    
    if (!selectedContainer || !tableContainer || !summaryContainer || !tbody || !totalsFoot) return;
    
    // Mettre à jour le compteur
    if (selectedCountEl) selectedCountEl.textContent = comparateurVehiculesEmp.length;
    
    // Mettre à jour le select et la liste filtrée
    updateComparateurSelectEmp();
    updateComparateurFilteredListEmp();
    
    if (comparateurVehiculesEmp.length === 0) {
      selectedContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Aucun véhicule sélectionné. Utilisez les filtres ci-dessus pour ajouter des véhicules.</p>';
      tableContainer.classList.add('hidden');
      summaryContainer.classList.add('hidden');
      return;
    }
    
    // Afficher les véhicules sélectionnés
    selectedContainer.innerHTML = comparateurVehiculesEmp.map((cv, index) => {
      const v = cv.vehicule;
      const selectedAssurance = cv.assuranceTier || null;
      const hasAssurances = v.assuranceTier1 || v.assuranceTier2 || v.assuranceTier3 || v.assuranceTier4;
      
      return `
        <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white mb-1">${v.type || '—'} ${v.modele || '—'}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">
                ${formatAmount(v.prixAchat || 0)} € • ${formatNumber(v.nombrePlaces || 0)} places
              </div>
            </div>
            <button 
              class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
              onclick="window.removeFromComparateurEmp(${index})"
            >
              Retirer
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Quantité</label>
              <input 
                type="number" 
                min="1" 
                value="${cv.quantite}" 
                class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
                onchange="window.updateComparateurQuantiteEmp(${index}, this.value)"
              />
            </div>
            
            ${hasAssurances ? `
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Assurance</label>
              <select 
                class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onchange="window.updateComparateurAssuranceEmp(${index}, this.value); event.stopPropagation();"
              >
                <option value="">Aucune</option>
                ${v.assuranceTier1 ? `<option value="Tier1" ${selectedAssurance === 'Tier1' ? 'selected' : ''}>Tier 1 - ${formatAmount(v.assuranceTier1)} €</option>` : ''}
                ${v.assuranceTier2 ? `<option value="Tier2" ${selectedAssurance === 'Tier2' ? 'selected' : ''}>Tier 2 - ${formatAmount(v.assuranceTier2)} €</option>` : ''}
                ${v.assuranceTier3 ? `<option value="Tier3" ${selectedAssurance === 'Tier3' ? 'selected' : ''}>Tier 3 - ${formatAmount(v.assuranceTier3)} €</option>` : ''}
                ${v.assuranceTier4 ? `<option value="Tier4" ${selectedAssurance === 'Tier4' ? 'selected' : ''}>Tier 4 - ${formatAmount(v.assuranceTier4)} €</option>` : ''}
              </select>
            </div>
            ` : '<div></div>'}
          </div>
        </div>
      `;
    }).join('');
    
    // Afficher le tableau de comparaison
    tableContainer.classList.remove('hidden');
    summaryContainer.classList.remove('hidden');
    
    // Générer le tableau
    let totalVehicules = 0;
    let totalPrix = 0;
    let totalPlaces = 0;
    let totalAssuranceT1 = 0;
    let totalAssuranceT2 = 0;
    let totalAssuranceT3 = 0;
    let totalAssuranceT4 = 0;
    
    tbody.innerHTML = comparateurVehiculesEmp.map((cv, index) => {
      const v = cv.vehicule;
      const qty = cv.quantite || 1;
      const prixUnitaire = v.prixAchat || 0;
      const prixTotal = prixUnitaire * qty;
      const placesTotal = (v.nombrePlaces || 0) * qty;
      
      // Calculer l'assurance sélectionnée
      let assuranceMontant = 0;
      let assuranceLabel = 'Aucune';
      if (cv.assuranceTier) {
        const assuranceValue = v[`assurance${cv.assuranceTier}`] || 0;
        assuranceMontant = assuranceValue * qty;
        assuranceLabel = cv.assuranceTier.replace('Tier', 'Tier ');
      }
      
      const totalAvecAssurance = prixTotal + assuranceMontant;
      
      totalVehicules += qty;
      totalPrix += prixTotal;
      totalPlaces += placesTotal;
      totalAssuranceT1 += cv.assuranceTier === 'Tier1' ? assuranceMontant : 0;
      totalAssuranceT2 += cv.assuranceTier === 'Tier2' ? assuranceMontant : 0;
      totalAssuranceT3 += cv.assuranceTier === 'Tier3' ? assuranceMontant : 0;
      totalAssuranceT4 += cv.assuranceTier === 'Tier4' ? assuranceMontant : 0;
      
      return `
        <tr class="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
          <td class="px-4 py-3 text-sm text-slate-900 dark:text-white">
            <div class="font-medium">${v.type || '—'} ${v.modele || '—'}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">${formatNumber(v.nombrePlaces || 0)} places</div>
          </td>
          <td class="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">
            <input 
              type="number" 
              min="1" 
              value="${qty}" 
              class="w-16 px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm text-center"
              onchange="window.updateComparateurQuantiteEmp(${index}, this.value)"
            />
          </td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatAmount(prixUnitaire)} €</td>
          <td class="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">${formatAmount(prixTotal)} €</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(placesTotal)}</td>
          <td class="px-4 py-3 text-center text-sm">
            <select 
              class="px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              onchange="window.updateComparateurAssuranceEmp(${index}, this.value); event.stopPropagation();"
            >
              <option value="">Aucune</option>
              ${v.assuranceTier1 ? `<option value="Tier1" ${cv.assuranceTier === 'Tier1' ? 'selected' : ''}>Tier 1</option>` : ''}
              ${v.assuranceTier2 ? `<option value="Tier2" ${cv.assuranceTier === 'Tier2' ? 'selected' : ''}>Tier 2</option>` : ''}
              ${v.assuranceTier3 ? `<option value="Tier3" ${cv.assuranceTier === 'Tier3' ? 'selected' : ''}>Tier 3</option>` : ''}
              ${v.assuranceTier4 ? `<option value="Tier4" ${cv.assuranceTier === 'Tier4' ? 'selected' : ''}>Tier 4</option>` : ''}
            </select>
          </td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
            ${assuranceMontant > 0 ? formatAmount(assuranceMontant) + ' €' : '—'}
          </td>
          <td class="px-4 py-3 text-right text-sm font-semibold text-purple-600 dark:text-purple-400">
            ${formatAmount(totalAvecAssurance)} €
          </td>
          <td class="px-4 py-3 text-center">
            <button 
              class="px-2 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              onclick="window.removeFromComparateurEmp(${index})"
            >
              Retirer
            </button>
          </td>
        </tr>
      `;
    }).join('');
    
    // Générer les totaux
    const totalAssurances = totalAssuranceT1 + totalAssuranceT2 + totalAssuranceT3 + totalAssuranceT4;
    const totalAvecAssurances = totalPrix + totalAssurances;
    
    // Calculer les frais de paiement
    const tauxFrais = comparateurModePaiementEmp === 'espece' ? 0.03 : 0.04;
    const fraisPaiement = totalAvecAssurances * tauxFrais;
    const totalFinal = totalAvecAssurances + fraisPaiement;
    
    totalsFoot.innerHTML = `
      <tr class="bg-slate-100 dark:bg-white/10">
        <td class="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">TOTAL</td>
        <td class="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">${totalVehicules}</td>
        <td class="px-4 py-3 text-right text-sm text-slate-500 dark:text-slate-400">—</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">${formatAmount(totalPrix)} €</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">${formatNumber(totalPlaces)}</td>
        <td class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">—</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-purple-600 dark:text-purple-400">${totalAssurances > 0 ? formatAmount(totalAssurances) + ' €' : '—'}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400">${formatAmount(totalAvecAssurances)} €</td>
        <td class="px-4 py-3"></td>
      </tr>
      <tr class="bg-slate-50 dark:bg-white/5">
        <td colspan="7" class="px-4 py-2 text-right text-xs text-slate-500 dark:text-slate-400">
          Frais de paiement (${comparateurModePaiementEmp === 'espece' ? 'Espèce' : 'Carte'} - ${(tauxFrais * 100).toFixed(0)}%)
        </td>
        <td class="px-4 py-2 text-right text-sm font-semibold text-orange-600 dark:text-orange-400">${formatAmount(fraisPaiement)} €</td>
        <td class="px-4 py-2"></td>
      </tr>
      <tr class="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500">
        <td colspan="7" class="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">
          TOTAL FINAL
        </td>
        <td class="px-4 py-3 text-right text-lg font-bold text-red-600 dark:text-red-400">${formatAmount(totalFinal)} €</td>
        <td class="px-4 py-3"></td>
      </tr>
    `;
    
    // Mettre à jour le résumé
    document.getElementById('summary-total-vehicules-emp').textContent = totalVehicules;
    document.getElementById('summary-prix-total-emp').textContent = formatAmount(totalPrix) + ' €';
    document.getElementById('summary-places-totales-emp').textContent = formatNumber(totalPlaces);
    document.getElementById('summary-assurances-totales-emp').textContent = formatAmount(totalAssurances) + ' €';
    const totalAvecAssurancesEl = document.getElementById('summary-total-avec-assurances-emp');
    if (totalAvecAssurancesEl) totalAvecAssurancesEl.textContent = formatAmount(totalAvecAssurances) + ' €';
    const fraisPaiementEl = document.getElementById('summary-frais-paiement-emp');
    if (fraisPaiementEl) fraisPaiementEl.textContent = formatAmount(fraisPaiement) + ' €';
    const totalFinalEl = document.getElementById('summary-total-final-emp');
    if (totalFinalEl) totalFinalEl.textContent = formatAmount(totalFinal) + ' €';
  }
  
  // Fonction globale pour mettre à jour la quantité
  window.updateComparateurQuantiteEmp = function(index, quantite) {
    const qty = parseInt(quantite) || 1;
    if (qty < 1) return;
    
    if (comparateurVehiculesEmp[index]) {
      comparateurVehiculesEmp[index].quantite = qty;
      updateComparateurDisplayEmp();
    }
  };
  
  // Fonction globale pour mettre à jour l'assurance
  window.updateComparateurAssuranceEmp = function(index, assuranceTier) {
    if (comparateurVehiculesEmp[index]) {
      comparateurVehiculesEmp[index].assuranceTier = assuranceTier || null;
      updateComparateurDisplayEmp();
    }
  };
  
  // Fonction globale pour mettre à jour le mode de paiement
  window.updateComparateurPaiementEmp = function(mode) {
    comparateurModePaiementEmp = mode;
    updateComparateurDisplayEmp();
    
    // Mettre à jour l'apparence des cartes de paiement
    const especeCard = document.querySelector('label[for="paiement-espece-emp"]');
    const carteCard = document.querySelector('label[for="paiement-carte-emp"]');
    const especeCheck = especeCard?.querySelector('.comparateur-paiement-check');
    const carteCheck = carteCard?.querySelector('.comparateur-paiement-check');
    
    if (mode === 'espece') {
      especeCard?.classList.add('border-green-400', 'dark:border-green-500');
      especeCard?.classList.remove('border-slate-200', 'dark:border-white/10');
      carteCard?.classList.remove('border-blue-400', 'dark:border-blue-500');
      carteCard?.classList.add('border-slate-200', 'dark:border-white/10');
      if (especeCheck) {
        especeCheck.classList.add('bg-green-500', 'border-green-500');
        especeCheck.querySelector('svg')?.classList.remove('hidden');
      }
      if (carteCheck) {
        carteCheck.classList.remove('bg-blue-500', 'border-blue-500');
        carteCheck.querySelector('svg')?.classList.add('hidden');
      }
    } else {
      carteCard?.classList.add('border-blue-400', 'dark:border-blue-500');
      carteCard?.classList.remove('border-slate-200', 'dark:border-white/10');
      especeCard?.classList.remove('border-green-400', 'dark:border-green-500');
      especeCard?.classList.add('border-slate-200', 'dark:border-white/10');
      if (carteCheck) {
        carteCheck.classList.add('bg-blue-500', 'border-blue-500');
        carteCheck.querySelector('svg')?.classList.remove('hidden');
      }
      if (especeCheck) {
        especeCheck.classList.remove('bg-green-500', 'border-green-500');
        especeCheck.querySelector('svg')?.classList.add('hidden');
      }
    }
  };
  
  // Fonction globale pour retirer un véhicule
  window.removeFromComparateurEmp = function(index) {
    comparateurVehiculesEmp.splice(index, 1);
    updateComparateurDisplayEmp();
    
    // Réinitialiser la recherche si nécessaire
    const searchInput = document.getElementById('comparateur-search-emp');
    if (searchInput && searchInput.value) {
      searchInput.dispatchEvent(new Event('input'));
    }
  };

  async function loadStats() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      const snap = await getDocs(collection(fb.db, 'flotte'));
      // Filtrer uniquement les véhicules achetés (Flotte MS Corp)
      const vehicules = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(v => v.achete === true);

      const totalVehicules = vehicules.length;
      const placesTotales = vehicules.reduce((sum, v) => sum + (v.nombrePlaces || 0), 0);
      const valeurTotale = vehicules.reduce((sum, v) => sum + (v.prixAchat || 0), 0);
      const assurancesActives = vehicules.filter(v => 
        v.assuranceTier1 || v.assuranceTier2 || v.assuranceTier3 || v.assuranceTier4
      ).length;

      document.getElementById('stat-total-vehicules-emp').textContent = formatNumber(totalVehicules);
      document.getElementById('stat-places-totales-emp').textContent = formatNumber(placesTotales);
      document.getElementById('stat-valeur-totale-emp').textContent = formatAmount(valeurTotale) + ' €';
      document.getElementById('stat-assurances-actives-emp').textContent = formatNumber(assurancesActives);
    } catch (e) { 
      console.error('Erreur chargement stats:', e); 
    }
  }

  async function loadFlotte() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const snap = await getDocs(query(collection(fb.db, 'flotte'), orderBy('dateAchat', 'desc')));
      const tbody = document.getElementById('flotte-emp-tbody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      // Filtrer uniquement les véhicules achetés (Flotte MS Corp)
      const vehiculesAchetes = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(v => v.achete === true);
      
      if (!vehiculesAchetes.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="7">Aucun véhicule acheté</td></tr>';
        flotteCache = [];
        loadStats();
        return;
      }

      flotteCache = vehiculesAchetes;
      
      vehiculesAchetes.forEach(v => {
        const dateAchat = v.dateAchat ? 
          (v.dateAchat.toDate ? v.dateAchat.toDate() : new Date(v.dateAchat)) : 
          (v.dateAchatFinanciere?.toDate ? v.dateAchatFinanciere.toDate() : new Date());
        
        // Déterminer quel tier d'assurance
        let assuranceTier = '—';
        let assuranceMontant = 0;
        if (v.assuranceTier1) {
          assuranceTier = `Tier 1: ${formatAmount(v.assuranceTier1)} €`;
          assuranceMontant = v.assuranceTier1;
        } else if (v.assuranceTier2) {
          assuranceTier = `Tier 2: ${formatAmount(v.assuranceTier2)} €`;
          assuranceMontant = v.assuranceTier2;
        } else if (v.assuranceTier3) {
          assuranceTier = `Tier 3: ${formatAmount(v.assuranceTier3)} €`;
          assuranceMontant = v.assuranceTier3;
        } else if (v.assuranceTier4) {
          assuranceTier = `Tier 4: ${formatAmount(v.assuranceTier4)} €`;
          assuranceMontant = v.assuranceTier4;
        }
        
        const montantTotal = (v.prixAchat || 0) + assuranceMontant;
        
        // Déterminer la date d'expiration de l'assurance
        const dateExpirationAssurance = v.dateExpirationAssurance ? 
          (v.dateExpirationAssurance.toDate ? v.dateExpirationAssurance.toDate() : new Date(v.dateExpirationAssurance)) : 
          null;
        
        // Calculer le compte à rebours pour le renouvellement
        let compteReboursHtml = '—';
        if (dateExpirationAssurance) {
          const maintenant = new Date();
          maintenant.setHours(0, 0, 0, 0);
          const expiration = new Date(dateExpirationAssurance);
          expiration.setHours(0, 0, 0, 0);
          const diffTime = expiration - maintenant;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            compteReboursHtml = `<span style="color: #ef4444; font-weight: 700;">Expirée (${Math.abs(diffDays)}j)</span>`;
          } else if (diffDays === 0) {
            compteReboursHtml = `<span style="color: #f59e0b; font-weight: 700;">Aujourd'hui</span>`;
          } else if (diffDays <= 7) {
            compteReboursHtml = `<span style="color: #f59e0b; font-weight: 700;">${diffDays} jour${diffDays > 1 ? 's' : ''}</span>`;
          } else {
            compteReboursHtml = `<span style="color: #10b981; font-weight: 700;">${diffDays} jour${diffDays > 1 ? 's' : ''}</span>`;
          }
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${dateAchat.toLocaleDateString('fr-FR')}</td>
          <td>${v.type || '—'} ${v.modele || '—'} (${v.immatriculation || '—'})</td>
          <td>${formatAmount(v.prixAchat || 0)} €</td>
          <td>${assuranceTier}</td>
          <td>${compteReboursHtml}</td>
          <td class="font-medium text-red-600">-${formatAmount(montantTotal)} €</td>
          <td>
            <div class="action-buttons" data-vehicule-id="${v.id}">
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
      
      loadStats();
      // Recharger les cartes si la vue card est active
      if (currentViewEmp === 'card') {
        loadFlotteCardsEmp();
      }
    } catch (e) { 
      console.error(e); 
    }
  }

  async function loadFlotteCardsEmp() {
    try {
      const cardsContainer = document.getElementById('flotte-cards-emp');
      const emptyState = document.getElementById('flotte-empty-card-emp');
      if (!cardsContainer || !emptyState) return;

      cardsContainer.innerHTML = '';
      
      if (!flotteCache || flotteCache.length === 0) {
        emptyState.textContent = 'Aucun véhicule';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');

      flotteCache.forEach(vehicule => {
        const dateAchat = vehicule.dateAchat ? 
          (vehicule.dateAchat.toDate ? vehicule.dateAchat.toDate() : new Date(vehicule.dateAchat)) : 
          null;
        
        const card = document.createElement('div');
        card.className = 'p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow';
        
        const hasAssurances = vehicule.assuranceTier1 || vehicule.assuranceTier2 || vehicule.assuranceTier3 || vehicule.assuranceTier4;
        
        card.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">${vehicule.type || '—'}</div>
              <div class="text-xl font-semibold text-slate-900 dark:text-white mb-1">${vehicule.modele || '—'}</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">${vehicule.immatriculation || '—'}</div>
            </div>
            <div class="action-buttons" data-vehicule-id="${vehicule.id}">
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
            </div>
          </div>
          
          <div class="grid gap-3 grid-cols-2">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400 mb-1">Places</div>
              <div class="text-lg font-semibold text-slate-900 dark:text-white">${formatNumber(vehicule.nombrePlaces || 0)}</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400 mb-1">Prix d'achat</div>
              <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">${formatAmount(vehicule.prixAchat || 0)} €</div>
            </div>
          </div>
          
          ${hasAssurances ? `
          <div class="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/10 p-3">
            <div class="text-xs uppercase text-slate-500 dark:text-slate-400 mb-2">Assurances</div>
            <div class="grid gap-2 grid-cols-2 text-xs">
              ${vehicule.assuranceTier1 ? `<div><span class="text-slate-600 dark:text-slate-400">Tier 1:</span> <span class="font-semibold">${formatAmount(vehicule.assuranceTier1)} €</span></div>` : ''}
              ${vehicule.assuranceTier2 ? `<div><span class="text-slate-600 dark:text-slate-400">Tier 2:</span> <span class="font-semibold">${formatAmount(vehicule.assuranceTier2)} €</span></div>` : ''}
              ${vehicule.assuranceTier3 ? `<div><span class="text-slate-600 dark:text-slate-400">Tier 3:</span> <span class="font-semibold">${formatAmount(vehicule.assuranceTier3)} €</span></div>` : ''}
              ${vehicule.assuranceTier4 ? `<div><span class="text-slate-600 dark:text-slate-400">Tier 4:</span> <span class="font-semibold">${formatAmount(vehicule.assuranceTier4)} €</span></div>` : ''}
            </div>
          </div>
          ` : ''}
          
          ${dateAchat || vehicule.kilometrage !== null ? `
          <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
            ${dateAchat ? `<div>🛒 ${dateAchat.toLocaleDateString('fr-FR')}</div>` : ''}
            ${vehicule.kilometrage !== null ? `<div>📏 ${formatNumber(vehicule.kilometrage)} km</div>` : ''}
          </div>
          ` : ''}
        `;
        
        cardsContainer.appendChild(card);
      });
    } catch (e) {
      console.error('Erreur chargement cartes:', e);
    }
  }

  // Actions sur les véhicules (lecture seule pour les employés)
  const page = document.querySelector('.page-card');
  page.addEventListener('click', async (e) => {
    const container = e.target.closest('.action-buttons');
    if (!container) return;
    const vehiculeId = container.getAttribute('data-vehicule-id');
    if (!vehiculeId) return;
    
    const vehicule = flotteCache.find(v => v.id === vehiculeId);
    if (!vehicule) return;

    if (e.target.closest('.btn-view')) {
      const dateAchat = vehicule.dateAchat ? 
        (vehicule.dateAchat.toDate ? vehicule.dateAchat.toDate() : new Date(vehicule.dateAchat)) : 
        null;
      
      const body = `
        <div class="view-highlight">
          <div class="view-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;"><path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"></path><polygon points="12 15 17 21 7 21 12 15"></polygon></svg></div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${vehicule.type || '—'} ${vehicule.modele || '—'}</div>
          <div style="color: rgb(100,116,139);">${vehicule.immatriculation || '—'}</div>
        </div>
        <div class="view-grid">
          <div class="view-section">
            <div class="view-section-title">Informations véhicule</div>
            <div class="view-item">
              <div class="view-item-label">Type</div>
              <div class="view-item-value">${vehicule.type || '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Modèle</div>
              <div class="view-item-value">${vehicule.modele || '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Immatriculation</div>
              <div class="view-item-value">${vehicule.immatriculation || '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Nombre de places</div>
              <div class="view-item-value">${formatNumber(vehicule.nombrePlaces || 0)}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Prix d'achat</div>
              <div class="view-item-value" style="font-size: 1.25rem; color: #0055A4;">${formatAmount(vehicule.prixAchat || 0)} €</div>
            </div>
          </div>
          <div class="view-section">
            <div class="view-section-title">Assurances</div>
            <div class="view-item">
              <div class="view-item-label">Assurance Tier 1</div>
              <div class="view-item-value">${vehicule.assuranceTier1 ? formatAmount(vehicule.assuranceTier1) + ' €' : '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Assurance Tier 2</div>
              <div class="view-item-value">${vehicule.assuranceTier2 ? formatAmount(vehicule.assuranceTier2) + ' €' : '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Assurance Tier 3</div>
              <div class="view-item-value">${vehicule.assuranceTier3 ? formatAmount(vehicule.assuranceTier3) + ' €' : '—'}</div>
            </div>
            <div class="view-item">
              <div class="view-item-label">Assurance Tier 4</div>
              <div class="view-item-value">${vehicule.assuranceTier4 ? formatAmount(vehicule.assuranceTier4) + ' €' : '—'}</div>
            </div>
          </div>
          ${dateAchat || vehicule.kilometrage !== null || vehicule.notes ? `
          <div class="view-section">
            <div class="view-section-title">Détails supplémentaires</div>
            ${dateAchat ? `
            <div class="view-item">
              <div class="view-item-label">Date d'achat</div>
              <div class="view-item-value">${dateAchat.toLocaleDateString('fr-FR')}</div>
            </div>
            ` : ''}
            ${vehicule.kilometrage !== null ? `
            <div class="view-item">
              <div class="view-item-label">Kilométrage</div>
              <div class="view-item-value">${formatNumber(vehicule.kilometrage)} km</div>
            </div>
            ` : ''}
            ${vehicule.notes ? `
            <div class="view-item">
              <div class="view-item-label">Notes</div>
              <div class="view-item-value">${vehicule.notes}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}
        </div>
      `;
      createModal({ 
        title: 'Détails véhicule', 
        body, 
        confirmText: 'Fermer', 
        onConfirm: () => {}, 
        isView: true 
      });
    }
  });
}

function viewCalculatriceEmploye(root) {
  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/employe/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <div class="user-info flex items-center gap-3">
              <div id="sb-avatar-calc" class="user-avatar w-9 h-9"></div>
              <div class="user-details">
                <div id="sb-name-calc" class="user-name text-sm font-semibold">—</div>
                <div id="sb-email-calc" class="user-handle text-xs opacity-70">—</div>
              </div>
            </div>
            <div
              id="sb-role-calc"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleEmploye"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente-calc" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/centrale" id="nav-centrale-calc" class="nav-item" style="display:none;"><span class="nav-icon"></span>Prise de service</a>
            <a href="#/employe/suivi-effectif" id="nav-suivi-effectif-calc" class="nav-item"><span class="nav-icon"></span>Suivi effectif</a>
            <a href="#/employe/flotte" id="nav-flotte-calc" class="nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul-calc" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/employe/calculatrice" id="nav-calculatrice-calc" class="active nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-emp-calc" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Calculatrice</div>
              <div class="page-sub">Calculatrice simple</div>
            </div>
          </div>

          <div class="max-w-sm mx-auto mt-8">
            <div class="card p-6 shadow-lg">
              <div id="calculator-display-emp" class="mb-6 p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-white/10 text-right text-4xl font-bold text-slate-900 dark:text-white min-h-[100px] flex items-center justify-end overflow-hidden">
                <span class="break-all">0</span>
              </div>
              
              <div class="grid grid-cols-4 gap-3">
                <button class="calc-btn calc-btn-clear" data-action="clear">
                  <span class="calc-btn-text">C</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-action="backspace">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                  </svg>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="/">
                  <span class="calc-btn-text">÷</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="*">
                  <span class="calc-btn-text">×</span>
                </button>
                
                <button class="calc-btn calc-btn-number" data-value="7">
                  <span class="calc-btn-text">7</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="8">
                  <span class="calc-btn-text">8</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="9">
                  <span class="calc-btn-text">9</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="-">
                  <span class="calc-btn-text">−</span>
                </button>
                
                <button class="calc-btn calc-btn-number" data-value="4">
                  <span class="calc-btn-text">4</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="5">
                  <span class="calc-btn-text">5</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="6">
                  <span class="calc-btn-text">6</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="+">
                  <span class="calc-btn-text">+</span>
                </button>
                
                <button class="calc-btn calc-btn-number" data-value="1">
                  <span class="calc-btn-text">1</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="2">
                  <span class="calc-btn-text">2</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="3">
                  <span class="calc-btn-text">3</span>
                </button>
                <button class="calc-btn calc-btn-equals" data-action="equals" style="grid-row: span 2;">
                  <span class="calc-btn-text text-2xl">=</span>
                </button>
                
                <button class="calc-btn calc-btn-number col-span-2" data-value="0">
                  <span class="calc-btn-text">0</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value=".">
                  <span class="calc-btn-text">.</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  mount(root, content);

  // Charger le profil utilisateur
  (async () => {
    let p = getCachedProfile();
    if (!p || !p.name) {
      p = await loadUserProfile() || {};
    }
    
    const av = document.getElementById('sb-avatar-calc');
    updateAvatar(av, p);
    const nm = document.getElementById('sb-name-calc');
    if (nm) nm.textContent = p.name || 'Utilisateur';
    const em = document.getElementById('sb-email-calc');
    if (em) em.textContent = p.email || '';
    const rb = document.getElementById('sb-role-calc');
    if (rb) await updateRoleBadge(rb);
  })();

  // Logique de la calculatrice
  let display = '0';
  let previousValue = null;
  let operator = null;
  let waitingForOperand = false;

  const displayEl = document.getElementById('calculator-display-emp');
  const buttons = document.querySelectorAll('.calc-btn');

  function updateDisplay() {
    const span = displayEl.querySelector('span');
    if (span) {
      span.textContent = display;
    } else {
      displayEl.textContent = display;
    }
  }

  function inputNumber(num) {
    if (waitingForOperand) {
      display = num;
      waitingForOperand = false;
    } else {
      display = display === '0' ? num : display + num;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (waitingForOperand) {
      display = '0.';
      waitingForOperand = false;
    } else if (display.indexOf('.') === -1) {
      display += '.';
    }
    updateDisplay();
  }

  function performOperation(nextOperator) {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      previousValue = inputValue;
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);

      display = String(newValue);
      previousValue = newValue;
      updateDisplay();
    }

    waitingForOperand = true;
    operator = nextOperator;
  }

  function calculate(firstValue, secondValue, operation) {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  }

  function clear() {
    display = '0';
    previousValue = null;
    operator = null;
    waitingForOperand = false;
    updateDisplay();
  }

  function backspace() {
    if (display.length > 1) {
      display = display.slice(0, -1);
    } else {
      display = '0';
    }
    updateDisplay();
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const value = button.getAttribute('data-value');

      if (action === 'clear') {
        clear();
      } else if (action === 'backspace') {
        backspace();
      } else if (action === 'equals') {
        if (operator && previousValue !== null) {
          performOperation(null);
          operator = null;
          previousValue = null;
          waitingForOperand = true;
        }
      } else if (value) {
        if (['+', '-', '*', '/'].includes(value)) {
          performOperation(value);
        } else if (value === '.') {
          inputDecimal();
        } else {
          inputNumber(value);
        }
      }
    });
  });

  // Gestion du logout
  const logoutLink = document.getElementById('logout-link-emp-calc');
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
            const { signOut } = await import('./firebase.js');
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
}

function viewCentraleEmploye(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/employe/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
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
              data-role-field="roleEmploye"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/centrale" id="nav-centrale" class="nav-item active"><span class="nav-icon"></span>Prise de service</a>
            <a href="#/employe/suivi-effectif" id="nav-suivi-effectif" class="nav-item"><span class="nav-icon"></span>Suivi effectif</a>
            <a href="#/employe/flotte" id="nav-flotte" class="nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/employe/calculatrice" id="nav-calculatrice" class="nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-emp-centrale" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card">
          <div class="page-head">
            <div>
              <div class="page-title">Prise de service</div>
              <div class="page-sub">Gérez votre prise de service et consultez les collègues en service</div>
            </div>
            <div class="flex gap-2 flex-wrap justify-end">
              <button id="btn-refresh-service" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115-6.7L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 01-15 6.7L3 16"></path><path d="M8 16H3v5"></path></svg></span>
                Actualiser
              </button>
              <button id="btn-my-service-action" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7h-1l-1-2h-8l-1 2H6a2 2 0 00-2 2v9a2 2 0 002 2h13a2 2 0 002-2V9a2 2 0 00-2-2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg></span>
                <span id="service-action-text">Prendre mon service</span>
              </button>
            </div>
          </div>

          <div class="card mt-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-lg">État du service</h3>
              <div id="service-status-summary" class="text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
            </div>

            <div id="my-service-status" class="p-4 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">Mon statut</div>
                  <div class="text-sm text-slate-600 dark:text-slate-300" id="my-service-detail">Chargement...</div>
                </div>
                <div id="my-service-badge" class="px-3 py-1 rounded-full text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Chargement...
                </div>
              </div>
            </div>

            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Employé</th>
                    <th>Contact</th>
                    <th>Prise de service</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="service-employees-tbody">
                  <tr><td colspan="4" class="py-3 text-center">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  mount(root, content);

  // Gestion du logout
  const logoutLink = document.getElementById('logout-link-emp-centrale');
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
          const { signOut } = await import('./firebase.js');
          await signOut(fb.auth);
        }
      } catch (err) {
        console.error('Erreur déconnexion:', err);
      }
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    });
  }

  let currentUser = null;
  let serviceEmployees = [];
  let serviceEmployeIds = new Set();
  let myServiceStatus = null;

  function renderServiceTable() {
    const tbody = document.getElementById('service-employees-tbody');
    const summaryEl = document.getElementById('service-status-summary');
    if (summaryEl) {
      summaryEl.textContent = `${serviceEmployees.length} employé${serviceEmployees.length > 1 ? 's' : ''} en service`;
    }
    if (!tbody) return;

    if (!serviceEmployees.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500 dark:text-slate-400">Aucun employé n\'est actuellement en service.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    serviceEmployees.forEach(emp => {
      const contactParts = [];
      if (emp.phone) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h4.09a2 2 0 0 1 2 1.72c.12.86.37 1.7.72 2.49a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6.18 6.18l1.59-1.59a2 2 0 0 1 2.11-.45c.79.35 1.63.6 2.49.72a2 2 0 0 1 1.72 2z"></path></svg>${emp.phone}</span>`);
      }
      if (emp.email) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>${emp.email}</span>`);
      }
      const contactHtml = contactParts.length ? contactParts.join('<br>') : '—';
      const startedAt = emp.startedAt ? emp.startedAt.toLocaleString('fr-FR') : '—';

      const isCurrentUser = emp.uid === currentUser?.uid;
      const canEndService = isCurrentUser || false; // Pour l'instant, seulement l'utilisateur peut terminer son propre service

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${emp.name || emp.uid || '—'} ${isCurrentUser ? '<span class="text-xs text-blue-600 dark:text-blue-400">(Vous)</span>' : ''}</td>
        <td>${contactHtml}</td>
        <td>${startedAt}</td>
        <td>
          ${canEndService ? `
            <div class="action-buttons" data-service-uid="${emp.uid}">
              <button class="action-btn btn-stop-service" title="Mettre fin au service" style="background: #dc2626; color: white;">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg></span>
              </button>
            </div>
          ` : '—'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMyServiceStatus() {
    const detailEl = document.getElementById('my-service-detail');
    const badgeEl = document.getElementById('my-service-badge');
    const actionBtn = document.getElementById('btn-my-service-action');
    const actionText = document.getElementById('service-action-text');

    if (!myServiceStatus) {
      if (detailEl) detailEl.textContent = 'Hors service';
      if (badgeEl) {
        badgeEl.textContent = 'Hors service';
        badgeEl.className = 'px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      }
      if (actionText) actionText.textContent = 'Prendre mon service';
      if (actionBtn) actionBtn.style.display = 'inline-flex';
    } else {
      const startedAt = myServiceStatus.startedAt ? myServiceStatus.startedAt.toLocaleString('fr-FR') : '—';
      if (detailEl) detailEl.textContent = `En service depuis ${startedAt}`;
      if (badgeEl) {
        badgeEl.textContent = 'En service';
        badgeEl.className = 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      }
      if (actionText) actionText.textContent = 'Terminer mon service';
      if (actionBtn) actionBtn.style.display = 'inline-flex';
    }
  }

  async function loadServiceEmployees() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const snap = await getDocs(query(collection(fb.db, 'centraleServices'), where('active', '==', true)));
      const mapped = snap.docs.map(docSnap => {
        const data = docSnap.data() || {};
        const uid = data.uid || docSnap.id;
        const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : null);
        return {
          id: docSnap.id,
          uid,
          name: data.name || uid,
          email: data.email || '',
          phone: data.phone || '',
          startedAt,
          raw: data
        };
      });
      mapped.sort((a, b) => {
        const timeA = a.startedAt ? a.startedAt.getTime() : 0;
        const timeB = b.startedAt ? b.startedAt.getTime() : 0;
        if (timeA === timeB) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return timeA - timeB;
      });
      serviceEmployees = mapped;
      serviceEmployeIds = new Set(mapped.map(emp => emp.uid));

      // Mettre à jour le statut de l'utilisateur actuel
      myServiceStatus = mapped.find(emp => emp.uid === currentUser?.uid) || null;

      renderServiceTable();
      renderMyServiceStatus();
    } catch (e) {
      console.error('Erreur chargement employés en service:', e);
      serviceEmployees = [];
      serviceEmployeIds = new Set();
      myServiceStatus = null;
      renderServiceTable();
      renderMyServiceStatus();
    }
  }

  async function toggleMyService() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db || !currentUser) return;

      if (myServiceStatus) {
        // Terminer le service
        await setDoc(doc(fb.db, 'centraleServices', currentUser.uid), {
          active: false,
          endedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });

        await addLogEntry(fb, {
          type: 'action',
          action: 'centrale_service_end',
          category: 'centrale',
          message: `Fin de service pour ${currentUser.name || currentUser.email || currentUser.uid}`
        });

        alertModal({ title: 'Succès', message: 'Votre fin de service a été enregistrée.', type: 'success' });
      } else {
        // Prendre le service
        const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
        await setDoc(doc(fb.db, 'centraleServices', currentUser.uid), {
          uid: currentUser.uid,
          name: currentUser.name || currentUser.email || currentUser.uid,
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          active: true,
          startedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: authState?.uid || null
        }, { merge: true });

        await addLogEntry(fb, {
          type: 'action',
          action: 'centrale_service_start',
          category: 'centrale',
          message: `Prise de service par ${currentUser.name || currentUser.email || currentUser.uid}`
        });

        alertModal({ title: 'Succès', message: 'Votre prise de service a été enregistrée.', type: 'success' });
      }

      await loadServiceEmployees();
    } catch (e) {
      console.error('Erreur gestion service:', e);
      alertModal({ title: 'Erreur', message: 'Impossible de modifier votre statut de service.', type: 'danger' });
    }
  }

  async function endServiceForEmployee(uid) {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      await setDoc(doc(fb.db, 'centraleServices', uid), {
        active: false,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      const emp = serviceEmployees.find(e => e.uid === uid);
      await addLogEntry(fb, {
        type: 'action',
        action: 'centrale_service_end',
        category: 'centrale',
        message: `Fin de service enregistrée pour ${emp?.name || uid}`
      });

      await loadServiceEmployees();
      alertModal({ title: 'Succès', message: `Fin de service enregistrée pour ${emp?.name || 'l\'employé'}.`, type: 'success' });
    } catch (e) {
      console.error('Erreur fin de service:', e);
      alertModal({ title: 'Erreur', message: 'Impossible d\'enregistrer la fin de service.', type: 'danger' });
    }
  }

  // Gestion des événements
  document.getElementById('btn-refresh-service')?.addEventListener('click', loadServiceEmployees);
  document.getElementById('btn-my-service-action')?.addEventListener('click', toggleMyService);

  document.addEventListener('click', async (e) => {
    const stopBtn = e.target.closest('.btn-stop-service');
    if (stopBtn) {
      const container = stopBtn.closest('.action-buttons');
      const uid = container?.getAttribute('data-service-uid');
      if (uid === currentUser?.uid) {
        createModal({
          title: 'Mettre fin au service',
          body: `<p>Confirmez-vous la fin de votre service ?</p>`,
          confirmText: 'Mettre fin',
          cancelText: 'Annuler',
          confirmStyle: 'background: #dc2626; color: white;',
          onConfirm: async () => {
            await endServiceForEmployee(uid);
          }
        });
      }
      return;
    }

    const actionContainer = e.target.closest('.action-buttons');
    if (actionContainer && actionContainer.hasAttribute('data-entry-id')) {
      const entryId = actionContainer.getAttribute('data-entry-id');
      const entry = centraleEntries.find(ent => ent.id === entryId);
      if (!entry) {
        return;
      }

      if (e.target.closest('.btn-edit')) {
        openAffectationModal(entry);
        return;
      }

      if (e.target.closest('.btn-delete')) {
        createModal({
          title: 'Supprimer l'affectation',
          body: `<p>Souhaitez-vous supprimer <strong>${entry.affectation || 'cette affectation'}</strong> ?</p><p class="text-sm text-slate-500 mt-2">Cette action est irréversible.</p>`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          confirmStyle: 'background: #dc2626; color: white;',
          onConfirm: async () => {
            try {
              const fb = getFirebase();
              if (!fb || !fb.db) return;
              await deleteDoc(doc(fb.db, 'centraleEffectif', entryId));
              await addLogEntry(fb, {
                type: 'action',
                action: 'centrale_delete',
                category: 'centrale',
                message: `Suppression affectation ${entry.affectation || entryId}`
              });
              centraleEntries = centraleEntries.filter(ent => ent.id !== entryId);
              renderCentraleTable();
              alertModal({ title: 'Succès', message: 'Affectation supprimée.', type: 'success' });
            } catch (err) {
              console.error('Erreur suppression affectation centrale (employé):', err);
              alertModal({ title: 'Erreur', message: 'Impossible de supprimer cette affectation.', type: 'danger' });
            }
          }
        });
        return;
      }
    }
  });

  // Initialisation
  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) {
        await waitForFirebase();
      }

      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }

      // Récupérer l'utilisateur actuel
      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      if (authState && authState.uid) {
        currentUser = {
          uid: authState.uid,
          name: profile.name || profile.email || authState.uid,
          email: profile.email || '',
          phone: profile.phone || ''
        };
      }

      const avatar = document.getElementById('sb-avatar');
      updateAvatar(avatar, profile);

      const nameEl = document.getElementById('sb-name');
      if (nameEl) nameEl.textContent = profile.name || 'Utilisateur';
      const emailEl = document.getElementById('sb-email');
      if (emailEl) emailEl.textContent = profile.email || '';
      const roleBadge = document.getElementById('sb-role');
      if (roleBadge) await updateRoleBadge(roleBadge);

      await updateNavPermissions();
      await applyPagePermissions({
        create: 'centrale',
        edit: 'centrale'
      });

      await loadServiceEmployees();
    } catch (e) {
      console.error('Erreur initialisation centrale employé:', e);
      alertModal({ title: 'Erreur', message: 'Impossible de charger la prise de service.', type: 'danger' });
    }
  })();

  function renderServiceStatus() {
    const statusEl = document.getElementById('service-status');
    const statusTextEl = document.getElementById('service-status-text');
    const startedEl = document.getElementById('service-started');

    if (!serviceStatus) {
      if (statusEl) statusEl.textContent = 'Hors service';
      if (statusTextEl) statusTextEl.textContent = 'Hors service';
      if (startedEl) startedEl.textContent = '—';
    } else {
      if (statusEl) statusEl.textContent = 'En service';
      if (statusTextEl) statusTextEl.textContent = 'En service';
      if (startedEl) startedEl.textContent = serviceStatus.startedAt ? serviceStatus.startedAt.toLocaleString('fr-FR') : '—';
    }

    renderMyServiceStatus();
  }
}

function viewSuiviEffectifEmploye(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  const content = html`
    <section class="fade-in layout">
      <aside class="sidebar">
        <div class="sidebar-inner">
          <a href="#/employe/profile" class="mb-4 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 block hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer">
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
              data-role-field="roleEmploye"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/centrale" id="nav-centrale" class="nav-item"><span class="nav-icon"></span>Prise de service</a>
            <a href="#/employe/suivi-effectif" id="nav-suivi-effectif" class="nav-item active"><span class="nav-icon"></span>Suivi effectif</a>
            <a href="#/employe/flotte" id="nav-flotte" class="nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/employe/calculatrice" id="nav-calculatrice" class="nav-item"><span class="nav-icon"></span>Calculatrice</a>
            <a href="#/public" class="nav-item" style="border-top: 1px solid rgba(226,232,240,1); margin-top: 0.5rem; padding-top: 0.75rem;"><span class="nav-icon"></span>Site Public</a>
          </nav>
          <div class="nav-bottom">
            <a href="#/home" class="home-card-link">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
              <span>Choix d'espace</span>
            </a>
            <a id="logout-link-emp-suivi" href="#/auth">Déconnexion</a>
          </div>
        </div>
      </aside>
      <div class="content">
        <div class="page-card effectif-page">
          <div class="page-head">
            <div>
              <div class="page-title">Suivi des effectifs</div>
              <div class="page-sub">Organisez les équipes en service et suivez les affectations</div>
            </div>
            <div class="flex gap-2 flex-wrap justify-end">
              <button id="btn-manage-status-emp" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4"></path><path d="M15 4.6A1.65 1.65 0 0015 3a2 2 0 10-2.94 1.76 1.65 1.65 0 00-1.42.84L10.37 7"></path><path d="M6.34 7a1.65 1.65 0 00-1.82-.33l-.06.06a2 2 0 102.83 2.83l.06-.06A1.65 1.65 0 007 9.66"></path></svg></span>
                Gérer les statuts
              </button>
              <button id="btn-new-affectation-emp" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span>
                Nouvelle affectation
              </button>
            </div>
          </div>

          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item effectif-tab active" data-tab="affectations">Mes affectations</button>
              <button class="tab-item effectif-tab" data-tab="service">Mon service</button>
            </div>
          </div>

          <div id="tab-affectations" class="tab-content active">
            <div class="card mt-4">
              <div class="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>Affectation</th>
                      <th>Véhicule</th>
                      <th>Équipe</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="affectations-tbody">
                    <tr><td colspan="5" class="py-3 text-center">Chargement…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="tab-service" class="tab-content hidden">
            <div class="card mt-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h3 class="font-medium text-lg">Mon statut de service</h3>
                  <div id="service-status" class="text-sm text-slate-500 dark:text-slate-400">—</div>
                </div>
                <div class="flex gap-2 flex-wrap justify-end">
                  <button id="btn-refresh-service" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115-6.7L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 01-15 6.7L3 16"></path><path d="M8 16H3v5"></path></svg></span>
                    Actualiser
                  </button>
                  <button id="btn-my-service-action" class="btn-primary flex items-center gap-2">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7h-1l-1-2h-8l-1 2H6a2 2 0 00-2 2v9a2 2 0 002 2h13a2 2 0 002-2V9a2 2 0 00-2-2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg></span>
                    <span id="service-action-text">Prendre mon service</span>
                  </button>
                </div>
              </div>
              <div id="service-details" class="space-y-3">
                <div class="p-4 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div class="text-sm text-slate-600 dark:text-slate-300">Statut : <span id="service-status-text">Chargement...</span></div>
                  <div class="text-sm text-slate-600 dark:text-slate-300 mt-1">Depuis : <span id="service-started">—</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  mount(root, content);

  // Gestion du logout
  const logoutLink = document.getElementById('logout-link-emp-suivi');
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
          const { signOut } = await import('./firebase.js');
          await signOut(fb.auth);
        }
      } catch (err) {
        console.error('Erreur déconnexion:', err);
      }
      localStorage.removeItem('ms_auth_state');
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null } }));
      location.hash = '#/auth';
    });
  }

  let currentUser = null;
  let centraleEntries = [];
  let serviceStatus = null;
  let vehiculeOptions = [];
  let employeOptions = [];
  let statutOptions = ['Disponible', 'En service', 'En intervention', 'En maintenance', 'Indisponible'];

  function renderAffectationsTable() {
    const tbody = document.getElementById('affectations-tbody');
    if (!tbody) return;

    if (!centraleEntries.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-500 dark:text-slate-400">Aucune affectation active pour le moment.</td></tr>';
      return;
    }

    // Filtrer les affectations où l'utilisateur actuel est présent
    const userAffectations = centraleEntries.filter(entry =>
      Array.isArray(entry.employes) &&
      entry.employes.some(emp => emp && emp.uid === currentUser.uid)
    );

    if (!userAffectations.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-500 dark:text-slate-400">Vous n\'êtes affecté à aucune équipe pour le moment.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    userAffectations.forEach(entry => {
      const employes = Array.isArray(entry.employes) ? entry.employes.filter(Boolean) : [];
      const mappedEmployes = employes.map(emp => {
        const empOption = employeOptions.find(e => e.uid === emp.uid);
        const name = empOption?.name || emp.name || empOption?.email || emp.email || emp.uid || '—';
        const inService = emp.uid ? serviceEmployeIds.has(emp.uid) : false;
        return {
          ...emp,
          name,
          inService
        };
      });

      const autres = mappedEmployes.filter(emp => emp.uid !== currentUser.uid);
      const equipeHtml = autres.length
        ? autres.map(emp => {
            const badgeClass = emp.inService
              ? 'bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-blue-300'
              : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300';
            const statusSuffix = emp.inService ? '' : '<span class="ml-1 text-[10px] uppercase tracking-wide text-red-500 dark:text-red-400">hors service</span>';
            return `<span class="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium ${badgeClass}">${emp.name}${statusSuffix}</span>`;
          }).join(' ')
        : '<span class="text-xs text-slate-400">Aucun équipier</span>';

      const myBadge = mappedEmployes.find(emp => emp.uid === currentUser.uid);
      const myStatusSuffix = myBadge && !myBadge.inService ? '<span class="ml-1 text-[10px] uppercase tracking-wide text-red-500 dark:text-red-400">hors service</span>' : '';
      const myLabel = myBadge ? `${myBadge.name}${myStatusSuffix}` : '—';

      const statutLabel = entry.statut || '—';
      const statutColor = getStatusColor(statutLabel);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${entry.affectation || '—'}</td>
        <td>${entry.vehiculeLabel || getVehiculeLabelById(entry.vehiculeId) || '—'}</td>
        <td class="space-y-1">
          <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Vous : ${myLabel}</div>
          <div class="space-x-1 space-y-1">${equipeHtml}</div>
        </td>
        <td><span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" style="background:${statutColor.bg}; color:${statutColor.fg};">${statutLabel}</span></td>
        <td>
          <div class="action-buttons" data-entry-id="${entry.id}">
            <button class="action-btn btn-edit" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
            <button class="action-btn btn-delete" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function getStatusColor(statut) {
    const normalized = (statut || '').toLowerCase();
    if (normalized.includes('dispo')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', fg: '#047857' };
    }
    if (normalized.includes('intervention') || normalized.includes('service') || normalized.includes('renfort')) {
      return { bg: 'rgba(59,130,246,0.15)', fg: '#1d4ed8' };
    }
    if (normalized.includes('maintenance') || normalized.includes('pause')) {
      return { bg: 'rgba(251,191,36,0.15)', fg: '#b45309' };
    }
    if (normalized.includes('indisp') || normalized.includes('incident')) {
      return { bg: 'rgba(239,68,68,0.15)', fg: '#b91c1c' };
    }
    return { bg: 'rgba(148, 163, 184, 0.2)', fg: '#475569' };
  }

  function getVehiculeLabelById(id) {
    const vehicule = vehiculeOptions.find(v => v.id === id);
    return vehicule?.label || '—';
  }

  function getEmployeeOption(uid) {
    return employeOptions.find(e => e.uid === uid);
  }

  function renderServiceStatus() {
    const statusEl = document.getElementById('service-status');
    const statusTextEl = document.getElementById('service-status-text');
    const startedEl = document.getElementById('service-started');

    if (!serviceStatus) {
      if (statusEl) statusEl.textContent = 'Hors service';
      if (statusTextEl) statusTextEl.textContent = 'Hors service';
      if (startedEl) startedEl.textContent = '—';
    } else {
      if (statusEl) statusEl.textContent = 'En service';
      if (statusTextEl) statusTextEl.textContent = 'En service';
      if (startedEl) startedEl.textContent = serviceStatus.startedAt ? serviceStatus.startedAt.toLocaleString('fr-FR') : '—';
    }

    renderMyServiceStatus();
  }

  async function loadStatuts() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const configDoc = await getDoc(doc(fb.db, 'centraleConfig', 'settings'));
      if (configDoc.exists()) {
        const data = configDoc.data() || {};
        if (Array.isArray(data.statuts) && data.statuts.length) {
          statutOptions = Array.from(new Set(data.statuts.map(s => String(s || '').trim()).filter(Boolean)));
          return;
        }
      }
      statutOptions = ['Disponible', 'En service', 'En intervention', 'En maintenance', 'Indisponible'];
    } catch (e) {
      console.error('Erreur chargement statuts centrale:', e);
      statutOptions = ['Disponible', 'En service', 'En intervention', 'En maintenance', 'Indisponible'];
    }
  }

  async function loadVehiculesAchetes() {
    try {
      const fbFlotte = getFlotteFirebase();
      if (!fbFlotte || !fbFlotte.db) return;
      const snap = await getDocs(query(collection(fbFlotte.db, 'flotte'), where('achete', '==', true)));
      vehiculeOptions = snap.docs.map(d => {
        const data = d.data() || {};
        const type = data.type || '';
        const modele = data.modele || '';
        const immat = data.immatriculation || '';
        const labelParts = [type, modele].filter(Boolean);
        const baseLabel = labelParts.length ? labelParts.join(' ') : 'Véhicule';
        const label = immat ? `${baseLabel} (${immat})` : baseLabel;
        return {
          id: d.id,
          label,
          meta: {
            type,
            modele,
            immatriculation: immat,
            nombrePlaces: data.nombrePlaces || null
          }
        };
      }).sort((a, b) => a.label.localeCompare(b.label));
    } catch (e) {
      console.error('Erreur chargement véhicules achetés:', e);
      vehiculeOptions = [];
    }
  }

  function buildUserDisplayName(user) {
    const { prenom, nom, name, email } = user;
    if (prenom || nom) {
      return [prenom, nom].filter(Boolean).join(' ') || name || email || user.uid || '—';
    }
    return name || email || user.uid || '—';
  }

  async function loadEmployeOptions() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const snap = await getDocs(collection(fb.db, 'users'));
      employeOptions = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => !!u.roleEntreprise && !!u.roleEmploye)
        .map(u => ({
          uid: u.uid || u.id || u.userId || d.id,
          name: buildUserDisplayName({ ...u, uid: d.id }),
          email: u.email || '',
          phone: u.phone || '',
          avatar: u.photoUrl || ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.error('Erreur chargement employés centrale:', e);
      employeOptions = [];
    }
  }

  async function loadCentraleEntries() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const snap = await getDocs(collection(fb.db, 'centraleEffectif'));
      centraleEntries = snap.docs.map(d => ({ id: d.id, ...d.data() || {} }));
      renderAffectationsTable();
    } catch (e) {
      console.error('Erreur chargement affectations:', e);
      centraleEntries = [];
      renderAffectationsTable();
    }
  }

  async function loadServiceStatus() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db || !currentUser) return;
      const docSnap = await getDoc(doc(fb.db, 'centraleServices', currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.active) {
          serviceStatus = {
            ...data,
            startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : null)
          };
        } else {
          serviceStatus = null;
        }
      } else {
        serviceStatus = null;
      }
      renderServiceStatus();
    } catch (e) {
      console.error('Erreur chargement statut service:', e);
      serviceStatus = null;
      renderServiceStatus();
    }
  }

  async function startService() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db || !currentUser) return;

      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      await setDoc(doc(fb.db, 'centraleServices', currentUser.uid), {
        uid: currentUser.uid,
        name: currentUser.name || currentUser.email || currentUser.uid,
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        active: true,
        startedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: authState?.uid || null
      }, { merge: true });

      await addLogEntry(fb, {
        type: 'action',
        action: 'centrale_service_start',
        category: 'centrale',
        message: `Prise de service par ${currentUser.name || currentUser.email || currentUser.uid}`
      });

      await loadServiceStatus();
      renderAffectationsTable();
      alertModal({ title: 'Succès', message: 'Votre prise de service a été enregistrée.', type: 'success' });
    } catch (e) {
      console.error('Erreur prise de service:', e);
      alertModal({ title: 'Erreur', message: 'Impossible d\'enregistrer la prise de service.', type: 'danger' });
    }
  }

  async function endService() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db || !currentUser) return;

      await setDoc(doc(fb.db, 'centraleServices', currentUser.uid), {
        active: false,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await addLogEntry(fb, {
        type: 'action',
        action: 'centrale_service_end',
        category: 'centrale',
        message: `Fin de service pour ${currentUser.name || currentUser.email || currentUser.uid}`
      });

      await loadServiceStatus();
      renderAffectationsTable();
      alertModal({ title: 'Succès', message: 'Votre fin de service a été enregistrée.', type: 'success' });
    } catch (e) {
      console.error('Erreur fin de service:', e);
      alertModal({ title: 'Erreur', message: 'Impossible d\'enregistrer la fin de service.', type: 'danger' });
    }
  }

  function openStatusManager() {
    const statusListHtml = statutOptions.length
      ? statutOptions.map(stat => `<span class="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/10 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">${stat}</span>`).join(' ')
      : '<span class="text-xs text-slate-500">Aucun statut enregistré.</span>';

    createModal({
      title: 'Gérer les statuts',
      body: `
        <div class="space-y-4">
          <div>
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Statuts disponibles</div>
            <div class="flex flex-wrap gap-2">${statusListHtml}</div>
          </div>
          <div class="modal-field">
            <label>Nouveau statut</label>
            <input id="modal-new-status" type="text" placeholder="Ex: En renfort" />
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">Ajoutez un statut personnalisé pour vos équipes. Les statuts seront disponibles dans les prochaines affectations.</p>
        </div>
      `,
      confirmText: 'Ajouter',
      cancelText: 'Fermer',
      onConfirm: async () => {
        const input = document.getElementById('modal-new-status');
        const value = input ? input.value.trim() : '';
        if (!value) {
          alertModal({ title: 'Information', message: 'Veuillez saisir un libellé de statut.', type: 'info' });
          return;
        }
        if (statutOptions.some(opt => opt.toLowerCase() === value.toLowerCase())) {
          alertModal({ title: 'Information', message: 'Ce statut est déjà disponible.', type: 'info' });
          return;
        }
        try {
          const fb = getFirebase();
          if (!fb || !fb.db) return;
          statutOptions.push(value);
          await setDoc(doc(fb.db, 'centraleConfig', 'settings'), { statuts: statutOptions }, { merge: true });
          alertModal({ title: 'Succès', message: `Le statut "${value}" a été ajouté.`, type: 'success' });
        } catch (e) {
          console.error('Erreur ajout statut centrale:', e);
          alertModal({ title: 'Erreur', message: 'Impossible d\'ajouter ce statut.', type: 'danger' });
        }
      }
    });
  }

  function buildEmployeeSelectOptions(selectedUid) {
    const options = ['<option value="">— Aucun —</option>'];
    const sortedService = [...employeOptions];
    sortedService.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    sortedService.forEach(emp => {
      const selected = emp.uid === selectedUid ? 'selected' : '';
      const label = emp.name || emp.email || emp.uid;
      options.push(`<option value="${emp.uid}" ${selected}>${label}</option>`);
    });
    if (selectedUid && !employeOptions.some(emp => emp.uid === selectedUid)) {
      const fallback = employeOptions.find(emp => emp.uid === selectedUid);
      if (fallback) {
        const label = `${fallback.name || fallback.email || fallback.uid}`;
        options.push(`<option value="${fallback.uid}" selected>${label}</option>`);
      }
    }
    return options.join('');
  }

  function buildVehiculeSelectOptions(selectedId) {
    const options = ['<option value="">— Sélectionner —</option>'];
    vehiculeOptions.forEach(veh => {
      const selected = veh.id === selectedId ? 'selected' : '';
      options.push(`<option value="${veh.id}" ${selected}>${veh.label}</option>`);
    });
    return options.join('');
  }

  function buildStatutSelectOptions(selectedStatut) {
    const options = ['<option value="">— Sélectionner —</option>'];
    statutOptions.forEach(stat => {
      const selected = stat === selectedStatut ? 'selected' : '';
      options.push(`<option value="${stat}" ${selected}>${stat}</option>`);
    });
    return options.join('');
  }

  async function openAffectationModal(entry = null) {
    await loadVehiculesAchetes();
    await loadEmployeOptions();

    const isEdit = !!entry;
    const employes = entry?.employes && Array.isArray(entry.employes) ? entry.employes : [];

    const body = `
      <div class="space-y-4">
        <div class="modal-field">
          <label>Affectation *</label>
          <select id="modal-affectation" required>
            <option value="">— Sélectionner —</option>
            <option value="Alpha" ${'Alpha' === entry?.affectation ? 'selected' : ''}>Alpha</option>
            <option value="Bravo" ${'Bravo' === entry?.affectation ? 'selected' : ''}>Bravo</option>
            <option value="Charlie" ${'Charlie' === entry?.affectation ? 'selected' : ''}>Charlie</option>
            <option value="Delta" ${'Delta' === entry?.affectation ? 'selected' : ''}>Delta</option>
            <option value="Echo" ${'Echo' === entry?.affectation ? 'selected' : ''}>Echo</option>
            <option value="Foxtrot" ${'Foxtrot' === entry?.affectation ? 'selected' : ''}>Foxtrot</option>
            <option value="Golf" ${'Golf' === entry?.affectation ? 'selected' : ''}>Golf</option>
            <option value="Hotel" ${'Hotel' === entry?.affectation ? 'selected' : ''}>Hotel</option>
            <option value="India" ${'India' === entry?.affectation ? 'selected' : ''}>India</option>
            <option value="Juliett" ${'Juliett' === entry?.affectation ? 'selected' : ''}>Juliett</option>
            <option value="Kilo" ${'Kilo' === entry?.affectation ? 'selected' : ''}>Kilo</option>
            <option value="Lima" ${'Lima' === entry?.affectation ? 'selected' : ''}>Lima</option>
            <option value="Mike" ${'Mike' === entry?.affectation ? 'selected' : ''}>Mike</option>
            <option value="November" ${'November' === entry?.affectation ? 'selected' : ''}>November</option>
            <option value="Oscar" ${'Oscar' === entry?.affectation ? 'selected' : ''}>Oscar</option>
            <option value="Papa" ${'Papa' === entry?.affectation ? 'selected' : ''}>Papa</option>
            <option value="Quebec" ${'Quebec' === entry?.affectation ? 'selected' : ''}>Quebec</option>
            <option value="Romeo" ${'Romeo' === entry?.affectation ? 'selected' : ''}>Romeo</option>
            <option value="Sierra" ${'Sierra' === entry?.affectation ? 'selected' : ''}>Sierra</option>
            <option value="Tango" ${'Tango' === entry?.affectation ? 'selected' : ''}>Tango</option>
            <option value="Uniform" ${'Uniform' === entry?.affectation ? 'selected' : ''}>Uniform</option>
            <option value="Victor" ${'Victor' === entry?.affectation ? 'selected' : ''}>Victor</option>
            <option value="Whiskey" ${'Whiskey' === entry?.affectation ? 'selected' : ''}>Whiskey</option>
            <option value="X-ray" ${'X-ray' === entry?.affectation ? 'selected' : ''}>X-ray</option>
            <option value="Yankee" ${'Yankee' === entry?.affectation ? 'selected' : ''}>Yankee</option>
            <option value="Zulu" ${'Zulu' === entry?.affectation ? 'selected' : ''}>Zulu</option>
          </select>
        </div>

        <div class="modal-field">
          <label>Véhicule *</label>
          <select id="modal-vehicule" required>
            ${buildVehiculeSelectOptions(entry?.vehiculeId || '')}
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${[1, 2, 3, 4].map(index => {
            const current = employes[index - 1];
            return `
              <div class="modal-field">
                <label>Employé ${index}</label>
                <select id="modal-employe-${index}">
                  ${buildEmployeeSelectOptions(current?.uid || '')}
                </select>
              </div>
            `;
          }).join('')}
        </div>

        <div class="modal-field">
          <label>Statut *</label>
          <select id="modal-statut" required>
            ${buildStatutSelectOptions(entry?.statut || '')}
          </select>
        </div>
      </div>
    `;

    createModal({
      title: isEdit ? 'Modifier l\'affectation' : 'Nouvelle affectation',
      body,
      confirmText: isEdit ? 'Enregistrer' : 'Créer',
      cancelText: 'Annuler',
      onConfirm: async () => {
        const affectation = document.getElementById('modal-affectation')?.value.trim();
        const vehiculeId = document.getElementById('modal-vehicule')?.value.trim();
        const statut = document.getElementById('modal-statut')?.value.trim();

        if (!affectation) {
          alertModal({ title: 'Champs requis', message: 'Veuillez sélectionner une affectation.', type: 'warning' });
          return;
        }
        if (!vehiculeId) {
          alertModal({ title: 'Champs requis', message: 'Veuillez sélectionner un véhicule.', type: 'warning' });
          return;
        }
        if (!statut) {
          alertModal({ title: 'Champs requis', message: 'Veuillez sélectionner un statut.', type: 'warning' });
          return;
        }

        const vehiculeLabel = getVehiculeLabelById(vehiculeId);

        const employeSelections = [1, 2, 3, 4].map(index => {
          const value = document.getElementById(`modal-employe-${index}`)?.value?.trim();
          if (!value) return null;
          const option = getEmployeeOption(value);
          return option ? { uid: option.uid, name: option.name || option.email || option.uid } : { uid: value, name: value };
        }).filter((emp, idx, self) => {
          if (!emp) return false;
          return self.findIndex(e => e.uid === emp.uid) === idx;
        });

        const now = serverTimestamp();

        const payload = {
          affectation,
          vehiculeId,
          vehiculeLabel,
          employes: employeSelections,
          statut,
          updatedAt: now
        };

        try {
          const fb = getFirebase();
          if (!fb || !fb.db) {
            alertModal({ title: 'Erreur', message: 'Base de données indisponible.', type: 'danger' });
            return;
          }

          if (isEdit) {
            await updateDoc(doc(fb.db, 'centraleEffectif', entry.id), payload);
            await addLogEntry(fb, {
              type: 'action',
              action: 'centrale_update',
              category: 'centrale',
              message: `Mise à jour affectation ${affectation} (${vehiculeLabel})`
            });
          } else {
            await addDoc(collection(fb.db, 'centraleEffectif'), {
              ...payload,
              createdAt: now
            });
            await addLogEntry(fb, {
              type: 'action',
              action: 'centrale_create',
              category: 'centrale',
              message: `Création affectation ${affectation} (${vehiculeLabel})`
            });
          }

          await loadCentraleEntries();
          alertModal({ title: 'Succès', message: 'Affectation enregistrée avec succès.', type: 'success' });
        } catch (e) {
          console.error('Erreur sauvegarde affectation centrale:', e);
          alertModal({ title: 'Erreur', message: 'Impossible d\'enregistrer cette affectation.', type: 'danger' });
        }
      }
    });
  }

  // Gestion des tabs
  document.querySelectorAll('.effectif-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.effectif-tab').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active', 'hidden'));

      tabBtn.classList.add('active');
      const target = document.getElementById(`tab-${tabBtn.dataset.tab}`);
      if (target) {
        target.classList.add('active');
        target.classList.remove('hidden');
      }

      // Recharger les données selon le tab
      if (tabBtn.dataset.tab === 'affectations') {
        loadCentraleEntries();
      } else if (tabBtn.dataset.tab === 'service') {
        loadServiceStatus();
      }
    });
  });

  // Gestion des boutons de service
  document.getElementById('btn-start-service')?.addEventListener('click', startService);
  document.getElementById('btn-end-service')?.addEventListener('click', endService);

  // Gestion des boutons de gestion
  document.getElementById('btn-manage-status-emp')?.addEventListener('click', openStatusManager);
  document.getElementById('btn-new-affectation-emp')?.addEventListener('click', () => openAffectationModal());

  // Initialisation
  (async () => {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) {
        await waitForFirebase();
      }

      let profile = getCachedProfile();
      if (!profile || !profile.name) {
        profile = await loadUserProfile() || {};
      }

      // Récupérer l'utilisateur actuel
      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      if (authState && authState.uid) {
        currentUser = {
          uid: authState.uid,
          name: profile.name || profile.email || authState.uid,
          email: profile.email || '',
          phone: profile.phone || ''
        };
      }

      const avatar = document.getElementById('sb-avatar');
      updateAvatar(avatar, profile);

      const nameEl = document.getElementById('sb-name');
      if (nameEl) nameEl.textContent = profile.name || 'Utilisateur';
      const emailEl = document.getElementById('sb-email');
      if (emailEl) emailEl.textContent = profile.email || '';
      const roleBadge = document.getElementById('sb-role');
      if (roleBadge) await updateRoleBadge(roleBadge);

      await updateNavPermissions();
      await applyPagePermissions({
        create: 'centrale',
        edit: 'centrale',
        delete: 'centrale',
        read: 'centrale'
      });

      await loadStatuts();
      await loadVehiculesAchetes();
      await loadEmployeOptions();
      await loadCentraleEntries();
      await loadServiceStatus();
    } catch (e) {
      console.error('Erreur initialisation suivi effectif:', e);
      alertModal({ title: 'Erreur', message: 'Impossible de charger le suivi d\'effectif.', type: 'danger' });
    }
  })();
}
