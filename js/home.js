import { html, mount, checkPermission } from './utils.js';

export async function viewHome(root) {
  const content = html`
    <section class="fade-in home-wrap">
      <div>
        <h2 class="text-3xl font-semibold text-center">Bienvenue</h2>
        <p class="text-center text-slate-500 mt-2 mb-10">Choisissez un espace</p>
        <div class="home-grid">
          <a href="#/entreprise" id="card-entreprise" class="card-flag">
            <div class="inner">
              <div class="card-logo-wrap">
                <img src="images/MScorp.png" alt="Logo MS Corp" class="card-logo">
              </div>
              <div class="badge">Administrateur</div>
              <div class="title mt-2">Gestion Entreprise</div>
              <div class="desc mt-1">Pilotez l'organisation: utilisateurs, rôles, ventes et journaux.</div>
              <div class="card-feats">
                <div class="feat"><span class="dot"></span>Gestion Employé</div>
                <div class="feat"><span class="dot"></span>Rôles & Permissions</div>
                <div class="feat"><span class="dot"></span>Ventes</div>
                <div class="feat"><span class="dot"></span>Logs</div>
              </div>
            </div>
          </a>
          <a href="#/employe" id="card-employe" class="card-flag">
            <div class="inner">
              <div class="card-logo-wrap">
                <img src="images/MScorp.png" alt="Logo MS Corp" class="card-logo">
              </div>
              <div class="badge">Employé</div>
              <div class="title mt-2">Espace Employé</div>
              <div class="desc mt-1">Accédez à vos ventes, documents et informations personnelles.</div>
              <div class="card-feats">
                <div class="feat"><span class="dot"></span>Ventes</div>
                <div class="feat"><span class="dot"></span>Documents</div>
              </div>
            </div>
          </a>
          <a href="#" id="card-profile" class="card-flag">
            <div class="inner">
              <div class="card-logo-wrap">
                <img src="images/MScorp.png" alt="Logo MS Corp" class="card-logo">
              </div>
              <div class="badge">Profil</div>
              <div class="title mt-2">Mon Profil</div>
              <div class="desc mt-1">Consultez vos informations personnelles et vos statistiques.</div>
              <div class="card-feats">
                <div class="feat"><span class="dot"></span>Informations</div>
                <div class="feat"><span class="dot"></span>Statistiques</div>
                <div class="feat"><span class="dot"></span>Historique</div>
              </div>
            </div>
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


