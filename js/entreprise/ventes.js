import { html, mount, createModal, getCachedProfile, loadUserProfile, updateNavPermissions, confirmModal, alertModal, updateAvatar, isAuthenticated } from '../utils.js';
import { getFirebase, waitForFirebase, collection, getDocs, query, orderBy, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, setDoc, getDoc, writeBatch, signOut, onSnapshot } from '../firebase.js';
import { addLogEntry } from '../firebase.js';
import { formatDate } from '../utils.js';

let ventesRealtimeUnsub = null;

export function viewVentes(root) {
  if (!isAuthenticated()) {
    localStorage.removeItem('ms_auth_state');
    location.hash = '#/auth';
    return;
  }

  if (ventesRealtimeUnsub) {
    try { ventesRealtimeUnsub(); } catch (err) { console.warn('Erreur lors de la fermeture du listener ventes:', err); }
    ventesRealtimeUnsub = null;
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
            <a href="#/entreprise/ventes" class="active nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
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
              <div class="page-title">Gestion Vente</div>
              <div class="page-sub">Gérez les ventes, le stockage et les ressources</div>
            </div>
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
                <div id="stat-total-ventes" class="stat-value">0</div>
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
                <div id="stat-en-attente" class="stat-value">0</div>
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
                <div id="stat-validees" class="stat-value">0</div>
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
                <div id="stat-traitees" class="stat-value">0</div>
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
                <div class="stat-label">Chiffre d'affaires</div>
                <div id="stat-ca" class="stat-value">0 €</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <div class="stat-label">Bénéfices totaux</div>
                <div id="stat-benefices" class="stat-value">0 €</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <div>
                <div class="stat-label">Stock disponible</div>
                <div id="stat-stock-dispo" class="stat-value">0</div>
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
                <div id="stat-annulees" class="stat-value">0</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs-container">
            <div class="tabs-list">
              <button class="tab-item active" data-tab="ventes">Gestion Ventes</button>
              <button class="tab-item" data-tab="ventes-employe">Gestion Ventes Employé</button>
              <button class="tab-item" data-tab="traitement">Traitement</button>
              <button class="tab-item" data-tab="stockage">Gestion Stockage</button>
              <button class="tab-item" data-tab="ressources">Gestion Ressources</button>
            </div>
          </div>

          <!-- Tab 1: Gestion Ventes -->
          <div id="tab-ventes" class="tab-content active">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-lg">Liste complète des ventes</h3>
              <button id="btn-new-vente" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle vente
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type ressource</th>
                    <th>Quantité</th>
                    <th>Employé</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="ventes-tbody">
                  <tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab 2: Gestion Ventes Employé -->
          <div id="tab-ventes-employe" class="tab-content">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 class="font-medium text-lg">Ventes par employé</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Sélectionnez un employé pour visualiser ses performances par ressource.</p>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <select id="select-employe" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 text-sm min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500"></select>
                <button id="btn-refresh-ventes-emp" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                  <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"></path></svg></span> Actualiser
                </button>
              </div>
            </div>
            <div id="ventes-emp-summary" class="hidden mb-4 grid gap-3 lg:grid-cols-4">
              <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Ventes totales</div>
                <div id="ventes-emp-total" class="text-2xl font-semibold mt-1">0</div>
              </div>
              <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Quantité totale</div>
                <div id="ventes-emp-quantite" class="text-2xl font-semibold mt-1">0</div>
              </div>
              <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Chiffre d'affaires</div>
                <div id="ventes-emp-ca" class="text-2xl font-semibold mt-1">0 €</div>
              </div>
              <div class="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Dernière vente</div>
                <div id="ventes-emp-last" class="text-2xl font-semibold mt-1 text-blue-600 dark:text-blue-400">—</div>
              </div>
            </div>
            <div id="ventes-emp-empty" class="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
              Sélectionnez un employé pour afficher ses cartes de ventes.
            </div>
            <div id="ventes-emp-cards" class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"></div>
          </div>

          <!-- Tab 3: Traitement -->
          <div id="tab-traitement" class="tab-content">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-lg">Ventes en traitement</h3>
              <button id="btn-refresh-traitement" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"></path></svg></span> Actualiser
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type ressource</th>
                    <th>Quantité</th>
                    <th>Employé</th>
                    <th>Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="traitement-tbody">
                  <tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab 3: Gestion Stockage -->
          <div id="tab-stockage" class="tab-content">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-lg">État du stockage</h3>
              <button id="btn-refresh-stock" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"></path></svg></span> Actualiser
              </button>
            </div>
            
            <!-- Carte Stock Global -->
            <div class="mb-6 p-6 rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Stock disponible</div>
                  <div id="stock-dispo-display" class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">0</div>
                  <div class="text-xs text-slate-500 dark:text-slate-500">Sur un stock maximum de <span id="stock-max-display" class="font-semibold">10 000</span></div>
                </div>
                <div class="flex items-center gap-4">
                  <div>
                    <label class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Modifier stock max</label>
                    <div class="flex items-center gap-2">
                      <input type="number" id="stock-max-global" min="0" class="w-32 px-3 py-2 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium" />
                      <button class="btn-primary btn-save-stock flex items-center gap-2 px-4 py-2">
                        <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="stockage-empty" class="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg">Chargement…</div>
            <div id="stockage-cards" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"></div>
          </div>

          <!-- Tab 3: Gestion Ressources -->
          <div id="tab-ressources" class="tab-content">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-lg">Types de ressources</h3>
            <button id="btn-new-ressource" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle ressource
              </button>
            </div>
            <div class="user-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prix de vente entreprise</th>
                    <th>Prix en bourse</th>
                    <th>Taille objet</th>
                    <th>Légalité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="ressources-tbody">
                  <tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>
                </tbody>
              </table>
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

  let currentTab = 'ventes';
  let ventesCache = [];
  let ventesLoading = true;
  let ressourcesCache = [];
  let usersCache = [];
  const ventesHistoryCache = new Map();

  // Formattage des statuts (majuscule/minuscule correctes)
  function formatStatus(raw) {
    const s = (raw || '').toLowerCase();
    if (s === 'en attente') return 'En attente';
    if (s === 'valide') return 'Validé';
    if (s === 'annule') return 'Annulé';
    if (s === 'traite') return 'Traité';
    return raw || '—';
  }

  // Tab switching
  const card = document.querySelector('.page-card');
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      currentTab = tabId;
      loadStats(); // Mettre à jour les stats à chaque changement d'onglet
      if (tabId === 'ventes') loadVentes();
      else if (tabId === 'ventes-employe') {
        // S'assurer que les users sont chargés avant de remplir le select
        if (!usersCache || usersCache.length === 0) {
          (async () => {
            const fb = getFirebase();
            if (fb && fb.db) {
              const usersSnap = await getDocs(collection(fb.db, 'users'));
              usersCache = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              loadVentesEmploye();
            }
          })();
        } else {
          loadVentesEmploye();
        }
      }
      else if (tabId === 'traitement') loadTraitement();
      else if (tabId === 'stockage') loadStockage();
      else if (tabId === 'ressources') loadRessources();
    });
  });

  // Load all data
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
      const rb = document.getElementById('sb-role'); if (rb) { rb.textContent = (p.role === 'admin' ? 'Admin' : 'Employé'); rb.className = 'badge-role ' + (p.role === 'admin' ? 'badge-admin' : 'badge-employe') + ' mt-2 inline-block text-xs'; }

      // Mettre à jour la navigation selon les permissions
      await updateNavPermissions();

      // Load ressources
      const resSnap = await getDocs(collection(fb.db, 'ressources'));
      ressourcesCache = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Load users (employés)
      const usersSnap = await getDocs(collection(fb.db, 'users'));
      usersCache = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      loadStats();
      loadVentes();
      startVentesListener();
    } catch (e) { console.error(e); }
  })();

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

  async function loadStats() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      // Charger toutes les ventes
      const allVentesSnap = await getDocs(collection(fb.db, 'ventes'));
      const allVentes = allVentesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Calculer les statistiques par statut
      const totalVentes = allVentes.length;
      const enAttente = allVentes.filter(v => (v.statut || 'en attente') === 'en attente').length;
      const validees = allVentes.filter(v => v.statut === 'valide').length;
      const traitees = allVentes.filter(v => v.statut === 'traite').length;
      const annulees = allVentes.filter(v => v.statut === 'annule').length;

      // Calculer le chiffre d'affaires (somme des ventes validées et traitées)
      let caTotal = 0;
      allVentes.forEach(v => {
        if (v.statut === 'valide' || v.statut === 'traite') {
          const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId);
          if (ressource) {
            const prixVente = ressource.prixVente || ressource.prix || 0;
            caTotal += prixVente * (v.quantite || 0);
          }
        }
      });

      // Calculer les bénéfices totaux (somme des bénéfices des ventes traitées)
      let beneficesTotal = 0;
      allVentes.forEach(v => {
        if (v.statut === 'traite') {
          const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId);
          if (ressource) {
            const prixBourse = ressource.prixBourse || 0;
            beneficesTotal += prixBourse * (v.quantite || 0);
          }
        }
      });

      // Calculer le stock disponible (en tenant compte de la taille des objets)
      let stockDispo = 0;
      try {
        const stockMaxDoc = await getDoc(doc(fb.db, 'config', 'stockMax'));
        const stockMax = stockMaxDoc?.exists() ? (stockMaxDoc.data().valeur || 10000) : 10000;
        const ventesNonTraitees = allVentes.filter(v => {
          const statut = v.statut || 'en attente';
          return statut === 'en attente' || statut === 'valide';
        });
        // Calculer la place totale occupée : somme(tailleObjet * quantite) pour chaque vente non traitée
        const placeTotaleOccupee = ventesNonTraitees.reduce((sum, v) => {
          const tailleObjet = v.tailleObjet || 1; // Par défaut 1 si non défini
          const quantite = v.quantite || 0;
          return sum + (tailleObjet * quantite);
        }, 0);
        stockDispo = Math.max(0, stockMax - placeTotaleOccupee);
      } catch (e) {}

      // Mettre à jour l'affichage
      const elTotal = document.getElementById('stat-total-ventes');
      if (elTotal) elTotal.textContent = formatNumber(totalVentes);
      const elAttente = document.getElementById('stat-en-attente');
      if (elAttente) elAttente.textContent = formatNumber(enAttente);
      const elValidees = document.getElementById('stat-validees');
      if (elValidees) elValidees.textContent = formatNumber(validees);
      const elTraitees = document.getElementById('stat-traitees');
      if (elTraitees) elTraitees.textContent = formatNumber(traitees);
      const elAnnulees = document.getElementById('stat-annulees');
      if (elAnnulees) elAnnulees.textContent = formatNumber(annulees);
      const elCA = document.getElementById('stat-ca');
      if (elCA) elCA.textContent = formatAmount(caTotal) + ' €';
      const elBenefices = document.getElementById('stat-benefices');
      if (elBenefices) elBenefices.textContent = formatAmount(beneficesTotal) + ' €';
      const elStock = document.getElementById('stat-stock-dispo');
      if (elStock) elStock.textContent = formatNumber(stockDispo);
    } catch (e) { console.error('Erreur chargement stats:', e); }
  }

  async function loadVentesEmploye() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      
      // Recharger les users si nécessaire
      if (!usersCache || usersCache.length === 0) {
        // Charger tous les utilisateurs (tous rôles)
        const usersSnap = await getDocs(collection(fb.db, 'users'));
        usersCache = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      
      // Remplir le select avec les employés
      const sel = document.getElementById('select-employe');
      if (!sel) return;
      
      // Filtrer uniquement les employés (role === 'employe')
      const onlyEmp = usersCache.filter(u => (u.active !== false));
      
      // Remplir le select
      const currentValue = sel.value; // Sauvegarder la valeur actuelle
      sel.innerHTML = `<option value="">— Choisir un employé —</option>` +
        onlyEmp.map(u => `<option value="${u.id}">${(u.name || u.email || u.id)}${u.role ? ' — ' + u.role : ''}</option>`).join('');
      
      // Restaurer la sélection si elle existait
      if (currentValue) {
        sel.value = currentValue;
      }
      
      // Ajouter l'event listener une seule fois
      if (!sel.dataset.listenerAdded) {
        sel.addEventListener('change', function(e) {
          const selectedId = this.value;
          if (selectedId) {
            loadVentesEmploye();
          } else {
            const cards = document.getElementById('ventes-emp-cards');
            const empty = document.getElementById('ventes-emp-empty');
            const summary = document.getElementById('ventes-emp-summary');
            if (cards) cards.innerHTML = '';
            if (empty) {
              empty.textContent = 'Sélectionnez un employé pour afficher ses cartes de ventes.';
              empty.classList.remove('hidden');
            }
            if (summary) summary.classList.add('hidden');
          }
        });
        sel.dataset.listenerAdded = '1';
      }
      
      // Charger les ventes de l'employé sélectionné
      const employeId = sel.value || '';
      const cardsContainer = document.getElementById('ventes-emp-cards');
      const emptyState = document.getElementById('ventes-emp-empty');
      const summary = document.getElementById('ventes-emp-summary');
      const summaryTotal = document.getElementById('ventes-emp-total');
      const summaryQuantite = document.getElementById('ventes-emp-quantite');
      const summaryCA = document.getElementById('ventes-emp-ca');
      const summaryLast = document.getElementById('ventes-emp-last');
      if (!cardsContainer || !emptyState || !summary || !summaryTotal || !summaryQuantite || !summaryCA || !summaryLast) return;
      
      if (!employeId) {
        cardsContainer.innerHTML = '';
        emptyState.textContent = 'Sélectionnez un employé pour afficher ses cartes de ventes.';
        emptyState.classList.remove('hidden');
        summary.classList.add('hidden');
        return;
      }
      
      // Charger les ventes de cet employé
      // Retirer orderBy pour éviter l'index composite requis
      const snap = await getDocs(query(collection(fb.db, 'ventes'), where('employeId', '==', employeId)));
      const ventes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const employeData = usersCache.find(u => u.id === employeId);
      const employeName = employeData?.name || employeData?.email || 'Employé';

      cardsContainer.innerHTML = '';
      if (!ventes.length) {
        emptyState.textContent = `Aucune vente enregistrée pour ${employeName}.`;
        emptyState.classList.remove('hidden');
        summary.classList.add('hidden');
        return;
      }
      emptyState.classList.add('hidden');
      summary.classList.remove('hidden');

      const totalVentes = ventes.length;
      const totalQuantite = ventes.reduce((sum, v) => sum + (v.quantite || 0), 0);
      let totalCA = 0;
      let lastDate = null;
      ventes.forEach(v => {
        const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId);
        if (ressource) {
          const prixVente = ressource.prixVente || ressource.prix || 0;
          totalCA += prixVente * (v.quantite || 0);
        }
        const currentDate = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : null;
        if (currentDate && (!lastDate || currentDate > lastDate)) {
          lastDate = currentDate;
        }
      });

      summaryTotal.textContent = formatNumber(totalVentes);
      summaryQuantite.textContent = formatNumber(totalQuantite);
      summaryCA.textContent = formatAmount(totalCA) + ' €';
      summaryLast.textContent = lastDate ? lastDate.toLocaleDateString('fr-FR') : '—';

      ventesHistoryCache.clear();

      const ventesParRessource = ventes.reduce((acc, v) => {
        const resId = v.typeRessourceId || 'autre';
        if (!acc.has(resId)) acc.set(resId, []);
        acc.get(resId).push(v);
        return acc;
      }, new Map());

      ventesParRessource.forEach((ventesRessource, resId) => {
        const card = document.createElement('div');
        card.className = 'p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col gap-4';
        const ressource = ressourcesCache.find(r => r.id === resId) || {};
        const ressourceNom = ressource.nom || 'Ressource inconnue';
        const ressourcePrix = ressource.prixVente || ressource.prix || 0;

        const sortedVentes = ventesRessource
          .slice()
          .sort((a, b) => {
            const ad = a.dateVente ? (a.dateVente.toDate ? a.dateVente.toDate().getTime() : new Date(a.dateVente).getTime()) : 0;
            const bd = b.dateVente ? (b.dateVente.toDate ? b.dateVente.toDate().getTime() : new Date(b.dateVente).getTime()) : 0;
            return bd - ad;
          });

        const totalCardVentes = ventesRessource.length;
        const totalCardQuantite = ventesRessource.reduce((sum, v) => sum + (v.quantite || 0), 0);
        let totalCardCA = 0;
        const statutCounts = { attente: 0, valide: 0, traite: 0, annule: 0 };
        let cardLastDate = null;

        ventesRessource.forEach(v => {
          totalCardCA += (ressourcePrix) * (v.quantite || 0);
          const statut = (v.statut || 'en attente').toLowerCase();
          if (statut === 'valide') statutCounts.valide += 1;
          else if (statut === 'traite') statutCounts.traite += 1;
          else if (statut === 'annule') statutCounts.annule += 1;
          else statutCounts.attente += 1;
          const d = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : null;
          if (d && (!cardLastDate || d > cardLastDate)) {
            cardLastDate = d;
          }
        });

        const cardHeader = document.createElement('div');
        cardHeader.className = 'flex items-start justify-between gap-3 flex-wrap';
        cardHeader.innerHTML = `
          <div>
            <div class="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">${employeName}</div>
            <div class="text-xl font-semibold text-slate-900 dark:text-white">${ressourceNom}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Prix unitaire : ${formatAmount(ressourcePrix)} €</div>
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400 text-right">
            <div>${totalCardVentes} vente${totalCardVentes > 1 ? 's' : ''}</div>
            <div>${cardLastDate ? 'Dernière le ' + cardLastDate.toLocaleDateString('fr-FR') : 'Aucune vente récente'}</div>
          </div>`;
        card.appendChild(cardHeader);

        const controls = document.createElement('div');
        controls.className = 'flex items-start gap-3 flex-wrap';
        const latestVente = sortedVentes[0];
        const latestDate = latestVente ? (latestVente.dateVente ? (latestVente.dateVente.toDate ? latestVente.dateVente.toDate() : new Date(latestVente.dateVente)) : null) : null;
        const latestMontant = latestVente ? ressourcePrix * (latestVente.quantite || 0) : 0;
        let latestBadgeClass = 'badge-employe';
        const latestStatut = latestVente?.statut || 'en attente';
        if (latestStatut === 'valide') latestBadgeClass = 'badge-actif';
        else if (latestStatut === 'annule') latestBadgeClass = 'badge-inactif';
        else if (latestStatut === 'traite') latestBadgeClass = 'badge-admin';

        controls.innerHTML = `
          <div class="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/10 p-3 flex flex-col gap-1">
            <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Dernière vente</div>
            ${latestVente ? `
              <div class="text-base font-semibold">${formatAmount(latestMontant)} € · ${latestVente.quantite || 0} unité${(latestVente.quantite || 0) > 1 ? 's' : ''}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${latestDate ? latestDate.toLocaleDateString('fr-FR') : 'Date inconnue'}</div>
              <div><span class="badge-role ${latestBadgeClass}">${formatStatus(latestStatut)}</span></div>
            ` : '<div class="text-sm text-slate-500 dark:text-slate-400">Aucune vente enregistrée</div>'}
          </div>
          <button class="history-btn ml-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 transition" data-history-modal="${resId}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Historique
          </button>`;
        card.appendChild(controls);

        const statsGrid = document.createElement('div');
        statsGrid.className = 'grid gap-3 md:grid-cols-2';
        statsGrid.innerHTML = `
          <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
            <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Quantité totale</div>
            <div class="text-lg font-semibold">${formatNumber(totalCardQuantite)}</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
            <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Chiffre d'affaires</div>
            <div class="text-lg font-semibold">${formatAmount(totalCardCA)} €</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
            <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Validées</div>
            <div class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">${formatNumber(statutCounts.valide)}</div>
          </div>
          <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
            <div class="text-xs uppercase text-slate-500 dark:text-slate-400">En attente</div>
            <div class="text-lg font-semibold text-amber-500">${formatNumber(statutCounts.attente)}</div>
          </div>`;
        card.appendChild(statsGrid);

        if (statutCounts.traite || statutCounts.annule) {
          const extraStats = document.createElement('div');
          extraStats.className = 'grid gap-3 md:grid-cols-2';
          extraStats.innerHTML = `
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Traitées</div>
              <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">${formatNumber(statutCounts.traite)}</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Annulées</div>
              <div class="text-lg font-semibold text-rose-500">${formatNumber(statutCounts.annule)}</div>
            </div>`;
          card.appendChild(extraStats);
        }

        ventesHistoryCache.set(resId, {
          ventes: sortedVentes,
          ressourceNom,
          ressourcePrix,
          employeName
        });
        cardsContainer.appendChild(card);
      });
    } catch (e) { 
      console.error('Erreur loadVentesEmploye:', e);
      const cards = document.getElementById('ventes-emp-cards');
      const emptyState = document.getElementById('ventes-emp-empty');
      const summary = document.getElementById('ventes-emp-summary');
      if (cards) cards.innerHTML = '';
      if (summary) summary.classList.add('hidden');
      if (emptyState) {
        emptyState.textContent = 'Erreur lors du chargement des ventes.';
        emptyState.classList.remove('hidden');
      }
    }
  }

  // Refresh button pour ventes employé
  card.addEventListener('click', (e) => {
    const historyBtn = e.target.closest('[data-history-modal]');
    if (historyBtn) {
      const resId = historyBtn.getAttribute('data-history-modal');
      const historyData = ventesHistoryCache.get(resId);
      if (!historyData) return;

      const rows = historyData.ventes.map(v => {
        const venteDate = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const montant = historyData.ressourcePrix * (v.quantite || 0);
        const statut = v.statut || 'en attente';
        let badgeClass = 'badge-employe';
        if (statut === 'valide') badgeClass = 'badge-actif';
        else if (statut === 'annule') badgeClass = 'badge-inactif';
        else if (statut === 'traite') badgeClass = 'badge-admin';

        return `
          <tr class="border-t border-slate-100 dark:border-white/5">
            <td class="px-5 py-3 text-sm">${venteDate.toLocaleDateString('fr-FR')}</td>
            <td class="px-5 py-3 text-sm">${formatAmount(montant)} €</td>
            <td class="px-5 py-3 text-sm">${formatNumber(v.quantite || 0)}</td>
            <td class="px-5 py-3 text-sm"><span class="badge-role ${badgeClass}">${formatStatus(statut)}</span></td>
          </tr>`;
      }).join('') || '<tr><td colspan="4" class="px-4 py-4 text-center text-sm text-slate-500">Aucun historique disponible.</td></tr>';

      const body = `
        <div class="space-y-4">
          <div class="rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-slate-700 dark:text-slate-200 text-sm">
                <thead class="bg-slate-100 dark:bg-white/10 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    <th class="px-5 py-3 font-medium">Date</th>
                    <th class="px-5 py-3 font-medium">Montant</th>
                    <th class="px-5 py-3 font-medium">Quantité</th>
                    <th class="px-5 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>`;

      createModal({
        title: `Historique — ${historyData.ressourceNom}`,
        body,
        confirmText: 'Fermer',
        onConfirm: () => {},
        isView: true
      });
      return;
    }

    if (e.target.closest('#btn-refresh-ventes-emp')) {
      loadVentesEmploye();
    }
  });

  async function loadVentes(options = {}) {
    const force = typeof options === 'boolean' ? options : Boolean(options.force);
    try {
      const tbody = document.getElementById('ventes-tbody');
      if (!tbody) return;

      if (force) {
        const fb = getFirebase();
        if (fb && fb.db) {
          const snap = await getDocs(query(collection(fb.db, 'ventes'), orderBy('dateVente', 'desc'), limit(100)));
          ventesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          ventesLoading = false;
        }
      }

      if (ventesLoading) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>';
        return;
      }

      if (!ventesCache.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucune vente</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      ventesCache.forEach(v => {
        const date = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId) || {};
        const tr = document.createElement('tr');
        const statut = v.statut || 'en attente';
        tr.innerHTML = `
          <td>${date.toLocaleDateString('fr-FR')}</td>
          <td>${ressource.nom || '—'}</td>
          <td>${v.quantite || 0}</td>
          <td>${(v.prenom || '')} ${(v.nom || '')} ${v.telephone ? ' — ' + v.telephone : ''}</td>
          <td><span class="badge-role ${statut === 'valide' ? 'badge-actif' : statut === 'annule' ? 'badge-inactif' : statut === 'traite' ? 'badge-admin' : 'badge-employe'}">${formatStatus(statut)}</span></td>
          <td>
            <div class="action-buttons" data-vente-id="${v.id}" data-vente-original='${JSON.stringify(v)}'>
              <button class="action-btn btn-view" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              <button class="action-btn btn-edit" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
              ${statut === 'en attente' ? `
              <button class="action-btn btn-validate" title="Valider"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span></button>
              <button class="action-btn btn-cancel" title="Annuler"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span></button>
              ` : ''}
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    } catch (e) { console.error(e); }
  }

  function startVentesListener() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) {
        ventesLoading = false;
        loadVentes();
        return;
      }

      if (ventesRealtimeUnsub) {
        try { ventesRealtimeUnsub(); } catch (err) { console.warn('Erreur fermeture listener ventes précédent:', err); }
        ventesRealtimeUnsub = null;
      }

      const ventesRef = query(collection(fb.db, 'ventes'), orderBy('dateVente', 'desc'), limit(100));
      ventesRealtimeUnsub = onSnapshot(ventesRef, (snapshot) => {
        ventesCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        ventesLoading = false;
        loadVentes();
        loadStats();
        if (currentTab === 'traitement') {
          loadTraitement();
        }
        if (currentTab === 'ventes-employe') {
          const sel = document.getElementById('select-employe');
          if (sel && sel.value) {
            loadVentesEmploye();
          }
        }
        if (currentTab === 'stockage') {
          loadStockage();
        }
      }, (error) => {
        console.error('Erreur flux ventes:', error);
      });
    } catch (err) {
      console.error('Erreur initialisation écoute ventes:', err);
    }
  }

  async function loadTraitement() {
    try {
      const fb = getFirebase();
      // Retirer orderBy pour éviter l'index composite (statut == 'valide')
      const snap = await getDocs(query(collection(fb.db, 'ventes'), where('statut', '==', 'valide')));
      const ventes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const tbody = document.getElementById('traitement-tbody');
      tbody.innerHTML = '';
      if (!ventes.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucune vente en traitement</td></tr>';
        return;
      }
      ventes.forEach(v => {
        const date = v.dateVente ? (v.dateVente.toDate ? v.dateVente.toDate() : new Date(v.dateVente)) : new Date();
        const ressource = ressourcesCache.find(r => r.id === v.typeRessourceId) || {};
        const montant = (ressource.prixVente || ressource.prix || 0) * (v.quantite || 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${date.toLocaleDateString('fr-FR')}</td>
          <td>${ressource.nom || '—'}</td>
          <td>${v.quantite || 0}</td>
          <td>${(v.prenom || '')} ${(v.nom || '')} ${v.telephone ? ' — ' + v.telephone : ''}</td>
          <td class="font-medium">${montant.toFixed(2)} €</td>
          <td>
            <div class="action-buttons" data-vente-id="${v.id}" data-vente-original='${JSON.stringify(v)}'>
              <button class="action-btn btn-view-traitement" title="Voir"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></span></button>
              <button class="action-btn btn-validate-traitement" title="Valider traitement"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    } catch (e) { console.error(e); }
  }

  async function loadStockage() {
    try {
      const fb = getFirebase();
      const cardsContainer = document.getElementById('stockage-cards');
      const emptyState = document.getElementById('stockage-empty');
      if (!fb || !fb.db || !cardsContainer || !emptyState) return;

      cardsContainer.innerHTML = '';
      emptyState.textContent = 'Chargement…';
      emptyState.classList.remove('hidden');

      const resSnap = await getDocs(collection(fb.db, 'ressources'));
      const ressources = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const ressourceMap = new Map(ressources.map(r => [r.id, r]));

      let stockMaxDoc = null;
      try {
        stockMaxDoc = await getDoc(doc(fb.db, 'config', 'stockMax'));
      } catch {}
      const stockMax = stockMaxDoc?.exists() ? (stockMaxDoc.data().valeur || 10000) : 10000;

      const allVentesSnap = await getDocs(collection(fb.db, 'ventes'));
      const ventesByResource = new Map();

      allVentesSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const resId = data.typeRessourceId;
        if (!resId) return;
        const statut = (data.statut || 'en attente').toLowerCase();
        const quantite = data.quantite || 0;
        const ressource = ressourceMap.get(resId);
        const tailleObjet = data.tailleObjet || ressource?.tailleObjet || 1;
        const place = tailleObjet * quantite;

        if (!ventesByResource.has(resId)) {
          ventesByResource.set(resId, {
            totalVentes: 0,
            enAttente: 0,
            valide: 0,
            traite: 0,
            annule: 0,
            quantiteEnAttente: 0,
            quantiteValide: 0,
            quantiteTraite: 0,
            quantiteAnnule: 0,
            placeOccupee: 0,
            lastDate: null,
            lastStatus: ''
          });
        }

        const stats = ventesByResource.get(resId);
        stats.totalVentes += 1;

        let eventDate = null;
        if (data.dateVente) {
          eventDate = data.dateVente.toDate ? data.dateVente.toDate() : new Date(data.dateVente);
        } else if (data.createdAt && data.createdAt.toDate) {
          eventDate = data.createdAt.toDate();
        }
        if (eventDate && (!stats.lastDate || eventDate > stats.lastDate)) {
          stats.lastDate = eventDate;
          stats.lastStatus = statut;
        }

        switch (statut) {
          case 'en attente':
            stats.enAttente += 1;
            stats.quantiteEnAttente += quantite;
            stats.placeOccupee += place;
            break;
          case 'valide':
            stats.valide += 1;
            stats.quantiteValide += quantite;
            stats.placeOccupee += place;
            break;
          case 'traite':
            stats.traite += 1;
            stats.quantiteTraite += quantite;
            break;
          case 'annule':
            stats.annule += 1;
            stats.quantiteAnnule += quantite;
            break;
          default:
            stats.enAttente += 1;
            stats.quantiteEnAttente += quantite;
            stats.placeOccupee += place;
            break;
        }
      });

      const totalPlaceOccupee = Array.from(ventesByResource.values()).reduce((sum, stats) => sum + stats.placeOccupee, 0);
      const stockDispoGlobal = Math.max(0, stockMax - totalPlaceOccupee);

      const elStockDispo = document.getElementById('stock-dispo-display');
      if (elStockDispo) {
        elStockDispo.textContent = formatNumber(stockDispoGlobal);
        elStockDispo.className = `text-3xl font-bold mb-1 ${stockDispoGlobal < 100 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`;
      }
      const elStockMax = document.getElementById('stock-max-display');
      if (elStockMax) elStockMax.textContent = formatNumber(stockMax);
      const elStockMaxInput = document.getElementById('stock-max-global');
      if (elStockMaxInput) elStockMaxInput.value = stockMax;

      if (!ressources.length) {
        emptyState.textContent = 'Aucune ressource.';
        emptyState.classList.remove('hidden');
        return;
      }

      ressources.forEach(res => {
        const stats = ventesByResource.get(res.id) || {
          totalVentes: 0,
          enAttente: 0,
          valide: 0,
          traite: 0,
          annule: 0,
          quantiteEnAttente: 0,
          quantiteValide: 0,
          quantiteTraite: 0,
          quantiteAnnule: 0,
          placeOccupee: 0,
          lastDate: null,
          lastStatus: ''
        };

        const totalQuantite = stats.quantiteEnAttente + stats.quantiteValide + stats.quantiteTraite + stats.quantiteAnnule;
        const nonTraitees = stats.quantiteEnAttente + stats.quantiteValide;
        const usagePercentRaw = stockMax > 0 ? Math.round((stats.placeOccupee / stockMax) * 100) : 0;
        const usagePercent = Math.max(0, Math.min(usagePercentRaw, 100));
        const progressColor = usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
        const alertBadge = usagePercent >= 90 ? '<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/15 text-rose-500">Critique</span>' : usagePercent >= 70 ? '<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-600">Élevé</span>' : '';
        const lastStatusLabel = stats.lastStatus ? formatStatus(stats.lastStatus) : '';
        let lastStatusBadge = 'badge-employe';
        if (stats.lastStatus === 'valide') lastStatusBadge = 'badge-actif';
        else if (stats.lastStatus === 'annule') lastStatusBadge = 'badge-inactif';
        else if (stats.lastStatus === 'traite') lastStatusBadge = 'badge-admin';
        const prixVente = Number(res.prixVente ?? res.prix ?? 0);
        const prixBourse = Number(res.prixBourse ?? 0);
        const tailleUnitaire = Number(res.tailleObjet ?? 1);

        const card = document.createElement('div');
        card.className = 'p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col gap-4';
        card.innerHTML = `
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Ressource</div>
              <div class="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                ${res.nom || '—'}
                ${alertBadge}
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Prix vente: ${formatAmount(prixVente)} € · Prix bourse: ${formatAmount(prixBourse)} €</div>
              <div class="text-xs text-slate-500 dark:text-slate-500">Taille unitaire: ${tailleUnitaire.toFixed(2)} unités</div>
            </div>
            <div class="text-right">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Dernier mouvement</div>
              <div class="text-sm font-semibold text-slate-900 dark:text-white">${stats.lastDate ? stats.lastDate.toLocaleDateString('fr-FR') : 'Aucun'}</div>
              ${stats.lastStatus ? `<div class="mt-1"><span class="badge-role ${lastStatusBadge}">${lastStatusLabel}</span></div>` : ''}
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Total ventes</div>
              <div class="text-lg font-semibold">${formatNumber(stats.totalVentes)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">Quantité: ${formatNumber(totalQuantite)}</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">En attente</div>
              <div class="text-lg font-semibold text-amber-500">${formatNumber(stats.enAttente)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">Quantité: ${formatNumber(stats.quantiteEnAttente)}</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Validées</div>
              <div class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">${formatNumber(stats.valide)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">Quantité: ${formatNumber(stats.quantiteValide)}</div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-white/10">
              <div class="text-xs uppercase text-slate-500 dark:text-slate-400">Traitées</div>
              <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">${formatNumber(stats.traite)}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">Quantité: ${formatNumber(stats.quantiteTraite)} · Annulées: ${formatNumber(stats.annule)} ventes</div>
            </div>
          </div>
          <div class="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/10 p-4">
            <div class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span>Consommation de stock</span>
              <span>${formatNumber(stats.placeOccupee)} / ${formatNumber(stockMax)} unités (${usagePercent}%)</span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div class="h-full ${progressColor}" style="width: ${usagePercent}%;"></div>
            </div>
            <div class="mt-3 grid gap-3 sm:grid-cols-2 text-xs text-slate-500 dark:text-slate-400">
              <div>Non traitées: ${formatNumber(nonTraitees)} unités</div>
              <div>Annulées: ${formatNumber(stats.quantiteAnnule)} unités</div>
            </div>
          </div>
        `;

        cardsContainer.appendChild(card);
      });

      if (cardsContainer.children.length) {
        emptyState.classList.add('hidden');
      } else {
        emptyState.textContent = 'Aucune donnée de stockage.';
        emptyState.classList.remove('hidden');
      }

    } catch (e) {
      console.error(e);
      const emptyState = document.getElementById('stockage-empty');
      if (emptyState) {
        emptyState.textContent = 'Erreur lors du chargement du stockage.';
        emptyState.classList.remove('hidden');
      }
    }
  }

  async function loadRessources() {
    try {
      const fb = getFirebase();
      const snap = await getDocs(collection(fb.db, 'ressources'));
      const ressourcesRaw = snap.docs.map((d, idx) => ({ id: d.id, ...d.data(), _fallbackOrder: idx }));
      const ressources = ressourcesRaw
        .map(r => ({ ...r, position: typeof r.position === 'number' ? r.position : r._fallbackOrder }))
        .sort((a, b) => {
          if (a.position === b.position) return a._fallbackOrder - b._fallbackOrder;
          return a.position - b.position;
        });
      const tbody = document.getElementById('ressources-tbody');
      tbody.innerHTML = '';
      if (!ressources.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucune ressource</td></tr>';
        return;
      }
      ressourcesCache = ressources;
      ressources.forEach((res, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${res.nom || '—'}</td>
          <td>${(res.prixVente || res.prix || 0).toFixed(2)} €</td>
          <td>${(res.prixBourse || 0).toFixed(2)} €</td>
          <td>${(res.tailleObjet || 1).toFixed(2)}</td>
          <td><span class="badge-role ${res.legalite === 'illegal' ? 'badge-inactif' : 'badge-actif'}">${res.legalite === 'illegal' ? 'Illégale' : 'Légale'}</span></td>
          <td>
            <div class="action-buttons" data-ressource-id="${res.id}">
              <button class="action-btn btn-move-up" title="Monter" ${index === 0 ? 'disabled' : ''}><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg></span></button>
              <button class="action-btn btn-move-down" title="Descendre" ${index === ressources.length - 1 ? 'disabled' : ''}><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span></button>
              <button class="action-btn btn-edit-ressource" title="Modifier"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></span></button>
              <button class="action-btn btn-delete-ressource" title="Supprimer"><span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"></path></svg></span></button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    } catch (e) { console.error(e); }
  }

  async function moveResource(ressourceId, direction) {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      if (!ressourcesCache || !ressourcesCache.length) return;

      const sorted = [...ressourcesCache].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const currentIndex = sorted.findIndex(r => r.id === ressourceId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= sorted.length) return;

      const [moved] = sorted.splice(currentIndex, 1);
      sorted.splice(newIndex, 0, moved);

      const batch = writeBatch(fb.db);
      sorted.forEach((res, idx) => {
        const docRef = doc(fb.db, 'ressources', res.id);
        batch.update(docRef, { position: idx });
        res.position = idx;
      });
      await batch.commit();
      ressourcesCache = sorted;
      loadRessources();
    } catch (e) {
      alertModal({ title: 'Erreur', message: 'Impossible de réordonner la ressource.', type: 'danger' });
    }
  }


  // New vente
  card.querySelector('#btn-new-vente').addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Date de la vente *</label>
        <input id="modal-date" type="date" required />
      </div>
      <div class="modal-field">
        <label>Type de ressource *</label>
        <select id="modal-ressource" required></select>
      </div>
      <div class="modal-field">
        <label>Nombre de ressources *</label>
        <input id="modal-quantite" type="number" min="1" required placeholder="1" />
      </div>
      
    `;
    createModal({
      title: 'Nouvelle vente',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const dateStr = document.getElementById('modal-date').value;
        const ressourceId = document.getElementById('modal-ressource').value;
        const quantite = parseInt(document.getElementById('modal-quantite').value);
        if (!dateStr || !ressourceId || !quantite) {
          alertModal({ title: 'Champs requis', message: 'Date, ressource et quantité sont requis.', type: 'warning' });
          return;
        }
        // Récupérer automatiquement la taille depuis la ressource sélectionnée
        const selectedRessource = ressourcesCache.find(r => r.id === ressourceId);
        const tailleObjet = selectedRessource?.tailleObjet || 1;
        try {
          // Récupérer les infos de l'utilisateur connecté
          let prenom = '', nom = '', telephone = '', employeId = null;
          const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
          const currentUserId = authState?.uid;
          
          if (currentUserId) {
            try {
              const userDoc = await getDoc(doc(fb.db, 'users', currentUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                employeId = currentUserId;
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
            employeId: employeId,
            prenom,
            nom,
            telephone,
            statut: 'en attente',
            createdAt: serverTimestamp()
          });
          await addLogEntry(fb, { type: 'action', action: 'vente_create', message: `Vente de ${quantite} ressources` });
          loadStats();
          loadVentes();
          loadStockage(); // Recharger le stockage pour mettre à jour le stock disponible
          alertModal({ title: 'Succès', message: 'Vente créée avec succès.', type: 'success' });
        } catch (e) { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la vente.', type: 'danger' });
          console.error(e); 
        }
      }
    });
    const sel = document.getElementById('modal-ressource');
    if (sel) {
      sel.innerHTML = ressourcesCache.map(r => `<option value="${r.id}">${r.nom}</option>`).join('') || '<option disabled>Aucune ressource disponible</option>';
    }
    document.getElementById('modal-date').valueAsDate = new Date();
  });

  // New ressource
  card.querySelector('#btn-new-ressource').addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Nom *</label>
        <input id="modal-res-nom" type="text" required placeholder="Nom de la ressource" />
      </div>
      <div class="modal-field">
        <label>Prix de vente de l'entreprise *</label>
        <input id="modal-res-prix-vente" type="number" min="0" step="0.01" required placeholder="0.00" />
      </div>
          <div class="modal-field">
            <label>Prix en bourse *</label>
            <input id="modal-res-prix-bourse" type="number" min="0" step="0.01" required placeholder="0.00" />
          </div>
          <div class="modal-field">
            <label>Légalité *</label>
            <select id="modal-res-legalite" required>
              <option value="legal">Légale</option>
              <option value="illegal">Illégale</option>
            </select>
          </div>
      <div class="modal-field">
        <label>Taille objet (place dans le stockage) *</label>
        <input id="modal-res-taille" type="number" min="0" step="0.01" required placeholder="1.00" />
        <div class="text-xs text-slate-500 mt-1">Définit la place prise par unité dans le stockage</div>
      </div>
    `;
    createModal({
      title: 'Nouvelle ressource',
      body,
      confirmText: 'Créer',
      onConfirm: async () => {
        const fb = getFirebase();
        const nom = document.getElementById('modal-res-nom').value.trim();
        const prixVente = parseFloat(document.getElementById('modal-res-prix-vente').value);
        const prixBourse = parseFloat(document.getElementById('modal-res-prix-bourse').value);
        const tailleObjet = parseFloat(document.getElementById('modal-res-taille').value);
        const legalite = document.getElementById('modal-res-legalite').value;
        if (!nom || isNaN(prixVente) || isNaN(prixBourse) || isNaN(tailleObjet) || !legalite) {
          alertModal({ title: 'Champs requis', message: 'Tous les champs sont requis.', type: 'warning' });
          return;
        }
        try {
          const nextPosition = (ressourcesCache && Array.isArray(ressourcesCache)) ? ressourcesCache.length : 0;
          await addDoc(collection(fb.db, 'ressources'), {
            nom,
            prixVente,
            prixBourse,
            tailleObjet,
            legalite,
            position: nextPosition,
            createdAt: serverTimestamp()
          });
          await addLogEntry(fb, { type: 'action', action: 'ressource_create', message: nom });
          loadRessources();
          ressourcesCache = (await getDocs(collection(fb.db, 'ressources'))).docs.map(d => ({ id: d.id, ...d.data() }));
          alertModal({ title: 'Succès', message: 'Ressource créée avec succès.', type: 'success' });
        } catch (e) { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la ressource.', type: 'danger' });
        }
      }
    });
  });

  // Refresh stock
  card.querySelector('#btn-refresh-stock')?.addEventListener('click', () => {
    loadStockage();
  });

  // Refresh traitement
  card.querySelector('#btn-refresh-traitement')?.addEventListener('click', () => {
    loadTraitement();
  });

  // Save stock max (global)
  card.addEventListener('click', async (e) => {
    if (e.target.closest('.btn-save-stock')) {
      const input = document.getElementById('stock-max-global');
      if (!input) return;
      const newStockMax = parseInt(input.value);
      if (isNaN(newStockMax) || newStockMax < 0) {
        alertModal({ title: 'Valeur invalide', message: 'Le stock max doit être un nombre positif.', type: 'warning' });
        return;
      }
      try {
        const fb = getFirebase();
        await setDoc(doc(fb.db, 'config', 'stockMax'), { valeur: newStockMax }, { merge: true });
        await addLogEntry(fb, { type: 'action', action: 'stock_max_update', message: `Stock max: ${newStockMax}` });
        loadStats();
        loadStockage();
        alertModal({ title: 'Succès', message: 'Stock max mis à jour avec succès.', type: 'success' });
      } catch (e) { 
        alertModal({ title: 'Erreur', message: 'Erreur lors de la sauvegarde du stock max.', type: 'danger' });
        console.error(e); 
      }
      return;
    }
  });

  // Delegated actions
  card.addEventListener('click', async (e) => {
    const container = e.target.closest('.action-buttons');
    if (!container) return;
    const fb = getFirebase();
    const venteId = container.getAttribute('data-vente-id');
    const ressourceId = container.getAttribute('data-ressource-id');
    
    if (venteId) {
      const vente = ventesCache.find(v => v.id === venteId) || {};
      if (e.target.closest('.btn-view')) {
        const date = vente.dateVente ? (vente.dateVente.toDate ? vente.dateVente.toDate() : new Date(vente.dateVente)) : new Date();
        const ressource = ressourcesCache.find(r => r.id === vente.typeRessourceId) || {};
        const montantTotal = (ressource.prixVente || ressource.prix || 0) * (vente.quantite || 0);
        const statut = vente.statut || 'en attente';
        const body = `
          <div class="view-highlight">
            <div class="view-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></div>
            <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${montantTotal.toFixed(2)} €</div>
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
                <div class="view-item-label">Quantité</div>
                <div class="view-item-value">${vente.quantite || 0}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Prix unitaire</div>
                <div class="view-item-value">${(ressource.prixVente || ressource.prix || 0).toFixed(2)} €</div>
              </div>
            </div>
            <div class="view-section">
              <div class="view-section-title">Détails</div>
              
              <div class="view-item">
                <div class="view-item-label">Statut</div>
                <div class="view-item-value">
                  <span class="view-badge badge-role ${statut === 'valide' ? 'badge-actif' : statut === 'annule' ? 'badge-inactif' : statut === 'traite' ? 'badge-admin' : 'badge-employe'}">${formatStatus(statut)}</span>
                </div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Employé</div>
                <div class="view-item-value">${(vente.prenom || '')} ${(vente.nom || '')}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Téléphone</div>
                <div class="view-item-value">${vente.telephone || '—'}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Montant total</div>
                <div class="view-item-value" style="font-size: 1.25rem; color: #0055A4;">${montantTotal.toFixed(2)} €</div>
              </div>
            </div>
          </div>
        `;
        createModal({ title: 'Détails vente', body, confirmText: 'Fermer', onConfirm: () => {}, isView: true });
        return;
      }
      if (e.target.closest('.btn-edit')) {
        const date = vente.dateVente ? (vente.dateVente.toDate ? vente.dateVente.toDate() : new Date(vente.dateVente)) : new Date();
        const body = `
          <div class="modal-field">
            <label>Date *</label>
            <input id="modal-edit-date" type="date" value="${date.toISOString().split('T')[0]}" required />
          </div>
          <div class="modal-field">
            <label>Type ressource *</label>
            <select id="modal-edit-ressource" required></select>
          </div>
          <div class="modal-field">
            <label>Quantité *</label>
            <input id="modal-edit-quantite" type="number" min="1" value="${vente.quantite || 1}" required />
          </div>
          
        `;
        createModal({
          title: 'Modifier vente',
          body,
          onConfirm: async () => {
            const dateStr = document.getElementById('modal-edit-date').value;
            const ressourceId = document.getElementById('modal-edit-ressource').value;
            const quantite = parseInt(document.getElementById('modal-edit-quantite').value);
            if (!dateStr || !ressourceId || !quantite) {
              alertModal({ title: 'Champs requis', message: 'Date, ressource et quantité sont requis.', type: 'warning' });
              return;
            }
            // Récupérer automatiquement la taille depuis la ressource sélectionnée
            const selectedRessource = ressourcesCache.find(r => r.id === ressourceId);
            const tailleObjet = selectedRessource?.tailleObjet || 1;
            try {
              await updateDoc(doc(fb.db, 'ventes', venteId), {
                dateVente: new Date(dateStr),
                typeRessourceId: ressourceId,
                quantite,
                tailleObjet
              });
              await addLogEntry(fb, { type: 'action', action: 'vente_update', message: venteId });
              loadStats();
              loadVentes();
              alertModal({ title: 'Succès', message: 'Vente modifiée avec succès.', type: 'success' });
            } catch { 
              alertModal({ title: 'Erreur', message: 'Erreur lors de la modification de la vente.', type: 'danger' });
            }
          }
        });
        const sel = document.getElementById('modal-edit-ressource');
        if (sel) {
          sel.innerHTML = ressourcesCache.map(r => `<option value="${r.id}" ${r.id === vente.typeRessourceId ? 'selected' : ''}>${r.nom}</option>`).join('');
        }
        return;
      }
      if (e.target.closest('.btn-validate')) {
        confirmModal({
          title: 'Valider la vente',
          message: 'Cette vente sera déplacée en traitement et le salaire de l\'employé sera enregistré.',
          type: 'warning',
          confirmText: 'Valider',
          cancelText: 'Annuler',
          onConfirm: async () => {
        try {
          const ressource = ressourcesCache.find(r => r.id === vente.typeRessourceId) || {};
          const salaire = (ressource.prixVente || ressource.prix || 0) * (vente.quantite || 0);
          await updateDoc(doc(fb.db, 'ventes', venteId), { 
            statut: 'valide',
            updatedAt: serverTimestamp()
          });
          await addDoc(collection(fb.db, 'finance'), {
            type: 'salaire',
            montant: salaire,
            venteId: venteId,
            date: serverTimestamp(),
            description: `Salaire de travail: ${ressource.nom || ''} x${vente.quantite || 0}`
          });
          await addLogEntry(fb, { type: 'action', action: 'vente_validate', message: venteId });
          loadStats();
          loadVentes();
          if (currentTab === 'traitement') loadTraitement();
          loadStockage();
          alertModal({ title: 'Succès', message: 'Vente validée avec succès.', type: 'success' });
        } catch (e) { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la validation de la vente.', type: 'danger' });
          console.error(e); 
        }
          }
        });
        return;
      }
      if (e.target.closest('.btn-cancel')) {
        confirmModal({
          title: 'Annuler la vente',
          message: 'Cette vente sera marquée comme annulée.',
          type: 'warning',
          confirmText: 'Annuler',
          cancelText: 'Retour',
          onConfirm: async () => {
            try {
              const originalData = JSON.parse(container.getAttribute('data-vente-original') || '{}');
              await updateDoc(doc(fb.db, 'ventes', venteId), { statut: 'annule' });
              await addLogEntry(fb, { type: 'action', action: 'vente_cancel', message: venteId });
              loadStats();
              loadVentes();
              loadStockage(); // Recharger le stockage car la vente annulée libère le stock
              alertModal({ title: 'Succès', message: 'Vente annulée avec succès.', type: 'success' });
            } catch (e) { 
              alertModal({ title: 'Erreur', message: 'Erreur lors de l\'annulation de la vente.', type: 'danger' });
              console.error(e); 
            }
          }
        });
        return;
      }
      // Handlers pour traitement
      if (e.target.closest('.btn-view-traitement')) {
        const date = vente.dateVente ? (vente.dateVente.toDate ? vente.dateVente.toDate() : new Date(vente.dateVente)) : new Date();
        const ressource = ressourcesCache.find(r => r.id === vente.typeRessourceId) || {};
        const montantTotal = (ressource.prixVente || ressource.prix || 0) * (vente.quantite || 0);
        const body = `
          <div class="view-highlight">
            <div class="view-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.5rem; height: 1.5rem;"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></div>
            <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${montantTotal.toFixed(2)} €</div>
            <div style="color: rgb(100,116,139);">Vente en traitement du ${date.toLocaleDateString('fr-FR')}</div>
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
                <div class="view-item-label">Quantité</div>
                <div class="view-item-value">${vente.quantite || 0}</div>
              </div>
              <div class="view-item">
                <div class="view-item-label">Prix unitaire (vente)</div>
                <div class="view-item-value">${(ressource.prixVente || ressource.prix || 0).toFixed(2)} €</div>
              </div>
            </div>
            <div class="view-section">
              <div class="view-section-title">Détails</div>
              
              <div class="view-item">
                <div class="view-item-label">Montant total</div>
                <div class="view-item-value" style="font-size: 1.25rem; color: #0055A4;">${montantTotal.toFixed(2)} €</div>
              </div>
            </div>
          </div>
        `;
        createModal({ title: 'Détails vente en traitement', body, confirmText: 'Fermer', onConfirm: () => {}, isView: true });
        return;
      }
      if (e.target.closest('.btn-validate-traitement')) {
        confirmModal({
          title: 'Valider le traitement',
          message: 'Le bénéfice correspondra au prix de bourse. L\'entreprise recevra le bénéfice réel.',
          type: 'warning',
          confirmText: 'Valider',
          cancelText: 'Annuler',
          onConfirm: async () => {
            try {
              const ressource = ressourcesCache.find(r => r.id === vente.typeRessourceId) || {};
              const prixBourse = ressource.prixBourse || 0;
              const beneficeReel = prixBourse * (vente.quantite || 0);
              await updateDoc(doc(fb.db, 'ventes', venteId), { 
                statut: 'traite',
                updatedAt: serverTimestamp()
              });
              await addDoc(collection(fb.db, 'finance'), {
                type: 'benefice',
                montant: beneficeReel,
                venteId: venteId,
                date: serverTimestamp(),
                description: `Bénéfice (bourse): ${ressource.nom || ''} x${vente.quantite || 0} (${prixBourse.toFixed(2)}€)`
              });
              await addLogEntry(fb, { type: 'action', action: 'traitement_validate', message: venteId });
              loadStats();
              loadTraitement();
              loadStockage();
              alertModal({ title: 'Succès', message: 'Traitement validé avec succès. Le bénéfice a été enregistré.', type: 'success' });
            } catch (e) { 
              alertModal({ title: 'Erreur', message: 'Erreur lors de la validation du traitement.', type: 'danger' });
              console.error(e); 
            }
          }
        });
        return;
      }
    }
    
    if (ressourceId) {
      const res = ressourcesCache.find(r => r.id === ressourceId) || {};
      const moveUpBtn = e.target.closest('.btn-move-up');
      if (moveUpBtn) {
        if (!moveUpBtn.hasAttribute('disabled')) moveResource(ressourceId, 'up');
        return;
      }
      const moveDownBtn = e.target.closest('.btn-move-down');
      if (moveDownBtn) {
        if (!moveDownBtn.hasAttribute('disabled')) moveResource(ressourceId, 'down');
        return;
      }
      if (e.target.closest('.btn-edit-ressource')) {
        const body = `
          <div class="modal-field">
            <label>Nom *</label>
            <input id="modal-edit-res-nom" type="text" value="${res.nom || ''}" required />
          </div>
          <div class="modal-field">
            <label>Prix de vente de l'entreprise *</label>
            <input id="modal-edit-res-prix-vente" type="number" min="0" step="0.01" value="${res.prixVente || res.prix || 0}" required />
          </div>
          <div class="modal-field">
            <label>Prix en bourse *</label>
            <input id="modal-edit-res-prix-bourse" type="number" min="0" step="0.01" value="${res.prixBourse || 0}" required />
          </div>
          <div class="modal-field">
            <label>Légalité *</label>
            <select id="modal-edit-res-legalite" required>
              <option value="legal" ${res.legalite !== 'illegal' ? 'selected' : ''}>Légale</option>
              <option value="illegal" ${res.legalite === 'illegal' ? 'selected' : ''}>Illégale</option>
            </select>
          </div>
          <div class="modal-field">
            <label>Taille objet (place dans le stockage) *</label>
            <input id="modal-edit-res-taille" type="number" min="0" step="0.01" value="${res.tailleObjet || 1}" required />
            <div class="text-xs text-slate-500 mt-1">Définit la place prise par unité dans le stockage</div>
          </div>
        `;
        createModal({
          title: 'Modifier ressource',
          body,
          onConfirm: async () => {
            const nom = document.getElementById('modal-edit-res-nom').value.trim();
            const prixVente = parseFloat(document.getElementById('modal-edit-res-prix-vente').value);
            const prixBourse = parseFloat(document.getElementById('modal-edit-res-prix-bourse').value);
            const tailleObjet = parseFloat(document.getElementById('modal-edit-res-taille').value);
            const legalite = document.getElementById('modal-edit-res-legalite').value;
            if (!nom || isNaN(prixVente) || isNaN(prixBourse) || isNaN(tailleObjet) || !legalite) {
              alertModal({ title: 'Champs requis', message: 'Tous les champs sont requis.', type: 'warning' });
              return;
            }
            try {
              await updateDoc(doc(fb.db, 'ressources', ressourceId), {
                nom,
                prixVente,
                prixBourse,
                tailleObjet,
                legalite
              });
              await addLogEntry(fb, { type: 'action', action: 'ressource_update', message: nom });
              loadRessources();
              ressourcesCache = (await getDocs(collection(fb.db, 'ressources'))).docs.map(d => ({ id: d.id, ...d.data() }));
              alertModal({ title: 'Succès', message: 'Ressource modifiée avec succès.', type: 'success' });
            } catch { 
              alertModal({ title: 'Erreur', message: 'Erreur lors de la modification de la ressource.', type: 'danger' });
            }
          }
        });
        return;
      }
      if (e.target.closest('.btn-delete-ressource')) {
        createModal({
          title: 'Supprimer ressource',
          body: `<p>Êtes-vous sûr de vouloir supprimer <strong>${res.nom}</strong> ?</p><p class="text-sm text-slate-500 mt-2">Cette action est irréversible.</p>`,
          confirmText: 'Supprimer',
          onConfirm: async () => {
            try {
              await deleteDoc(doc(fb.db, 'ressources', ressourceId));
              await addLogEntry(fb, { type: 'action', action: 'ressource_delete', message: res.nom });
              loadRessources();
              ressourcesCache = ressourcesCache.filter(r => r.id !== ressourceId);
              alertModal({ title: 'Succès', message: 'Ressource supprimée avec succès.', type: 'success' });
            } catch { 
              alertModal({ title: 'Erreur', message: 'Erreur lors de la suppression de la ressource.', type: 'danger' });
            }
          }
        });
      }
    }
  });
}
