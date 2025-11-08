    import { html, mount, createModal, getCachedProfile, loadUserProfile, updateNavPermissions, alertModal, updateAvatar, isAuthenticated, updateRoleBadge } from '../utils.js'
import { getFirebase, waitForFirebase, collection, getDocs, getDoc, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, signOut } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

export function viewFlotte(root) {
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
            <a href="#/entreprise/roles" class="nav-item"><span class="nav-icon"></span>Rôle & Permission</a>
            <a href="#/entreprise/ventes" class="nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
            <a href="#/entreprise/flotte" class="active nav-item"><span class="nav-icon"></span>Gestion Flotte</a>
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
              <div class="page-title">Gestion de la Flotte</div>
              <div class="page-sub">Gérez les véhicules de l'entreprise (camions, etc.)</div>
            </div>
            <button id="btn-new-vehicule" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau véhicule
            </button>
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
                <div id="stat-total-vehicules" class="stat-value">0</div>
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
                <div id="stat-places-totales" class="stat-value">0</div>
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
                <div id="stat-valeur-totale" class="stat-value">0 €</div>
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
                <div id="stat-assurances-actives" class="stat-value">0</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item active" data-tab="liste-a4l">Liste des véhicules A4L</button>
              <button class="tab-item" data-tab="flotte-ms-corp">Flotte MS Corp</button>
            </div>
          </div>

          <!-- Tab 1: Liste des véhicules A4L -->
          <div id="tab-liste-a4l" class="tab-content active">
            <!-- Toggle vue card/tableau -->
            <div class="flex items-center justify-between mb-4 mt-6">
              <h3 class="font-medium text-lg">Véhicules disponibles</h3>
              <div class="flex items-center gap-2">
                <button id="btn-view-table" class="view-toggle-btn active flex items-center gap-2 px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors" title="Vue tableau">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Tableau
                </button>
                <button id="btn-view-card" class="view-toggle-btn flex items-center gap-2 px-3 py-1.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors" title="Vue cartes">
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
            <div id="flotte-table-view" class="flotte-view">
              <div class="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Modèle</th>
                      <th>Nombre de places</th>
                      <th>Prix d'achat</th>
                      <th>Assurance Tier 1</th>
                      <th>Assurance Tier 2</th>
                      <th>Assurance Tier 3</th>
                      <th>Assurance Tier 4</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="flotte-tbody">
                    <tr><td class="py-3 text-center" colspan="9">Chargement…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Vue Cartes -->
            <div id="flotte-card-view" class="flotte-view hidden">
              <div id="flotte-empty-card" class="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
                Chargement…
              </div>
              <div id="flotte-cards" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div>
            </div>
          </div>

          <!-- Tab 2: Flotte MS Corp -->
          <div id="tab-flotte-ms-corp" class="tab-content">
            <div class="card mt-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-lg">Véhicules achetés</h3>
              </div>
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
                  <tbody id="flotte-achetee-tbody">
                    <tr><td class="py-3 text-center" colspan="7">Chargement…</td></tr>
                  </tbody>
                </table>
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

  let flotteCache = [];
  let flotteAcheteeCache = [];
  let currentView = localStorage.getItem('flotte-view') || 'table'; // 'table' ou 'card'
  let currentTab = localStorage.getItem('flotte-tab') || 'liste-a4l'; // 'liste-a4l' ou 'flotte-ms-corp'

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
  function switchView(view) {
    currentView = view;
    localStorage.setItem('flotte-view', view);
    
    const tableView = document.getElementById('flotte-table-view');
    const cardView = document.getElementById('flotte-card-view');
    const btnTable = document.getElementById('btn-view-table');
    const btnCard = document.getElementById('btn-view-card');
    
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
      loadFlotteCards();
    }
  }

  document.getElementById('btn-view-table')?.addEventListener('click', () => switchView('table'));
  document.getElementById('btn-view-card')?.addEventListener('click', () => switchView('card'));
  
  // Initialiser la vue
  switchView(currentView);

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
        currentTab = tabId;
        localStorage.setItem('flotte-tab', tabId);
        
        if (tabId === 'liste-a4l') {
          loadFlotte();
          loadStats();
        } else if (tabId === 'flotte-ms-corp') {
          loadFlotteAchetee();
        }
      });
    });
    
    // Initialiser l'onglet actif
    const activeTabBtn = document.querySelector(`[data-tab="${currentTab}"]`);
    if (activeTabBtn) {
      const tabContent = document.getElementById(`tab-${currentTab}`);
      if (tabContent) {
        document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        activeTabBtn.classList.add('active');
        tabContent.classList.add('active');
      }
    }
  }, 100);

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
      const av = document.getElementById('sb-avatar');
      updateAvatar(av, p);
      const nm = document.getElementById('sb-name');
      if (nm) nm.textContent = p.name || 'Utilisateur';
      const em = document.getElementById('sb-email');
      if (em) em.textContent = p.email || '';
      const rb = document.getElementById('sb-role');
      if (rb) await updateRoleBadge(rb);

      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();

      if (currentTab === 'liste-a4l') {
        loadFlotte();
        loadStats();
      } else if (currentTab === 'flotte-ms-corp') {
        loadFlotteAchetee();
      }
    } catch (e) { 
      console.error(e); 
    }
  })();

  async function loadStats() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      const snap = await getDocs(collection(fb.db, 'flotte'));
      const vehicules = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const totalVehicules = vehicules.length;
      const placesTotales = vehicules.reduce((sum, v) => sum + (v.nombrePlaces || 0), 0);
      const valeurTotale = vehicules.reduce((sum, v) => sum + (v.prixAchat || 0), 0);
      const assurancesActives = vehicules.filter(v => 
        v.assuranceTier1 || v.assuranceTier2 || v.assuranceTier3 || v.assuranceTier4
      ).length;

      document.getElementById('stat-total-vehicules').textContent = formatNumber(totalVehicules);
      document.getElementById('stat-places-totales').textContent = formatNumber(placesTotales);
      document.getElementById('stat-valeur-totale').textContent = formatAmount(valeurTotale) + ' €';
      document.getElementById('stat-assurances-actives').textContent = formatNumber(assurancesActives);
    } catch (e) { 
      console.error('Erreur chargement stats:', e); 
    }
  }

  async function loadFlotte() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const snap = await getDocs(query(collection(fb.db, 'flotte'), orderBy('createdAt', 'desc')));
      const tbody = document.getElementById('flotte-tbody');
      tbody.innerHTML = '';
      
      // Afficher uniquement les véhicules sources (sans vehiculeSourceId) - ceux qu'on peut acheter plusieurs fois
      const vehicules = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(v => !v.vehiculeSourceId); // Seulement les véhicules sources, pas les copies achetées
      
      if (!vehicules.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="9">Aucun véhicule disponible</td></tr>';
        flotteCache = [];
        loadStats();
        return;
      }

      flotteCache = vehicules;
      
      vehicules.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${v.type || '—'}</td>
          <td>${v.modele || '—'}</td>
          <td>${formatNumber(v.nombrePlaces || 0)}</td>
          <td>${formatAmount(v.prixAchat || 0)} €</td>
          <td>${v.assuranceTier1 ? formatAmount(v.assuranceTier1) + ' €' : '—'}</td>
          <td>${v.assuranceTier2 ? formatAmount(v.assuranceTier2) + ' €' : '—'}</td>
          <td>${v.assuranceTier3 ? formatAmount(v.assuranceTier3) + ' €' : '—'}</td>
          <td>${v.assuranceTier4 ? formatAmount(v.assuranceTier4) + ' €' : '—'}</td>
          <td>
            <div class="action-buttons" data-vehicule-id="${v.id}">
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              <button class="action-btn btn-edit" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
              <button class="action-btn btn-acheter" title="Acheter" style="background: #0055A4; color: white;"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></span></button>
              <button class="action-btn btn-delete" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
      
      loadStats();
      // Recharger les cartes si la vue card est active
      if (currentView === 'card') {
        loadFlotteCards();
      }
    } catch (e) { 
      console.error(e); 
    }
  }

  // Fonction pour vérifier et renouveler automatiquement les assurances expirées
  async function checkAndRenewAssurances() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const snap = await getDocs(query(collection(fb.db, 'flotte'), where('achete', '==', true)));
      const maintenant = new Date();
      maintenant.setHours(0, 0, 0, 0);
      
      for (const docSnap of snap.docs) {
        const vehicule = { id: docSnap.id, ...docSnap.data() };
        
        if (!vehicule.dateExpirationAssurance) continue;
        
        const dateExpiration = vehicule.dateExpirationAssurance.toDate ? 
          vehicule.dateExpirationAssurance.toDate() : 
          new Date(vehicule.dateExpirationAssurance);
        dateExpiration.setHours(0, 0, 0, 0);
        
        // Si l'assurance est expirée, la renouveler automatiquement pour 30 jours supplémentaires
        if (dateExpiration < maintenant) {
          // Utiliser la date du dernier paiement comme référence, sinon utiliser la date d'expiration actuelle
          let dateReference = maintenant;
          if (vehicule.dateDernierPaiementAssurance) {
            const dateDernierPaiement = vehicule.dateDernierPaiementAssurance.toDate ? 
              vehicule.dateDernierPaiementAssurance.toDate() : 
              new Date(vehicule.dateDernierPaiementAssurance);
            dateDernierPaiement.setHours(0, 0, 0, 0);
            dateReference = dateDernierPaiement;
          }
          
          // Calculer la nouvelle date d'expiration : 30 jours à partir de la date de référence
          const nouvelleDateExpiration = new Date(dateReference);
          nouvelleDateExpiration.setDate(nouvelleDateExpiration.getDate() + 30);
          
          // Mettre à jour la date du dernier paiement à aujourd'hui si elle n'existe pas ou est antérieure
          const nouvelleDatePaiement = maintenant;
          
          await updateDoc(doc(fb.db, 'flotte', vehicule.id), {
            dateExpirationAssurance: nouvelleDateExpiration,
            dateDernierPaiementAssurance: nouvelleDatePaiement
          });
        }
      }
    } catch (e) {
      console.error('Erreur lors du renouvellement automatique des assurances:', e);
    }
  }

  async function loadFlotteAchetee() {
    try {
      // Vérifier et renouveler automatiquement les assurances expirées avant de charger
      await checkAndRenewAssurances();
      
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      const snap = await getDocs(query(collection(fb.db, 'flotte'), orderBy('dateAchat', 'desc')));
      const tbody = document.getElementById('flotte-achetee-tbody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      // Filtrer uniquement les véhicules achetés
      const vehiculesAchetes = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(v => v.achete === true);
      
      if (!vehiculesAchetes.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="7">Aucun véhicule acheté</td></tr>';
        flotteAcheteeCache = [];
        return;
      }

      flotteAcheteeCache = vehiculesAchetes;
      
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
        const dateExpirationStr = dateExpirationAssurance ? dateExpirationAssurance.toLocaleDateString('fr-FR') : 'Non définie';
        
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
            <div class="action-buttons" data-vehicule-id="${v.id}" data-assurance-montant="${assuranceMontant}" data-assurance-tier="${assuranceTier}">
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              <button class="action-btn btn-repayer-assurance" title="Repayer assurance" style="background: #10b981; color: white;"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></span></button>
              <button class="action-btn btn-controle-technique" title="Payer contrôle technique" style="background: #f59e0b; color: white;"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></span></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    } catch (e) { 
      console.error(e); 
    }
  }

  async function loadFlotteCards() {
    try {
      const cardsContainer = document.getElementById('flotte-cards');
      const emptyState = document.getElementById('flotte-empty-card');
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
            </div>
            <div class="action-buttons" data-vehicule-id="${vehicule.id}">
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              <button class="action-btn btn-edit" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
              <button class="action-btn btn-acheter" title="Acheter" style="background: #0055A4; color: white;"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></span></button>
              <button class="action-btn btn-delete" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
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

  // Nouveau véhicule
  document.getElementById('btn-new-vehicule').addEventListener('click', () => {
    const body = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
        <div class="modal-field">
          <label>Type de véhicule *</label>
          <select id="modal-type" required>
            <option value="">Sélectionnez</option>
            <option value="Camion">Camion</option>
            <option value="Camionnette">Camionnette</option>
            <option value="Fourgon">Fourgon</option>
            <option value="Utilitaire">Utilitaire</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Modèle *</label>
          <input id="modal-modele" type="text" required placeholder="Ex: Renault Master" />
        </div>
        <div class="modal-field">
          <label>Nombre de places *</label>
          <input id="modal-places" type="number" min="1" required placeholder="Ex: 3" />
        </div>
        <div class="modal-field">
          <label>Prix d'achat (€) *</label>
          <input id="modal-prix" type="number" min="0" step="0.01" required placeholder="Ex: 25000.00" />
        </div>
        <div class="modal-field">
          <label>Kilométrage</label>
          <input id="modal-kilometrage" type="number" min="0" placeholder="0" />
        </div>
      </div>
      <div class="modal-field">
        <label>Assurances (optionnel)</label>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
          <div>
            <label style="font-size: 0.875rem; color: rgb(100,116,139); margin-bottom: 0.25rem; display: block;">Tier 1 (€)</label>
            <input id="modal-assurance1" type="number" min="0" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(2,6,23,0.1); border-radius: 0.375rem;" />
          </div>
          <div>
            <label style="font-size: 0.875rem; color: rgb(100,116,139); margin-bottom: 0.25rem; display: block;">Tier 2 (€)</label>
            <input id="modal-assurance2" type="number" min="0" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(2,6,23,0.1); border-radius: 0.375rem;" />
          </div>
          <div>
            <label style="font-size: 0.875rem; color: rgb(100,116,139); margin-bottom: 0.25rem; display: block;">Tier 3 (€)</label>
            <input id="modal-assurance3" type="number" min="0" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(2,6,23,0.1); border-radius: 0.375rem;" />
          </div>
          <div>
            <label style="font-size: 0.875rem; color: rgb(100,116,139); margin-bottom: 0.25rem; display: block;">Tier 4 (€)</label>
            <input id="modal-assurance4" type="number" min="0" step="0.01" placeholder="0.00" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(2,6,23,0.1); border-radius: 0.375rem;" />
          </div>
        </div>
      </div>
      <div class="modal-field">
        <label>Notes</label>
        <textarea id="modal-notes" rows="2" placeholder="Informations supplémentaires..."></textarea>
      </div>
    `;
    
    createModal({
      title: 'Nouveau véhicule',
      body,
      confirmText: 'Créer',
      cancelText: 'Annuler',
      onConfirm: async () => {
        const fb = getFirebase();
        const type = document.getElementById('modal-type').value.trim();
        const modele = document.getElementById('modal-modele').value.trim();
        const nombrePlaces = parseInt(document.getElementById('modal-places').value);
        const prixAchat = parseFloat(document.getElementById('modal-prix').value);
        const assuranceTier1 = parseFloat(document.getElementById('modal-assurance1').value) || null;
        const assuranceTier2 = parseFloat(document.getElementById('modal-assurance2').value) || null;
        const assuranceTier3 = parseFloat(document.getElementById('modal-assurance3').value) || null;
        const assuranceTier4 = parseFloat(document.getElementById('modal-assurance4').value) || null;
        const kilometrage = parseInt(document.getElementById('modal-kilometrage').value) || null;
        const notes = document.getElementById('modal-notes').value.trim() || null;

        if (!type || !modele || !nombrePlaces || isNaN(prixAchat)) {
          alertModal({ 
            title: 'Champs requis', 
            message: 'Type, modèle, nombre de places et prix d\'achat sont requis.', 
            type: 'warning' 
          });
          return;
        }

        try {
          const data = {
            type,
            modele,
            nombrePlaces,
            prixAchat,
            achete: false,
            createdAt: serverTimestamp()
          };
          
          if (assuranceTier1 !== null && assuranceTier1 > 0) data.assuranceTier1 = assuranceTier1;
          if (assuranceTier2 !== null && assuranceTier2 > 0) data.assuranceTier2 = assuranceTier2;
          if (assuranceTier3 !== null && assuranceTier3 > 0) data.assuranceTier3 = assuranceTier3;
          if (assuranceTier4 !== null && assuranceTier4 > 0) data.assuranceTier4 = assuranceTier4;
          if (kilometrage !== null) data.kilometrage = kilometrage;
          if (notes) data.notes = notes;

          await addDoc(collection(fb.db, 'flotte'), data);
          
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'flotte_create', 
            category: 'flotte',
            message: `Ajout d'un véhicule à la liste: ${type} ${modele}` 
          });
          
          await loadFlotte();
          if (currentView === 'card') {
            loadFlotteCards();
          }
          alertModal({ title: 'Succès', message: 'Véhicule ajouté à la liste avec succès.', type: 'success' });
        } catch (e) { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création du véhicule.', type: 'danger' });
          console.error(e); 
        }
      }
    });
  });

  // Actions sur les véhicules
  const page = document.querySelector('.page-card');
  page.addEventListener('click', async (e) => {
    const container = e.target.closest('.action-buttons');
    if (!container) return;
    const vehiculeId = container.getAttribute('data-vehicule-id');
    if (!vehiculeId) return;
    
    const vehicule = flotteCache.find(v => v.id === vehiculeId);
    if (!vehicule) return;

    const fb = getFirebase();

    if (e.target.closest('.btn-view')) {
      const dateAchat = vehicule.dateAchat ? 
        (vehicule.dateAchat.toDate ? vehicule.dateAchat.toDate() : new Date(vehicule.dateAchat)) : 
        null;
      
      const body = `
        <div class="view-highlight">
          <div class="view-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;"><path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"></path><polygon points="12 15 17 21 7 21 12 15"></polygon></svg></div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: rgb(15,23,42);" class="dark:text-white">${vehicule.type || '—'} ${vehicule.modele || '—'}</div>
          <div style="color: rgb(100,116,139);" class="dark:text-slate-400">${vehicule.immatriculation || '—'}</div>
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
      return;
    }

    if (e.target.closest('.btn-edit')) {
      const dateAchat = vehicule.dateAchat ? 
        (vehicule.dateAchat.toDate ? vehicule.dateAchat.toDate() : new Date(vehicule.dateAchat)) : 
        null;
      
      const body = `
        <div class="modal-field">
          <label>Type de véhicule *</label>
          <select id="modal-edit-type" required>
            <option value="">Sélectionnez un type</option>
            <option value="Camion" ${vehicule.type === 'Camion' ? 'selected' : ''}>Camion</option>
            <option value="Camionnette" ${vehicule.type === 'Camionnette' ? 'selected' : ''}>Camionnette</option>
            <option value="Fourgon" ${vehicule.type === 'Fourgon' ? 'selected' : ''}>Fourgon</option>
            <option value="Utilitaire" ${vehicule.type === 'Utilitaire' ? 'selected' : ''}>Utilitaire</option>
            <option value="Autre" ${vehicule.type === 'Autre' ? 'selected' : ''}>Autre</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Modèle *</label>
          <input id="modal-edit-modele" type="text" value="${vehicule.modele || ''}" required />
        </div>
        <div class="modal-field">
          <label>Immatriculation ${vehicule.achete ? '*' : '(saisie lors de l\'achat)'}</label>
          <input id="modal-edit-immatriculation" type="text" value="${vehicule.immatriculation || ''}" ${vehicule.achete ? 'required' : 'disabled'} />
        </div>
        <div class="modal-field">
          <label>Nombre de places *</label>
          <input id="modal-edit-places" type="number" min="1" value="${vehicule.nombrePlaces || 1}" required />
        </div>
        <div class="modal-field">
          <label>Prix d'achat (€) *</label>
          <input id="modal-edit-prix" type="number" min="0" step="0.01" value="${vehicule.prixAchat || 0}" required />
        </div>
        <div class="modal-field">
          <label>Assurance Tier 1 (€)</label>
          <input id="modal-edit-assurance1" type="number" min="0" step="0.01" value="${vehicule.assuranceTier1 || ''}" />
        </div>
        <div class="modal-field">
          <label>Assurance Tier 2 (€)</label>
          <input id="modal-edit-assurance2" type="number" min="0" step="0.01" value="${vehicule.assuranceTier2 || ''}" />
        </div>
        <div class="modal-field">
          <label>Assurance Tier 3 (€)</label>
          <input id="modal-edit-assurance3" type="number" min="0" step="0.01" value="${vehicule.assuranceTier3 || ''}" />
        </div>
        <div class="modal-field">
          <label>Assurance Tier 4 (€)</label>
          <input id="modal-edit-assurance4" type="number" min="0" step="0.01" value="${vehicule.assuranceTier4 || ''}" />
        </div>
        <div class="modal-field">
          <label>Date d'achat</label>
          <input id="modal-edit-date-achat" type="date" value="${dateAchat ? dateAchat.toISOString().split('T')[0] : ''}" />
        </div>
        <div class="modal-field">
          <label>Kilométrage</label>
          <input id="modal-edit-kilometrage" type="number" min="0" value="${vehicule.kilometrage || ''}" />
        </div>
        <div class="modal-field">
          <label>Notes</label>
          <textarea id="modal-edit-notes" rows="3">${vehicule.notes || ''}</textarea>
        </div>
      `;
      createModal({
        title: 'Modifier véhicule',
        body,
        confirmText: 'Enregistrer',
        onConfirm: async () => {
          const type = document.getElementById('modal-edit-type').value.trim();
          const modele = document.getElementById('modal-edit-modele').value.trim();
          const immatriculationInput = document.getElementById('modal-edit-immatriculation');
          const immatriculation = immatriculationInput ? immatriculationInput.value.trim() : '';
          const nombrePlaces = parseInt(document.getElementById('modal-edit-places').value);
          const prixAchat = parseFloat(document.getElementById('modal-edit-prix').value);
          const assuranceTier1 = parseFloat(document.getElementById('modal-edit-assurance1').value) || null;
          const assuranceTier2 = parseFloat(document.getElementById('modal-edit-assurance2').value) || null;
          const assuranceTier3 = parseFloat(document.getElementById('modal-edit-assurance3').value) || null;
          const assuranceTier4 = parseFloat(document.getElementById('modal-edit-assurance4').value) || null;
          const dateAchatStr = document.getElementById('modal-edit-date-achat').value || null;
          const kilometrage = parseInt(document.getElementById('modal-edit-kilometrage').value) || null;
          const notes = document.getElementById('modal-edit-notes').value.trim() || null;

          if (!type || !modele || !nombrePlaces || isNaN(prixAchat)) {
            alertModal({ 
              title: 'Champs requis', 
              message: 'Type, modèle, nombre de places et prix d\'achat sont requis.', 
              type: 'warning' 
            });
            return;
          }

          // Vérifier l'immatriculation uniquement si le véhicule a été acheté
          if (vehicule.achete && !immatriculation) {
            alertModal({ 
              title: 'Champs requis', 
              message: 'L\'immatriculation est requise pour un véhicule acheté.', 
              type: 'warning' 
            });
            return;
          }

          try {
            const data = {
              type,
              modele,
              nombrePlaces,
              prixAchat,
              updatedAt: serverTimestamp()
            };
            
            // Ajouter l'immatriculation seulement si elle est saisie (véhicule acheté)
            if (immatriculation) {
              data.immatriculation = immatriculation;
            }

            if (assuranceTier1 !== null) data.assuranceTier1 = assuranceTier1;
            else data.assuranceTier1 = null;
            if (assuranceTier2 !== null) data.assuranceTier2 = assuranceTier2;
            else data.assuranceTier2 = null;
            if (assuranceTier3 !== null) data.assuranceTier3 = assuranceTier3;
            else data.assuranceTier3 = null;
            if (assuranceTier4 !== null) data.assuranceTier4 = assuranceTier4;
            else data.assuranceTier4 = null;
            if (dateAchatStr) data.dateAchat = new Date(dateAchatStr);
            else data.dateAchat = null;
            if (kilometrage !== null) data.kilometrage = kilometrage;
            else data.kilometrage = null;
            if (notes) data.notes = notes;
            else data.notes = null;

            await updateDoc(doc(fb.db, 'flotte', vehiculeId), data);
            await addLogEntry(fb, { 
              type: 'action', 
              action: 'flotte_update', 
              category: 'flotte',
              message: `Modification du véhicule: ${type} ${modele} (${immatriculation})` 
            });
            await loadFlotte();
            if (currentView === 'card') {
              loadFlotteCards();
            }
            alertModal({ title: 'Succès', message: 'Véhicule modifié avec succès.', type: 'success' });
          } catch (e) { 
            alertModal({ title: 'Erreur', message: 'Erreur lors de la modification du véhicule.', type: 'danger' });
            console.error(e); 
          }
        }
      });
      return;
    }

    if (e.target.closest('.btn-acheter')) {
      let selectedTier = null;
      let assuranceMontant = 0;
      
      // Vérifier qu'au moins une assurance est renseignée
      const hasAssurance = vehicule.assuranceTier1 || vehicule.assuranceTier2 || vehicule.assuranceTier3 || vehicule.assuranceTier4;
      if (!hasAssurance) {
        alertModal({ 
          title: 'Assurance requise', 
          message: 'Veuillez d\'abord renseigner au moins une assurance dans les données du véhicule.', 
          type: 'warning' 
        });
        return;
      }
      
      const body = `
        <div class="mb-4">
          <p class="mb-3" style="font-size: 1.125rem;"><strong>${vehicule.type || ''} ${vehicule.modele || ''}</strong></p>
          <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl mb-4 border border-blue-200 dark:border-blue-800">
            <div class="flex justify-between items-center">
              <span style="font-weight: 500; color: rgb(100,116,139);">Prix véhicule:</span>
              <strong style="font-size: 1.25rem; color: #0055A4;">${formatAmount(vehicule.prixAchat || 0)} €</strong>
            </div>
          </div>
        </div>
        <div class="modal-field">
          <label>Immatriculation (plaque) *</label>
          <input id="modal-immatriculation-achat" type="text" required placeholder="Ex: AB-123-CD" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(2,6,23,0.1); border-radius: 0.375rem;" />
        </div>
        <div class="modal-field">
          <label style="font-weight: 600; margin-bottom: 0.75rem; display: block;">Sélectionner une assurance *</label>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 0.5rem;">
            ${vehicule.assuranceTier1 ? `
            <button type="button" id="btn-tier-1" class="tier-btn" style="padding: 1.25rem; border: 2px solid rgba(59,130,246,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(59,130,246,0.1); position: relative; overflow: hidden;">
              <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 1</div>
                  <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(59,130,246); opacity: 0.6;"></div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: rgb(37,99,235);">${formatAmount(vehicule.assuranceTier1)} €</div>
                <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
              </div>
            </button>
            ` : ''}
            ${vehicule.assuranceTier2 ? `
            <button type="button" id="btn-tier-2" class="tier-btn" style="padding: 1.25rem; border: 2px solid rgba(34,197,94,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(34,197,94,0.1); position: relative; overflow: hidden;">
              <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 2</div>
                  <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(34,197,94); opacity: 0.6;"></div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: rgb(22,163,74);">${formatAmount(vehicule.assuranceTier2)} €</div>
                <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
              </div>
            </button>
            ` : ''}
            ${vehicule.assuranceTier3 ? `
            <button type="button" id="btn-tier-3" class="tier-btn" style="padding: 1.25rem; border: 2px solid rgba(251,146,60,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(251,146,60,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(251,146,60,0.1); position: relative; overflow: hidden;">
              <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 3</div>
                  <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(251,146,60); opacity: 0.6;"></div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: rgb(234,88,12);">${formatAmount(vehicule.assuranceTier3)} €</div>
                <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
              </div>
            </button>
            ` : ''}
            ${vehicule.assuranceTier4 ? `
            <button type="button" id="btn-tier-4" class="tier-btn" style="padding: 1.25rem; border: 2px solid rgba(168,85,247,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(168,85,247,0.1); position: relative; overflow: hidden;">
              <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                  <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 4</div>
                  <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(168,85,247); opacity: 0.6;"></div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: rgb(147,51,234);">${formatAmount(vehicule.assuranceTier4)} €</div>
                <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
              </div>
            </button>
            ` : ''}
          </div>
          <div id="selected-tier-display" style="margin-top: 1.5rem; padding: 1.25rem; background: linear-gradient(135deg, rgba(0,85,164,0.1), rgba(0,85,164,0.05)); border: 2px solid rgba(0,85,164,0.2); border-radius: 0.75rem; display: none;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #0055A4;"></div>
              <div style="font-weight: 700; color: #0055A4; font-size: 1rem;">Assurance sélectionnée: <span id="selected-tier-name"></span></div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(0,85,164,0.2);">
              <div>
                <div style="font-size: 0.75rem; color: rgb(100,116,139); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Montant assurance</div>
                <div style="font-size: 1.125rem; font-weight: 600; color: rgb(15,23,42);"><span id="selected-tier-amount"></span> €</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: rgb(100,116,139); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Total à payer</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: #0055A4;"><span id="total-amount">0</span> €</div>
              </div>
            </div>
          </div>
        </div>
      `;

      createModal({
        title: 'Acheter véhicule',
        body,
        confirmText: 'Confirmer l\'achat',
        cancelText: 'Annuler',
        onConfirm: async () => {
          if (!selectedTier || assuranceMontant <= 0) {
            alertModal({ 
              title: 'Assurance requise', 
              message: 'Veuillez sélectionner une assurance.', 
              type: 'warning' 
            });
            return;
          }

          // Récupérer l'immatriculation saisie
          const immatriculationInput = document.getElementById('modal-immatriculation-achat');
          const immatriculation = immatriculationInput ? immatriculationInput.value.trim() : '';
          
          if (!immatriculation) {
            alertModal({ 
              title: 'Immatriculation requise', 
              message: 'Veuillez saisir l\'immatriculation (plaque) du véhicule.', 
              type: 'warning' 
            });
            return;
          }

          try {
            const montantTotal = (vehicule.prixAchat || 0) + assuranceMontant;
            const dateAchat = new Date();
            
            // Calculer la date d'expiration de l'assurance (30 jours à partir d'aujourd'hui)
            const dateExpirationAssurance = new Date();
            dateExpirationAssurance.setDate(dateExpirationAssurance.getDate() + 30);
            
            // Créer un nouveau document pour le véhicule acheté (permet d'acheter le même véhicule plusieurs fois)
            const vehiculeAcheteData = {
              type: vehicule.type,
              modele: vehicule.modele,
              immatriculation: immatriculation,
              nombrePlaces: vehicule.nombrePlaces,
              prixAchat: vehicule.prixAchat,
              assuranceTier1: vehicule.assuranceTier1 || null,
              assuranceTier2: vehicule.assuranceTier2 || null,
              assuranceTier3: vehicule.assuranceTier3 || null,
              assuranceTier4: vehicule.assuranceTier4 || null,
              kilometrage: vehicule.kilometrage || null,
              notes: vehicule.notes || null,
              achete: true,
              dateAchat: dateAchat,
              dateAchatFinanciere: serverTimestamp(),
              dateExpirationAssurance: dateExpirationAssurance,
              dateDernierPaiementAssurance: serverTimestamp(),
              vehiculeSourceId: vehiculeId, // Référence au véhicule source dans la liste A4L
              createdAt: serverTimestamp()
            };
            
            // Créer le nouveau document pour le véhicule acheté
            const nouveauVehiculeRef = await addDoc(collection(fb.db, 'flotte'), vehiculeAcheteData);
            
            // Créer la transaction financière (retrait)
            await addDoc(collection(fb.db, 'finance'), {
              type: 'depense',
              montant: montantTotal,
              description: `Achat véhicule: ${vehicule.type} ${vehicule.modele} (${immatriculation}) - Assurance ${selectedTier.toUpperCase()}`,
              category: 'flotte',
              vehiculeId: nouveauVehiculeRef.id,
              vehiculeSourceId: vehiculeId,
              date: serverTimestamp(),
              createdAt: serverTimestamp()
            });
            
            await addLogEntry(fb, { 
              type: 'action', 
              action: 'flotte_acheter', 
              category: 'flotte',
              message: `Achat d'un véhicule: ${vehicule.type} ${vehicule.modele} (${immatriculation}) - ${formatAmount(montantTotal)} €` 
            });
            
            await loadFlotte();
            if (currentView === 'card') {
              loadFlotteCards();
            }
            if (currentTab === 'flotte-ms-corp') {
              await loadFlotteAchetee();
            }
            alertModal({ title: 'Succès', message: `Véhicule acheté avec succès. Montant total: ${formatAmount(montantTotal)} €`, type: 'success' });
          } catch (e) { 
            alertModal({ title: 'Erreur', message: 'Erreur lors de l\'achat du véhicule.', type: 'danger' });
            console.error(e); 
          }
        }
      });
      
      // Gérer la sélection des tiers après création du modal
      setTimeout(() => {
        ['1', '2', '3', '4'].forEach(num => {
          const btn = document.getElementById(`btn-tier-${num}`);
          if (!btn) return; // Ignorer si le bouton n'existe pas (assurance non renseignée)
          
          const tierKey = `tier${num}`;
          const montant = vehicule[`assuranceTier${num}`] || 0;
          
          // Couleurs par défaut pour chaque tier
          const tierColors = {
            'tier1': { bg: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)', border: 'rgba(59,130,246,0.2)', shadow: 'rgba(59,130,246,0.1)', shadowSelected: 'rgba(59,130,246,0.3)' },
            'tier2': { bg: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)', border: 'rgba(34,197,94,0.2)', shadow: 'rgba(34,197,94,0.1)', shadowSelected: 'rgba(34,197,94,0.3)' },
            'tier3': { bg: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(251,146,60,0.05) 100%)', border: 'rgba(251,146,60,0.2)', shadow: 'rgba(251,146,60,0.1)', shadowSelected: 'rgba(251,146,60,0.3)' },
            'tier4': { bg: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.05) 100%)', border: 'rgba(168,85,247,0.2)', shadow: 'rgba(168,85,247,0.1)', shadowSelected: 'rgba(168,85,247,0.3)' }
          };
          
          const defaultColor = tierColors[tierKey];
          
          btn.addEventListener('click', () => {
            // Désélectionner les autres
            document.querySelectorAll('.tier-btn').forEach(b => {
              const btnTier = b.id.replace('btn-tier-', 'tier');
              const btnColor = tierColors[btnTier] || defaultColor;
              b.style.borderColor = btnColor.border;
              b.style.background = btnColor.bg;
              b.style.boxShadow = `0 1px 3px ${btnColor.shadow}`;
              b.style.transform = 'scale(1)';
            });
            
            // Sélectionner celui-ci
            btn.style.borderColor = '#0055A4';
            btn.style.borderWidth = '2px';
            btn.style.background = 'linear-gradient(135deg, rgba(0,85,164,0.15) 0%, rgba(0,85,164,0.1) 100%)';
            btn.style.boxShadow = `0 4px 12px ${defaultColor.shadowSelected}`;
            btn.style.transform = 'scale(1.02)';
            selectedTier = tierKey;
            assuranceMontant = montant;
            
            // Afficher la sélection
            const display = document.getElementById('selected-tier-display');
            const name = document.getElementById('selected-tier-name');
            const amount = document.getElementById('selected-tier-amount');
            const total = document.getElementById('total-amount');
            if (display && name && amount && total) {
              display.style.display = 'block';
              name.textContent = `Tier ${num}`;
              amount.textContent = formatAmount(montant);
              const montantTotal = (vehicule.prixAchat || 0) + montant;
              total.textContent = formatAmount(montantTotal);
            }
          });
          
          // Effet hover
          btn.addEventListener('mouseenter', () => {
            if (selectedTier !== tierKey) {
              btn.style.borderColor = '#0055A4';
              btn.style.boxShadow = `0 2px 6px ${defaultColor.shadowSelected}`;
            }
          });
          
          btn.addEventListener('mouseleave', () => {
            if (selectedTier !== tierKey) {
              btn.style.borderColor = defaultColor.border;
              btn.style.boxShadow = `0 1px 3px ${defaultColor.shadow}`;
            }
          });
        });
      }, 100);
      
      return;
    }

    if (e.target.closest('.btn-delete')) {
      createModal({
        title: 'Supprimer véhicule',
        body: `<p>Êtes-vous sûr de vouloir supprimer <strong>${vehicule.type || ''} ${vehicule.modele || ''}</strong> (${vehicule.immatriculation || ''}) ?</p><p class="text-sm text-slate-500 mt-2">Cette action est irréversible.</p>`,
        confirmText: 'Supprimer',
        onConfirm: async () => {
          try {
            await deleteDoc(doc(fb.db, 'flotte', vehiculeId));
            await addLogEntry(fb, { 
              type: 'action', 
              action: 'flotte_delete', 
              category: 'flotte',
              message: `Suppression du véhicule: ${vehicule.type} ${vehicule.modele} (${vehicule.immatriculation})` 
            });
            await loadFlotte();
            if (currentView === 'card') {
              loadFlotteCards();
            }
            alertModal({ title: 'Succès', message: 'Véhicule supprimé avec succès.', type: 'success' });
          } catch (e) { 
            alertModal({ title: 'Erreur', message: 'Erreur lors de la suppression du véhicule.', type: 'danger' });
            console.error(e); 
          }
        }
      });
    }
  });

  // Gestionnaire pour le bouton "Voir" dans Flotte MS Corp (avec historique)
  page.addEventListener('click', async (e) => {
    if (e.target.closest('.btn-view')) {
      const container = e.target.closest('.action-buttons');
      if (!container) return;
      const vehiculeId = container.getAttribute('data-vehicule-id');
      if (!vehiculeId) return;
      
      // Vérifier si c'est un véhicule acheté (dans Flotte MS Corp)
      const vehiculeAchete = flotteAcheteeCache.find(v => v.id === vehiculeId);
      if (!vehiculeAchete) {
        // Si pas trouvé dans flotteAcheteeCache, c'est probablement un véhicule de la liste A4L
        // Le gestionnaire existant s'en chargera
        return;
      }
      
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      try {
        // Récupérer le véhicule complet depuis Firestore
        const vehiculeDoc = await getDoc(doc(fb.db, 'flotte', vehiculeId));
        if (!vehiculeDoc.exists()) {
          alertModal({ 
            title: 'Erreur', 
            message: 'Véhicule introuvable.', 
            type: 'danger' 
          });
          return;
        }
        
        const vehicule = { id: vehiculeDoc.id, ...vehiculeDoc.data() };
        
        // Récupérer toutes les transactions financières liées à ce véhicule
        // On utilise seulement where('vehiculeId') sans orderBy pour éviter l'index composite
        // On filtre et trie en mémoire
        const transactionsSnap = await getDocs(
          query(
            collection(fb.db, 'finance'),
            where('vehiculeId', '==', vehiculeId)
          )
        );
        
        // Filtrer par category 'flotte' et trier par date en mémoire
        const transactions = transactionsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(t => t.category === 'flotte')
          .sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
            return dateB - dateA; // Tri décroissant (plus récent en premier)
          });
        
        // Séparer les transactions par type
        const achatInitial = transactions.find(t => t.description && t.description.includes('Achat véhicule'));
        const paiementsAssurance = transactions.filter(t => 
          t.description && (t.description.includes('Renouvellement assurance') || t.description.includes('assurance'))
        );
        const controlesTechniques = transactions.filter(t => 
          t.description && t.description.includes('Contrôle technique')
        );
        
        // Dates importantes
        const dateAchat = vehicule.dateAchat ? 
          (vehicule.dateAchat.toDate ? vehicule.dateAchat.toDate() : new Date(vehicule.dateAchat)) : 
          null;
        const dateExpirationAssurance = vehicule.dateExpirationAssurance ? 
          (vehicule.dateExpirationAssurance.toDate ? vehicule.dateExpirationAssurance.toDate() : new Date(vehicule.dateExpirationAssurance)) : 
          null;
        const dateDernierPaiementAssurance = vehicule.dateDernierPaiementAssurance ? 
          (vehicule.dateDernierPaiementAssurance.toDate ? vehicule.dateDernierPaiementAssurance.toDate() : new Date(vehicule.dateDernierPaiementAssurance)) : 
          null;
        const dateDernierControle = vehicule.dateDernierControleTechnique ? 
          (vehicule.dateDernierControleTechnique.toDate ? vehicule.dateDernierControleTechnique.toDate() : new Date(vehicule.dateDernierControleTechnique)) : 
          null;
        
        // Déterminer quel tier d'assurance est actuellement utilisé
        let assuranceActuelle = '—';
        if (vehicule.assuranceTier1) assuranceActuelle = `Tier 1: ${formatAmount(vehicule.assuranceTier1)} €`;
        else if (vehicule.assuranceTier2) assuranceActuelle = `Tier 2: ${formatAmount(vehicule.assuranceTier2)} €`;
        else if (vehicule.assuranceTier3) assuranceActuelle = `Tier 3: ${formatAmount(vehicule.assuranceTier3)} €`;
        else if (vehicule.assuranceTier4) assuranceActuelle = `Tier 4: ${formatAmount(vehicule.assuranceTier4)} €`;
        
        const body = `
          <div class="view-grid" style="grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 1rem;">
            <div class="view-section" style="grid-column: span 4; padding: 1rem 1.25rem; margin-bottom: 0; background: rgba(0,85,164,0.15); border: 2px solid rgba(0,85,164,0.4);">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #0055A4 0%, #003d7a 100%); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,85,164,0.3);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;">
                    <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"></path>
                    <polygon points="12 15 17 21 7 21 12 15"></polygon>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 1.5rem; font-weight: 800; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">${vehicule.type || '—'} ${vehicule.modele || '—'}</div>
                  <div style="font-size: 1rem; color: #e2e8f0; font-weight: 700; margin-top: 0.25rem;">${vehicule.immatriculation || '—'}</div>
                </div>
              </div>
            </div>
            
            <div class="view-section">
              <div class="view-section-title" style="font-size: 0.875rem; font-weight: 800; color: #e2e8f0; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(255,255,255,0.2);">Informations</div>
                <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Type</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${vehicule.type || '—'}</div>
              </div>
              <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Modèle</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${vehicule.modele || '—'}</div>
              </div>
              <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Places</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${formatNumber(vehicule.nombrePlaces || 0)}</div>
              </div>
              ${dateAchat ? `
              <div class="view-item" style="margin-bottom: 0;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Date d'achat</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${dateAchat.toLocaleDateString('fr-FR')}</div>
              </div>
              ` : ''}
            </div>
            
            <div class="view-section">
              <div class="view-section-title" style="font-size: 0.875rem; font-weight: 800; color: #e2e8f0; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(255,255,255,0.2);">Prix & Kilométrage</div>
              <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Prix d'achat</div>
                <div class="view-item-value" style="font-size: 1.375rem; color: #60a5fa; font-weight: 900;">${formatAmount(vehicule.prixAchat || 0)} €</div>
              </div>
              ${vehicule.kilometrage !== null ? `
              <div class="view-item" style="margin-bottom: 0;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Kilométrage</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${formatNumber(vehicule.kilometrage)} km</div>
              </div>
              ` : ''}
            </div>
            
            <div class="view-section">
              <div class="view-section-title" style="font-size: 0.875rem; font-weight: 800; color: #e2e8f0; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(255,255,255,0.2);">Assurance</div>
              <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Assurance actuelle</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #34d399; font-weight: 800;">${assuranceActuelle}</div>
              </div>
              ${dateExpirationAssurance ? `
              <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Expiration</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: ${dateExpirationAssurance < new Date() ? '#f87171' : '#34d399'}; font-weight: 800;">${dateExpirationAssurance.toLocaleDateString('fr-FR')}</div>
              </div>
              ${(() => {
                const maintenant = new Date();
                maintenant.setHours(0, 0, 0, 0);
                const expiration = new Date(dateExpirationAssurance);
                expiration.setHours(0, 0, 0, 0);
                const diffTime = expiration - maintenant;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                  return `<div class="view-item" style="margin-bottom: 0;">
                    <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Renouvellement</div>
                    <div class="view-item-value" style="font-size: 1.125rem; color: #f87171; font-weight: 800;">Expirée depuis ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}</div>
                  </div>`;
                } else if (diffDays === 0) {
                  return `<div class="view-item" style="margin-bottom: 0;">
                    <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Renouvellement</div>
                    <div class="view-item-value" style="font-size: 1.125rem; color: #fbbf24; font-weight: 800;">Aujourd'hui</div>
                  </div>`;
                } else {
                  return `<div class="view-item" style="margin-bottom: 0;">
                    <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Renouvellement dans</div>
                    <div class="view-item-value" style="font-size: 1.125rem; color: ${diffDays <= 7 ? '#fbbf24' : '#34d399'}; font-weight: 800;">${diffDays} jour${diffDays > 1 ? 's' : ''}</div>
                  </div>`;
                }
              })()}
              ` : ''}
              ${dateDernierPaiementAssurance ? `
              <div class="view-item" style="margin-bottom: 0;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Dernier paiement</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${dateDernierPaiementAssurance.toLocaleDateString('fr-FR')}</div>
              </div>
              ` : ''}
            </div>
            
            ${dateDernierControle ? `
            <div class="view-section">
              <div class="view-section-title" style="font-size: 0.875rem; font-weight: 800; color: #e2e8f0; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(255,255,255,0.2);">Contrôle technique</div>
              <div class="view-item" style="margin-bottom: 0.75rem;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Dernier contrôle</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #ffffff; font-weight: 800;">${dateDernierControle.toLocaleDateString('fr-FR')}</div>
              </div>
              ${vehicule.prixDernierControleTechnique ? `
              <div class="view-item" style="margin-bottom: 0;">
                <div class="view-item-label" style="font-size: 0.8125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.375rem;">Prix</div>
                <div class="view-item-value" style="font-size: 1.125rem; color: #fbbf24; font-weight: 900;">${formatAmount(vehicule.prixDernierControleTechnique)} €</div>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
          
          ${transactions.length > 0 ? `
          <div style="padding: 1rem; border-top: 2px solid rgba(255,255,255,0.2); margin-top: 1rem; padding-top: 1.25rem;">
            <div style="font-size: 1.25rem; font-weight: 900; margin-bottom: 1rem; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em;">Historique des paiements</div>
            
            ${achatInitial ? `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(0,85,164,0.2); border-radius: 0.5rem; border: 2px solid rgba(0,85,164,0.4);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 800; font-size: 1rem; color: #ffffff; margin-bottom: 0.375rem;">${achatInitial.description || 'Achat véhicule'}</div>
                  <div style="font-size: 0.875rem; color: #cbd5e1; font-weight: 700;">${achatInitial.date?.toDate ? achatInitial.date.toDate().toLocaleDateString('fr-FR') : '—'}</div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 900; color: #f87171;">-${formatAmount(achatInitial.montant || 0)} €</div>
              </div>
            </div>
            ` : ''}
            
            ${paiementsAssurance.length > 0 ? `
            <div style="margin-bottom: 1rem;">
              <div style="font-weight: 800; font-size: 0.875rem; color: #e2e8f0; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Assurance (${paiementsAssurance.length})</div>
              <div style="display: flex; flex-direction: column; gap: 0.625rem; max-height: 200px; overflow-y: auto;">
                ${paiementsAssurance.map(t => {
                  const date = t.date?.toDate ? t.date.toDate() : new Date(t.date || new Date());
                  return `
                    <div style="padding: 0.875rem; background: rgba(16,185,129,0.15); border-radius: 0.5rem; border: 2px solid rgba(16,185,129,0.3);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 700; font-size: 0.9375rem; color: #ffffff; margin-bottom: 0.25rem;">${t.description || 'Renouvellement assurance'}</div>
                          <div style="font-size: 0.8125rem; color: #cbd5e1; font-weight: 700;">${date.toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div style="font-size: 1.125rem; font-weight: 900; color: #f87171;">-${formatAmount(t.montant || 0)} €</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            ` : ''}
            
            ${controlesTechniques.length > 0 ? `
            <div style="margin-bottom: 1rem;">
              <div style="font-weight: 800; font-size: 0.875rem; color: #e2e8f0; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;">Contrôles techniques (${controlesTechniques.length})</div>
              <div style="display: flex; flex-direction: column; gap: 0.625rem; max-height: 200px; overflow-y: auto;">
                ${controlesTechniques.map(t => {
                  const date = t.date?.toDate ? t.date.toDate() : new Date(t.date || new Date());
                  return `
                    <div style="padding: 0.875rem; background: rgba(245,158,11,0.15); border-radius: 0.5rem; border: 2px solid rgba(245,158,11,0.3);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 700; font-size: 0.9375rem; color: #ffffff; margin-bottom: 0.25rem;">${t.description || 'Contrôle technique'}</div>
                          <div style="font-size: 0.8125rem; color: #cbd5e1; font-weight: 700;">${date.toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div style="font-size: 1.125rem; font-weight: 900; color: #f87171;">-${formatAmount(t.montant || 0)} €</div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}
        `;
        
        createModal({ 
          title: 'Détails véhicule - Flotte MS Corp', 
          body, 
          confirmText: 'Fermer',
          isView: true, 
          onConfirm: () => {}
        });
      } catch (e) {
        alertModal({ title: 'Erreur', message: 'Erreur lors de la récupération des détails du véhicule.', type: 'danger' });
        console.error(e);
      }
      return;
    }
  });

  // Gestionnaire pour le bouton "Repayer assurance" dans Flotte MS Corp
  page.addEventListener('click', async (e) => {
    if (e.target.closest('.btn-repayer-assurance')) {
      const container = e.target.closest('.action-buttons');
      if (!container) return;
      const vehiculeId = container.getAttribute('data-vehicule-id');
      
      if (!vehiculeId) {
        alertModal({ 
          title: 'Erreur', 
          message: 'Impossible d\'identifier le véhicule.', 
          type: 'warning' 
        });
        return;
      }

      // Récupérer le véhicule depuis la collection
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Variables pour la sélection (déclarées dans le scope du gestionnaire)
      let selectedTier = null;
      let assuranceMontant = 0;
      
      try {
        const vehiculeDoc = await getDoc(doc(fb.db, 'flotte', vehiculeId));
        if (!vehiculeDoc.exists()) {
          alertModal({ 
            title: 'Erreur', 
            message: 'Véhicule introuvable.', 
            type: 'danger' 
          });
          return;
        }
        
        const vehicule = { id: vehiculeDoc.id, ...vehiculeDoc.data() };
        
        // Vérifier qu'au moins une assurance est renseignée
        const hasAssurance = vehicule.assuranceTier1 || vehicule.assuranceTier2 || vehicule.assuranceTier3 || vehicule.assuranceTier4;
        if (!hasAssurance) {
          alertModal({ 
            title: 'Erreur', 
            message: 'Aucune assurance renseignée pour ce véhicule.', 
            type: 'warning' 
          });
          return;
        }
        
        const dateExpirationActuelle = vehicule.dateExpirationAssurance ? 
          (vehicule.dateExpirationAssurance.toDate ? vehicule.dateExpirationAssurance.toDate() : new Date(vehicule.dateExpirationAssurance)) : 
          null;
        
        // Calculer la nouvelle date d'expiration (30 jours à partir d'aujourd'hui lors du paiement manuel)
        const datePaiementManuel = new Date();
        const nouvelleDateExpirationManuelle = new Date(datePaiementManuel);
        nouvelleDateExpirationManuelle.setDate(nouvelleDateExpirationManuelle.getDate() + 30);
        
        const body = `
          <div class="mb-4">
            <p class="mb-3" style="font-size: 1.125rem;"><strong>${vehicule.type || ''} ${vehicule.modele || ''}</strong></p>
            <p class="mb-4" style="color: rgb(100,116,139); font-size: 0.875rem;">${vehicule.immatriculation || ''}</p>
            ${dateExpirationActuelle ? `
            <div class="p-3 bg-slate-50 dark:bg-white/5 rounded-lg mb-4">
              <div style="font-size: 0.875rem; color: rgb(100,116,139); margin-bottom: 0.25rem;">Date d'expiration actuelle:</div>
              <div style="font-weight: 600; color: rgb(15,23,42);" class="dark:text-white">${dateExpirationActuelle.toLocaleDateString('fr-FR')}</div>
            </div>
            ` : ''}
          </div>
          <div class="modal-field">
            <label style="font-weight: 600; margin-bottom: 0.75rem; display: block;">Sélectionner une assurance *</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 0.5rem;">
              ${vehicule.assuranceTier1 ? `
              <button type="button" id="btn-tier-1-renew" class="tier-btn-renew" style="padding: 1.25rem; border: 2px solid rgba(59,130,246,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(59,130,246,0.1); position: relative; overflow: hidden;">
                <div style="position: relative; z-index: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 1</div>
                    <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(59,130,246); opacity: 0.6;"></div>
                  </div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: rgb(37,99,235);">${formatAmount(vehicule.assuranceTier1)} €</div>
                  <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
                </div>
              </button>
              ` : ''}
              ${vehicule.assuranceTier2 ? `
              <button type="button" id="btn-tier-2-renew" class="tier-btn-renew" style="padding: 1.25rem; border: 2px solid rgba(34,197,94,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(34,197,94,0.1); position: relative; overflow: hidden;">
                <div style="position: relative; z-index: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 2</div>
                    <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(34,197,94); opacity: 0.6;"></div>
                  </div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: rgb(22,163,74);">${formatAmount(vehicule.assuranceTier2)} €</div>
                  <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
                </div>
              </button>
              ` : ''}
              ${vehicule.assuranceTier3 ? `
              <button type="button" id="btn-tier-3-renew" class="tier-btn-renew" style="padding: 1.25rem; border: 2px solid rgba(251,146,60,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(251,146,60,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(251,146,60,0.1); position: relative; overflow: hidden;">
                <div style="position: relative; z-index: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 3</div>
                    <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(251,146,60); opacity: 0.6;"></div>
                  </div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: rgb(234,88,12);">${formatAmount(vehicule.assuranceTier3)} €</div>
                  <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
                </div>
              </button>
              ` : ''}
              ${vehicule.assuranceTier4 ? `
              <button type="button" id="btn-tier-4-renew" class="tier-btn-renew" style="padding: 1.25rem; border: 2px solid rgba(168,85,247,0.2); border-radius: 0.75rem; background: linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.05) 100%); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(168,85,247,0.1); position: relative; overflow: hidden;">
                <div style="position: relative; z-index: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div style="font-weight: 700; font-size: 1rem; color: rgb(15,23,42);">Tier 4</div>
                    <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: rgb(168,85,247); opacity: 0.6;"></div>
                  </div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: rgb(147,51,234);">${formatAmount(vehicule.assuranceTier4)} €</div>
                  <div style="font-size: 0.75rem; color: rgb(100,116,139); margin-top: 0.25rem;">Par 30 jours</div>
                </div>
              </button>
              ` : ''}
            </div>
            <div id="selected-tier-display-renew" style="margin-top: 1.5rem; padding: 1.25rem; background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05)); border: 2px solid rgba(16,185,129,0.2); border-radius: 0.75rem; display: none;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                <div style="width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #10b981;"></div>
                <div style="font-weight: 700; color: #10b981; font-size: 1rem;">Assurance sélectionnée: <span id="selected-tier-name-renew"></span></div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(16,185,129,0.2);">
                <div>
                  <div style="font-size: 0.75rem; color: rgb(100,116,139); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Montant assurance</div>
                  <div style="font-size: 1.125rem; font-weight: 600; color: rgb(15,23,42);"><span id="selected-tier-amount-renew"></span> €</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: rgb(100,116,139); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Nouvelle expiration</div>
                  <div style="font-size: 1.125rem; font-weight: 700; color: #10b981;"><span id="new-expiration-date-renew">${nouvelleDateExpirationManuelle.toLocaleDateString('fr-FR')}</span></div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        createModal({
          title: 'Repayer assurance',
          body,
          confirmText: 'Confirmer le paiement',
          cancelText: 'Annuler',
          onConfirm: async () => {
            if (!selectedTier || assuranceMontant <= 0) {
              alertModal({ 
                title: 'Assurance requise', 
                message: 'Veuillez sélectionner une assurance.', 
                type: 'warning' 
              });
              return;
            }

            try {
              // Mettre à jour la date d'expiration de l'assurance (30 jours à partir du paiement manuel)
              const datePaiementManuelConfirm = new Date();
              const nouvelleDateExpirationManuelleConfirm = new Date(datePaiementManuelConfirm);
              nouvelleDateExpirationManuelleConfirm.setDate(nouvelleDateExpirationManuelleConfirm.getDate() + 30);
              
              await updateDoc(doc(fb.db, 'flotte', vehiculeId), {
                dateExpirationAssurance: nouvelleDateExpirationManuelleConfirm,
                dateDernierPaiementAssurance: serverTimestamp()
              });
              
              // Créer la transaction financière (retrait)
              await addDoc(collection(fb.db, 'finance'), {
                type: 'depense',
                montant: assuranceMontant,
                description: `Renouvellement assurance: ${vehicule.type} ${vehicule.modele} (${vehicule.immatriculation}) - ${selectedTier.toUpperCase()}`,
                category: 'flotte',
                vehiculeId: vehiculeId,
                date: serverTimestamp(),
                createdAt: serverTimestamp()
              });
              
              await addLogEntry(fb, { 
                type: 'action', 
                action: 'flotte_repayer_assurance', 
                category: 'flotte',
                message: `Renouvellement assurance pour ${vehicule.type} ${vehicule.modele} (${vehicule.immatriculation}) - ${selectedTier.toUpperCase()} - ${formatAmount(assuranceMontant)} €` 
              });
              
              // Recharger la flotte MS Corp
              if (currentTab === 'flotte-ms-corp') {
                await loadFlotteAchetee();
              }
              
              alertModal({ 
                title: 'Succès', 
                message: `Assurance renouvelée avec succès. Nouvelle date d'expiration: ${nouvelleDateExpirationManuelleConfirm.toLocaleDateString('fr-FR')}`, 
                type: 'success' 
              });
            } catch (e) { 
              alertModal({ title: 'Erreur', message: 'Erreur lors du renouvellement de l\'assurance.', type: 'danger' });
              console.error(e); 
            }
          }
        });
        
        // Gestionnaire pour la sélection des tiers d'assurance
        setTimeout(() => {
          const tierColors = {
            'tier1': { bg: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)', border: 'rgba(59,130,246,0.2)', shadow: 'rgba(59,130,246,0.1)', shadowSelected: 'rgba(59,130,246,0.3)' },
            'tier2': { bg: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)', border: 'rgba(34,197,94,0.2)', shadow: 'rgba(34,197,94,0.1)', shadowSelected: 'rgba(34,197,94,0.3)' },
            'tier3': { bg: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(251,146,60,0.05) 100%)', border: 'rgba(251,146,60,0.2)', shadow: 'rgba(251,146,60,0.1)', shadowSelected: 'rgba(251,146,60,0.3)' },
            'tier4': { bg: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.05) 100%)', border: 'rgba(168,85,247,0.2)', shadow: 'rgba(168,85,247,0.1)', shadowSelected: 'rgba(168,85,247,0.3)' }
          };
          
          [1, 2, 3, 4].forEach(num => {
            const btn = document.getElementById(`btn-tier-${num}-renew`);
            if (!btn) return;
            
            const tierKey = `tier${num}`;
            const montant = vehicule[`assuranceTier${num}`] || 0;
            const defaultColor = tierColors[tierKey];
            
            btn.addEventListener('click', () => {
              // Désélectionner les autres
              document.querySelectorAll('.tier-btn-renew').forEach(b => {
                const btnTier = b.id.replace('btn-tier-', 'tier').replace('-renew', '');
                const btnColor = tierColors[btnTier] || defaultColor;
                b.style.borderColor = btnColor.border;
                b.style.background = btnColor.bg;
                b.style.boxShadow = `0 1px 3px ${btnColor.shadow}`;
                b.style.transform = 'scale(1)';
              });
              
              // Sélectionner celui-ci
              btn.style.borderColor = '#10b981';
              btn.style.borderWidth = '2px';
              btn.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.1) 100%)';
              btn.style.boxShadow = `0 4px 12px ${defaultColor.shadowSelected}`;
              btn.style.transform = 'scale(1.02)';
              selectedTier = tierKey;
              assuranceMontant = montant;
              
              // Afficher la sélection
              const display = document.getElementById('selected-tier-display-renew');
              const name = document.getElementById('selected-tier-name-renew');
              const amount = document.getElementById('selected-tier-amount-renew');
              if (display && name && amount) {
                display.style.display = 'block';
                name.textContent = `Tier ${num}`;
                amount.textContent = formatAmount(montant);
              }
            });
            
            // Effet hover
            btn.addEventListener('mouseenter', () => {
              if (selectedTier !== tierKey) {
                btn.style.borderColor = '#10b981';
                btn.style.boxShadow = `0 2px 6px ${defaultColor.shadowSelected}`;
              }
            });
            
            btn.addEventListener('mouseleave', () => {
              if (selectedTier !== tierKey) {
                btn.style.borderColor = defaultColor.border;
                btn.style.boxShadow = `0 1px 3px ${defaultColor.shadow}`;
              }
            });
          });
        }, 100);
      } catch (e) {
        alertModal({ title: 'Erreur', message: 'Erreur lors de la récupération du véhicule.', type: 'danger' });
        console.error(e);
      }
    }
  });

  // Gestionnaire pour le bouton "Contrôle technique" dans Flotte MS Corp
  page.addEventListener('click', async (e) => {
    if (e.target.closest('.btn-controle-technique')) {
      const container = e.target.closest('.action-buttons');
      if (!container) return;
      const vehiculeId = container.getAttribute('data-vehicule-id');
      
      if (!vehiculeId) {
        alertModal({ 
          title: 'Erreur', 
          message: 'Impossible d\'identifier le véhicule.', 
          type: 'warning' 
        });
        return;
      }

      // Récupérer le véhicule depuis la collection
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      try {
        const vehiculeDoc = await getDoc(doc(fb.db, 'flotte', vehiculeId));
        if (!vehiculeDoc.exists()) {
          alertModal({ 
            title: 'Erreur', 
            message: 'Véhicule introuvable.', 
            type: 'danger' 
          });
          return;
        }
        
        const vehicule = { id: vehiculeDoc.id, ...vehiculeDoc.data() };
        
        // Récupérer la date du dernier contrôle technique si elle existe
        const dernierControle = vehicule.dateDernierControleTechnique ? 
          (vehicule.dateDernierControleTechnique.toDate ? vehicule.dateDernierControleTechnique.toDate() : new Date(vehicule.dateDernierControleTechnique)) : 
          null;
        
        const body = `
          <div class="mb-4">
            <p class="mb-3" style="font-size: 1.125rem;"><strong>${vehicule.type || ''} ${vehicule.modele || ''}</strong></p>
            <p class="mb-4" style="color: rgb(100,116,139); font-size: 0.875rem;">${vehicule.immatriculation || ''}</p>
            ${dernierControle ? `
            <div class="p-3 bg-slate-50 dark:bg-white/5 rounded-lg mb-4">
              <div style="font-size: 0.875rem; color: rgb(100,116,139); margin-bottom: 0.25rem;">Dernier contrôle technique:</div>
              <div style="font-weight: 600; color: rgb(15,23,42);" class="dark:text-white">${dernierControle.toLocaleDateString('fr-FR')}</div>
            </div>
            ` : ''}
          </div>
          <div class="modal-field">
            <label>Date du contrôle technique *</label>
            <input id="modal-controle-date" type="date" required value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="modal-field">
            <label>Prix (€) *</label>
            <input id="modal-controle-prix" type="number" min="0" step="0.01" required placeholder="Ex: 120.00" />
          </div>
        `;
        
        createModal({
          title: 'Payer contrôle technique',
          body,
          confirmText: 'Confirmer le paiement',
          cancelText: 'Annuler',
          onConfirm: async () => {
            const dateControleStr = document.getElementById('modal-controle-date').value;
            const prixControle = parseFloat(document.getElementById('modal-controle-prix').value);
            
            if (!dateControleStr || isNaN(prixControle) || prixControle <= 0) {
              alertModal({ 
                title: 'Champs requis', 
                message: 'Veuillez saisir une date valide et un prix supérieur à 0.', 
                type: 'warning' 
              });
              return;
            }

            try {
              const dateControle = new Date(dateControleStr);
              
              // Mettre à jour la date du dernier contrôle technique
              await updateDoc(doc(fb.db, 'flotte', vehiculeId), {
                dateDernierControleTechnique: dateControle,
                prixDernierControleTechnique: prixControle
              });
              
              // Créer la transaction financière (retrait)
              await addDoc(collection(fb.db, 'finance'), {
                type: 'depense',
                montant: prixControle,
                description: `Contrôle technique: ${vehicule.type} ${vehicule.modele} (${vehicule.immatriculation})`,
                category: 'flotte',
                vehiculeId: vehiculeId,
                date: serverTimestamp(),
                createdAt: serverTimestamp()
              });
              
              await addLogEntry(fb, { 
                type: 'action', 
                action: 'flotte_controle_technique', 
                category: 'flotte',
                message: `Paiement contrôle technique pour ${vehicule.type} ${vehicule.modele} (${vehicule.immatriculation}) - ${formatAmount(prixControle)} €` 
              });
              
              // Recharger la flotte MS Corp
              if (currentTab === 'flotte-ms-corp') {
                await loadFlotteAchetee();
              }
              
              alertModal({ 
                title: 'Succès', 
                message: `Contrôle technique enregistré avec succès. Date: ${dateControle.toLocaleDateString('fr-FR')}`, 
                type: 'success' 
              });
            } catch (e) { 
              alertModal({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement du contrôle technique.', type: 'danger' });
              console.error(e); 
            }
          }
        });
      } catch (e) {
        alertModal({ title: 'Erreur', message: 'Erreur lors de la récupération du véhicule.', type: 'danger' });
        console.error(e);
      }
    }
  });
}

