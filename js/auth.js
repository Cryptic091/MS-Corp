import { html, mount, setAuthState } from './utils.js';
import { getFirebase, initFirebaseIfReady, signInWithEmailAndPassword, addDoc, collection, serverTimestamp } from './firebase.js';

export function viewAuth(root) {
  const content = html`
    <section class="fade-in auth-screen">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo-simple">
              <div class="auth-logo-icon-simple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
            <h2 class="auth-title">MS Corp</h2>
            <p class="auth-subtitle">Connectez-vous à votre compte</p>
          </div>

          <form id="form-login" class="auth-form">
            <div class="auth-field">
              <label class="auth-label">Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                autocomplete="email"
                placeholder="vous@entreprise.com"
                class="auth-input" 
              />
            </div>

            <div class="auth-field">
              <label class="auth-label">Mot de passe</label>
              <input 
                name="password" 
                type="password" 
                required 
                minlength="6"
                autocomplete="current-password"
                placeholder="••••••••"
                class="auth-input" 
              />
            </div>

            <div class="auth-actions">
              <button type="submit" class="auth-submit">
                <span>Se connecter</span>
              </button>
            </div>

            <p id="auth-msg" class="auth-message"></p>
          </form>
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
      msg.classList.add('auth-message-error');
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
      try { await addDoc(collection(fb.db, 'logs'), { type: 'login', uid: cred.user.uid, message: 'Connexion', createdAt: serverTimestamp() }); } catch {}
      msg.textContent = '';
      msg.className = 'auth-message';
      submitBtn.innerHTML = '<span>Connexion réussie...</span>';
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
      msg.classList.add('auth-message-error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Se connecter</span>';
    }
  });
}


