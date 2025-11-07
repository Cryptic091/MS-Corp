import { html, mount, setAuthState } from './utils.js';
import { getFirebase, initFirebaseIfReady, signInWithEmailAndPassword, addDoc, collection, serverTimestamp } from './firebase.js';

export function viewAuth(root) {
  const content = html`
    <section class="fade-in auth-screen">
      <div class="auth-card card mx-auto">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-semibold">Connexion</h2>
      </div>

        <form id="form-login" class="space-y-3">
          <div>
            <label class="text-sm text-slate-600">Email</label>
            <input name="email" type="email" required class="mt-1 w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2" />
          </div>
          <div>
            <label class="text-sm text-slate-600">Mot de passe</label>
            <input name="password" type="password" required minlength="6" class="mt-1 w-full rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2" />
          </div>
          <div>
            <button type="submit" class="btn-primary w-full">Se connecter</button>
          </div>
          <p id="auth-msg" class="text-sm text-rougeFr"></p>
        </form>
      </div>
    </section>
  `;

  mount(root, content);

  const form = document.getElementById('form-login');
  const msg = document.getElementById('auth-msg');

  function getFormValues() {
    const emailInput = form.querySelector('input[name="email"]');
    const passInput = form.querySelector('input[name="password"]');
    const email = (emailInput?.value || '').trim();
    const password = (passInput?.value || '').trim();
    return { email, password };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = getFormValues();
    if (!email || !password) {
      msg.textContent = 'Veuillez saisir un email et un mot de passe (≥ 6 caractères).';
      return;
    }
    const fb = getFirebase() || initFirebaseIfReady();
    if (!fb) {
      // Fallback démo si Firebase non configuré
      setAuthState({ uid: 'demo-uid', email });
      location.hash = '#/home';
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(fb.auth, String(email), String(password));
      try { await addDoc(collection(fb.db, 'logs'), { type: 'login', uid: cred.user.uid, message: 'Connexion', createdAt: serverTimestamp() }); } catch {}
      msg.textContent = '';
      location.hash = '#/home';
      return;
    } catch (err) {
      let message = 'Erreur de connexion';
      if (err?.code === 'auth/wrong-password') {
        message = 'Mot de passe incorrect. Veuillez réessayer.';
      } else if (err?.code === 'auth/user-not-found') {
        message = 'Aucun compte trouvé avec cet email.';
      } else if (err?.message) {
        message = err.message;
      }
      msg.textContent = message;
    }
  });
}


