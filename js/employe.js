import { html, mount, getCachedProfile, loadUserProfile, createModal, alertModal, updateAvatar, isAuthenticated, updateRoleBadge } from './utils.js';
import { getFirebase, waitForFirebase, doc, getDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, where, signOut } from './firebase.js';
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
  
  if (hash === '#/employe/calculatrice') {
    viewCalculatriceEmploye(root);
    return;
  }
  
  if (hash === '#/employe/flotte') {
    viewFlotteEmploye(root);
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
            <div id="sb-role" class="badge-role badge-employe mt-2 inline-block text-xs">Employé</div>
          </a>
          <div class="section-title">Employé</div>
            <nav class="nav-links">
            <a href="#/employe" id="nav-vente" class="nav-item"><span class="nav-icon"></span>Vente</a>
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
  if (navVente && navFlotte && navCalcul) {
    if (hash === '#/employe/calcul') {
      navCalcul.classList.add('active');
      navVente.classList.remove('active');
      navFlotte.classList.remove('active');
    } else if (hash === '#/employe/flotte') {
      navFlotte.classList.add('active');
      navVente.classList.remove('active');
      navCalcul.classList.remove('active');
    } else {
      navVente.classList.add('active');
      navFlotte.classList.remove('active');
      navCalcul.classList.remove('active');
    }
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
            <div id="sb-role-calc" class="badge-role badge-employe mt-2 inline-block text-xs">Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente-calc" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/flotte" id="nav-flotte-calc" class="nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul-calc" class="active nav-item"><span class="nav-icon"></span>Calculateur CA</a>
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
  if (navVente && navFlotte && navCalcul) {
    if (hash === '#/employe/calcul') {
      navCalcul.classList.add('active');
      navVente.classList.remove('active');
      navFlotte.classList.remove('active');
    } else if (hash === '#/employe/flotte') {
      navFlotte.classList.add('active');
      navVente.classList.remove('active');
      navCalcul.classList.remove('active');
    } else {
      navVente.classList.add('active');
      navFlotte.classList.remove('active');
      navCalcul.classList.remove('active');
    }
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
            <div id="sb-role-flotte" class="badge-role badge-employe mt-2 inline-block text-xs">Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente-flotte" class="nav-item"><span class="nav-icon"></span>Vente</a>
            <a href="#/employe/flotte" id="nav-flotte-flotte" class="active nav-item"><span class="nav-icon"></span>Flotte</a>
            <a href="#/employe/calcul" id="nav-calcul-flotte" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
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
  if (navVente && navFlotte && navCalcul) {
    if (hash === '#/employe/flotte') {
      navFlotte.classList.add('active');
      navVente.classList.remove('active');
      navCalcul.classList.remove('active');
    } else if (hash === '#/employe/calcul') {
      navCalcul.classList.add('active');
      navVente.classList.remove('active');
      navFlotte.classList.remove('active');
    } else {
      navVente.classList.add('active');
      navFlotte.classList.remove('active');
      navCalcul.classList.remove('active');
    }
  }

  let flotteCache = [];
  let currentViewEmp = localStorage.getItem('flotte-view-emp') || 'table'; // 'table' ou 'card'

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
    } catch (e) { 
      console.error(e); 
    }
  })();

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
            <div id="sb-role-calc" class="badge-role badge-employe mt-2 inline-block text-xs">Employé</div>
          </a>
          <div class="section-title">Employé</div>
          <nav class="nav-links">
            <a href="#/employe" id="nav-vente-calc" class="nav-item"><span class="nav-icon"></span>Vente</a>
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
