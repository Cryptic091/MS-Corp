# Guide : Utiliser une deuxième base de données Firebase

Ce guide explique comment configurer et utiliser une deuxième base de données Firebase dans votre application MS Corp.

## Options disponibles

### Option 1 : Deux projets Firebase différents (recommandé)
Utilisez deux projets Firebase complètement séparés avec leurs propres configurations.

### Option 2 : Deux bases de données Firestore dans le même projet
Nécessite le plan **Blaze** (payant) de Firebase. Permet d'avoir plusieurs bases de données dans un même projet.

## Configuration

### Étape 1 : Ajouter la configuration secondaire

Dans `index.html`, décommentez et remplissez `firebaseConfig2` :

```javascript
window.firebaseConfig2 = {
  apiKey: "VOTRE_API_KEY_2",
  authDomain: "votre-projet-2.firebaseapp.com",
  projectId: "votre-projet-2",
  storageBucket: "votre-projet-2.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID_2",
  appId: "VOTRE_APP_ID_2",
  measurementId: "VOTRE_MEASUREMENT_ID_2"
};
```

### Étape 2 : Utiliser la deuxième base de données

Dans votre code JavaScript, importez les fonctions nécessaires :

```javascript
import { getFirebaseSecondary } from './firebase.js';
import { collection, getDocs, addDoc } from './firebase.js';

// Obtenir la référence à la deuxième base de données
const fb2 = getFirebaseSecondary();

if (fb2 && fb2.db) {
  // Utiliser la deuxième base de données
  const snap = await getDocs(collection(fb2.db, 'ma_collection'));
  // ...
}
```

## Exemples d'utilisation

### Lire des données depuis la deuxième base

```javascript
import { getFirebaseSecondary } from './firebase.js';
import { collection, getDocs, query, orderBy } from './firebase.js';

async function loadDataFromSecondary() {
  const fb2 = getFirebaseSecondary();
  if (!fb2 || !fb2.db) {
    console.error('Deuxième base de données non disponible');
    return;
  }

  try {
    const snap = await getDocs(
      query(collection(fb2.db, 'vehicules'), orderBy('createdAt', 'desc'))
    );
    
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Données de la deuxième base:', data);
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### Écrire des données dans la deuxième base

```javascript
import { getFirebaseSecondary } from './firebase.js';
import { collection, addDoc, serverTimestamp } from './firebase.js';

async function addDataToSecondary() {
  const fb2 = getFirebaseSecondary();
  if (!fb2 || !fb2.db) return;

  try {
    await addDoc(collection(fb2.db, 'ma_collection'), {
      nom: 'Exemple',
      createdAt: serverTimestamp()
    });
    console.log('Données ajoutées avec succès');
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### Utiliser l'authentification de la deuxième base

```javascript
import { getFirebaseSecondary } from './firebase.js';
import { signInWithEmailAndPassword } from './firebase.js';

async function loginToSecondary(email, password) {
  const fb2 = getFirebaseSecondary();
  if (!fb2 || !fb2.auth) return;

  try {
    const userCredential = await signInWithEmailAndPassword(
      fb2.auth, 
      email, 
      password
    );
    console.log('Connecté à la deuxième base:', userCredential.user);
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
}
```

## Cas d'usage

- **Synchronisation de données** : Synchroniser des données entre deux projets
- **Sauvegarde** : Sauvegarder des données importantes dans une deuxième base
- **Environnements séparés** : Utiliser une base pour la production et une pour le développement
- **Données externes** : Accéder à des données d'un autre projet Firebase

## Notes importantes

1. **Authentification séparée** : Chaque base de données a sa propre authentification. Les utilisateurs doivent être créés dans chaque projet.

2. **Règles de sécurité** : Configurez les règles Firestore pour chaque projet séparément dans la console Firebase.

3. **Coûts** : Si vous utilisez deux projets Firebase, les coûts sont séparés. Le plan gratuit (Spark) s'applique à chaque projet.

4. **Performance** : Utiliser deux bases peut avoir un impact sur les performances. Utilisez uniquement si nécessaire.

## Dépannage

### Erreur : "Firebase app named 'secondary' already exists"
La deuxième base est déjà initialisée. Utilisez `getFirebaseSecondary()` au lieu de `initFirebaseSecondary()`.

### Erreur : "Configuration Firebase secondaire non trouvée"
Vérifiez que `window.firebaseConfig2` est bien défini dans `index.html`.

### Les données ne s'affichent pas
Vérifiez les règles de sécurité Firestore dans la console Firebase du deuxième projet.

