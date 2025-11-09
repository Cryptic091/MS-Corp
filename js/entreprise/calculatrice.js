import { html, mount, getCachedProfile, loadUserProfile, updateAvatar, isAuthenticated, updateNavPermissions, updateRoleBadge, applyPagePermissions } from '../utils.js';
import { getFirebase, waitForFirebase, signOut } from '../firebase.js';
import { addLogEntry } from '../firebase.js';

export function viewCalculatrice(root) {
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
            <a href="#/entreprise/ventes" class="nav-item"><span class="nav-icon"></span>Gestion Vente</a>
            <a href="#/entreprise/finance" class="nav-item"><span class="nav-icon"></span>Gestion Finance</a>
            <a href="#/entreprise/flotte" class="nav-item"><span class="nav-icon"></span>Gestion Flotte</a>
            <a href="#/entreprise/calcul" class="nav-item"><span class="nav-icon"></span>Calculateur CA</a>
            <a href="#/entreprise/calculatrice" class="active nav-item"><span class="nav-icon"></span>Calculatrice</a>
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
              <div class="page-title">Calculatrice</div>
              <div class="page-sub">Calculatrice simple</div>
            </div>
          </div>

          <div class="max-w-sm mx-auto mt-8">
            <div class="card p-6 shadow-lg">
              <div id="calculator-display" class="mb-6 p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-white/10 text-right text-4xl font-bold text-slate-900 dark:text-white min-h-[100px] flex items-center justify-end overflow-hidden">
                <span class="break-all">0</span>
              </div>
              
              <div class="grid grid-cols-4 gap-3">
                <button class="calc-btn calc-btn-clear" data-action="clear">
                  <span class="calc-btn-text">C</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-action="backspace">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                  </svg>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="/">
                  <span class="calc-btn-text">÷</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="*">
                  <span class="calc-btn-text">×</span>
                </button>
                
                <button class="calc-btn calc-btn-number" data-value="7">
                  <span class="calc-btn-text">7</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="8">
                  <span class="calc-btn-text">8</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="9">
                  <span class="calc-btn-text">9</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="-">
                  <span class="calc-btn-text">−</span>
                </button>
                
                <button class="calc-btn calc-btn-number" data-value="4">
                  <span class="calc-btn-text">4</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="5">
                  <span class="calc-btn-text">5</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="6">
                  <span class="calc-btn-text">6</span>
                </button>
                <button class="calc-btn calc-btn-operator" data-value="+">
                  <span class="calc-btn-text">+</span>
                </button>
                
                <button class="calc-btn calc-btn-number" data-value="1">
                  <span class="calc-btn-text">1</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="2">
                  <span class="calc-btn-text">2</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value="3">
                  <span class="calc-btn-text">3</span>
                </button>
                <button class="calc-btn calc-btn-equals" data-action="equals" style="grid-row: span 2;">
                  <span class="calc-btn-text text-2xl">=</span>
                </button>
                
                <button class="calc-btn calc-btn-number col-span-2" data-value="0">
                  <span class="calc-btn-text">0</span>
                </button>
                <button class="calc-btn calc-btn-number" data-value=".">
                  <span class="calc-btn-text">.</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  mount(root, content);

  // Charger le profil utilisateur
  (async () => {
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
    updateNavPermissions();
    
    // Appliquer les permissions pour les actions de la page
    await applyPagePermissions({
      create: 'calculatrice',
      edit: 'calculatrice',
      delete: 'calculatrice'
    });
  })();

  // Logique de la calculatrice
  let display = '0';
  let previousValue = null;
  let operator = null;
  let waitingForOperand = false;

  const displayEl = document.getElementById('calculator-display');
  const buttons = document.querySelectorAll('.calc-btn');

  function updateDisplay() {
    const span = displayEl.querySelector('span');
    if (span) {
      span.textContent = display;
    } else {
      displayEl.textContent = display;
    }
  }

  function inputNumber(num) {
    if (waitingForOperand) {
      display = num;
      waitingForOperand = false;
    } else {
      display = display === '0' ? num : display + num;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (waitingForOperand) {
      display = '0.';
      waitingForOperand = false;
    } else if (display.indexOf('.') === -1) {
      display += '.';
    }
    updateDisplay();
  }

  function performOperation(nextOperator) {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      previousValue = inputValue;
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);

      display = String(newValue);
      previousValue = newValue;
      updateDisplay();
    }

    waitingForOperand = true;
    operator = nextOperator;
  }

  function calculate(firstValue, secondValue, operation) {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  }

  function clear() {
    display = '0';
    previousValue = null;
    operator = null;
    waitingForOperand = false;
    updateDisplay();
  }

  function backspace() {
    if (display.length > 1) {
      display = display.slice(0, -1);
    } else {
      display = '0';
    }
    updateDisplay();
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const value = button.getAttribute('data-value');

      if (action === 'clear') {
        clear();
      } else if (action === 'backspace') {
        backspace();
      } else if (action === 'equals') {
        if (operator && previousValue !== null) {
          performOperation(null);
          operator = null;
          previousValue = null;
          waitingForOperand = true;
        }
      } else if (value) {
        if (['+', '-', '*', '/'].includes(value)) {
          performOperation(value);
        } else if (value === '.') {
          inputDecimal();
        } else {
          inputNumber(value);
        }
      }
    });
  });

  // Gestion du logout
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
            const { signOut } = await import('../firebase.js');
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
}

