
(async function() {
  // Fonction pour parser les nombres français
  function parseFrenchNumber(value) {
    if (!value || value === '—' || value === '-' || value === '') return null;
    let cleaned = String(value).replace(/\s/g, '').replace(/€/g, '').trim();
    if (cleaned.includes(',') && !cleaned.includes('.')) cleaned = cleaned.replace(',', '.');
    else if (cleaned.includes(',') && cleaned.includes('.')) {
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      else cleaned = cleaned.replace(/,/g, '');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  // Charger Firebase depuis le CDN si nécessaire
  if (!window.firebaseLoaded) {
    console.log('🔄 Chargement de Firebase depuis le CDN...');
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js');
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');
    
    if (!window.firebaseConfig) {
      console.error('❌ Configuration Firebase non trouvée');
      return;
    }
    
    const app = initializeApp(window.firebaseConfig);
    const db = getFirestore(app);
    
    window.firebaseDb = db;
    window.firebaseCollection = collection;
    window.firebaseAddDoc = addDoc;
    window.firebaseServerTimestamp = serverTimestamp;
    window.firebaseLoaded = true;
    console.log('✅ Firebase chargé');
  }
  
  const db = window.firebaseDb;
  const collection = window.firebaseCollection;
  const addDoc = window.firebaseAddDoc;
  const serverTimestamp = window.firebaseServerTimestamp;
  
  // Vérifier l'authentification
  const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
  if (!authState || !authState.uid) {
    console.error('❌ Vous devez être connecté pour importer des véhicules');
    return;
  }
  console.log('✅ Utilisateur connecté:', authState.email);
  
  // Charger les données depuis vehicles-data.txt
  // Ouvrez le fichier vehicles-data.txt et copiez tout son contenu entre les backticks ci-dessous
  // Format: une ligne par véhicule, colonnes séparées par TAB
  // Type[TAB]Modèle[TAB]Prix[TAB]Vitesse Max[TAB]Puissance[TAB]Places[TAB]Coffre[TAB]Assurance T1[TAB]Assurance T2[TAB]Assurance T3[TAB]Assurance T4
  
  const data = `COLLER_LE_CONTENU_DE_vehicles-data.txt_ICI`;
  
  // Filtrer les lignes vides et les commentaires
  const linesArray = data.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'));
  let imported = 0, errors = 0;
  
  console.log(`🚀 Début de l'importation de ${linesArray.length} véhicules...\n`);
  
  for (let i = 0; i < linesArray.length; i++) {
    const line = linesArray[i];
    const parts = line.split('\t');
    if (parts.length < 11) {
      console.warn(`⚠️  Ligne ${i + 1} ignorée (colonnes insuffisantes: ${parts.length})`);
      continue;
    }
    
    const vehicle = {
      type: parts[0]?.trim() || 'Autre',
      modele: parts[1]?.trim() || '',
      prixAchat: parseFrenchNumber(parts[2]) || 0,
      vitesseMax: parseFrenchNumber(parts[3]),
      puissance: parseFrenchNumber(parts[4]),
      nombrePlaces: parseFrenchNumber(parts[5]),
      coffre: parseFrenchNumber(parts[6]),
      assuranceTier1: parseFrenchNumber(parts[7]),
      assuranceTier2: parseFrenchNumber(parts[8]),
      assuranceTier3: parseFrenchNumber(parts[9]),
      assuranceTier4: parseFrenchNumber(parts[10]),
      achete: false,
      createdAt: serverTimestamp()
    };
    
    if (!vehicle.modele || !vehicle.prixAchat) {
      console.warn(`⚠️  Ligne ${i + 1} ignorée (données incomplètes)`);
      continue;
    }
    
    try {
      await addDoc(collection(db, 'flotte'), vehicle);
      imported++;
      if (imported % 10 === 0 || imported === 1) {
        console.log(`✅ [${imported}/${linesArray.length}] ${vehicle.type} ${vehicle.modele}`);
      }
    } catch (error) {
      console.error(`❌ Erreur ligne ${i + 1}: ${vehicle.modele}`, error.message || error);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(50));
  console.log(`✅ Importés: ${imported}`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log(`📦 Total traité: ${linesArray.length}`);
  console.log('='.repeat(50));
})();
