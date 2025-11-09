    import { html, mount, createModal, getCachedProfile, loadUserProfile, updateNavPermissions, alertModal, updateAvatar, isAuthenticated, updateRoleBadge } from '../utils.js'
import { getFirebase, getFlotteFirebase, waitForFirebase, collection, getDocs, getDoc, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, signOut } from '../firebase.js';
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
              <div class="page-title">Gestion de la Flotte</div>
              <div class="page-sub">Gérez les véhicules de l'entreprise (camions, etc.)</div>
            </div>
            <button id="btn-new-vehicule" class="btn-primary flex items-center gap-2">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span> Nouveau véhicule
            </button>
          </div>

          <!-- Statistiques -->
          <div class="stats-grid mb-4">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"></path>
                  <polygon points="12 15 17 21 7 21 12 15"></polygon>
                </svg>
              </div>
              <div>
                <div class="stat-label">Total</div>
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
                <div class="stat-label">Capacité</div>
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
                <div class="stat-label">Valeur</div>
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
                <div class="stat-label">Actifs</div>
                <div id="stat-assurances-actives" class="stat-value">0</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item active" data-tab="liste-a4l">Liste des véhicules A4L</button>
              <button class="tab-item" data-tab="flotte-ms-corp">Flotte MS Corp</button>
              <button class="tab-item" data-tab="comparateur">Comparateur véhicule</button>
            </div>
          </div>

          <!-- Tab 1: Liste des véhicules A4L -->
          <div id="tab-liste-a4l" class="tab-content active">
            <!-- Barre de recherche et filtres -->
            <div class="card mb-4 mt-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <!-- Recherche -->
                <div class="lg:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Rechercher
                  </label>
                  <input 
                    type="text" 
                    id="flotte-search-input" 
                    placeholder="Marque, modèle, type..."
                    class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- Filtre Type/Marque -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type/Marque
                  </label>
                  <select 
                    id="flotte-filter-type" 
                    class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                  </select>
                </div>

                <!-- Filtre Prix -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Prix max
                  </label>
                  <input 
                    type="number" 
                    id="flotte-filter-prix" 
                    placeholder="Prix maximum"
                    class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Tri et statistiques -->
              <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <div class="flex items-center gap-4 flex-wrap">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Trier par:</label>
                  <select 
                    id="flotte-sort-select" 
                    class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="prix-asc">Prix croissant</option>
                    <option value="prix-desc">Prix décroissant</option>
                    <option value="marque-asc">Marque A-Z</option>
                    <option value="marque-desc">Marque Z-A</option>
                    <option value="places-asc">Places croissant</option>
                    <option value="places-desc">Places décroissant</option>
                  </select>
                  <button 
                    id="flotte-reset-filters" 
                    class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                    title="Réinitialiser les filtres"
                  >
                    Réinitialiser
                  </button>
                </div>
                <div id="flotte-stats-count" class="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <span id="flotte-filtered-count">0</span> véhicule(s) trouvé(s)
                </div>
              </div>
            </div>

            <!-- Toggle vue card/tableau -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-lg">Véhicules disponibles</h3>
              <div class="flex items-center gap-2">
                <button id="btn-delete-all-a4l" class="px-3 py-1.5 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2" title="Supprimer tous les véhicules A4L">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                  </svg>
                  Supprimer tout A4L
                </button>
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
              <div class="user-table" style="max-height: calc(100vh - 500px); min-height: 400px; overflow-y: auto; overflow-x: auto; position: relative;">
                <table style="width: 100%;">
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

          <!-- Tab 2: Comparateur véhicule -->
          <div id="tab-comparateur" class="tab-content">
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
                      id="comparateur-search" 
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
                      id="comparateur-filter-type" 
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
                      id="comparateur-filter-prix" 
                      placeholder="Prix maximum"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                <!-- Boutons d'action rapide -->
                <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                  <button 
                    id="comparateur-add-all" 
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Ajouter tous les résultats
                  </button>
                  <button 
                    id="comparateur-clear-filters" 
                    class="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    Réinitialiser filtres
                  </button>
                  <button 
                    id="comparateur-clear-all" 
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
                    id="comparateur-select" 
                    class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Choisir un véhicule --</option>
                  </select>
                  <button 
                    id="comparateur-add-selected" 
                    class="mt-2 w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Ajouter au comparateur
                  </button>
                </div>
              </div>

              <!-- Liste des véhicules filtrés avec cases à cocher -->
              <div id="comparateur-filtered-list" class="mb-6 hidden">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Véhicules disponibles (<span id="comparateur-filtered-count">0</span>)
                  </h4>
                  <div class="flex items-center gap-2">
                    <button 
                      id="comparateur-select-all" 
                      class="px-2 py-1 rounded text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                    >
                      Tout sélectionner
                    </button>
                    <button 
                      id="comparateur-add-selected-multiple" 
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Ajouter sélectionnés
                    </button>
                  </div>
                </div>
                <div id="comparateur-filtered-items" class="max-h-80 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-lg p-3 space-y-2 bg-white dark:bg-white/5"></div>
              </div>

              <!-- Liste des véhicules sélectionnés -->
              <div class="mb-6">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Véhicules dans le comparateur (<span id="comparateur-selected-count">0</span>)
                </h4>
                <div id="comparateur-selected" class="space-y-3">
                  <p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Aucun véhicule sélectionné. Utilisez les filtres ci-dessus pour ajouter des véhicules.
                  </p>
                </div>
              </div>

              <!-- Tableau de comparaison -->
              <div id="comparateur-table-container" class="hidden">
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
                    <tbody id="comparateur-tbody"></tbody>
                    <tfoot id="comparateur-totals" class="bg-slate-50 dark:bg-white/5 font-semibold">
                      <!-- Les totaux seront générés ici -->
                    </tfoot>
                  </table>
                </div>
              </div>

              <!-- Résumé global -->
              <div id="comparateur-summary" class="hidden mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Total véhicules</div>
                  <div id="summary-total-vehicules" class="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Prix total</div>
                  <div id="summary-prix-total" class="text-2xl font-bold text-blue-600 dark:text-blue-400">0 €</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Places totales</div>
                  <div id="summary-places-totales" class="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Assurances totales</div>
                  <div id="summary-assurances-totales" class="text-2xl font-bold text-purple-600 dark:text-purple-400">0 €</div>
                </div>
                <div class="card p-4">
                  <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Total avec assurances</div>
                  <div id="summary-total-avec-assurances" class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0 €</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: Flotte MS Corp -->
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
  let filteredFlotte = [];
  let flotteAcheteeCache = [];
  let currentView = localStorage.getItem('flotte-view') || 'table'; // 'table' ou 'card'
  let currentTab = localStorage.getItem('flotte-tab') || 'liste-a4l'; // 'liste-a4l', 'flotte-ms-corp' ou 'comparateur'
  let comparateurVehicules = []; // [{vehicule, quantite}]

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
      renderFlotteTable();
    } else {
      tableView?.classList.add('hidden');
      cardView?.classList.remove('hidden');
      btnTable?.classList.remove('active');
      btnCard?.classList.add('active');
      renderFlotteCards();
    }
  }

  document.getElementById('btn-view-table')?.addEventListener('click', () => switchView('table'));
  document.getElementById('btn-view-card')?.addEventListener('click', () => switchView('card'));
  
  // Configurer les event listeners pour les filtres
  function setupFlotteFilters() {
    const searchInput = document.getElementById('flotte-search-input');
    const filterType = document.getElementById('flotte-filter-type');
    const filterPrix = document.getElementById('flotte-filter-prix');
    const sortSelect = document.getElementById('flotte-sort-select');
    const resetBtn = document.getElementById('flotte-reset-filters');
    
    if (searchInput) searchInput.addEventListener('input', applyFiltersFlotte);
    if (filterType) filterType.addEventListener('change', applyFiltersFlotte);
    if (filterPrix) filterPrix.addEventListener('input', applyFiltersFlotte);
    if (sortSelect) sortSelect.addEventListener('change', applyFiltersFlotte);
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterType) filterType.value = '';
        if (filterPrix) filterPrix.value = '';
        if (sortSelect) sortSelect.value = 'prix-asc';
        applyFiltersFlotte();
      });
    }
  }
  
  // Supprimer tous les véhicules A4L
  document.getElementById('btn-delete-all-a4l')?.addEventListener('click', async () => {
    const a4lVehicules = flotteCache.filter(v => !v.vehiculeSourceId);
    const count = a4lVehicules.length;
    
    if (count === 0) {
      alertModal({
        title: 'Aucun véhicule',
        message: 'Il n\'y a aucun véhicule A4L à supprimer.',
        type: 'info'
      });
      return;
    }
    
    const confirmed = await new Promise((resolve) => {
      createModal({
        title: 'Supprimer tous les véhicules A4L',
        body: `
          <div style="padding: 1rem 0;">
            <p style="margin-bottom: 1rem; color: rgb(239,68,68); font-weight: 600;">
              ⚠️ Attention : Cette action est irréversible !
            </p>
            <p style="margin-bottom: 0.5rem;">
              Vous êtes sur le point de supprimer <strong>${count} véhicule(s) A4L</strong>.
            </p>
            <p style="color: rgb(100,116,139); font-size: 0.875rem;">
              Les véhicules achetés (Flotte MS Corp) ne seront pas affectés.
            </p>
          </div>
        `,
        confirmText: 'Supprimer tout',
        cancelText: 'Annuler',
        confirmStyle: 'background: rgb(239,68,68); color: white;',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
    
    if (!confirmed) return;
    
    try {
      const fb = getFlotteFirebase();
      if (!fb || !fb.db) {
        alertModal({ title: 'Erreur', message: 'Erreur de connexion à la base de données.', type: 'danger' });
        return;
      }
      
      let deleted = 0;
      let errors = 0;
      
      // Afficher un modal de progression
      const progressModal = createModal({
        title: 'Suppression en cours...',
        body: `<div style="padding: 1rem 0; text-align: center;">
          <div style="margin-bottom: 1rem;">Suppression de ${count} véhicule(s)...</div>
          <div id="delete-progress" style="font-size: 0.875rem; color: rgb(100,116,139);">0/${count}</div>
        </div>`,
        confirmText: '',
        cancelText: '',
        isView: true
      });
      
      // Supprimer chaque véhicule
      for (const vehicule of a4lVehicules) {
        try {
          await deleteDoc(doc(fb.db, 'flotte', vehicule.id));
          deleted++;
          
          // Mettre à jour la progression
          const progressEl = document.getElementById('delete-progress');
          if (progressEl) {
            progressEl.textContent = `${deleted}/${count}`;
          }
        } catch (error) {
          console.error(`Erreur suppression véhicule ${vehicule.id}:`, error);
          errors++;
        }
      }
      
      // Fermer le modal de progression
      const modalBackdrop = document.querySelector('.modal-backdrop');
      if (modalBackdrop) {
        modalBackdrop.classList.remove('show');
        modalBackdrop.remove();
      }
      
      // Log de l'action
      await addLogEntry(fb, {
        type: 'action',
        action: 'flotte_delete_all_a4l',
        category: 'flotte',
        message: `Suppression de ${deleted} véhicule(s) A4L`
      });
      
      // Recharger les données
      await loadFlotte();
      if (currentView === 'card') {
        loadFlotteCards();
      }
      await loadStats();
      
      if (errors > 0) {
        alertModal({
          title: 'Suppression partielle',
          message: `${deleted} véhicule(s) supprimé(s) avec succès. ${errors} erreur(s) rencontrée(s).`,
          type: 'warning'
        });
      } else {
        alertModal({
          title: 'Succès',
          message: `${deleted} véhicule(s) A4L supprimé(s) avec succès.`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alertModal({
        title: 'Erreur',
        message: 'Erreur lors de la suppression des véhicules.',
        type: 'danger'
      });
    }
  });
  
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
        } else if (tabId === 'comparateur') {
          // Attendre que la flotte soit chargée si nécessaire
          if (flotteCache.length === 0) {
            loadFlotte().then(() => {
              setTimeout(() => setupComparateur(), 100);
            });
          } else {
            setupComparateur();
          }
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
      } else if (currentTab === 'comparateur') {
        setupComparateur();
      }
      
      // Configurer les event listeners pour les filtres
      setupFlotteFilters();
    } catch (e) { 
      console.error(e); 
    }
  })();

  async function loadStats() {
    try {
      const fb = getFlotteFirebase();
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
      const fb = getFlotteFirebase();
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
      
      // Remplir le select des types
      const typeSelect = document.getElementById('flotte-filter-type');
      if (typeSelect) {
        const types = [...new Set(vehicules.map(v => v.type).filter(Boolean))].sort();
        // Garder seulement l'option "Tous"
        typeSelect.innerHTML = '<option value="">Tous</option>';
        types.forEach(type => {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          typeSelect.appendChild(option);
        });
      }
      
      // Appliquer les filtres initiaux
      applyFiltersFlotte();
      
      // Charger les stats
      loadStats();
      
      // Si on est sur l'onglet comparateur, l'initialiser
      if (currentTab === 'comparateur') {
        setTimeout(() => setupComparateur(), 100);
      }
    } catch (e) { 
      console.error(e); 
    }
  }

  // Fonction pour appliquer les filtres
  function applyFiltersFlotte() {
    const searchTerm = document.getElementById('flotte-search-input')?.value.toLowerCase() || '';
    const filterType = document.getElementById('flotte-filter-type')?.value || '';
    const filterPrix = parseFloat(document.getElementById('flotte-filter-prix')?.value) || Infinity;
    const sortValue = document.getElementById('flotte-sort-select')?.value || 'prix-asc';

    // Filtrer
    filteredFlotte = flotteCache.filter(v => {
      const matchSearch = !searchTerm || 
        (v.type || '').toLowerCase().includes(searchTerm) ||
        (v.modele || '').toLowerCase().includes(searchTerm);
      
      const matchType = !filterType || v.type === filterType;
      const matchPrix = (v.prixAchat || 0) <= filterPrix;
      
      return matchSearch && matchType && matchPrix;
    });

    // Trier
    filteredFlotte.sort((a, b) => {
      switch(sortValue) {
        case 'prix-asc':
          return (a.prixAchat || 0) - (b.prixAchat || 0);
        case 'prix-desc':
          return (b.prixAchat || 0) - (a.prixAchat || 0);
        case 'marque-asc':
          return (a.type || '').localeCompare(b.type || '');
        case 'marque-desc':
          return (b.type || '').localeCompare(a.type || '');
        case 'places-asc':
          return (a.nombrePlaces || 0) - (b.nombrePlaces || 0);
        case 'places-desc':
          return (b.nombrePlaces || 0) - (a.nombrePlaces || 0);
        default:
          return 0;
      }
    });

    // Mettre à jour le compteur
    const countEl = document.getElementById('flotte-filtered-count');
    if (countEl) countEl.textContent = filteredFlotte.length;
    
    // Afficher les résultats selon la vue actuelle
    if (currentView === 'table') {
      renderFlotteTable();
    } else {
      renderFlotteCards();
    }
  }

  // Fonction pour rendre le tableau filtré
  function renderFlotteTable() {
    const tbody = document.getElementById('flotte-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!filteredFlotte.length) {
      tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="9">Aucun véhicule ne correspond à vos critères</td></tr>';
      return;
    }
    
    filteredFlotte.forEach(v => {
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
  }

  // Fonction pour rendre les cartes filtrées
  function renderFlotteCards() {
    loadFlotteCards();
  }

  // Fonction pour vérifier et renouveler automatiquement les assurances expirées
  async function checkAndRenewAssurances() {
    try {
      const fb = getFlotteFirebase();
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
      
      const fb = getFlotteFirebase();
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
      
      if (!filteredFlotte || filteredFlotte.length === 0) {
        emptyState.textContent = filteredFlotte.length === 0 && flotteCache.length > 0 ? 'Aucun véhicule ne correspond à vos critères' : 'Aucun véhicule';
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');

      filteredFlotte.forEach(vehicule => {
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
            <option value="Van">Van</option>
            <option value="Pick-up">Pick-up</option>
            <option value="SUV">SUV</option>
            <option value="Berline">Berline</option>
            <option value="Break">Break</option>
            <option value="Monospace">Monospace</option>
            <option value="Cabriolet">Cabriolet</option>
            <option value="Coupé">Coupé</option>
            <option value="Moto">Moto</option>
            <option value="Scooter">Scooter</option>
            <option value="Quad">Quad</option>
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
        const fb = getFlotteFirebase();
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
          
          // Utiliser la première base pour les logs
          const fbMain = getFirebase();
          await addLogEntry(fbMain, { 
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
            <option value="Van" ${vehicule.type === 'Van' ? 'selected' : ''}>Van</option>
            <option value="Pick-up" ${vehicule.type === 'Pick-up' ? 'selected' : ''}>Pick-up</option>
            <option value="SUV" ${vehicule.type === 'SUV' ? 'selected' : ''}>SUV</option>
            <option value="Berline" ${vehicule.type === 'Berline' ? 'selected' : ''}>Berline</option>
            <option value="Break" ${vehicule.type === 'Break' ? 'selected' : ''}>Break</option>
            <option value="Monospace" ${vehicule.type === 'Monospace' ? 'selected' : ''}>Monospace</option>
            <option value="Cabriolet" ${vehicule.type === 'Cabriolet' ? 'selected' : ''}>Cabriolet</option>
            <option value="Coupé" ${vehicule.type === 'Coupé' ? 'selected' : ''}>Coupé</option>
            <option value="Moto" ${vehicule.type === 'Moto' ? 'selected' : ''}>Moto</option>
            <option value="Scooter" ${vehicule.type === 'Scooter' ? 'selected' : ''}>Scooter</option>
            <option value="Quad" ${vehicule.type === 'Quad' ? 'selected' : ''}>Quad</option>
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
            
            // Utiliser la première base pour la finance
            const fbMain = getFirebase();
            // Créer la transaction financière (retrait)
            await addDoc(collection(fbMain.db, 'finance'), {
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

  // ========== COMPARATEUR VÉHICULE ==========
  
  let comparateurFilteredVehicules = []; // Véhicules filtrés actuellement affichés
  
  function setupComparateur() {
    // Remplir le select des types
    const typeSelect = document.getElementById('comparateur-filter-type');
    if (typeSelect && flotteCache.length > 0) {
      const types = [...new Set(flotteCache.map(v => v.type).filter(Boolean))].sort();
      typeSelect.innerHTML = '<option value="">Tous</option>';
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
      });
    }
    
    // Remplir le select des véhicules
    updateComparateurSelect();
    
    // Event listeners pour les filtres
    const searchInput = document.getElementById('comparateur-search');
    const filterType = document.getElementById('comparateur-filter-type');
    const filterPrix = document.getElementById('comparateur-filter-prix');
    
    const applyFilters = () => {
      const query = (searchInput?.value || '').toLowerCase().trim();
      const typeFilter = filterType?.value || '';
      const prixFilter = parseFloat(filterPrix?.value) || Infinity;
      
      comparateurFilteredVehicules = flotteCache.filter(v => {
        const matchSearch = !query || 
          (v.type || '').toLowerCase().includes(query) ||
          (v.modele || '').toLowerCase().includes(query);
        const matchType = !typeFilter || v.type === typeFilter;
        const matchPrix = (v.prixAchat || 0) <= prixFilter;
        
        return matchSearch && matchType && matchPrix;
      });
      
      updateComparateurFilteredList();
      updateComparateurSelect();
    };
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterType) filterType.addEventListener('change', applyFilters);
    if (filterPrix) filterPrix.addEventListener('input', applyFilters);
    
    // Bouton ajouter depuis le select
    const addSelectedBtn = document.getElementById('comparateur-add-selected');
    if (addSelectedBtn) {
      addSelectedBtn.addEventListener('click', () => {
        const select = document.getElementById('comparateur-select');
        const vehiculeId = select?.value;
        if (vehiculeId) {
          window.addToComparateur(vehiculeId);
          if (select) select.value = '';
        }
      });
    }
    
    // Bouton ajouter tous les résultats
    const addAllBtn = document.getElementById('comparateur-add-all');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', () => {
        comparateurFilteredVehicules.forEach(v => {
          if (!comparateurVehicules.some(cv => cv.vehicule.id === v.id)) {
            comparateurVehicules.push({ vehicule: v, quantite: 1, assuranceTier: null });
          }
        });
        updateComparateurDisplay();
      });
    }
    
    // Bouton réinitialiser filtres
    const clearFiltersBtn = document.getElementById('comparateur-clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterType) filterType.value = '';
        if (filterPrix) filterPrix.value = '';
        applyFilters();
      });
    }
    
    // Bouton vider le comparateur
    const clearAllBtn = document.getElementById('comparateur-clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir vider le comparateur ?')) {
          comparateurVehicules = [];
          updateComparateurDisplay();
        }
      });
    }
    
    // Bouton tout sélectionner
    const selectAllBtn = document.getElementById('comparateur-select-all');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#comparateur-filtered-items input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
      });
    }
    
    // Bouton ajouter sélectionnés
    const addSelectedMultipleBtn = document.getElementById('comparateur-add-selected-multiple');
    if (addSelectedMultipleBtn) {
      addSelectedMultipleBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#comparateur-filtered-items input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
          const vehiculeId = cb.value;
          if (!comparateurVehicules.some(cv => cv.vehicule.id === vehiculeId)) {
            const vehicule = flotteCache.find(v => v.id === vehiculeId);
            if (vehicule) {
              comparateurVehicules.push({ vehicule: vehicule, quantite: 1, assuranceTier: null });
            }
          }
        });
        updateComparateurDisplay();
        // Décocher toutes les cases
        document.querySelectorAll('#comparateur-filtered-items input[type="checkbox"]').forEach(cb => cb.checked = false);
      });
    }
    
    // Initialiser avec tous les véhicules
    comparateurFilteredVehicules = [...flotteCache];
    updateComparateurFilteredList();
    updateComparateurDisplay();
  }
  
  function updateComparateurSelect() {
    const select = document.getElementById('comparateur-select');
    if (!select) return;
    
    // Garder l'option par défaut
    select.innerHTML = '<option value="">-- Choisir un véhicule --</option>';
    
    // Ajouter les véhicules filtrés (non déjà ajoutés)
    comparateurFilteredVehicules.forEach(v => {
      const isAlreadyAdded = comparateurVehicules.some(cv => cv.vehicule.id === v.id);
      if (!isAlreadyAdded) {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.type || '—'} ${v.modele || '—'} - ${formatAmount(v.prixAchat || 0)} €`;
        select.appendChild(option);
      }
    });
  }
  
  function updateComparateurFilteredList() {
    const container = document.getElementById('comparateur-filtered-list');
    const itemsContainer = document.getElementById('comparateur-filtered-items');
    const countEl = document.getElementById('comparateur-filtered-count');
    
    if (!container || !itemsContainer || !countEl) return;
    
    if (comparateurFilteredVehicules.length === 0) {
      container.classList.add('hidden');
      return;
    }
    
    container.classList.remove('hidden');
    countEl.textContent = comparateurFilteredVehicules.length;
    
    itemsContainer.innerHTML = comparateurFilteredVehicules.map(v => {
      const isAlreadyAdded = comparateurVehicules.some(cv => cv.vehicule.id === v.id);
      const hasAssurances = v.assuranceTier1 || v.assuranceTier2 || v.assuranceTier3 || v.assuranceTier4;
      
      return `
        <div class="comparateur-vehicle-item p-4 rounded-xl border ${isAlreadyAdded ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5'} hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-start gap-4 cursor-pointer" onclick="if(!this.querySelector('input').disabled) this.querySelector('input').click()">
          <label class="custom-checkbox-wrapper flex-shrink-0 mt-0.5 cursor-pointer">
            <input 
              type="checkbox" 
              value="${v.id}" 
              id="comparateur-checkbox-${v.id}"
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
  window.addToComparateur = function(vehiculeId) {
    const vehicule = flotteCache.find(v => v.id === vehiculeId);
    if (!vehicule) return;
    
    // Vérifier si déjà ajouté
    if (comparateurVehicules.some(cv => cv.vehicule.id === vehiculeId)) {
      alertModal({ 
        title: 'Information', 
        message: 'Ce véhicule est déjà dans le comparateur.', 
        type: 'info' 
      });
      return;
    }
    
    comparateurVehicules.push({
      vehicule: vehicule,
      quantite: 1,
      assuranceTier: null
    });
    
    updateComparateurDisplay();
  };
  
  function updateComparateurDisplay() {
    const selectedContainer = document.getElementById('comparateur-selected');
    const selectedCountEl = document.getElementById('comparateur-selected-count');
    const tableContainer = document.getElementById('comparateur-table-container');
    const summaryContainer = document.getElementById('comparateur-summary');
    const tbody = document.getElementById('comparateur-tbody');
    const totalsFoot = document.getElementById('comparateur-totals');
    
    if (!selectedContainer || !tableContainer || !summaryContainer || !tbody || !totalsFoot) return;
    
    // Mettre à jour le compteur
    if (selectedCountEl) selectedCountEl.textContent = comparateurVehicules.length;
    
    // Mettre à jour le select et la liste filtrée
    updateComparateurSelect();
    updateComparateurFilteredList();
    
    if (comparateurVehicules.length === 0) {
      selectedContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Aucun véhicule sélectionné. Utilisez les filtres ci-dessus pour ajouter des véhicules.</p>';
      tableContainer.classList.add('hidden');
      summaryContainer.classList.add('hidden');
      return;
    }
    
    // Afficher les véhicules sélectionnés
    selectedContainer.innerHTML = comparateurVehicules.map((cv, index) => {
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
              onclick="window.removeFromComparateur(${index})"
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
                onchange="window.updateComparateurQuantite(${index}, this.value)"
              />
            </div>
            
            ${hasAssurances ? `
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Assurance</label>
              <select 
                class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onchange="window.updateComparateurAssurance(${index}, this.value); event.stopPropagation();"
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
    
    tbody.innerHTML = comparateurVehicules.map((cv, index) => {
      const v = cv.vehicule;
      const qty = cv.quantite || 1;
      const prixUnitaire = v.prixAchat || 0;
      const prixTotal = prixUnitaire * qty;
      const placesTotal = (v.nombrePlaces || 0) * qty;
      
      // Calculer l'assurance sélectionnée
      let assuranceMontant = 0;
      let assuranceLabel = 'Aucune';
      if (cv.assuranceTier) {
        // cv.assuranceTier est "Tier1", "Tier2", "Tier3" ou "Tier4"
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
              onchange="window.updateComparateurQuantite(${index}, this.value)"
            />
          </td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatAmount(prixUnitaire)} €</td>
          <td class="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">${formatAmount(prixTotal)} €</td>
          <td class="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">${formatNumber(placesTotal)}</td>
          <td class="px-4 py-3 text-center text-sm">
            <select 
              class="px-2 py-1 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              onchange="window.updateComparateurAssurance(${index}, this.value); event.stopPropagation();"
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
              onclick="window.removeFromComparateur(${index})"
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
    
    totalsFoot.innerHTML = `
      <tr class="bg-slate-100 dark:bg-white/10">
        <td class="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">TOTAL</td>
        <td class="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">${totalVehicules}</td>
        <td class="px-4 py-3 text-right text-sm text-slate-500 dark:text-slate-400">—</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">${formatAmount(totalPrix)} €</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">${formatNumber(totalPlaces)}</td>
        <td class="px-4 py-3 text-center text-sm text-slate-500 dark:text-slate-400">—</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-purple-600 dark:text-purple-400">${totalAssurances > 0 ? formatAmount(totalAssurances) + ' €' : '—'}</td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400 text-lg">${formatAmount(totalAvecAssurances)} €</td>
        <td class="px-4 py-3"></td>
      </tr>
    `;
    
    // Mettre à jour le résumé
    document.getElementById('summary-total-vehicules').textContent = totalVehicules;
    document.getElementById('summary-prix-total').textContent = formatAmount(totalPrix) + ' €';
    document.getElementById('summary-places-totales').textContent = formatNumber(totalPlaces);
    document.getElementById('summary-assurances-totales').textContent = formatAmount(totalAssurances) + ' €';
    const totalAvecAssurancesEl = document.getElementById('summary-total-avec-assurances');
    if (totalAvecAssurancesEl) totalAvecAssurancesEl.textContent = formatAmount(totalAvecAssurances) + ' €';
  }
  
  // Fonction globale pour mettre à jour la quantité
  window.updateComparateurQuantite = function(index, quantite) {
    const qty = parseInt(quantite) || 1;
    if (qty < 1) return;
    
    if (comparateurVehicules[index]) {
      comparateurVehicules[index].quantite = qty;
      updateComparateurDisplay();
    }
  };
  
  // Fonction globale pour mettre à jour l'assurance
  window.updateComparateurAssurance = function(index, assuranceTier) {
    if (comparateurVehicules[index]) {
      comparateurVehicules[index].assuranceTier = assuranceTier || null;
      // Forcer la mise à jour immédiate
      updateComparateurDisplay();
    }
  };
  
  // Fonction globale pour retirer un véhicule
  window.removeFromComparateur = function(index) {
    comparateurVehicules.splice(index, 1);
    updateComparateurDisplay();
    
    // Réinitialiser la recherche si nécessaire
    const searchInput = document.getElementById('comparateur-search');
    if (searchInput && searchInput.value) {
      searchInput.dispatchEvent(new Event('input'));
    }
  };

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
      
      const fb = getFlotteFirebase();
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
      const fb = getFlotteFirebase();
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
      const fb = getFlotteFirebase();
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

