import { html, mount, checkPermission } from './utils.js';

export async function viewHome(root) {
  const content = html`
    <section class="fade-in home-wrap">
      <!-- Background effects -->
      <div class="home-background">
        <div class="bg-gradient-orb orb-1"></div>
        <div class="bg-gradient-orb orb-2"></div>
        <div class="bg-gradient-orb orb-3"></div>
        <div class="bg-grid"></div>
        <div class="bg-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>
      </div>
      
      <div class="home-container">
        <div class="home-header">
          <h2 class="home-title">Bienvenue</h2>
          <p class="home-subtitle">Choisissez un espace</p>
        </div>
        <div class="home-grid">
          <a href="#/entreprise" id="card-entreprise" class="space-card">
            <div class="space-card-header">
              <div class="space-card-icon enterprise-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="space-card-badge enterprise-badge">Administrateur</div>
            </div>
            <div class="space-card-content">
              <h3 class="space-card-title">Gestion Entreprise</h3>
              <p class="space-card-desc">Pilotez l'organisation: utilisateurs, rôles, ventes et journaux.</p>
              <div class="space-card-features">
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Gestion Employé</span>
                </div>
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Rôles & Permissions</span>
                </div>
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Ventes</span>
                </div>
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Logs</span>
                </div>
              </div>
            </div>
            <div class="space-card-accent enterprise-accent"></div>
          </a>
          <a href="#/employe" id="card-employe" class="space-card">
            <div class="space-card-header">
              <div class="space-card-icon employe-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="space-card-badge employe-badge">Employé</div>
            </div>
            <div class="space-card-content">
              <h3 class="space-card-title">Espace Employé</h3>
              <p class="space-card-desc">Accédez à vos ventes, documents et informations personnelles.</p>
              <div class="space-card-features">
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Ventes</span>
                </div>
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Documents</span>
                </div>
              </div>
            </div>
            <div class="space-card-accent employe-accent"></div>
          </a>
          <a href="#" id="card-profile" class="space-card">
            <div class="space-card-header">
              <div class="space-card-icon profile-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="space-card-badge profile-badge">Profil</div>
            </div>
            <div class="space-card-content">
              <h3 class="space-card-title">Mon Profil</h3>
              <p class="space-card-desc">Consultez vos informations personnelles et vos statistiques.</p>
              <div class="space-card-features">
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Informations</span>
                </div>
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Statistiques</span>
                </div>
                <div class="feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Historique</span>
                </div>
              </div>
            </div>
            <div class="space-card-accent profile-accent"></div>
          </a>
        </div>
      </div>
    </section>
  `;
  mount(root, content);
  
  // Vérifier les permissions et masquer les cartes si nécessaire
  const hasEntreprise = await checkPermission('entreprise');
  const hasEmploye = await checkPermission('employe');
  
  const cardEntreprise = document.getElementById('card-entreprise');
  const cardEmploye = document.getElementById('card-employe');
  const cardProfile = document.getElementById('card-profile');
  
  if (!hasEntreprise && cardEntreprise) {
    cardEntreprise.style.display = 'none';
  }
  
  if (!hasEmploye && cardEmploye) {
    cardEmploye.style.display = 'none';
  }
  
  // Définir le lien du profil selon les permissions
  // Le profil est toujours accessible car c'est le profil de l'utilisateur connecté
  if (cardProfile) {
    if (hasEntreprise) {
      cardProfile.href = '#/entreprise/profile';
    } else if (hasEmploye) {
      cardProfile.href = '#/employe/profile';
    } else {
      // Par défaut, on redirige vers employe/profile (accessible à tous)
      cardProfile.href = '#/employe/profile';
    }
  }
}


