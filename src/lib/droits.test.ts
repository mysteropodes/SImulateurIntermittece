import { describe, it, expect } from 'vitest';
import { diagnosticAnniversaire, simulerRattrapage, afd, joursAFDMois, simulerConge, congesSpectacles, heuresAnneeCivile } from './droits';
import { calculAJ, type Contrat } from './calculs';

const c = (date: string, nombre: number, brut: number, type: Contrat['type'] = 'Heures'): Contrat => ({ id: date + nombre + type, date, employeur: 'E', type, nombre, brut });
const profil = { ancienneteAns: 6, cinqAnsSur10: true, afdDeja: 0 };

describe('perte de l’intermittence', () => {
  it('diagnostic : 507 h, 338–506 h avec ou sans ancienneté, moins de 338 h', () => {
    expect(diagnosticAnniversaire(520, profil).issue).toBe('readmission');
    expect(diagnosticAnniversaire(456, profil).issue).toBe('rattrapage');
    expect(diagnosticAnniversaire(456, { ...profil, cinqAnsSur10: false }).issue).toBe('rattrapage-sans-anciennete');
    const d = diagnosticAnniversaire(300, profil);
    expect(d.issue).toBe('solidarite');
    expect(d.manquantPourRattrapage).toBe(38);
    expect(d.manquantPour507).toBe(207);
  });

  it('rattrapage : 6 mois à la dernière AJ, franchises 2 + 2 j/mois non reportables', () => {
    const r = simulerRattrapage('2023-12-31', 60, 3, 0);
    expect(r.fin).toBe('2024-06-30'); // guide, exemple 15
    expect(r.mois[0]).toMatchObject({ cle: '2023-12', jours: 1, franchiseCP: 1, joursIndemnises: 0 });
    expect(r.mois[1]).toMatchObject({ cle: '2024-01', franchiseCP: 2, joursIndemnises: 29 });
    expect(r.mois[2].franchiseCP).toBe(0);
    expect(r.joursIndemnises).toBe(183 - 3);
    expect(r.totalBrut).toBe((183 - 3) * 60);
  });

  it('AFD : 30 €/j, 61 / 92 / 182 jours et 1 / 2 / 3 ouvertures selon l’ancienneté', () => {
    expect(afd({ ...profil, ancienneteAns: 3 })).toEqual({ jours: 61, total: 1830, maxOuvertures: 1, possible: true });
    expect(afd({ ...profil, ancienneteAns: 5 }).jours).toBe(92);
    expect(afd({ ...profil, ancienneteAns: 12, afdDeja: 3 })).toMatchObject({ jours: 182, maxOuvertures: 3, possible: false });
    expect(joursAFDMois(31, 1000)).toBe(11);
  });
});

describe('maternité / paternité', () => {
  const contrats = [c('2025-06-10', 150, 5000), c('2025-10-10', 150, 5000), c('2026-01-10', 160, 5200)];

  it('IJ = salaires 12 mois / 365 × 0,79, conditions d’ouverture', () => {
    const s = simulerConge(contrats, 'A8', '2026-03-01', 'maternite-1-2', { nht: 460, sr: 15200 }, false);
    expect(s.jours).toBe(112);
    expect(s.fin).toBe('2026-06-20');
    expect(s.salaires12Mois).toBe(15200);
    expect(s.ij).toBeCloseTo((15200 / 365) * 0.79, 6);
    expect(s.eligible).toBe(true); // 160 h dans les 3 mois
    expect(s.total).toBeCloseTo(s.ij * 112, 6);
  });

  it('IJ plafonnée : 104,02 € en 2026', () => {
    const s = simulerConge([c('2025-05-10', 800, 80000)], 'A8', '2026-03-01', 'maternite-1-2', { nht: 800, sr: 80000 }, false);
    expect(s.ijPlafond).toBeCloseTo(104.02, 2);
    expect(s.ij).toBeCloseTo(104.02, 2);
  });

  it('maternité : 5 h/jour assimilées et SR aménagé (guide, exemple 7 : 8 000 € avec 120 j → 11 918,36 €)', () => {
    // exemple 7 : on vérifie la formule d'aménagement sur 120 jours
    expect((8000 / (365 - 120)) * 365).toBeCloseTo(11918.37, 1);
    const s = simulerConge([], 'A8', '2026-03-01', 'maternite-1-2', { nht: 400, sr: 12000 }, true);
    expect(s.heuresAssimilees).toBe(112 * 5);
    expect(s.srAmenage).toBeCloseTo((12000 / (365 - 112)) * 365, 6);
    expect(s.ajAvec).toBeCloseTo(calculAJ('A8', (12000 / 253) * 365, 400 + 560).aj, 6);
    expect(s.eligible).toBe(true); // maintien des droits (indemnisée)
  });

  it('paternité : pas d’assimilation', () => {
    const s = simulerConge(contrats, 'A8', '2026-03-01', 'paternite', { nht: 460, sr: 15200 }, false);
    expect(s.jours).toBe(25);
    expect(s.heuresAssimilees).toBe(0);
    expect(s.ajAvec).toBeNull();
  });
});

describe('Congés Spectacles et Audiens', () => {
  it('10 % des salaires spectacle du 1er avril au 31 mars, hors enseignement', () => {
    const p = congesSpectacles([c('2025-03-15', 10, 1000), c('2025-04-02', 10, 2000), c('2026-03-20', 10, 500), c('2025-06-01', 17, 650, 'Enseignement'), c('2026-04-01', 10, 3000)], new Date(2026, 8, 1));
    expect(p.map((x) => [x.debut, x.salaires, x.indemniteBrute])).toEqual([
      ['2024-04-01', 1000, 100],
      ['2025-04-01', 2500, 250],
      ['2026-04-01', 3000, 300],
    ]);
    expect(p[1].payableDes).toBe('2026-05-01');
    expect(p[2].enCours).toBe(true);
  });

  it('heures d’une année civile', () => {
    expect(heuresAnneeCivile([c('2025-12-15', 30, 900), c('2026-01-05', 40, 1000)], 2025)).toBe(30);
  });
});
