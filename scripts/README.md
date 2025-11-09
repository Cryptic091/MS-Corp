# Import de véhicules

Ce dossier contient les fichiers nécessaires pour importer des véhicules dans la **deuxième base de données Firebase** (`ms-corp-207e3`).

## Fichiers

Les véhicules sont répartis en plusieurs fichiers selon la première lettre de la marque :
- **`vehicles-A.txt`** : Marques commençant par A (Alfa Romeo, Apollo, Aston Martin, Audi, etc.) - 51 véhicules
- **`vehicles-B.txt`** : Marques commençant par B (Bentley, BMW, Bugatti) - 72 véhicules
- **`vehicles-C.txt`** : Marques commençant par C (Cadillac, Chevrolet, Chrysler, Citroën) - 23 véhicules
- **`vehicles-D.txt`** : Marques commençant par D (Dacia, Dodge) - 15 véhicules
- **`vehicles-F.txt`** : Marques commençant par F (Ferrari, Fiat, Ford) - 51 véhicules
- **`vehicles-H.txt`** : Marques commençant par H (Honda, Hummer, Hyundai) - 11 véhicules
- **`vehicles-J.txt`** : Marques commençant par J (Jaguar, Jeep) - 7 véhicules
- **`vehicles-K.txt`** : Marques commençant par K (Kia, Koenigsegg, KTM) - 4 véhicules
- **`vehicles-L.txt`** : Marques commençant par L (Lamborghini, Land Rover, Lexus, Lincoln) - 14 véhicules
- **`vehicles-M.txt`** : Marques commençant par M (Maserati, Mazda, McLaren, Mercedes, Mini, Mitsubishi, Moto) - 68 véhicules
- **`vehicles-N.txt`** : Marques commençant par N (Nissan) - 8 véhicules
- **`vehicles-O.txt`** : Marques commençant par O (Opel) - 1 véhicule
- **`vehicles-P.txt`** : Marques commençant par P (Pagani, Peugeot, Porsche, Poids Lourds) - 63 véhicules
- **`vehicles-Q.txt`** : Marques commençant par Q (Quad) - 4 véhicules
- **`vehicles-R.txt`** : Marques commençant par R (Renault, Rimac, Rolls Royce) - 21 véhicules
- **`vehicles-S.txt`** : Marques commençant par S (Seat, Skoda, Smart, Subaru) - 13 véhicules
- **`vehicles-T.txt`** : Marques commençant par T (Tesla, Toyota) - 11 véhicules
- **`vehicles-U.txt`** : Marques commençant par U (Utilitaires) - 36 véhicules
- **`vehicles-V.txt`** : Marques commençant par V (Volkswagen, Volvo) - 16 véhicules
- **`vehicles-X.txt`** : Marques commençant par X (Xiaomi) - 1 véhicule

- **`IMPORT_FLOTTE_SECONDAIRE.md`** : Instructions détaillées pour importer les véhicules dans la deuxième base Firebase
- **`IMPORT_FLOTTE_SECONDAIRE.js`** : Script d'import prêt à utiliser dans la console du navigateur

## Méthode d'import

### Import dans la deuxième base Firebase

**C'EST SIMPLE : COPIEZ-COLLEZ DIRECTEMENT !**

1. **Ouvrez la console du navigateur** (F12) sur votre site
2. **Assurez-vous d'être connecté** (vous devez être authentifié)
3. **Ouvrez un fichier** `vehicles-X.txt` (ex: `vehicles-C.txt`)
4. **Sélectionnez TOUT le contenu** (Ctrl+A)
5. **Copiez** (Ctrl+C)
6. **Collez dans la console** (Ctrl+V)
7. **Appuyez sur Entrée** pour exécuter

**C'est tout !** Chaque fichier contient déjà le script complet avec les données intégrées.

**Important** : 
- Les véhicules seront importés dans la **deuxième base** (`ms-corp-207e3`)
- Vous devez importer chaque fichier séparément
- Commencez par `vehicles-A.txt`, puis `vehicles-B.txt`, etc.
- Les fichiers `vehicles-A.txt` et `vehicles-B.txt` sont prêts mais vides (ajoutez les données si nécessaire)

## Format des données

Chaque ligne de chaque fichier représente un véhicule avec les colonnes suivantes (séparées par des TAB) :

1. Type
2. Modèle
3. Prix
4. Vitesse Max
5. Puissance
6. Places
7. Coffre
8. Assurance T1
9. Assurance T2
10. Assurance T3
11. Assurance T4

