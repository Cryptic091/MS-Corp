import { html, mount, getCachedProfile, loadUserProfile, updateNavPermissions, updateAvatar, alertModal, confirmModal, formatDate, isAuthenticated, updateRoleBadge } from '../utils.js';
import { getFirebase, waitForFirebase, collection, getDocs, query, orderBy, limit, deleteDoc, doc, getDoc, signOut } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

export function viewLogs(root) {
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
            <a href="#/entreprise/calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/entreprise/logs" class="active nav-item"><span class="nav-icon"></span>Logs</a>
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
              <div class="page-title">Logs</div>
              <div class="page-sub">Journal d'activité du système</div>
            </div>
            <div class="flex gap-2 flex-wrap justify-end">
              <select class="rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm">
                <option>Tous les types</option>
                <option>Connexion</option>
                <option>Action</option>
                <option>Erreur</option>
              </select>
              <button class="btn-primary flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></span> Exporter
              </button>
              <button id="btn-clear-logs" class="btn-danger flex items-center gap-2">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6l1-2h4l1 2"></path></svg></span>
                Supprimer les logs
              </button>
            </div>
          </div>
          <div class="user-table mt-4">
            <table>
              <thead>
                <tr>
                  <th>Date/Heure</th>
                  <th>Type</th>
                  <th>Catégorie</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody id="logs-tbody">
                <tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>
              </tbody>
            </table>
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

  const tbody = document.getElementById('logs-tbody');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  let fbInstance = null;
  let usersCache = {}; // Cache des utilisateurs par UID

  async function loadUsersCache() {
    if (!fbInstance) fbInstance = getFirebase();
    const fb = fbInstance;
    if (!fb || !fb.db) return;
    try {
      const usersSnap = await getDocs(collection(fb.db, 'users'));
      usersCache = {};
      usersSnap.forEach(doc => {
        const userData = doc.data();
        // Stocker avec l'ID du document (qui devrait être l'UID Firebase Auth)
        usersCache[doc.id] = {
          name: userData.name || userData.email?.split('@')[0] || 'Utilisateur',
          email: userData.email || '—',
          role: userData.role || 'employe'
        };
      });
      
      // Aussi récupérer les utilisateurs depuis Firebase Auth si possible
      if (fb.auth && fb.auth.currentUser) {
        const currentUid = fb.auth.currentUser.uid;
        if (!usersCache[currentUid]) {
          // Si l'utilisateur n'est pas dans la collection users, utiliser les infos d'Auth
          usersCache[currentUid] = {
            name: fb.auth.currentUser.displayName || fb.auth.currentUser.email?.split('@')[0] || 'Utilisateur',
            email: fb.auth.currentUser.email || '—',
            role: 'employe'
          };
        }
      }
    } catch (e) {
      usersCache = {};
    }
  }

  async function getUserInfo(uid) {
    if (!uid) return { name: '—', email: '—' };
    
    // Vérifier d'abord dans le cache
    let user = usersCache[uid];
    
    // Si pas trouvé, essayer de charger depuis Firestore
    if (!user && fbInstance && fbInstance.db) {
      try {
        const userDoc = await getDoc(doc(fbInstance.db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          user = {
            name: userData.name || userData.email?.split('@')[0] || 'Utilisateur',
            email: userData.email || '—',
            role: userData.role || 'employe'
          };
          // Mettre en cache pour la prochaine fois
          usersCache[uid] = user;
        }
      } catch (e) {
        // Ignorer les erreurs
      }
    }
    
    if (user) {
      return {
        name: user.name || user.email?.split('@')[0] || 'Utilisateur',
        email: user.email || '—'
      };
    }
    
    // Fallback : afficher les 8 premiers caractères de l'UID
    return { name: uid.slice(0, 8) + '...', email: '—' };
  }

  async function renderLogs() {
    if (!tbody) return;
    if (!fbInstance) {
      fbInstance = getFirebase();
    }
    const fb = fbInstance;
    if (!fb || !fb.db) return;
      tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Chargement…</td></tr>';
    try {
      // Charger le cache des utilisateurs
      await loadUsersCache();
      
      const snap = await getDocs(query(collection(fb.db, 'logs'), orderBy('createdAt', 'desc'), limit(100)));
        tbody.innerHTML = '';
        if (!snap.size) {
          tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Aucun log</td></tr>';
          return;
        }
      // Récupérer les informations utilisateur pour tous les logs
      // Utiliser d'abord les informations stockées dans le log, sinon récupérer depuis Firestore
      const logsWithUsers = await Promise.all(
        snap.docs.map(async (d) => {
          const log = d.data();
          // Si le log contient déjà les infos utilisateur, les utiliser
          let userInfo;
          if (log.userName && log.userEmail) {
            userInfo = { name: log.userName, email: log.userEmail };
          } else {
            // Sinon, récupérer depuis Firestore
            userInfo = await getUserInfo(log.uid);
          }
          return { log, userInfo, date: log.createdAt?.toDate ? log.createdAt.toDate() : new Date() };
        })
      );
      
      logsWithUsers.forEach(({ log, userInfo, date }) => {
        const tr = document.createElement('tr');
        const typeClass = log.type === 'error' ? 'badge-admin' : log.type === 'login' ? 'badge-actif' : 'badge-employe';
        const categoryBadge = log.category ? `<span class="badge-role badge-employe text-xs">${log.category}</span>` : '—';
        tr.innerHTML = `
          <td>${formatDate(date)}</td>
          <td><span class="badge-role ${typeClass}">${log.type || 'action'}</span></td>
          <td>${categoryBadge}</td>
          <td>
            <div class="user-info">
              <div class="user-name">${userInfo.name || '—'}</div>
              ${userInfo.email && userInfo.email !== '—' ? `<div class="user-handle text-xs opacity-70">${userInfo.email}</div>` : '<div class="user-handle text-xs opacity-50">—</div>'}
            </div>
          </td>
          <td>${log.action || '—'}</td>
          <td>${log.message || '—'}</td>`;
        tbody.appendChild(tr);
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td class="py-3 text-center" colspan="6">Erreur lors du chargement</td></tr>';
    }
  }

  if (btnClearLogs) {
    btnClearLogs.addEventListener('click', () => {
      confirmModal({
        title: 'Supprimer tous les logs',
        message: 'Cette action supprimera définitivement tous les logs. Voulez-vous continuer ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger',
        onConfirm: async () => {
          try {
            if (!fbInstance) fbInstance = getFirebase();
            const fb = fbInstance;
            if (!fb || !fb.db) {
              alertModal({ title: 'Erreur', message: 'Firebase n\'est pas initialisé.', type: 'danger' });
              return;
            }
            
            // Vérifier l'authentification
            if (!fb.auth || !fb.auth.currentUser) {
              alertModal({ title: 'Erreur', message: 'Vous devez être connecté pour supprimer les logs.', type: 'danger' });
              return;
            }
            
            btnClearLogs.disabled = true;
            
            let totalDeleted = 0;
            let totalErrors = 0;
            const BATCH_SIZE = 100; // Nombre de logs à récupérer à la fois
            let hasMore = true;
            let attemptCount = 0;
            const MAX_ATTEMPTS = 500; // Limite de sécurité
            
            // Supprimer les logs un par un (plus fiable que les batches)
            while (hasMore && attemptCount < MAX_ATTEMPTS) {
              attemptCount++;
              
              // Récupérer un lot de logs
              const logsQuery = query(collection(fb.db, 'logs'), limit(BATCH_SIZE));
              const logsSnap = await getDocs(logsQuery);
              
              if (logsSnap.empty) {
                hasMore = false;
                break;
              }
              
              // Supprimer chaque log individuellement
              for (const docSnapshot of logsSnap.docs) {
                try {
                  await deleteDoc(docSnapshot.ref);
                  totalDeleted++;
                } catch (deleteError) {
                  totalErrors++;
                  // Si c'est une erreur de permission, on arrête tout
                  if (deleteError.code === 'permission-denied' || deleteError.message?.includes('permission')) {
                    throw new Error('Permission refusée. Les règles Firestore doivent autoriser la suppression des logs. Vérifiez Firebase Console → Firestore → Règles et assurez-vous que "allow delete: if isAuthed();" est présent pour la collection logs.');
                  }
                  // Continuer pour les autres erreurs
                }
                // Petit délai entre chaque suppression pour éviter de surcharger
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              
              // Si on a récupéré moins de documents que la limite, c'est qu'il n'y en a plus
              if (logsSnap.docs.length < BATCH_SIZE) {
                hasMore = false;
              } else {
                // Délai entre les lots
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            // Message de résultat
            if (totalDeleted === 0 && totalErrors === 0) {
              alertModal({ title: 'Information', message: 'Aucun log à supprimer.', type: 'info' });
            } else if (totalErrors > 0) {
              alertModal({ 
                title: 'Avertissement', 
                message: `${totalDeleted} log(s) supprimé(s), ${totalErrors} erreur(s). Vérifiez les règles Firestore.`, 
                type: 'warning' 
              });
            } else {
              alertModal({ title: 'Succès', message: `${totalDeleted} log(s) supprimé(s) avec succès.`, type: 'success' });
            }
            
            await renderLogs();
          } catch (e) {
            const errorMsg = e.message || e.code || (e.toString ? e.toString() : 'Erreur inconnue');
            alertModal({ 
              title: 'Erreur', 
              message: `Impossible de supprimer les logs. Vérifiez que les règles Firestore autorisent la suppression. Erreur: ${errorMsg}`, 
              type: 'danger' 
            });
          } finally {
            btnClearLogs.disabled = false;
          }
        }
      });
    });
  }

  (async () => {
    try {
      fbInstance = getFirebase();
      const fb = fbInstance;
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
      
      await renderLogs();
    } catch (e) {}
  })();
}
