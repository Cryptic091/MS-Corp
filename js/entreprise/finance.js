import { html, mount, getCachedProfile, loadUserProfile, createModal, updateNavPermissions, alertModal, updateAvatar, isAuthenticated, updateRoleBadge } from '../utils.js';
import { getFirebase, waitForFirebase, collection, getDocs, query, orderBy, limit, where, addDoc, serverTimestamp, signOut, doc, getDoc } from '../firebase.js';
import { addLogEntry } from '../firebase.js';
import { formatDate } from '../utils.js';

export function viewFinance(root) {
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
            <a href="#/entreprise/finance" class="active nav-item"><span class="nav-icon"></span>Gestion Finance</a>
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
              <div class="page-title">Gestion Finance</div>
              <div class="page-sub">Suivi des bénéfices et finances de l'entreprise</div>
            </div>
          </div>
          <div class="stats-grid mt-4">
            <div class="stat-card">
              <div class="stat-icon green"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></span></div>
              <div class="stat-content">
                <div class="stat-label">Solde du Compte</div>
                <div id="kpi-benefices" class="stat-value">—</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon blue"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span></div>
              <div class="stat-content">
                <div class="stat-label">Bénéfice Ce mois</div>
                <div id="kpi-month" class="stat-value">—</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon orange"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span></div>
              <div class="stat-content">
                <div class="stat-label">Bénéfice Aujourd'hui</div>
                <div id="kpi-today" class="stat-value">—</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon red"><span class="icon icon-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg></span></div>
              <div class="stat-content">
                <div class="stat-label">Bénéfice Entreprise</div>
                <div id="kpi-avg" class="stat-value">—</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item active" data-tab="historique">Historique</button>
              <button class="tab-item" data-tab="ajout-salaire">Ajout de Salaire</button>
            </div>
          </div>

          <!-- Tab 1: Historique -->
          <div id="tab-historique" class="tab-content active">
            <div class="card mt-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-lg">Historique des transactions</h3>
                <select id="filter-finance" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm">
                  <option value="all">Tous</option>
                  <option value="benefice">Ajouts Solde du Compte</option>
                  <option value="salaire">Salaires</option>
                  <option value="depense">Retraits Solde du Compte</option>
                </select>
              </div>
              <div class="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody id="finance-tbody">
                    <tr><td class="py-3 text-center" colspan="4">Chargement…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tab 2: Ajout de Salaire -->
          <div id="tab-ajout-salaire" class="tab-content">
            <div class="card mt-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-lg">Ajouter une transaction</h3>
                <button id="btn-add-transaction" class="btn-primary flex items-center gap-2">
                  <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouvelle transaction
                </button>
              </div>
              <div class="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody id="transactions-tbody">
                    <tr><td class="py-3 text-center" colspan="4">Aucune transaction ajoutée manuellement</td></tr>
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

  // Fonction pour formater les nombres avec espaces (1 000, 10 000, etc.)
  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0,00';
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return integerPart + ',' + parts[1];
  }

  let currentTab = 'historique';

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
      if (tabId === 'historique') loadFinance();
      else if (tabId === 'ajout-salaire') loadTransactions();
    });
  });

  // Bouton ajouter transaction
  card.querySelector('#btn-add-transaction')?.addEventListener('click', () => {
    const body = `
      <div class="modal-field">
        <label>Type de transaction *</label>
        <select id="modal-transaction-type" required>
          <option value="benefice">Ajout Solde du Compte</option>
          <option value="depense">Retrait Solde du Compte</option>
        </select>
      </div>
      <div class="modal-field">
        <label>Montant *</label>
        <input id="modal-transaction-montant" type="number" min="0" step="0.01" required placeholder="0.00" />
      </div>
      <div class="modal-field">
        <label>Description</label>
        <input id="modal-transaction-desc" type="text" placeholder="Description de la transaction" />
      </div>
    `;
    createModal({
      title: 'Nouvelle transaction',
      body,
      confirmText: 'Ajouter',
      onConfirm: async () => {
        const fb = getFirebase();
        const type = document.getElementById('modal-transaction-type').value;
        const montant = parseFloat(document.getElementById('modal-transaction-montant').value);
        const description = document.getElementById('modal-transaction-desc').value.trim();
        if (!type || isNaN(montant) || montant <= 0) {
          alertModal({ title: 'Champs requis', message: 'Type et montant valides sont requis.', type: 'warning' });
          return;
        }
        try {
          await addDoc(collection(fb.db, 'finance'), {
            type,
            montant,
            description: description || `Transaction manuelle: ${type}`,
            date: serverTimestamp(),
            source: 'manuel'
          });
          await addLogEntry(fb, { 
            type: 'action', 
            action: 'finance_add', 
            category: 'finance',
            message: `Ajout d'une transaction ${type}: ${montant}€${description ? ` - ${description}` : ''}` 
          });
          loadFinance();
          if (currentTab === 'ajout-salaire') loadTransactions();
          alertModal({ title: 'Succès', message: 'Transaction ajoutée avec succès.', type: 'success' });
        } catch (e) { 
          alertModal({ title: 'Erreur', message: 'Erreur lors de la création de la transaction.', type: 'danger' });
          console.error(e); 
        }
      }
    });
  });

  async function loadTransactions() {
    try {
      const fb = getFirebase();
      const snap = await getDocs(query(collection(fb.db, 'finance'), orderBy('date', 'desc'), limit(100)));
      const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const tbody = document.getElementById('transactions-tbody');
      tbody.innerHTML = '';
      if (!transactions.length) {
        tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="4">Aucune transaction</td></tr>';
        return;
      }
      transactions.forEach(f => {
        const date = f.date?.toDate ? f.date.toDate() : new Date(f.date || new Date());
        const montant = f.montant || 0;
        const tr = document.createElement('tr');
        const typeLabel = f.type === 'benefice' ? 'Ajout Solde du Compte' : f.type === 'salaire' ? 'Salaire' : f.type === 'depense' ? 'Retrait Solde du Compte' : 'Dépense';
        tr.innerHTML = `
          <td>${formatDate(date)}</td>
          <td><span class="badge-role ${f.type === 'benefice' ? 'badge-actif' : f.type === 'salaire' ? 'badge-employe' : 'badge-inactif'}">${typeLabel}</span></td>
          <td>${f.description || '—'}</td>
          <td class="font-medium ${f.type === 'benefice' ? 'text-green-600' : 'text-red-600'}">${f.type === 'benefice' ? '+' : '-'}${formatNumber(montant)} €</td>`;
        tbody.appendChild(tr);
      });
    } catch (e) { console.error(e); }
  }

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

      loadFinance();
    } catch (e) { console.error(e); }
  })();

  async function loadFinance() {
    try {
      const fb = getFirebase();
      const snap = await getDocs(query(collection(fb.db, 'finance'), orderBy('date', 'desc'), limit(100)));
      const finance = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const tbody = document.getElementById('finance-tbody');
      tbody.innerHTML = '';
      
      let total = 0, month = 0, today = 0;
      const now = new Date();
      
      finance.forEach(f => {
        const date = f.date?.toDate ? f.date.toDate() : new Date(f.date || now);
        const montant = f.montant || 0;
        if (f.type === 'benefice') {
          total += montant;
          if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) month += montant;
          if (date.toDateString() === now.toDateString()) today += montant;
        } else if (f.type === 'salaire' || f.type === 'depense') {
          // Si salaire ajouté manuellement => entrée (positif). Sinon (auto) => sortie (négatif)
          // Les dépenses de flotte sont toujours des retraits
          const isManuel = (f.source === 'manuel');
          const delta = isManuel ? montant : -montant;
          total += delta;
          if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) month += delta;
          if (date.toDateString() === now.toDateString()) today += delta;
        }
        
        const tr = document.createElement('tr');
        const typeLabel = f.type === 'benefice' ? 'Ajout Solde du Compte' : f.type === 'salaire' ? 'Salaire' : f.type === 'depense' ? 'Retrait Solde du Compte' : 'Dépense';
        const isManuel = (f.type === 'salaire' && f.source === 'manuel');
        const isPositive = f.type === 'benefice' || isManuel;
        tr.innerHTML = `
          <td>${formatDate(date)}</td>
          <td><span class="badge-role ${isPositive ? 'badge-actif' : (f.type === 'salaire' ? 'badge-employe' : 'badge-inactif')}">${typeLabel}${isManuel ? ' (manuel)' : ''}</span></td>
          <td>${f.description || '—'}</td>
          <td class="font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}">${isPositive ? '+' : '-'}${formatNumber(montant)} €</td>`;
        tbody.appendChild(tr);
      });
      
      document.getElementById('kpi-benefices').textContent = formatNumber(total) + ' €';
      
      // Calculer les bénéfices nets : validation du traitement - validation de la vente
      // Bénéfice = (prixBourse * quantite) - (prixVente * quantite)
      let beneficeTotal = 0;
      let beneficeToday = 0;
      let beneficeMonth = 0;
      
      try {
        const ventesSnap = await getDocs(query(collection(fb.db, 'ventes'), where('statut', '==', 'traite')));
        const ventesTraitees = ventesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Charger les ressources pour obtenir les prix
        const ressourcesSnap = await getDocs(collection(fb.db, 'ressources'));
        const ressources = ressourcesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        ventesTraitees.forEach(v => {
          const ressource = ressources.find(r => r.id === v.typeRessourceId);
          if (ressource) {
            const prixBourse = ressource.prixBourse || 0;
            const prixVente = ressource.prixVente || ressource.prix || 0;
            const quantite = v.quantite || 0;
            // Bénéfice = bénéfice après traitement - salaire employé
            const beneficeTraitement = prixBourse * quantite;
            const salaireEmploye = prixVente * quantite;
            const beneficeNet = beneficeTraitement - salaireEmploye;
            
            beneficeTotal += beneficeNet;
            
            // Vérifier la date de traitement (updatedAt ou createdAt si pas de updatedAt)
            let dateTraitement = null;
            if (v.updatedAt) {
              dateTraitement = v.updatedAt.toDate ? v.updatedAt.toDate() : new Date(v.updatedAt);
            } else if (v.createdAt) {
              dateTraitement = v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
            }
            
            if (dateTraitement) {
              // Bénéfice aujourd'hui
              if (dateTraitement.toDateString() === now.toDateString()) {
                beneficeToday += beneficeNet;
              }
              // Bénéfice ce mois
              if (dateTraitement.getMonth() === now.getMonth() && dateTraitement.getFullYear() === now.getFullYear()) {
                beneficeMonth += beneficeNet;
              }
            }
          }
        });
      } catch (e) {
        console.error('Erreur calcul bénéfice:', e);
      }
      
      document.getElementById('kpi-month').textContent = formatNumber(beneficeMonth) + ' €';
      document.getElementById('kpi-today').textContent = formatNumber(beneficeToday) + ' €';
      document.getElementById('kpi-avg').textContent = formatNumber(beneficeTotal) + ' €';
      
      if (!finance.length) tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="4">Aucune transaction</td></tr>';
    } catch (e) { console.error(e); }
  }


  document.getElementById('filter-finance')?.addEventListener('change', (e) => {
    const filter = e.target.value;
    const rows = document.querySelectorAll('#finance-tbody tr');
    rows.forEach(tr => {
      if (filter === 'all') tr.style.display = '';
      else {
        const type = tr.querySelector('.badge-role')?.textContent.toLowerCase() || '';
        tr.style.display = (filter === 'benefice' && (type.includes('ajout solde') || type === 'bénéfice')) || (filter === 'salaire' && type === 'salaire') || (filter === 'depense' && (type.includes('retrait solde') || type === 'dépense')) ? '' : 'none';
      }
    });
  });
}

