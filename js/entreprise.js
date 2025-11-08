import { viewEmployes } from './entreprise/employes.js';
import { viewRoles } from './entreprise/roles.js';
import { viewVentes } from './entreprise/ventes.js';
import { viewFinance } from './entreprise/finance.js';
import { viewFlotte } from './entreprise/flotte.js';
import { viewCalcul } from './entreprise/calcul.js';
import { viewLogs } from './entreprise/logs.js';
import { viewProfile } from './profile.js';

export function viewEntreprise(root) {
  const hash = location.hash || '#/entreprise';
  
  if (hash === '#/entreprise' || hash.startsWith('#/entreprise/employes')) {
    viewEmployes(root);
  } else if (hash === '#/entreprise/roles') {
    viewRoles(root);
  } else if (hash === '#/entreprise/ventes') {
    viewVentes(root);
  } else if (hash === '#/entreprise/finance') {
    viewFinance(root);
  } else if (hash === '#/entreprise/flotte') {
    viewFlotte(root);
  } else if (hash === '#/entreprise/calcul') {
    viewCalcul(root);
  } else if (hash === '#/entreprise/logs') {
    viewLogs(root);
  } else if (hash === '#/entreprise/profile') {
    viewProfile(root, 'entreprise');
  } else {
    viewEmployes(root);
  }
}
