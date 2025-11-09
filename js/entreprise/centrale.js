import { html, mount, createModal, getCachedProfile, loadUserProfile, updateNavPermissions, alertModal, updateAvatar, isAuthenticated, updateRoleBadge, applyPagePermissions } from '../utils.js';
import { getFirebase, getFlotteFirebase, waitForFirebase, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where, query, orderBy, setDoc, signOut } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

const NATO_AFFECTATIONS = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Delta',
  'Echo',
  'Foxtrot',
  'Golf',
  'Hotel',
  'India',
  'Juliett',
  'Kilo',
  'Lima',
  'Mike',
  'November',
  'Oscar',
  'Papa',
  'Quebec',
  'Romeo',
  'Sierra',
  'Tango',
  'Uniform',
  'Victor',
  'Whiskey',
  'X-ray',
  'Yankee',
  'Zulu'
];

const DEFAULT_STATUSES = [
  'Disponible',
  'En service',
  'En intervention',
  'Maintenance',
  'Indisponible'
];

const CENTRALE_COLLECTION = 'centraleEffectif';
const CENTRALE_CONFIG_COLLECTION = 'centraleConfig';
const CENTRALE_CONFIG_DOC = 'settings';

export function viewCentrale(root) {
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
            <a href="#/entreprise/centrale" class="active nav-item"><span class="nav-icon"></span>Suivi Effectif</a>
            <a href="#/entreprise/ventes" class="nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
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
        <div class="page-card effectif-page">
          <div class="page-head">
            <div>
              <div class="page-title">Centrale - Suivi des effectifs</div>
              <div class="page-sub">Organisez les équipes en service et suivez les affectations</div>
            </div>
            <div class="flex gap-2 flex-wrap justify-end">
              <button id="btn-manage-status" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4"></path><path d="M15 4.6A1.65 1.65 0 0015 3a2 2 0 10-2.94 1.76 1.65 1.65 0 00-1.42.84L10.37 7"></path><path d="M6.34 7a1.65 1.65 0 00-1.82-.33l-.06.06a2 2 0 102.83 2.83l.06-.06A1.65 1.65 0 007 9.66"></path></svg></span>
                Gérer les statuts
              </button>
              <button id="btn-new-affectation" class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span>
                Nouvelle affectation
              </button>
            </div>
          </div>

          <div class="tabs-container mt-4">
            <div class="tabs-list">
              <button class="tab-item effectif-tab active" data-tab="centrale">Centrale</button>
              <button class="tab-item effectif-tab" data-tab="prise-service">Prise de service</button>
              <button class="tab-item effectif-tab" data-tab="historique">Historique</button>
            </div>
          </div>

          <div id="tab-centrale" class="tab-content active">
            <div class="card mt-4">
              <div class="user-table">
                <table>
                  <thead>
                    <tr>
                      <th>Affectation</th>
                      <th>Véhicule</th>
                      <th>Employés</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="centrale-tbody">
                    <tr><td colspan="5" class="py-3 text-center">Chargement…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="tab-prise-service" class="tab-content hidden">
            <div class="card mt-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h3 class="font-medium text-lg">Mon statut de service</h3>
                  <div id="entreprise-service-status" class="text-sm text-slate-500 dark:text-slate-400">—</div>
                </div>
                <div class="flex gap-2 flex-wrap justify-end">
                  <button id="btn-refresh-service-ent" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115-6.7L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 01-15 6.7L3 16"></path><path d="M8 16H3v5"></path></svg></span>
                    Actualiser
                  </button>
                  <button id="btn-toggle-service-ent" class="btn-primary flex items-center gap-2">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7h-1l-1-2h-8l-1 2H6a2 2 0 00-2 2v9a2 2 0 002 2h13a2 2 0 002-2V9a2 2 0 00-2-2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg></span>
                    <span id="entreprise-service-action-text">Prendre mon service</span>
                  </button>
                </div>
              </div>
              <div class="space-y-3">
                <div class="p-4 rounded-md bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div class="text-sm text-slate-600 dark:text-slate-300">Statut : <span id="entreprise-service-status-text">Chargement...</span></div>
                  <div class="text-sm text-slate-600 dark:text-slate-300 mt-1">Depuis : <span id="entreprise-service-started">—</span></div>
                </div>
              </div>
            </div>

            <div class="card mt-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-lg">Employés en service</h3>
                <div class="flex items-center gap-3">
                  <button id="btn-refresh-service-ent-table" class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm flex items-center gap-2">
                    <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115-6.7L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 01-15 6.7L3 16"></path><path d="M8 16H3v5"></path></svg></span>
                    Actualiser
                  </button>
                  <div id="centrale-service-count" class="text-sm text-slate-500 dark:text-slate-400">—</div>
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
                  <tbody id="centrale-service-tbody">
                    <tr><td colspan="4" class="py-3 text-center">Chargement…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="tab-historique" class="tab-content hidden">
            <div class="tabs-container mt-4">
              <div class="tabs-list">
                <button class="tab-item historique-tab active" data-subtab="prises-service">Prises de service</button>
                <button class="tab-item historique-tab" data-subtab="fins-service">Fins de service</button>
              </div>
            </div>

            <div id="subtab-prises-service" class="tab-content active">
              <div class="card mt-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-medium text-lg">Historique des prises de service</h3>
                  <div id="prises-service-count" class="text-sm text-slate-500 dark:text-slate-400">—</div>
                </div>
                <div class="user-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Employé</th>
                        <th>Contact</th>
                        <th>Prise de service</th>
                        <th>Créé par</th>
                      </tr>
                    </thead>
                    <tbody id="prises-service-tbody">
                      <tr><td colspan="4" class="py-3 text-center">Chargement…</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div id="subtab-fins-service" class="tab-content hidden">
              <div class="card mt-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-medium text-lg">Historique des fins de service</h3>
                  <div id="fins-service-count" class="text-sm text-slate-500 dark:text-slate-400">—</div>
                </div>
                <div class="user-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Employé</th>
                        <th>Contact</th>
                        <th>Fin de service</th>
                        <th>Durée</th>
                      </tr>
                    </thead>
                    <tbody id="fins-service-tbody">
                      <tr><td colspan="4" class="py-3 text-center">Chargement…</td></tr>
                    </tbody>
                  </table>
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

  let centraleEntries = [];
  let vehiculeOptions = [];
  let employeOptions = [];
  let statutOptions = [...DEFAULT_STATUSES];
  let serviceEmployes = [];
  let serviceEmployeIds = new Set();
  let currentUser = null;
  let myServiceStatus = null;
  let prisesServiceHistorique = [];
  let finsServiceHistorique = [];

  const page = document.querySelector('.effectif-page');

  function getVehiculeLabelById(id) {
    const vehicule = vehiculeOptions.find(v => v.id === id);
    return vehicule?.label || '—';
  }

  function getVehiculeMetaById(id) {
    const vehicule = vehiculeOptions.find(v => v.id === id);
    return vehicule?.meta || {};
  }

  function getEmployeeOption(uid) {
    return employeOptions.find(e => e.uid === uid);
  }

  function renderCentraleTable() {
    const tbody = document.getElementById('centrale-tbody');
    if (!tbody) return;

    if (!centraleEntries.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-500 dark:text-slate-400">Aucune affectation enregistrée pour le moment.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    const sortedEntries = [...centraleEntries].sort((a, b) => (a.affectation || '').localeCompare(b.affectation || ''));

    sortedEntries.forEach(entry => {
      const vehiculeLabel = entry.vehiculeLabel || getVehiculeLabelById(entry.vehiculeId);
      const employes = Array.isArray(entry.employes) ? entry.employes.filter(Boolean) : [];
      const employesHtml = employes.length
        ? employes.map(emp => {
            const option = emp.uid ? getEmployeeOption(emp.uid) : null;
            const displayName = option?.name || emp.name || option?.email || emp.email || emp.uid || '—';
            const inService = emp.uid ? serviceEmployeIds.has(emp.uid) : false;
            const badgeClass = inService
              ? 'bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-blue-300'
              : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300';
            const statusSuffix = inService ? '' : '<span class="ml-1 text-[10px] uppercase tracking-wide text-red-500 dark:text-red-400">hors service</span>';
            return `<span class="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium ${badgeClass}">${displayName}${statusSuffix}</span>`;
          }).join(' ')
        : '<span class="text-xs text-slate-400">—</span>';

      const statutLabel = entry.statut || '—';
      const statutColor = getStatusColor(statutLabel);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${entry.affectation || '—'}</td>
        <td>${vehiculeLabel}</td>
        <td class="space-x-1 space-y-1">${employesHtml}</td>
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

  async function loadStatuts() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const configDoc = await getDoc(doc(fb.db, CENTRALE_CONFIG_COLLECTION, CENTRALE_CONFIG_DOC));
      if (configDoc.exists()) {
        const data = configDoc.data() || {};
        if (Array.isArray(data.statuts) && data.statuts.length) {
          statutOptions = Array.from(new Set(data.statuts.map(s => String(s || '').trim()).filter(Boolean)));
          return;
        }
      }
      statutOptions = [...DEFAULT_STATUSES];
    } catch (e) {
      console.error('Erreur chargement statuts centrale:', e);
      statutOptions = [...DEFAULT_STATUSES];
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
      renderCentraleTable();
    } catch (e) {
      console.error('Erreur chargement employés centrale:', e);
      employeOptions = [];
      renderCentraleTable();
    }
  }

  async function loadServiceEmployes() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const snap = await getDocs(query(collection(fb.db, 'centraleServices'), where('active', '==', true)));
      const mapped = snap.docs.map(docSnap => {
        const data = docSnap.data() || {};
        const uid = data.uid || docSnap.id;
        const baseInfo = employeOptions.find(emp => emp.uid === uid) || {};
        const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : null);
        return {
          id: docSnap.id,
          uid,
          name: data.name || baseInfo.name || baseInfo.email || uid,
          email: data.email || baseInfo.email || '',
          phone: data.phone || baseInfo.phone || '',
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
      serviceEmployes = mapped;
      serviceEmployeIds = new Set(mapped.map(emp => emp.uid));
      myServiceStatus = currentUser ? mapped.find(emp => emp.uid === currentUser.uid) || null : null;
      renderServiceTable();
      renderMyServiceStatus();
      renderCentraleTable();
    } catch (e) {
      console.error('Erreur chargement employés en service:', e);
      serviceEmployes = [];
      serviceEmployeIds = new Set();
      myServiceStatus = null;
      renderServiceTable();
      renderMyServiceStatus();
      renderCentraleTable();
    }
  }

  async function loadCentraleEntries() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;
      const snap = await getDocs(collection(fb.db, CENTRALE_COLLECTION));
      centraleEntries = snap.docs.map(d => ({ id: d.id, ...d.data() || {} }));
      renderCentraleTable();
    } catch (e) {
      console.error('Erreur chargement centrale:', e);
      centraleEntries = [];
      renderCentraleTable();
    }
  }

  async function loadPrisesServiceHistorique() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      // Récupérer tous les documents de centraleServices avec startedAt non null
      const snap = await getDocs(query(
        collection(fb.db, 'centraleServices'),
        where('startedAt', '!=', null),
        orderBy('startedAt', 'desc')
      ));
      const prises = snap.docs.map(docSnap => {
        const data = docSnap.data() || {};
        const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : null);
        const empOption = employeOptions.find(e => e.uid === data.uid);

        return {
          id: docSnap.id,
          uid: data.uid,
          name: data.name || empOption?.name || data.uid || '—',
          email: data.email || empOption?.email || '',
          phone: data.phone || empOption?.phone || '',
          startedAt,
          createdBy: data.createdBy || null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : startedAt)
        };
      });

      // Trier par date décroissante (plus récent en premier)
      prises.sort((a, b) => {
        const timeA = a.startedAt ? a.startedAt.getTime() : 0;
        const timeB = b.startedAt ? b.startedAt.getTime() : 0;
        return timeB - timeA;
      });

      prisesServiceHistorique = prises;
      renderPrisesServiceTable();
    } catch (e) {
      console.error('Erreur chargement historique prises de service:', e);
      prisesServiceHistorique = [];
      renderPrisesServiceTable();
    }
  }

  async function loadFinsServiceHistorique() {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) return;

      // Récupérer tous les documents de centraleServices avec endedAt non null
      const snap = await getDocs(query(
        collection(fb.db, 'centraleServices'),
        where('endedAt', '!=', null),
        orderBy('endedAt', 'desc')
      ));
      const fins = snap.docs.map(docSnap => {
        const data = docSnap.data() || {};
        const startedAt = data.startedAt?.toDate ? data.startedAt.toDate() : (data.startedAt ? new Date(data.startedAt) : null);
        const endedAt = data.endedAt?.toDate ? data.endedAt.toDate() : (data.endedAt ? new Date(data.endedAt) : null);
        const empOption = employeOptions.find(e => e.uid === data.uid);

        let duree = '—';
        if (startedAt && endedAt) {
          const diffMs = endedAt.getTime() - startedAt.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duree = `${diffHours}h ${diffMinutes}min`;
        }

        return {
          id: docSnap.id,
          uid: data.uid,
          name: data.name || empOption?.name || data.uid || '—',
          email: data.email || empOption?.email || '',
          phone: data.phone || empOption?.phone || '',
          startedAt,
          endedAt,
          duree,
          createdBy: data.createdBy || null
        };
      });

      // Trier par date décroissante (plus récent en premier)
      fins.sort((a, b) => {
        const timeA = a.endedAt ? a.endedAt.getTime() : 0;
        const timeB = b.endedAt ? b.endedAt.getTime() : 0;
        return timeB - timeA;
      });

      finsServiceHistorique = fins;
      renderFinsServiceTable();
    } catch (e) {
      console.error('Erreur chargement historique fins de service:', e);
      finsServiceHistorique = [];
      renderFinsServiceTable();
    }
  }

  function renderPrisesServiceTable() {
    const tbody = document.getElementById('prises-service-tbody');
    const countEl = document.getElementById('prises-service-count');

    if (countEl) {
      countEl.textContent = `${prisesServiceHistorique.length} prise${prisesServiceHistorique.length > 1 ? 's' : ''} de service`;
    }

    if (!tbody) return;

    if (!prisesServiceHistorique.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500 dark:text-slate-400">Aucune prise de service enregistrée.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    prisesServiceHistorique.forEach(prise => {
      const contactParts = [];
      if (prise.phone) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h4.09a2 2 0 0 1 2 1.72c.12.86.37 1.7.72 2.49a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6.18 6.18l1.59-1.59a2 2 0 0 1 2.11-.45c.79.35 1.63.6 2.49.72a2 2 0 0 1 1.72 2z"></path></svg>${prise.phone}</span>`);
      }
      if (prise.email) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>${prise.email}</span>`);
      }
      const contactHtml = contactParts.length ? contactParts.join('<br>') : '—';
      const startedAt = prise.startedAt ? prise.startedAt.toLocaleString('fr-FR') : '—';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${prise.name || prise.uid || '—'}</td>
        <td>${contactHtml}</td>
        <td>${startedAt}</td>
        <td class="text-sm text-slate-600 dark:text-slate-300">${prise.createdBy || 'Système'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderFinsServiceTable() {
    const tbody = document.getElementById('fins-service-tbody');
    const countEl = document.getElementById('fins-service-count');

    if (countEl) {
      countEl.textContent = `${finsServiceHistorique.length} fin${finsServiceHistorique.length > 1 ? 's' : ''} de service`;
    }

    if (!tbody) return;

    if (!finsServiceHistorique.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500 dark:text-slate-400">Aucune fin de service enregistrée.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    finsServiceHistorique.forEach(fin => {
      const contactParts = [];
      if (fin.phone) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h4.09a2 2 0 0 1 2 1.72c.12.86.37 1.7.72 2.49a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6.18 6.18l1.59-1.59a2 2 0 0 1 2.11-.45c.79.35 1.63.6 2.49.72a2 2 0 0 1 1.72 2z"></path></svg>${fin.phone}</span>`);
      }
      if (fin.email) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>${fin.email}</span>`);
      }
      const contactHtml = contactParts.length ? contactParts.join('<br>') : '—';
      const endedAt = fin.endedAt ? fin.endedAt.toLocaleString('fr-FR') : '—';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fin.name || fin.uid || '—'}</td>
        <td>${contactHtml}</td>
        <td>${endedAt}</td>
        <td class="text-sm text-slate-600 dark:text-slate-300">${fin.duree}</td>
      `;
      tbody.appendChild(tr);
    });
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
          await setDoc(doc(fb.db, CENTRALE_CONFIG_COLLECTION, CENTRALE_CONFIG_DOC), { statuts: statutOptions }, { merge: true });
          alertModal({ title: 'Succès', message: `Le statut "${value}" a été ajouté.`, type: 'success' });
        } catch (e) {
          console.error('Erreur ajout statut centrale:', e);
          alertModal({ title: 'Erreur', message: 'Impossible d\'ajouter ce statut.', type: 'danger' });
        }
      }
    });
  }

  async function startServiceForUid(uid, { showAlert = true, reload = true, successMessage, errorMessage } = {}) {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) {
        if (showAlert) {
          alertModal({ title: 'Erreur', message: errorMessage || 'Base de données indisponible.', type: 'danger' });
        }
        return false;
      }
      const empOption = employeOptions.find(e => e.uid === uid) || {};
      const emp = (Object.keys(empOption).length ? empOption : {}) || {};
      const fallback = (!Object.keys(emp).length && currentUser && currentUser.uid === uid) ? currentUser : {};
      const resolved = Object.keys(emp).length ? emp : fallback;
      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      await setDoc(doc(fb.db, 'centraleServices', uid), {
        uid,
        name: resolved.name || resolved.email || uid,
        email: resolved.email || '',
        phone: resolved.phone || '',
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
        message: `Prise de service enregistrée pour ${resolved.name || resolved.email || uid}`
      });
      if (reload) {
        await loadServiceEmployes();
        renderCentraleTable();
        await loadPrisesServiceHistorique();
        await loadFinsServiceHistorique();
      }
      if (showAlert) {
        alertModal({ title: 'Succès', message: successMessage || `Prise de service enregistrée pour ${resolved.name || resolved.email || uid}.`, type: 'success' });
      }
      return true;
    } catch (e) {
      console.error('Erreur lors de la prise de service:', e);
      if (showAlert) {
        alertModal({ title: 'Erreur', message: errorMessage || 'Impossible d\'enregistrer la prise de service.', type: 'danger' });
      }
      return false;
    }
  }

  async function endServiceForUid(uid, { showAlert = true, reload = true, successMessage, errorMessage } = {}) {
    try {
      const fb = getFirebase();
      if (!fb || !fb.db) {
        if (showAlert) {
          alertModal({ title: 'Erreur', message: errorMessage || 'Base de données indisponible.', type: 'danger' });
        }
        return false;
      }
      await setDoc(doc(fb.db, 'centraleServices', uid), {
        active: false,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      const empFound = serviceEmployes.find(e => e.uid === uid) || employeOptions.find(e => e.uid === uid) || {};
      const fallback = (!Object.keys(empFound).length && currentUser && currentUser.uid === uid) ? currentUser : {};
      const resolved = Object.keys(empFound).length ? empFound : fallback;
      await addLogEntry(fb, {
        type: 'action',
        action: 'centrale_service_end',
        category: 'centrale',
        message: `Fin de service enregistrée pour ${resolved.name || resolved.email || uid}`
      });
      if (reload) {
        await loadServiceEmployes();
        renderCentraleTable();
        await loadPrisesServiceHistorique();
        await loadFinsServiceHistorique();
      }
      if (showAlert) {
        alertModal({ title: 'Succès', message: successMessage || `Fin de service enregistrée pour ${resolved.name || resolved.email || uid}.`, type: 'success' });
      }
      return true;
    } catch (e) {
      console.error('Erreur fin de service:', e);
      if (showAlert) {
        alertModal({ title: 'Erreur', message: errorMessage || 'Impossible d\'enregistrer la fin de service.', type: 'danger' });
      }
      return false;
    }
  }

  async function toggleMyServiceEntreprise() {
    if (!currentUser) {
      alertModal({ title: 'Information', message: 'Utilisateur non identifié.', type: 'info' });
      return;
    }

    if (myServiceStatus) {
      await endServiceForUid(currentUser.uid, {
        successMessage: 'Votre fin de service a été enregistrée.',
        errorMessage: 'Impossible d\'enregistrer votre fin de service.'
      });
    } else {
      await startServiceForUid(currentUser.uid, {
        successMessage: 'Votre prise de service a été enregistrée.',
        errorMessage: 'Impossible d\'enregistrer votre prise de service.'
      });
    }
  }

  async function closeServiceForEmployee(uid) {
    await endServiceForUid(uid);
  }

  function buildEmployeeSelectOptions(selectedUid) {
    const options = ['<option value="">— Aucun —</option>'];
    const sortedService = [...serviceEmployes];
    sortedService.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    sortedService.forEach(emp => {
      const selected = emp.uid === selectedUid ? 'selected' : '';
      const label = emp.name || emp.email || emp.uid;
      options.push(`<option value="${emp.uid}" ${selected}>${label}</option>`);
    });
    if (selectedUid && !serviceEmployeIds.has(selectedUid)) {
      const fallback = employeOptions.find(emp => emp.uid === selectedUid);
      if (fallback) {
        const label = `${fallback.name || fallback.email || fallback.uid} (hors service)`;
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

  function renderServiceTable() {
    const tbody = document.getElementById('centrale-service-tbody');
    const countEl = document.getElementById('centrale-service-count');
    if (countEl) {
      countEl.textContent = serviceEmployes.length > 0
        ? `${serviceEmployes.length} en service`
        : 'Aucun employé en service';
    }
    if (!tbody) return;
    if (!serviceEmployes.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-500 dark:text-slate-400">Aucun employé n\'est actuellement en service.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    serviceEmployes.forEach(emp => {
      const contactParts = [];
      if (emp.phone) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2 4.18 2 2 0 0 1 4 2h4.09a2 2 0 0 1 2 1.72c.12.86.37 1.7.72 2.49a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6.18 6.18l1.59-1.59a2 2 0 0 1 2.11-.45c.79.35 1.63.6 2.49.72a2 2 0 0 1 1.72 2z"></path></svg>${emp.phone}</span>`);
      }
      if (emp.email) {
        contactParts.push(`<span class="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>${emp.email}</span>`);
      }
      const contactHtml = contactParts.length ? contactParts.join('<br>') : '—';
      const startedAt = emp.startedAt ? emp.startedAt.toLocaleString('fr-FR') : '—';
      const isCurrentUser = currentUser && emp.uid === currentUser.uid;
      const nameHtml = `${emp.name || emp.uid || '—'}${isCurrentUser ? ' <span class="text-xs text-blue-600 dark:text-blue-400">(Vous)</span>' : ''}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nameHtml}</td>
        <td>${contactHtml}</td>
        <td>${startedAt}</td>
        <td>
          <div class="action-buttons" data-service-uid="${emp.uid}">
            <button class="action-btn btn-stop-service" title="Mettre fin au service" style="background: #dc2626; color: white;">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg></span>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderMyServiceStatus() {
    const statusEl = document.getElementById('entreprise-service-status');
    const statusTextEl = document.getElementById('entreprise-service-status-text');
    const startedEl = document.getElementById('entreprise-service-started');
    const toggleBtn = document.getElementById('btn-toggle-service-ent');
    const actionTextEl = document.getElementById('entreprise-service-action-text');

    if (!statusEl || !statusTextEl || !startedEl || !toggleBtn || !actionTextEl) {
      return;
    }

    if (!currentUser) {
      statusEl.textContent = 'Non disponible';
      statusTextEl.textContent = 'Utilisateur inconnu';
      startedEl.textContent = '—';
      toggleBtn.disabled = true;
      toggleBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'text-white');
      toggleBtn.classList.add('btn-primary');
      actionTextEl.textContent = 'Prendre mon service';
      return;
    }

    toggleBtn.disabled = false;

    if (!myServiceStatus) {
      statusEl.textContent = 'Hors service';
      statusTextEl.textContent = 'Hors service';
      startedEl.textContent = '—';
      toggleBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'text-white');
      if (!toggleBtn.classList.contains('btn-primary')) {
        toggleBtn.classList.add('btn-primary');
      }
      actionTextEl.textContent = 'Prendre mon service';
    } else {
      statusEl.textContent = 'En service';
      statusTextEl.textContent = 'En service';
      startedEl.textContent = myServiceStatus.startedAt ? myServiceStatus.startedAt.toLocaleString('fr-FR') : '—';
      toggleBtn.classList.remove('btn-primary');
      toggleBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'text-white');
      actionTextEl.textContent = 'Terminer mon service';
    }
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
    await loadServiceEmployes();

    const isEdit = !!entry;
    const employes = entry?.employes && Array.isArray(entry.employes) ? entry.employes : [];

    const body = `
      <div class="space-y-4">
        <div class="modal-field">
          <label>Affectation *</label>
          <select id="modal-affectation" required>
            <option value="">— Sélectionner —</option>
            ${NATO_AFFECTATIONS.map(aff => `<option value="${aff}" ${aff === entry?.affectation ? 'selected' : ''}>${aff}</option>`).join('')}
          </select>
        </div>

        <div class="modal-field">
          <label>Véhicule *</label>
          <select id="modal-vehicule" required>
            ${buildVehiculeSelectOptions(entry?.vehiculeId || '')}
          </select>
        </div>

        ${serviceEmployes.length === 0 ? `
        <div class="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-200 text-xs">
          Aucun employé n'est actuellement en service. Utilisez le bouton "Prise de service" pour ajouter des collaborateurs disponibles.
        </div>` : ''}

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
      title: isEdit ? 'Modifier l’affectation' : 'Nouvelle affectation',
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

        const selectedVehiculeMeta = getVehiculeMetaById(vehiculeId);
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
          vehiculeMeta: selectedVehiculeMeta,
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
            await updateDoc(doc(fb.db, CENTRALE_COLLECTION, entry.id), payload);
            await addLogEntry(fb, {
              type: 'action',
              action: 'centrale_update',
              category: 'centrale',
              message: `Mise à jour affectation ${affectation} (${vehiculeLabel})`
            });
          } else {
            await addDoc(collection(fb.db, CENTRALE_COLLECTION), {
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

  function registerEventHandlers() {
    document.querySelectorAll('.effectif-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.effectif-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active', 'hidden'));

        tabBtn.classList.add('active');
        const target = document.getElementById(`tab-${tabBtn.dataset.tab}`);
        document.querySelectorAll('.tab-content').forEach(content => {
          if (content === target) {
            content.classList.add('active');
            content.classList.remove('hidden');
          } else {
            content.classList.remove('active');
            content.classList.add('hidden');
          }
        });

        if (tabBtn.dataset.tab === 'prise-service') {
          loadServiceEmployes();
        } else if (tabBtn.dataset.tab === 'centrale') {
          renderCentraleTable();
        } else if (tabBtn.dataset.tab === 'historique') {
          // Charger les données d'historique quand on ouvre l'onglet
          loadPrisesServiceHistorique();
          loadFinsServiceHistorique();
        }
      });
    });

    document.getElementById('btn-new-affectation')?.addEventListener('click', () => { openAffectationModal(); });
    document.getElementById('btn-manage-status')?.addEventListener('click', openStatusManager);
    document.getElementById('btn-toggle-service-ent')?.addEventListener('click', toggleMyServiceEntreprise);

    ['btn-refresh-service-ent', 'btn-refresh-service-ent-table'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        loadServiceEmployes();
        loadPrisesServiceHistorique();
        loadFinsServiceHistorique();
      });
    });

    // Gestionnaire pour les sous-tabs historique
    document.querySelectorAll('.historique-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.historique-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('#tab-historique .tab-content').forEach(content => content.classList.remove('active', 'hidden'));

        tabBtn.classList.add('active');
        const target = document.getElementById(`subtab-${tabBtn.dataset.subtab}`);
        document.querySelectorAll('#tab-historique .tab-content').forEach(content => {
          if (content === target) {
            content.classList.add('active');
            content.classList.remove('hidden');
          } else {
            content.classList.remove('active');
            content.classList.add('hidden');
          }
        });
      });
    });

    page?.addEventListener('click', async (e) => {
      const stopBtn = e.target.closest('.btn-stop-service');
      if (stopBtn) {
        const container = stopBtn.closest('.action-buttons');
        const uid = container?.getAttribute('data-service-uid');
        const emp = serviceEmployes.find(s => s.uid === uid);
        createModal({
          title: 'Mettre fin au service',
          body: `<p>Confirmez-vous la fin de service pour <strong>${emp?.name || 'cet employé'}</strong> ?</p>`,
          confirmText: 'Mettre fin',
          cancelText: 'Annuler',
          confirmStyle: 'background: #dc2626; color: white;',
          onConfirm: async () => {
            await closeServiceForEmployee(uid);
          }
        });
        return;
      }

      const container = e.target.closest('.action-buttons');
      if (!container) return;
      const entryId = container.getAttribute('data-entry-id');
      if (!entryId) return;

      const entry = centraleEntries.find(ent => ent.id === entryId);
      if (!entry) return;

      if (e.target.closest('.btn-edit')) {
        openAffectationModal(entry);
        return;
      }

      if (e.target.closest('.btn-delete')) {
        createModal({
          title: 'Supprimer l’affectation',
          body: `<p>Souhaitez-vous supprimer <strong>${entry.affectation || 'cette affectation'}</strong> ?</p><p class="text-sm text-slate-500 mt-2">Cette action est irréversible.</p>`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          confirmStyle: 'background: #dc2626; color: white;',
          onConfirm: async () => {
            try {
              const fb = getFirebase();
              if (!fb || !fb.db) return;
              await deleteDoc(doc(fb.db, CENTRALE_COLLECTION, entryId));
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
              console.error('Erreur suppression affectation centrale:', err);
              alertModal({ title: 'Erreur', message: 'Impossible de supprimer cette affectation.', type: 'danger' });
            }
          }
        });
      }
    });
  }

  registerEventHandlers();

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

      const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
      if (authState && authState.uid) {
        currentUser = {
          uid: authState.uid,
          name: profile.name || profile.email || authState.uid,
          email: profile.email || '',
          phone: profile.phone || ''
        };
      } else {
        currentUser = null;
      }
      renderMyServiceStatus();

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
        delete: 'centrale'
      });

      await loadStatuts();
      await loadVehiculesAchetes();
      await loadEmployeOptions();
      await loadServiceEmployes();
      await loadPrisesServiceHistorique();
      await loadFinsServiceHistorique();
      await loadCentraleEntries();
    } catch (e) {
      console.error('Erreur initialisation centrale:', e);
      alertModal({ title: 'Erreur', message: 'Impossible de charger la centrale.', type: 'danger' });
    }
  })();
}


