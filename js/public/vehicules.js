import { html, mount } from '../utils.js';
import { getFirebase, getFlotteFirebase, waitForFirebase, waitForFlotteFirebase, collection, getDocs, query, orderBy } from '../firebase.js';

let allVehicules = [];
let filteredVehicules = [];
let currentPage = 1;
let currentView = 'table'; // 'table' ou 'card'
const itemsPerPage = 20; // Nombre raisonnable pour la pagination

export async function viewPublicVehicules(root) {
  const content = html`
    <section class="fade-in min-h-screen">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Liste des Véhicules A4L
          </h1>
          <p class="text-base md:text-lg text-slate-600 dark:text-slate-300">
            Découvrez notre catalogue complet de véhicules professionnels
          </p>
        </div>

        <!-- Barre de recherche et filtres -->
        <div class="card mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <!-- Recherche -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rechercher
              </label>
              <input 
                type="text" 
                id="search-input" 
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
                id="filter-type" 
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
                id="filter-prix" 
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
                id="sort-select" 
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
                id="reset-filters" 
                class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                title="Réinitialiser les filtres"
              >
                Réinitialiser
              </button>
            </div>
            <div id="stats-count" class="text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span id="filtered-count">0</span> véhicule(s) trouvé(s)
            </div>
          </div>
        </div>

        <!-- Boutons de vue -->
        <div class="mb-4 flex items-center gap-2">
          <button id="btn-view-table" class="view-toggle-btn active px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            Tableau
          </button>
          <button id="btn-view-card" class="view-toggle-btn px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            Cartes
          </button>
        </div>

        <!-- Vue Tableau -->
        <div id="vehicules-table-view" class="vehicules-view">
          <div class="card">
            <div class="user-table" style="max-height: 600px; overflow-y: auto; overflow-x: auto; position: relative;">
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
                  </tr>
                </thead>
                <tbody id="vehicules-tbody">
                  <tr>
                    <td colspan="8" class="py-3 text-center">Chargement des véhicules...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div id="pagination-container" class="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div class="text-sm text-slate-600 dark:text-slate-400">
                Page <span id="current-page">1</span> sur <span id="total-pages">1</span>
              </div>
              <div class="flex gap-2">
                <button id="prev-page" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Précédent
                </button>
                <button id="next-page" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Vue Cartes -->
        <div id="vehicules-card-view" class="vehicules-view hidden">
          <div id="vehicules-empty-card" class="py-10 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-white/10 rounded-lg card">
            Chargement…
          </div>
          <div id="vehicules-cards" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"></div>
          
          <!-- Pagination pour les cartes -->
          <div id="pagination-container-cards" class="mt-6 px-6 py-4 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-between">
            <div class="text-sm text-slate-600 dark:text-slate-400">
              Page <span id="current-page-cards">1</span> sur <span id="total-pages-cards">1</span>
            </div>
            <div class="flex gap-2">
              <button id="prev-page-cards" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Précédent
              </button>
              <button id="next-page-cards" class="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Suivant
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  `;

  mount(root, content);

  // Charger les véhicules depuis Firebase
  await loadVehicules();
  
  // Initialiser les événements
  setupFilters();
  setupPagination();
  setupViewToggle();
}

// Toggle vue card/tableau
function switchView(view) {
  currentView = view;
  
  const tableView = document.getElementById('vehicules-table-view');
  const cardView = document.getElementById('vehicules-card-view');
  const btnTable = document.getElementById('btn-view-table');
  const btnCard = document.getElementById('btn-view-card');
  
  if (view === 'table') {
    tableView?.classList.remove('hidden');
    cardView?.classList.add('hidden');
    btnTable?.classList.add('active');
    btnCard?.classList.remove('active');
    renderTable();
    updatePagination();
  } else {
    tableView?.classList.add('hidden');
    cardView?.classList.remove('hidden');
    btnTable?.classList.remove('active');
    btnCard?.classList.add('active');
    renderCards();
    updatePaginationCards();
  }
}

function setupViewToggle() {
  document.getElementById('btn-view-table')?.addEventListener('click', () => switchView('table'));
  document.getElementById('btn-view-card')?.addEventListener('click', () => switchView('card'));
}

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

async function loadVehicules() {
  try {
    const fb = getFlotteFirebase() || await waitForFlotteFirebase();
    if (!fb || !fb.db) {
      document.getElementById('vehicules-tbody').innerHTML = `
        <tr>
          <td colspan="8" class="py-3 text-center text-red-500">
            Erreur de connexion à la base de données
          </td>
        </tr>
      `;
      return;
    }

    const snap = await getDocs(query(collection(fb.db, 'flotte'), orderBy('createdAt', 'desc')));
    allVehicules = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(v => !v.vehiculeSourceId); // Seulement les véhicules sources (A4L)

    if (!allVehicules.length) {
      document.getElementById('vehicules-tbody').innerHTML = `
        <tr>
          <td colspan="8" class="py-3 text-center text-slate-500 dark:text-slate-400">
            Aucun véhicule disponible pour le moment
          </td>
        </tr>
      `;
      return;
    }

    // Remplir le filtre de type/marque
    const types = [...new Set(allVehicules.map(v => v.type).filter(Boolean))].sort();
    const typeSelect = document.getElementById('filter-type');
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeSelect.appendChild(option);
    });

    // Appliquer les filtres initiaux
    applyFilters();
    
  } catch (error) {
    console.error('Erreur lors du chargement des véhicules:', error);
    document.getElementById('vehicules-tbody').innerHTML = `
      <tr>
        <td colspan="8" class="py-3 text-center text-red-500">
          Erreur lors du chargement des véhicules
        </td>
      </tr>
    `;
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const filterType = document.getElementById('filter-type').value;
  const filterPrix = parseFloat(document.getElementById('filter-prix').value) || Infinity;
  const sortValue = document.getElementById('sort-select').value;

  // Filtrer
  filteredVehicules = allVehicules.filter(v => {
    const matchSearch = !searchTerm || 
      (v.type || '').toLowerCase().includes(searchTerm) ||
      (v.modele || '').toLowerCase().includes(searchTerm);
    
    const matchType = !filterType || v.type === filterType;
    const matchPrix = (v.prixAchat || 0) <= filterPrix;
    
    return matchSearch && matchType && matchPrix;
  });

  // Trier
  filteredVehicules.sort((a, b) => {
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
  document.getElementById('filtered-count').textContent = filteredVehicules.length;
  
  // Réinitialiser la page
  currentPage = 1;
  
  // Afficher les résultats selon la vue actuelle
  if (currentView === 'table') {
    renderTable();
    updatePagination();
  } else {
    renderCards();
    updatePaginationCards();
  }
}

function renderTable() {
  const tbody = document.getElementById('vehicules-tbody');
  
  if (!filteredVehicules.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-3 text-center text-slate-500 dark:text-slate-400">
          Aucun véhicule ne correspond à vos critères
        </td>
      </tr>
    `;
    return;
  }

  // Pagination
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageVehicules = filteredVehicules.slice(start, end);

  tbody.innerHTML = pageVehicules.map(v => {
    return `
      <tr>
        <td>${v.type || '—'}</td>
        <td>${v.modele || '—'}</td>
        <td>${formatNumber(v.nombrePlaces || 0)}</td>
        <td>${formatAmount(v.prixAchat || 0)} €</td>
        <td>${v.assuranceTier1 ? formatAmount(v.assuranceTier1) + ' €' : '—'}</td>
        <td>${v.assuranceTier2 ? formatAmount(v.assuranceTier2) + ' €' : '—'}</td>
        <td>${v.assuranceTier3 ? formatAmount(v.assuranceTier3) + ' €' : '—'}</td>
        <td>${v.assuranceTier4 ? formatAmount(v.assuranceTier4) + ' €' : '—'}</td>
      </tr>
    `;
  }).join('');
}

function setupFilters() {
  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('filter-type').addEventListener('change', applyFilters);
  document.getElementById('filter-prix').addEventListener('input', applyFilters);
  document.getElementById('sort-select').addEventListener('change', applyFilters);
  
  // Bouton réinitialiser
  document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-prix').value = '';
    document.getElementById('sort-select').value = 'prix-asc';
    applyFilters();
  });
}

function renderCards() {
  const cardsContainer = document.getElementById('vehicules-cards');
  const emptyState = document.getElementById('vehicules-empty-card');
  if (!cardsContainer || !emptyState) return;

  cardsContainer.innerHTML = '';
  
  if (!filteredVehicules.length) {
    emptyState.textContent = 'Aucun véhicule ne correspond à vos critères';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Pagination
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageVehicules = filteredVehicules.slice(start, end);

  pageVehicules.forEach(vehicule => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow';
    
    const hasAssurances = vehicule.assuranceTier1 || vehicule.assuranceTier2 || vehicule.assuranceTier3 || vehicule.assuranceTier4;
    
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">${vehicule.type || '—'}</div>
          <div class="text-xl font-semibold text-slate-900 dark:text-white mb-1">${vehicule.modele || '—'}</div>
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
    `;
    
    cardsContainer.appendChild(card);
  });
}

function setupPagination() {
  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      updatePagination();
    }
  });

  document.getElementById('next-page')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredVehicules.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      updatePagination();
    }
  });

  // Pagination pour les cartes
  document.getElementById('prev-page-cards')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderCards();
      updatePaginationCards();
    }
  });

  document.getElementById('next-page-cards')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredVehicules.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderCards();
      updatePaginationCards();
    }
  });
}

function updatePaginationCards() {
  const totalPages = Math.ceil(filteredVehicules.length / itemsPerPage);
  document.getElementById('current-page-cards').textContent = currentPage;
  document.getElementById('total-pages-cards').textContent = totalPages || 1;
  
  document.getElementById('prev-page-cards').disabled = currentPage === 1;
  document.getElementById('next-page-cards').disabled = currentPage >= totalPages;
}

function updatePagination() {
  const totalPages = Math.ceil(filteredVehicules.length / itemsPerPage);
  document.getElementById('current-page').textContent = currentPage;
  document.getElementById('total-pages').textContent = totalPages || 1;
  
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage >= totalPages || totalPages === 0;
}

