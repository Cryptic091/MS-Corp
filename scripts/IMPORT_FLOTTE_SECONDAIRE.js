// Script d'import pour la Flotte (Deuxième Base Firebase)
// Utilisez ce script dans la console du navigateur pour importer les véhicules

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
  
  // Charger Firebase depuis le CDN
  console.log('🔄 Chargement de Firebase...');
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js');
  const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js');
  
  // Vérifier la configuration de la deuxième base
  if (!window.firebaseConfig2) {
    console.error('❌ Configuration Firebase secondaire (firebaseConfig2) non trouvée');
    console.error('Assurez-vous que firebaseConfig2 est défini dans index.html');
    return;
  }
  
  // Initialiser la deuxième app Firebase
  let app2;
  try {
    app2 = initializeApp(window.firebaseConfig2, 'secondary');
  } catch (error) {
    if (error.code === 'app/duplicate-app') {
      // L'app existe déjà, la récupérer
      const { getApps } = await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js');
      app2 = getApps().find(app => app.name === 'secondary');
    } else {
      throw error;
    }
  }
  
  const db2 = getFirestore(app2);
  
  console.log('✅ Deuxième base Firebase initialisée:', window.firebaseConfig2.projectId);
  
  // Vérifier l'authentification
  const authState = JSON.parse(localStorage.getItem('ms_auth_state') || 'null');
  if (!authState || !authState.uid) {
    console.error('❌ Vous devez être connecté pour importer des véhicules');
    return;
  }
  console.log('✅ Utilisateur connecté:', authState.email);
  
  // ⬇️ COLLER LE CONTENU DU FICHIER vehicles-X.txt ICI ⬇️
  // Remplacez cette ligne par le contenu du fichier vehicles-X.txt
  const data = `COLLER_LE_CONTENU_DU_FICHIER_VEHICLES_X_TXT_ICI`;
  
  // Filtrer les lignes vides et les commentaires
  const linesArray = data.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('//'));
  
  let imported = 0, errors = 0, skipped = 0;
  
  console.log(`🚀 Début de l'importation de ${linesArray.length} véhicules dans la deuxième base...\n`);
  
  for (let i = 0; i < linesArray.length; i++) {
    const line = linesArray[i];
    const parts = line.split('\t');
    
    if (parts.length < 11) {
      console.warn(`⚠️  Ligne ${i + 1} ignorée (colonnes insuffisantes: ${parts.length})`);
      skipped++;
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
      skipped++;
      continue;
    }
    
    try {
      await addDoc(collection(db2, 'flotte'), vehicle);
      imported++;
      if (imported % 10 === 0 || imported === 1) {
        console.log(`✅ [${imported}] ${vehicle.type} ${vehicle.modele}`);
      }
      // Petit délai pour éviter de surcharger Firebase
      if (imported % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Erreur ligne ${i + 1}: ${vehicle.modele}`, error.message || error);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(50));
  console.log(`✅ Importés: ${imported}`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log(`⚠️  Ignorés: ${skipped}`);
  console.log(`📦 Total traité: ${linesArray.length}`);
  console.log(`🗄️  Base: ${window.firebaseConfig2.projectId}`);
  console.log('='.repeat(50));
})();

