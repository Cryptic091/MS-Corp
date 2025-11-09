import { html, mount, setAuthState, isAuthenticated } from '../utils.js';
import { getFirebase, initFirebaseIfReady, signInWithEmailAndPassword, addLogEntry } from '../firebase.js';

export function viewPublicLogin(root) {
  // Rediriger si déjà connecté
  if (isAuthenticated()) {
    location.hash = '#/home';
    return;
  }

  const content = html`
    <section class="fade-in auth-screen min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-nuit dark:via-slate-900 dark:to-nuit py-12 px-4">
      <div class="auth-container w-full max-w-md">
        <div class="auth-card bg-white dark:bg-white/5 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-8">
          <div class="auth-header text-center mb-8">
            <div class="auth-logo-simple inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 mx-auto">
              <div class="auth-logo-icon-simple text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
            <h2 class="auth-title text-2xl font-bold text-slate-900 dark:text-white mb-2">MS Corp</h2>
            <p class="auth-subtitle text-slate-600 dark:text-slate-300">Connectez-vous à votre compte</p>
          </div>

          <form id="form-login" class="auth-form">
            <div class="auth-field mb-5">
              <label class="auth-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                autocomplete="email"
                placeholder="vous@entreprise.com"
                class="auth-input w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>

            <div class="auth-field mb-6">
              <label class="auth-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mot de passe</label>
              <input 
                name="password" 
                type="password" 
                required 
                minlength="6"
                autocomplete="current-password"
                placeholder="••••••••"
                class="auth-input w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>

            <div class="auth-actions mb-4">
              <button type="submit" class="auth-submit w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-semibold hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg">
                <span>Se connecter</span>
              </button>
            </div>

            <p id="auth-msg" class="auth-message text-sm text-center"></p>
          </form>

          <div class="mt-6 text-center">
            <a href="#/public" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <path d="M19 12H5"></path>
                <path d="M12 19l-7-7 7-7"></path>
              </svg>
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  mount(root, content);

  const form = document.getElementById('form-login');
  const msg = document.getElementById('auth-msg');
  const submitBtn = form.querySelector('.auth-submit');

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
    
    msg.textContent = '';
    msg.className = 'auth-message';
    
    if (!email || !password) {
      msg.textContent = 'Veuillez saisir un email et un mot de passe (≥ 6 caractères).';
      msg.classList.add('auth-message-error', 'text-red-600', 'dark:text-red-400');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Connexion...</span>';
    
    const fb = getFirebase() || initFirebaseIfReady();
    if (!fb) {
      setAuthState({ uid: 'demo-uid', email });
      location.hash = '#/home';
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(fb.auth, String(email), String(password));
      await addLogEntry(fb, { 
        type: 'login', 
        action: 'login', 
        category: 'authentification',
        message: `Connexion de l'utilisateur ${email}`,
        uid: cred.user.uid
      });
      msg.textContent = '';
      msg.className = 'auth-message';
      submitBtn.innerHTML = '<span>Connexion réussie...</span>';
      submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
      setTimeout(() => {
        location.hash = '#/home';
      }, 500);
      return;
    } catch (err) {
      let message = 'Erreur de connexion';
      if (err?.code === 'auth/wrong-password') {
        message = 'Mot de passe incorrect. Veuillez réessayer.';
      } else if (err?.code === 'auth/user-not-found') {
        message = 'Aucun compte trouvé avec cet email.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'Adresse email invalide.';
      } else if (err?.message) {
        message = err.message;
      }
      msg.textContent = message;
      msg.classList.add('auth-message-error', 'text-red-600', 'dark:text-red-400');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Se connecter</span>';
      submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    }
  });
}
