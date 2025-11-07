import { html, mount, formatDate } from './utils.js';
import { waitForFirebase, collection, getDocs, query, orderBy, limit, where } from './firebase.js';

export function viewDashboard(root) {
  const content = html`
    <section class="fade-in">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold">Dashboard</h2>
        <p class="text-slate-500">Vue d'ensemble de l'entreprise</p>
      </div>

      <div class="grid-auto">
        <div class="card">
          <div class="text-sm text-slate-500">Utilisateurs actifs</div>
          <div id="kpi-users" class="mt-2 text-3xl font-semibold">—</div>
        </div>
        <div class="card">
          <div class="text-sm text-slate-500">Employés</div>
          <div id="kpi-employees" class="mt-2 text-3xl font-semibold">—</div>
        </div>
        <div class="card">
          <div class="text-sm text-slate-500">Connexions aujourd'hui</div>
          <div id="kpi-logins-today" class="mt-2 text-3xl font-semibold">—</div>
        </div>
        <div class="card">
          <div class="text-sm text-slate-500">Dernière mise à jour</div>
          <div class="mt-2 text-lg">${formatDate(new Date())}</div>
        </div>
      </div>

      <div class="mt-8 card">
        <div class="flex items-center justify-between">
          <h3 class="font-medium">Journaux récents</h3>
        </div>
        <ul id="logs-list" class="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>Chargement…</li>
        </ul>
      </div>
    </section>
  `;
  mount(root, content);

  // Chargement Firestore
  (async () => {
    try {
      // Attendre que Firebase soit prêt
      const fb = await waitForFirebase();
      if (!fb || !fb.db) {
        const ul = document.getElementById('logs-list');
        if (ul) ul.innerHTML = '<li class="text-red-600 dark:text-red-400">Firestore non activé. Voir FIRESTORE_RULES.txt</li>';
        return;
      }
      
      const usersSnap = await getDocs(collection(fb.db, 'users'));
      const allUsers = usersSnap.docs.map(d => d.data());
      const employeesCount = allUsers.filter(u => (u.role || 'employe') === 'employe').length;
      document.getElementById('kpi-users').textContent = String(usersSnap.size);
      document.getElementById('kpi-employees').textContent = String(employeesCount);

      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      let logsSnap;
      try {
        const logsQ = query(collection(fb.db, 'logs'), orderBy('createdAt', 'desc'), limit(10));
        logsSnap = await getDocs(logsQ);
      } catch (e) {
        // Si l'index n'existe pas, récupérer sans orderBy
        try {
          logsSnap = await getDocs(query(collection(fb.db, 'logs'), limit(10)));
        } catch (e2) {
          logsSnap = { docs: [], size: 0, forEach: () => {} };
        }
      }
      const ul = document.getElementById('logs-list');
      ul.innerHTML = '';
      let todayCount = 0;
      logsSnap.forEach(docu => {
        const log = docu.data();
        const li = document.createElement('li');
        li.textContent = `${log.type || 'action'} — ${log.message || ''}`;
        ul.appendChild(li);
        if (log.createdAt?.toDate && log.createdAt.toDate() >= startOfDay) todayCount++;
      });
      if (!logsSnap.size) ul.innerHTML = '<li>Aucun log</li>';
      document.getElementById('kpi-logins-today').textContent = String(todayCount);
    } catch (e) {
      const ul = document.getElementById('logs-list');
      if (ul) {
        // Afficher un message d'erreur plus informatif
        if (e.code === 'permission-denied') {
          ul.innerHTML = '<li class="text-red-600 dark:text-red-400">Permission refusée. Vérifiez les règles Firestore.</li>';
        } else if (e.code === 'failed-precondition') {
          ul.innerHTML = '<li class="text-yellow-600 dark:text-yellow-400">Index Firestore manquant. Créez l\'index requis dans la console Firebase.</li>';
        } else {
          ul.innerHTML = '<li class="text-red-600 dark:text-red-400">Erreur de chargement. Vérifiez que Firestore est activé.</li>';
        }
      }
      console.error('Erreur chargement dashboard:', e);
    }
  })();
}


