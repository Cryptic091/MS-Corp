# 🚀 Guide de publication sur GitHub Pages

## ✅ Après l'installation de Git

### Étape 1 : Ouvrir PowerShell dans le dossier du projet

1. Ouvrez l'Explorateur Windows
2. Naviguez vers `C:\Users\Aniss\Desktop\MS Corp`
3. Cliquez dans la barre d'adresse et tapez `powershell` puis appuyez sur Entrée
   - OU faites un clic droit dans le dossier → "Ouvrir dans PowerShell"

### Étape 2 : Vérifier que Git est installé

```powershell
git --version
```

Vous devriez voir quelque chose comme : `git version 2.x.x`

### Étape 3 : Supprimer le dossier node_modules (si présent)

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
```

### Étape 4 : Configurer Git (première fois uniquement)

Remplacez avec vos informations :

```powershell
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

**Exemple** :
```powershell
git config --global user.name "Aniss"
git config --global user.email "aniss@example.com"
```

### Étape 5 : Initialiser le dépôt Git

```powershell
git init
```

### Étape 6 : Ajouter tous les fichiers

```powershell
git add .
```

### Étape 7 : Créer le premier commit

```powershell
git commit -m "Initial commit - MS Corp"
```

### Étape 8 : Créer le dépôt sur GitHub.com

1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur le bouton **+** en haut à droite → **New repository**
3. **Nom du dépôt** : `MS-Corp` (ou un autre nom de votre choix)
4. **Description** (optionnel) : "Portail entreprise MS Corp"
5. **Visibilité** : 
   - ✅ **Public** (gratuit, site accessible publiquement)
   - OU **Private** (nécessite GitHub Pro pour Pages)
6. **NE COCHEZ PAS** "Add a README file" (vous en avez déjà un)
7. Cliquez sur **Create repository**

### Étape 9 : Lier votre dépôt local à GitHub

**Remplacez `VOTRE_USERNAME` et `NOM_DU_DEPOT`** par vos valeurs :

```powershell
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git
git push -u origin main
```

**Exemple si votre username est "aniss" et le dépôt "MS-Corp"** :
```powershell
git branch -M main
git remote add origin https://github.com/aniss/MS-Corp.git
git push -u origin main
```

Vous devrez peut-être vous authentifier :
- GitHub vous demandera votre username et password
- Pour le password, utilisez un **Personal Access Token** (voir ci-dessous)

### Étape 10 : Activer GitHub Pages

1. Sur votre dépôt GitHub, cliquez sur **Settings** (en haut)
2. Dans le menu de gauche, cliquez sur **Pages**
3. Sous **Source**, sélectionnez :
   - **Deploy from a branch**
   - **Branch** : `main`
   - **Folder** : `/ (root)`
4. Cliquez sur **Save**

### Étape 11 : Attendre le déploiement

- Attendez 1-2 minutes
- Rafraîchissez la page Settings → Pages
- Vous verrez un message vert avec l'URL de votre site
- Votre site sera accessible à : `https://VOTRE_USERNAME.github.io/NOM_DU_DEPOT/`

## 🔐 Créer un Personal Access Token (si nécessaire)

Si GitHub vous demande un token au lieu d'un mot de passe :

1. Allez sur GitHub.com → **Settings** (votre profil) → **Developer settings**
2. Cliquez sur **Personal access tokens** → **Tokens (classic)**
3. Cliquez sur **Generate new token** → **Generate new token (classic)**
4. **Note** : "MS Corp Deployment"
5. **Expiration** : Choisissez une durée (ex: 90 jours)
6. **Scopes** : Cochez **repo** (tout cocher sous repo)
7. Cliquez sur **Generate token**
8. **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)
9. Utilisez ce token comme mot de passe lors du `git push`

## 🔄 Mettre à jour le site (après modifications)

À chaque fois que vous modifiez votre code :

```powershell
git add .
git commit -m "Description de vos modifications"
git push
```

Le site sera automatiquement mis à jour en quelques minutes !

## ✅ Vérification finale

Votre projet devrait maintenant contenir uniquement :
- ✅ `index.html`
- ✅ `assets/` (dossier CSS)
- ✅ `js/` (dossier JavaScript)
- ✅ `images/` (dossier images)
- ✅ `firestore.rules`
- ✅ `storage.rules`
- ✅ `README.md`
- ✅ `.gitignore`
- ✅ `.github/workflows/deploy.yml`

## 🐛 Résolution de problèmes

### Erreur "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/VOTRE_USERNAME/NOM_DU_DEPOT.git
```

### Le site ne se charge pas
- Vérifiez Settings → Pages (doit être activé)
- Vérifiez l'onglet **Actions** pour voir si le déploiement a réussi
- Attendez quelques minutes (premier déploiement peut prendre du temps)

### Erreur lors du push
- Vérifiez que vous êtes bien connecté à GitHub
- Utilisez un Personal Access Token au lieu du mot de passe
- Vérifiez l'URL du dépôt (doit correspondre à votre dépôt GitHub)

