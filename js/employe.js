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
            <a href="#/employe/calcul" id="nav-calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
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
          await addLogEntry(fb, { type: 'logout', message: 'Déconnexion' });
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
  const navCalcul = document.getElementById('nav-calcul');
  if (navVente && navCalcul) {
    if (hash === '#/employe/calcul') {
      navCalcul.classList.add('active');
      navVente.classList.remove('active');
    } else {
      navVente.classList.add('active');
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
          await addLogEntry(fb, { type: 'action', action: 'vente_create', message: `Vente de ${quantite} ressources` });
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
            <a href="#/employe/calcul" id="nav-calcul-calc" class="active nav-item"><span class="nav-icon"></span>Calculateur CA</a>
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
          await addLogEntry(fb, { type: 'logout', message: 'Déconnexion' });
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
  const navCalcul = document.getElementById('nav-calcul-calc');
  if (navVente && navCalcul) {
    if (hash === '#/employe/calcul') {
      navCalcul.classList.add('active');
      navVente.classList.remove('active');
    } else {
      navVente.classList.add('active');
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
