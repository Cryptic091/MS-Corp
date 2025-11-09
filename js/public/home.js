import { html, mount } from '../utils.js';

export function viewPublicHome(root) {
  const content = html`
    <section class="fade-in">
      <!-- Hero Section sobre -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            MS Corp
          </h1>
          <p class="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Solutions professionnelles pour la gestion de flotte et d'entreprise
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <a href="#/public/vehicules" class="btn-primary px-6 py-3 rounded-lg">
              Voir nos véhicules
            </a>
            <a href="#/public/login" class="px-6 py-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
              Espace client
            </a>
          </div>
        </div>
      </div>

      <!-- Section Services simplifiée -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid md:grid-cols-2 gap-6 mb-12">
          <!-- Service 1 -->
          <div class="card p-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-blue-600 dark:text-blue-400">
                  <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1"></path>
                  <polygon points="12 15 17 21 7 21 12 15"></polygon>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Gestion de Flotte</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Catalogue complet de véhicules A4L avec options d'assurance adaptées.
                </p>
                <a href="#/public/vehicules" class="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Découvrir →
                </a>
              </div>
            </div>
          </div>

          <!-- Service 2 -->
          <div class="card p-6">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-green-600 dark:text-green-400">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 010 7.75"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Solutions Entreprise</h3>
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Outils de gestion pour employés, ventes et finances.
                </p>
                <a href="#/public/login" class="text-sm text-green-600 dark:text-green-400 font-medium hover:underline">
                  Accéder →
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Véhicules sobre -->
        <div class="card p-8 text-center">
          <h2 class="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
            Véhicules A4L
          </h2>
          <p class="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto">
            Explorez notre sélection de véhicules professionnels avec des options d'assurance adaptées.
          </p>
          <a href="#/public/vehicules" class="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg">
            <span>Voir tous les véhicules</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  `;

  mount(root, content);
}
