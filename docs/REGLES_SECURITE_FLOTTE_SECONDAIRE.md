# Règles de Sécurité Firestore - Deuxième Base (Flotte)

## Problème

Si vous voyez l'erreur `FirebaseError: Missing or insufficient permissions` dans la console, c'est que les règles de sécurité Firestore pour la deuxième base (`ms-corp-207e3`) ne sont pas configurées.

## Solution

### Étape 1 : Accéder à Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet **`ms-corp-207e3`** (votre deuxième base)
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**
4. Cliquez sur l'onglet **"Règles"** (Rules)

### Étape 2 : Copier les règles de sécurité

Copiez-collez les règles suivantes dans l'éditeur de règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection flotte
    match /flotte/{document=**} {
      // Lecture publique (pour le site public)
      allow read: if true;
      
      // Écriture pour les utilisateurs authentifiés
      // Note: L'authentification se fait via la première base (ms-corp)
      // Si vous avez des problèmes de permissions, utilisez la version ci-dessous
      allow write: if request.auth != null;
    }
    
    // Par défaut, refuser tout accès
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ Si vous avez toujours des erreurs de permissions après avoir configuré les règles ci-dessus**, utilisez cette version temporaire (moins sécurisée) :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection flotte - Accès public temporaire
    // ⚠️ À améliorer avec une authentification partagée entre les deux projets
    match /flotte/{document=**} {
      allow read, write: if true;
    }
    
    // Par défaut, refuser tout accès
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Note importante :** Cette deuxième version permet l'accès public complet. Utilisez-la uniquement temporairement pour tester, puis revenez à la première version une fois l'authentification partagée configurée.

### Étape 3 : Publier les règles

1. Cliquez sur le bouton **"Publier"** (Publish) en haut à droite
2. Attendez la confirmation que les règles ont été publiées

### Étape 4 : Vérifier

1. Rechargez votre application
2. Les erreurs de permissions devraient disparaître
3. Vous devriez pouvoir voir et gérer les véhicules dans la section "Gestion Flotte"

## Explication des règles

- **`request.auth != null`** : Vérifie que l'utilisateur est authentifié (connecté)
- **`allow read, write`** : Autorise la lecture et l'écriture pour les utilisateurs authentifiés
- **`match /flotte/{document=**}`** : Applique ces règles à tous les documents de la collection `flotte` et ses sous-collections
- **`match /{document=**}`** : Par défaut, refuse tout accès aux autres collections

## Note importante

Ces règles permettent à **tous les utilisateurs authentifiés** d'accéder à la collection `flotte`. Si vous souhaitez restreindre l'accès à certains utilisateurs ou rôles, vous devrez modifier les règles en conséquence.

### Exemple : Restreindre l'accès aux administrateurs uniquement

Si vous avez un champ `role` dans les documents utilisateurs de votre première base, vous pouvez utiliser :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fonction helper pour vérifier si l'utilisateur est admin
    function isAdmin() {
      // Note: Cette fonction nécessite que les données utilisateur soient dans cette base
      // ou que vous utilisiez une autre méthode de vérification
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /flotte/{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Pour l'instant, utilisez les règles simples ci-dessus qui autorisent tous les utilisateurs authentifiés.

