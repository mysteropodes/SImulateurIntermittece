/** Échéances d'un intermittent et export agenda (.ics, RFC 5545). */
import { addDays, parseDate, toISODate, formatDateFR } from './calculs';

export type TypeEcheance = 'france-travail' | 'audiens' | 'droit';

export interface Echeance {
  id: string;
  date: string; // YYYY-MM-DD
  titre: string;
  detail: string;
  type: TypeEcheance;
  /** Répété chaque mois (actualisation). */
  mensuel?: boolean;
}

export interface ParamsEcheances {
  aujourdHui: string;
  dateAnniversaire: string;
  /** Diagnostic à la date anniversaire : rattrapage possible ? */
  rattrapagePossible: boolean;
}

export function echeances(p: ParamsEcheances): Echeance[] {
  const out: Echeance[] = [];
  const auj = parseDate(p.aujourdHui);
  const anniv = parseDate(p.dateAnniversaire);

  // actualisation mensuelle : du 28 au 15 du mois suivant
  const prochain28 = new Date(auj.getFullYear(), auj.getMonth() + (auj.getDate() > 28 ? 1 : 0), 28);
  out.push({
    id: 'actualisation',
    date: toISODate(prochain28),
    titre: 'Actualisation France Travail',
    detail: 'Déclarez vos heures et salaires bruts du mois, du 28 au 15 du mois suivant. Un oubli suspend le paiement.',
    type: 'france-travail',
    mensuel: true,
  });

  out.push({
    id: 'verif-contrats',
    date: toISODate(addDays(anniv, -30)),
    titre: 'Vérifier vos contrats avant le réexamen',
    detail: 'Dans « Mes 2 dernières années professionnelles », vérifiez que toutes vos attestations employeur sont bien reçues et certifiées.',
    type: 'droit',
  });
  out.push({
    id: 'demande-examen',
    date: toISODate(addDays(anniv, -15)),
    titre: 'Demande d’examen de vos droits',
    detail: 'France Travail vous invite à demander le réexamen de vos droits (rubrique « Mes allocations »).',
    type: 'france-travail',
  });
  out.push({
    id: 'anniversaire',
    date: p.dateAnniversaire,
    titre: 'Date anniversaire',
    detail: 'Fin du droit en cours. Évitez d’être sous contrat spectacle ce jour-là : l’examen serait reporté au premier jour sans contrat et votre prochaine date anniversaire reculerait (voir la page Échéances).',
    type: 'droit',
  });
  if (p.rattrapagePossible) {
    out.push({
      id: 'rattrapage',
      date: toISODate(addDays(anniv, 30)),
      titre: 'Limite de demande de clause de rattrapage (≈)',
      detail: '30 jours après l’envoi de la notification de refus. Sans demande, vous perdez aussi l’APS et l’AFD.',
      type: 'france-travail',
    });
  }

  // Congés Spectacles : demande à partir de mi-avril, paiement dès le 1er mai, au plus tard le 31 mars suivant
  const y = auj.getMonth() + 1 >= 4 && auj.getDate() >= 1 ? auj.getFullYear() : auj.getFullYear() - 1;
  const candidats: Echeance[] = [
    {
      id: `cs-ouverture-${y + 1}`,
      date: `${y + 1}-04-15`,
      titre: 'Congés Spectacles : demande possible',
      detail: `Demandez votre indemnité de congés (10 % des salaires du 1er avril ${y} au 31 mars ${y + 1}) sur votre espace Audiens.`,
      type: 'audiens',
    },
    {
      id: `cs-paiement-${y + 1}`,
      date: `${y + 1}-05-01`,
      titre: 'Congés Spectacles : premiers paiements',
      detail: 'Paiement au plus tôt le 1er mai, au moins 15 jours après la demande.',
      type: 'audiens',
    },
    {
      id: `cs-limite-${y + 1}`,
      date: `${y + 1}-03-31`,
      titre: 'Congés Spectacles : dernier jour pour demander',
      detail: `Dernier jour pour demander les congés de la période précédente (1er avril ${y - 1} → 31 mars ${y}).`,
      type: 'audiens',
    },
  ];
  out.push(...candidats.filter((e) => e.date >= p.aujourdHui));

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const ics = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const d8 = (iso: string) => iso.replace(/-/g, '');

/** Calendrier .ics (événements sur la journée, rappel la veille). */
export function versICS(liste: Echeance[], maintenant = new Date()): string {
  const stamp = maintenant.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Simulateur Intermittence//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of liste) {
    lignes.push(
      'BEGIN:VEVENT',
      `UID:${e.id}-${d8(e.date)}@simulateur-intermittence`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d8(e.date)}`,
      `DTEND;VALUE=DATE:${d8(toISODate(addDays(parseDate(e.date), 1)))}`,
      `SUMMARY:${ics(e.titre)}`,
      `DESCRIPTION:${ics(`${e.detail} (${formatDateFR(e.date)})`)}`,
      ...(e.mensuel ? ['RRULE:FREQ=MONTHLY;COUNT=12'] : []),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${ics(e.titre)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lignes.push('END:VCALENDAR');
  return lignes.join('\r\n');
}
