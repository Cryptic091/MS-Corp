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

export function initFirebaseIfReady() {
  if (appRef) return { app: appRef, auth: authRef, db: dbRef, storage: storageRef, analytics: analyticsRef };
  if (!window.firebaseConfig) return null;
  
  // Initialisation exactement comme Firebase le montre
  appRef = initializeApp(window.firebaseConfig);
  analyticsRef = getAnalytics(appRef);
  authRef = getAuth(appRef);
  dbRef = getFirestore(appRef);
  storageRef = getStorage(appRef);
  
  return { app: appRef, auth: authRef, db: dbRef, storage: storageRef, analytics: analyticsRef };
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

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, fetchSignInMethodsForEmail };
export { collection, getDocs, getDoc, doc, query, where, orderBy, limit, setDoc, addDoc, serverTimestamp, updateDoc, deleteDoc, increment, writeBatch, onSnapshot };
export { getStorage, ref, uploadBytes, getDownloadURL, deleteObject };

// Simple helper: log an action into Firestore
export async function addLogEntry(fb, { type = 'action', action = '', message = '', uid = '' }) {
  try {
    if (!fb || !fb.db) return;

    // Si aucun UID n'est fourni, récupérer l'UID de l'utilisateur connecté
    let userId = uid;
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

    const logsRef = collection(fb.db, 'logs');
    const entry = {
      type: type || 'action',
      action: action || '',
      message: message || '',
      uid: userId || 'system',
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


