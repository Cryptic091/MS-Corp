// Import des SDK Firebase (CDN modulaire) - exactement comme Firebase le montre
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, setDoc, addDoc, serverTimestamp, updateDoc, deleteDoc, increment, writeBatch, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js';

let appRef = null;
let authRef = null;
let dbRef = null;
let storageRef = null;
let analyticsRef = null;

// Références pour la deuxième base de données (optionnelle)
let appRef2 = null;
let dbRef2 = null;
let authRef2 = null;
let storageRef2 = null;

export function initFirebaseIfReady() {
  if (appRef) return { app: appRef, auth: authRef, db: dbRef, storage: storageRef, analytics: analyticsRef };
  if (!window.firebaseConfig) return null;
  
  // Initialisation exactement comme Firebase le montre
  appRef = initializeApp(window.firebaseConfig);
  analyticsRef = getAnalytics(appRef);
  authRef = getAuth(appRef);
  
  // Initialiser Firestore
  // Note: La région Firestore (ex: europe-west1) doit être choisie lors de la création
  // de la base de données dans Firebase Console. Elle ne peut pas être changée après.
  // Pour utiliser une base de données nommée dans une région spécifique, spécifiez le nom ici :
  // dbRef = getFirestore(appRef, 'nom-de-la-base');
  dbRef = getFirestore(appRef);
  
  storageRef = getStorage(appRef);
  
  return { app: appRef, auth: authRef, db: dbRef, storage: storageRef, analytics: analyticsRef };
}

// Fonction pour initialiser la deuxième base de données Firebase (optionnelle)
export function initFirebaseSecondary() {
  // Si déjà initialisée, retourner les références existantes
  if (appRef2) {
    return { 
      app: appRef2, 
      auth: authRef2, 
      db: dbRef2, 
      storage: storageRef2 
    };
  }
  
  // Vérifier si une configuration secondaire existe
  if (!window.firebaseConfig2) {
    console.warn('⚠️ Configuration Firebase secondaire (firebaseConfig2) non trouvée');
    return null;
  }
  
  try {
    // Initialiser la deuxième app Firebase avec un nom unique
    appRef2 = initializeApp(window.firebaseConfig2, 'secondary');
    authRef2 = getAuth(appRef2);
    
    // Initialiser Firestore - la région est définie lors de la création dans Firebase Console
    // Si vous utilisez une base de données nommée, spécifiez-la ici
    dbRef2 = getFirestore(appRef2);
    
    storageRef2 = getStorage(appRef2);
    
    console.log('✅ Deuxième base de données Firebase initialisée');
    if (window.firebaseConfig2.firestoreRegion) {
      console.log(`📍 Région Firestore: ${window.firebaseConfig2.firestoreRegion}`);
    }
    return { 
      app: appRef2, 
      auth: authRef2, 
      db: dbRef2, 
      storage: storageRef2 
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la deuxième base Firebase:', error);
    return null;
  }
}

// Fonction pour obtenir la deuxième base de données
export function getFirebaseSecondary() {
  return initFirebaseSecondary();
}

// Fonction helper pour obtenir la base de données de la flotte (utilise la deuxième base)
export function getFlotteFirebase() {
  const secondary = getFirebaseSecondary();
  if (secondary && secondary.db) {
    return secondary;
  }
  // Fallback sur la première base si la deuxième n'est pas disponible
  console.warn('⚠️ Base secondaire non disponible, utilisation de la base principale pour la flotte');
  return getFirebase();
}

export function getFirebase() {
  return initFirebaseIfReady();
}

// Fonction pour attendre que Firebase soit prêt
export async function waitForFirebase(maxRetries = 20, delay = 200) {
  // D'abord attendre que firebaseConfig soit défini
  for (let i = 0; i < maxRetries; i++) {
    if (window.firebaseConfig) break;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  if (!window.firebaseConfig) return null;
  
  // Ensuite attendre que Firebase soit initialisé (db et storage)
  for (let i = 0; i < maxRetries; i++) {
    const fb = initFirebaseIfReady();
    if (fb && fb.db && fb.storage) {
      return fb;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return null;
}

// Fonction pour attendre que la base de données de la flotte soit prête
export async function waitForFlotteFirebase(maxRetries = 20, delay = 200) {
  // D'abord attendre que firebaseConfig2 soit défini
  for (let i = 0; i < maxRetries; i++) {
    if (window.firebaseConfig2) break;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  if (!window.firebaseConfig2) {
    // Fallback sur la première base si la deuxième n'est pas configurée
    return await waitForFirebase(maxRetries, delay);
  }
  
  // Ensuite attendre que la deuxième base Firebase soit initialisée
  for (let i = 0; i < maxRetries; i++) {
    const fb = initFirebaseSecondary();
    if (fb && fb.db) {
      return fb;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Fallback sur la première base si la deuxième n'est pas disponible
  return await waitForFirebase(maxRetries, delay);
}

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail };
export { collection, getDocs, getDoc, doc, query, where, orderBy, limit, setDoc, addDoc, serverTimestamp, updateDoc, deleteDoc, increment, writeBatch, onSnapshot };
export { getStorage, ref, uploadBytes, getDownloadURL, deleteObject };

// Simple helper: log an action into Firestore
export async function addLogEntry(fb, { type = 'action', action = '', message = '', uid = '', category = '' }) {
  try {
    if (!fb || !fb.db) return;

    // Si aucun UID n'est fourni, récupérer l'UID de l'utilisateur connecté
    let userId = uid;
    let userName = '';
    let userEmail = '';
    
    if (!userId && fb.auth && fb.auth.currentUser) {
      userId = fb.auth.currentUser.uid;
    } else if (!userId) {
      try {
        const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
        userId = authState?.uid || '';
      } catch (e) {
        userId = '';
      }
    }

    // Récupérer les informations utilisateur depuis Firestore
    if (userId && userId !== 'system' && fb.db) {
      try {
        const userDoc = await getDoc(doc(fb.db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.name || userData.email?.split('@')[0] || 'Utilisateur';
          userEmail = userData.email || '';
        }
      } catch (e) {
        // Ignorer les erreurs de récupération utilisateur
      }
    }

    const logsRef = collection(fb.db, 'logs');
    const entry = {
      type: type || 'action',
      action: action || '',
      message: message || '',
      category: category || '',
      uid: userId || 'system',
      userName: userName || '',
      userEmail: userEmail || '',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(logsRef, entry);
    } catch (writeError) {
      // Si la première tentative échoue (ex: index manquant), réessayer sans createdAt pour laisser Firestore créer un timestamp par défaut
      const fallbackEntry = { ...entry };
      delete fallbackEntry.createdAt;
      await addDoc(logsRef, fallbackEntry);
    }
  } catch (e) {
    // Ignorer les erreurs de logging pour ne pas bloquer l'application
  }
}


