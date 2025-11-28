import { html, mount, getCachedProfile, loadUserProfile, updateAvatar, isAuthenticated, alertModal, updateNavPermissions, updateRoleBadge, applyPagePermissions } from '../utils.js';
import { getFirebase, waitForFirebase, collection, getDocs, signOut } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

export function viewCalcul(root) {
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
            <div
              id="sb-role"
              class="badge-role badge-employe mt-2 inline-block text-xs"
              data-role-field="roleEntreprise"
              data-default-label="Sans rôle"
              data-empty-label="Sans rôle"
              data-role-class="badge-employe"
            >Employé</div>
          </a>
          <div class="section-title">Entreprise</div>
          <nav class="nav-links">
            <a href="#/entreprise" class="nav-item"><span class="nav-icon"></span>Gestion Employé</a>
            <a href="#/entreprise/centrale" class="nav-item"><span class="nav-icon"></span>Suivi Effectif</a>
            <a href="#/entreprise/ventes" class="nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
            <a href="#/entreprise/flotte" class="nav-item"><span class="nav-icon"></span>Gestion Flotte</a>
            <a href="#/entreprise/calcul" class="active nav-item"><span class="nav-icon"></span>Calculateur CA</a>
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
              <div class="page-title">Calculateur de Chiffre d'Affaires</div>
              <div class="page-sub">Estimez votre chiffre d'affaires potentiel selon vos ressources</div>
            </div>
          </div>

          <div class="card mb-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Paramètres de calcul</h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">Sélectionnez une ressource et indiquez la quantité disponible pour calculer le chiffre d'affaires potentiel.</p>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mode de calcul *</label>
              <div class="flex gap-2">
                <button id="calc-mode-quantite" class="calc-mode-btn active flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium transition-colors" data-mode="quantite">
                  Quantité directe
                </button>
                <button id="calc-mode-camions" class="calc-mode-btn flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium transition-colors" data-mode="camions">
                  Par camions
                </button>
              </div>
            </div>
            
            <div id="calc-form-quantite">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="modal-field">
                  <label>Type de ressource *</label>
                  <select id="calc-ressource" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" required>
                    <option value="">Sélectionnez une ressource</option>
                  </select>
                </div>
                
                <div class="modal-field">
                  <label>Type d'objet *</label>
                  <select id="calc-type-objet" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" required>
                    <option value="brut">Brut</option>
                    <option value="traite">Traité</option>
                  </select>
                </div>
                
                <div class="modal-field">
                  <label>Quantité disponible *</label>
                  <input id="calc-quantite" type="number" min="1" step="1" required placeholder="0" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" />
                </div>
              </div>
            </div>

            <div id="calc-form-camions" class="hidden">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="modal-field">
                  <label>Type de ressource *</label>
                  <select id="calc-ressource-camions" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" required>
                    <option value="">Sélectionnez une ressource</option>
                  </select>
                </div>
                
                <div class="modal-field">
                  <label>Type d'objet *</label>
                  <select id="calc-type-objet-camions" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" required>
                    <option value="brut">Brut</option>
                    <option value="traite">Traité</option>
                  </select>
                </div>
                
                <div class="modal-field">
                  <label>Nombre de camions *</label>
                  <input id="calc-nb-camions" type="number" min="1" step="1" required placeholder="0" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" />
                </div>
                
                <div class="modal-field">
                  <label>Stockage par camion *</label>
                  <input id="calc-stockage-camion" type="number" min="0" step="0.01" required placeholder="0" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm w-full" />
                </div>
              </div>
            </div>

            <div class="mt-4">
              <button id="btn-calculer" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span>
                Calculer
              </button>
            </div>
          </div>

          <div id="calc-results" class="hidden">
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
                  <div id="calc-ressource-nom" class="stat-value text-sm">—</div>
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
                  <div id="calc-prix-unitaire" class="stat-value">0 €</div>
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
                  <div id="calc-quantite-display" class="stat-value">0</div>
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
                  <div id="calc-ca-total" class="stat-value" style="font-size: 1.5rem; color: #0055A4;">0 €</div>
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
                    <div id="detail-ressource-nom" class="view-item-value">—</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Prix de vente unitaire</div>
                    <div id="detail-prix-vente" class="view-item-value">0 €</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Prix en bourse</div>
                    <div id="detail-prix-bourse" class="view-item-value">0 €</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Taille objet (stockage)</div>
                    <div id="detail-taille" class="view-item-value">0</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Légalité</div>
                    <div id="detail-legalite" class="view-item-value">
                      <span class="badge-role badge-employe">—</span>
                    </div>
                  </div>
                </div>
                <div class="view-section">
                  <div class="view-section-title">Calcul</div>
                  <div class="view-item">
                    <div class="view-item-label">Quantité disponible</div>
                    <div id="detail-quantite" class="view-item-value">0</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Formule</div>
                    <div id="detail-formule" class="view-item-value text-sm">Quantité × Prix de vente</div>
                  </div>
                  <div id="detail-camions-info" class="view-item hidden">
                    <div class="view-item-label">Informations camions</div>
                    <div id="detail-camions-details" class="view-item-value text-sm">—</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Chiffre d'affaires</div>
                    <div id="detail-ca" class="view-item-value" style="font-size: 1.25rem; color: #0055A4; font-weight: 700;">0 €</div>
                  </div>
                  <div class="view-item">
                    <div class="view-item-label">Avec prix bourse</div>
                    <div id="detail-ca-bourse" class="view-item-value" style="font-size: 1.1rem; color: #667eea;">0 €</div>
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

  // Gérer l'état actif des liens de navigation
  const hash = location.hash || '#/entreprise/calcul';
  const navLinks = document.querySelectorAll('.nav-item');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

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
      
      // Appliquer les permissions pour les actions de la page
      await applyPagePermissions({
        create: 'calcul',
        edit: 'calcul',
        delete: 'calcul'
      });

      // Charger les ressources
      const resSnap = await getDocs(collection(fb.db, 'ressources'));
      ressourcesCache = resSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Remplir les selects
      const select = document.getElementById('calc-ressource');
      const selectCamions = document.getElementById('calc-ressource-camions');
      const optionsHtml = '<option value="">Sélectionnez une ressource</option>' +
        ressourcesCache.map(r => `<option value="${r.id}">${r.nom || 'Sans nom'}</option>`).join('');
      if (select) {
        select.innerHTML = optionsHtml;
      }
      if (selectCamions) {
        selectCamions.innerHTML = optionsHtml;
      }
    } catch (e) {
      console.error('Erreur chargement:', e);
    }
  })();

  // Gestion du mode de calcul
  let currentMode = 'quantite';
  const modeButtons = document.querySelectorAll('#calc-mode-quantite, #calc-mode-camions');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.getAttribute('data-mode');
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (currentMode === 'quantite') {
        document.getElementById('calc-form-quantite').classList.remove('hidden');
        document.getElementById('calc-form-camions').classList.add('hidden');
      } else {
        document.getElementById('calc-form-quantite').classList.add('hidden');
        document.getElementById('calc-form-camions').classList.remove('hidden');
      }
    });
  });

  // Calculer
  document.getElementById('btn-calculer').addEventListener('click', () => {
    let ressourceId, quantite;

    let typeObjet;
    if (currentMode === 'quantite') {
      ressourceId = document.getElementById('calc-ressource').value;
      quantite = parseFloat(document.getElementById('calc-quantite').value);
      typeObjet = document.getElementById('calc-type-objet').value;

      if (!ressourceId || !quantite || quantite <= 0 || !typeObjet) {
        alertModal({ 
          title: 'Informations manquantes', 
          message: 'Pour effectuer le calcul, veuillez :<br><br>• Sélectionner un type de ressource<br>• Sélectionner un type d\'objet<br>• Entrer une quantité supérieure à zéro', 
          type: 'warning' 
        });
        return;
      }
    } else {
      ressourceId = document.getElementById('calc-ressource-camions').value;
      const nbCamions = parseFloat(document.getElementById('calc-nb-camions').value);
      const stockageCamion = parseFloat(document.getElementById('calc-stockage-camion').value);
      typeObjet = document.getElementById('calc-type-objet-camions').value;

      if (!ressourceId || !nbCamions || nbCamions <= 0 || !stockageCamion || stockageCamion <= 0 || !typeObjet) {
        alertModal({ 
          title: 'Informations manquantes', 
          message: 'Pour effectuer le calcul, veuillez :<br><br>• Sélectionner un type de ressource<br>• Sélectionner un type d\'objet<br>• Entrer un nombre de camions supérieur à zéro<br>• Entrer un stockage par camion supérieur à zéro', 
          type: 'warning' 
        });
        return;
      }

      // Calculer la quantité totale de ressources basée sur le stockage
      const ressource = ressourcesCache.find(r => r.id === ressourceId);
      if (!ressource) {
        alertModal({ 
          title: 'Ressource introuvable', 
          message: 'La ressource sélectionnée n\'a pas pu être trouvée dans la base de données.', 
          type: 'danger' 
        });
        return;
      }

      const tailleObjet = typeObjet === 'traite' ? (ressource.tailleObjetTraite || ressource.tailleObjet || 1) : (ressource.tailleObjet || 1);
      const stockageTotal = nbCamions * stockageCamion;
      quantite = Math.floor(stockageTotal / tailleObjet);
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
    document.getElementById('calc-results').classList.remove('hidden');
    
    // Stats
    document.getElementById('calc-ressource-nom').textContent = ressource.nom || '—';
    document.getElementById('calc-prix-unitaire').textContent = formatAmount(prixVente) + ' €';
    document.getElementById('calc-quantite-display').textContent = quantite.toLocaleString('fr-FR');
    document.getElementById('calc-ca-total').textContent = formatAmount(caTotal) + ' €';

    // Calculer la taille d'objet selon le type sélectionné
    const tailleObjetUtilisee = typeObjet === 'traite' ? (ressource.tailleObjetTraite || ressource.tailleObjet || 1) : (ressource.tailleObjet || 1);
    const typeObjetLabel = typeObjet === 'traite' ? 'Traité' : 'Brut';
    
    // Détails
    document.getElementById('detail-ressource-nom').textContent = ressource.nom || '—';
    document.getElementById('detail-prix-vente').textContent = formatAmount(prixVente) + ' €';
    document.getElementById('detail-prix-bourse').textContent = formatAmount(prixBourse) + ' €';
    document.getElementById('detail-taille').textContent = `${tailleObjetUtilisee.toFixed(2)} (${typeObjetLabel})`;
    const legaliteBadge = document.querySelector('#detail-legalite .badge-role');
    if (legaliteBadge) {
      legaliteBadge.textContent = ressource.legalite === 'illegal' ? 'Illégale' : 'Légale';
      legaliteBadge.className = 'badge-role ' + (ressource.legalite === 'illegal' ? 'badge-inactif' : 'badge-actif');
    }
    document.getElementById('detail-quantite').textContent = quantite.toLocaleString('fr-FR');
    document.getElementById('detail-ca').textContent = formatAmount(caTotal) + ' €';
    document.getElementById('detail-ca-bourse').textContent = formatAmount(caBourse) + ' €';
    
    // Afficher les informations sur les camions si mode camions
    const camionsInfo = document.getElementById('detail-camions-info');
    const camionsDetails = document.getElementById('detail-camions-details');
    const formuleEl = document.getElementById('detail-formule');
    
    if (currentMode === 'camions') {
      const nbCamions = parseFloat(document.getElementById('calc-nb-camions').value);
      const stockageCamion = parseFloat(document.getElementById('calc-stockage-camion').value);
      const stockageTotal = nbCamions * stockageCamion;
      
      camionsInfo.classList.remove('hidden');
      camionsDetails.innerHTML = `
        ${nbCamions.toLocaleString('fr-FR')} camion(s) × ${stockageCamion.toLocaleString('fr-FR')} stockage = ${stockageTotal.toLocaleString('fr-FR')} stockage total<br>
        ${stockageTotal.toLocaleString('fr-FR')} stockage ÷ ${tailleObjetUtilisee.toFixed(2)} taille/unité (${typeObjetLabel}) = ${quantite.toLocaleString('fr-FR')} unités
      `;
      formuleEl.textContent = `(Stockage total ÷ Taille objet ${typeObjetLabel.toLowerCase()}) × Prix de vente`;
    } else {
      camionsInfo.classList.add('hidden');
      formuleEl.textContent = `Quantité (${typeObjetLabel.toLowerCase()}) × Prix de vente`;
    }
  });
}

