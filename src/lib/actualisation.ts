/** Récapitulatif d'un mois pour l'actualisation France Travail. */
import { type Contrat, heuresContrat, repartirContrat, joursEntre, formatDateFR, estActivite } from './calculs';

export interface LigneActualisation {
  employeur: string;
  type: Contrat['type'];
  debut: string;
  fin: string;
  heures: number;
  brut: number;
}

export interface RecapMois {
  cle: string;
  lignes: LigneActualisation[];
  heures: number;
  brut: number;
  arrets: { debut: string; fin: string; jours: number }[];
  formations: { employeur: string; heures: number }[];
}

export function recapMois(contrats: Contrat[], cle: string): RecapMois {
  const [y, m] = cle.split('-').map(Number);
  const debutMois = `${cle}-01`;
  const finMois = `${cle}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  const lignes: LigneActualisation[] = [];
  const arrets: RecapMois['arrets'] = [];
  const formations: RecapMois['formations'] = [];
  for (const c of contrats) {
    const part = repartirContrat(c).find((p) => p.cle === cle);
    if (!part) continue;
    const debut = c.date > debutMois ? c.date : debutMois;
    const finC = c.dateFin && c.dateFin >= c.date ? c.dateFin : c.date;
    const fin = finC < finMois ? finC : finMois;
    if (c.type === 'Arret') {
      arrets.push({ debut, fin, jours: joursEntre(c, debutMois, finMois) });
      continue;
    }
    if (c.type === 'Formation') {
      formations.push({ employeur: c.employeur || 'Formation', heures: part.heures });
      continue;
    }
    if (!estActivite(c)) continue;
    lignes.push({ employeur: c.employeur || '(sans nom)', type: c.type, debut, fin, heures: part.heures, brut: part.brut });
  }
  lignes.sort((a, b) => a.debut.localeCompare(b.debut));
  return {
    cle,
    lignes,
    heures: lignes.reduce((a, l) => a + l.heures, 0),
    brut: lignes.reduce((a, l) => a + l.brut, 0),
    arrets,
    formations,
  };
}

const f2 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

export function recapTexte(r: RecapMois, libelleMois: string): string {
  const l = [`Actualisation — ${libelleMois}`, ''];
  if (r.lignes.length === 0) l.push('Aucune activité ce mois-ci.');
  for (const x of r.lignes) {
    l.push(`• ${x.employeur} — ${f2(x.heures)} h — ${f2(x.brut)} € brut (${formatDateFR(x.debut)}${x.fin !== x.debut ? ` → ${formatDateFR(x.fin)}` : ''})`);
  }
  if (r.lignes.length) l.push('', `Total : ${f2(r.heures)} h — ${f2(r.brut)} € brut`);
  for (const a of r.arrets) l.push(`Arrêt / congé : du ${formatDateFR(a.debut)} au ${formatDateFR(a.fin)} (${a.jours} j)`);
  for (const f of r.formations) l.push(`Formation : ${f.employeur} — ${f2(f.heures)} h`);
  return l.join('\n');
}

export { heuresContrat };
