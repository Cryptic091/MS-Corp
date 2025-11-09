# Guide : Choisir la région Firestore (Europe - Belgium)

Ce guide explique comment choisir l'emplacement de votre base de données Firestore en Europe (europe-west1 - Belgium).

## ⚠️ Important

**La région Firestore doit être choisie lors de la création de la base de données dans Firebase Console. Elle ne peut pas être changée après la création.**

## Étapes pour créer une base Firestore en Europe

### Option 1 : Créer une nouvelle base de données Firestore

1. **Allez dans Firebase Console**
   - Connectez-vous à [Firebase Console](https://console.firebase.google.com/)
   - Sélectionnez votre projet

2. **Créez une nouvelle base de données Firestore**
   - Allez dans **Firestore Database**
   - Cliquez sur **Créer une base de données**

3. **Choisissez le mode**
   - Sélectionnez **Mode production** ou **Mode test** selon vos besoins

4. **Sélectionnez la région** ⭐
   - Dans la liste des régions, choisissez **europe-west1 (Belgium)**
   - Cliquez sur **Suivant**

5. **Activez Firestore**
   - Confirmez la création de la base de données

### Option 2 : Utiliser une base de données nommée (Plan Blaze requis)

Si vous avez déjà une base de données et souhaitez créer une deuxième base dans une région différente :

1. **Allez dans Firestore Database**
2. **Cliquez sur "Créer une base de données"**
3. **Choisissez "Créer une base de données nommée"**
4. **Donnez un nom** (ex: `ms-corp-europe`)
5. **Sélectionnez la région** : `europe-west1 (Belgium)`
6. **Dans votre code**, spécifiez le nom de la base :

```javascript
import { getFirestore } from './firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ms-corp-europe'); // Nom de la base de données
```

## Régions disponibles en Europe

- **europe-west1** (Belgium) - Recommandé pour la France/Belgique
- **europe-west2** (London, UK)
- **europe-west3** (Frankfurt, Germany)
- **europe-west4** (Netherlands)
- **europe-west6** (Zurich, Switzerland)
- **europe-north1** (Finland)
- **europe-central2** (Warsaw, Poland)

## Vérifier la région de votre base de données

1. Allez dans **Firestore Database** dans Firebase Console
2. Cliquez sur l'onglet **Utilisation**
3. La région est affichée en haut de la page

## Migration vers une autre région

⚠️ **Impossible de migrer une base existante vers une autre région.**

Si vous devez changer de région :
1. Exportez toutes vos données depuis l'ancienne base
2. Créez une nouvelle base dans la région souhaitée
3. Importez les données dans la nouvelle base
4. Mettez à jour votre code pour utiliser la nouvelle base

## Avantages de europe-west1 (Belgium)

- ✅ **Latence réduite** pour les utilisateurs en France/Belgique
- ✅ **Conformité RGPD** : données stockées en Europe
- ✅ **Performance optimale** pour les applications européennes
- ✅ **Coûts** : mêmes tarifs que les autres régions

## Configuration dans votre code

Une fois la base créée dans `europe-west1`, votre code actuel fonctionnera automatiquement. La région est gérée par Firebase et ne nécessite pas de configuration supplémentaire dans le code JavaScript.

```javascript
// Votre code actuel fonctionne normalement
import { getFirebase } from './firebase.js';
import { collection, getDocs } from './firebase.js';

const fb = getFirebase();
const snap = await getDocs(collection(fb.db, 'ma_collection'));
```

## Pour une deuxième base de données

Si vous créez une deuxième base de données dans `europe-west1` :

1. Créez-la dans Firebase Console avec la région `europe-west1`
2. Configurez `firebaseConfig2` dans `index.html`
3. Utilisez `getFirebaseSecondary()` dans votre code

La région sera automatiquement utilisée car elle est définie dans Firebase Console.

## Support

Pour plus d'informations sur les régions Firestore :
- [Documentation Firebase - Régions](https://firebase.google.com/docs/firestore/locations)
- [Console Firebase](https://console.firebase.google.com/)

