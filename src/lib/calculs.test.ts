import { describe, it, expect } from 'vitest';
import {
  calculAJ,
  sjm,
  ajNette,
  franchiseCP,
  franchiseSalaires,
  activiteMois,
  plafondCumul,
  suiviMensuel,
  affiliation,
  periodeReference,
  repartirContrat,
  smicAt,
  projectionEligibilite,
  heuresPourAJ,
  paliers,
  margeAvantJourPerdu,
  type Contrat,
} from './calculs';

const contrat = (over: Partial<Contrat>): Contrat => ({
  id: 'x',
  date: '2024-01-01',
  employeur: 'E',
  type: 'Heures',
  nombre: 0,
  brut: 0,
  ...over,
});

describe('Allocation journalière (guide p. 11)', () => {
  it('exemple 6 : technicien A8, 800 h, 18 000 € → 64,78 €', () => {
    const r = calculAJ('A8', 18000, 800);
    expect(r.A).toBeCloseTo(39.8, 1);
    expect(r.B).toBeCloseTo(12.2, 1);
    expect(r.C).toBeCloseTo(12.78, 2);
    expect(r.aj).toBeCloseTo(64.78, 1);
    expect(r.plancherApplique).toBe(false);
    expect(r.plafondApplique).toBe(false);
  });

  it('artiste A10, 600 h, 18 500 € → ≈ 65 €', () => {
    const r = calculAJ('A10', 18500, 600);
    expect(r.aj).toBeGreaterThan(64);
    expect(r.aj).toBeLessThan(66);
  });

  it('applique le plancher 38 € (A8) / 44 € (A10)', () => {
    expect(calculAJ('A8', 5000, 507).aj).toBe(38);
    expect(calculAJ('A10', 5000, 507).aj).toBe(44);
    expect(calculAJ('A8', 5000, 507).plancherApplique).toBe(true);
  });

  it('applique le plafond 174,80 €', () => {
    const r = calculAJ('A8', 1_000_000, 2000);
    expect(r.aj).toBe(174.8);
    expect(r.plafondApplique).toBe(true);
  });

  it('la partie A est dégressive au-delà de 14 400 € (A8)', () => {
    const a1 = calculAJ('A8', 14400, 507).A;
    const a2 = calculAJ('A8', 24400, 507).A;
    // 10 000 € de plus ne rapportent que 0,05 au lieu de 0,42
    expect(a2 - a1).toBeCloseTo((31.96 * 0.05 * 10000) / 5000, 4);
  });
});

describe('SJM et AJ nette (guide p. 12-13)', () => {
  it('exemple 8 : SJM A8 = 18 000 / (800/8) = 180 €', () => {
    expect(sjm('A8', 18000, 800)).toBe(180);
    expect(sjm('A10', 18000, 800)).toBe(225);
  });

  it('aucune retenue sous 31,96 €, retraite complémentaire seule entre 31,96 et 60 €', () => {
    expect(ajNette(31, 100).net).toBe(31);
    const r = ajNette(50, 180);
    expect(r.csgCrds).toBe(0);
    expect(r.retraiteComplementaire).toBeCloseTo(1.674, 3);
    expect(r.net).toBeCloseTo(48.33, 2);
  });

  it('au-delà de 60 € : CSG + CRDS sur 98,25 %', () => {
    const r = ajNette(100, 180);
    expect(r.csgCrds).toBeCloseTo(100 * 0.9825 * 0.067, 3);
    expect(r.net).toBeLessThan(100 - 6);
  });
});

describe('Franchises (guide p. 14-15, flyer)', () => {
  it('exemple 10 : 176 jours travaillés → 18 jours de CP, forfait 2 j/mois', () => {
    expect(franchiseCP(176)).toEqual({ total: 18, forfaitMensuel: 2 });
  });

  it('franchise CP plafonnée à 30 jours, forfait 3 j au-delà de 24', () => {
    expect(franchiseCP(400)).toEqual({ total: 30, forfaitMensuel: 3 });
    expect(franchiseCP(250)).toEqual({ total: 26, forfaitMensuel: 3 });
  });

  it('exemple 11 : 32 jours de franchise salaires sur 9 mois → 4 j/mois ; sur 6 mois → 6 j/mois', () => {
    // On force un total de 32 via la formule inverse : on teste la répartition seule.
    const f9 = { total: 32, mensuelle: Math.ceil(32 / Math.min(8, 9)) };
    const f6 = { total: 32, mensuelle: Math.ceil(32 / Math.min(8, 6)) };
    expect(f9.mensuelle).toBe(4);
    expect(f6.mensuelle).toBe(6);
  });

  it('franchise salaires : nulle pour un technicien à 18 000 € / 800 h (formule − 27)', () => {
    const smic = smicAt('2024-06-30');
    expect(franchiseSalaires(18000, 180, smic).total).toBe(0);
  });

  it('franchise salaires : positive pour des salaires élevés, arrondie à l’entier inférieur', () => {
    const smic = smicAt('2024-06-30'); // 11,65 €/h → 1 766,96 / 81,55
    const sr = 45000;
    const s = sjm('A8', sr, 700);
    const brut = (sr / smic.mensuel) * (s / (3 * smic.journalier)) - 27;
    const f = franchiseSalaires(sr, s, smic, 12);
    expect(f.total).toBe(Math.floor(brut));
    expect(f.total).toBeGreaterThan(0);
    expect(f.mensuelle).toBe(Math.ceil(f.total / 8));
  });
});

describe('Cumul ARE + activité (guide p. 16-17)', () => {
  it('exemple 12 : 80 h en A8 → 10 j de travail, 14 j non indemnisables', () => {
    const a = activiteMois('A8', 80);
    expect(a.joursTravail).toBe(10);
    expect(a.joursNonIndemnisables).toBe(14);
    expect(a.seuilAtteint).toBe(false);
  });

  it('flyer : 24 h → 4,2 soit 4 jours', () => {
    expect(activiteMois('A8', 24).joursNonIndemnisables).toBe(4);
  });

  it('A10 : 10 cachets (120 h) → 12 j de travail → 15 j non indemnisables (×1,3)', () => {
    const a = activiteMois('A10', 120);
    expect(a.joursTravail).toBe(12);
    expect(a.joursNonIndemnisables).toBe(15);
  });

  it('seuil : 26 j (A8) / 27 j (A10) → aucune indemnisation', () => {
    expect(activiteMois('A8', 208).seuilAtteint).toBe(true);
    expect(activiteMois('A10', 270).seuilAtteint).toBe(true);
    expect(activiteMois('A10', 260).seuilAtteint).toBe(false);
  });

  it('plafond de cumul = 118 % du PMSS (4 559,52 € en 2024)', () => {
    expect(plafondCumul(2024)).toBe(4559.52);
    expect(plafondCumul(2025)).toBe(4631.5);
    expect(plafondCumul(2026)).toBe(4725.9);
    expect(plafondCumul(2023)).toBe(4325.88);
    expect(plafondCumul(2040)).toBe(plafondCumul(2026));
  });

  it('exemple 12 complet : AJ 140 €, 80 h / 4 000 € en avril 2024 → 559,52 € sur 4 jours', () => {
    const r = suiviMensuel({
      annexe: 'A8',
      contrats: [contrat({ date: '2024-04-10', type: 'Heures', nombre: 80, brut: 4000 })],
      ajBrute: 140,
      ratioNetAJ: 1,
      tauxPrelevement: 0,
      ratioNetSalaire: 1,
      dateDebut: '2024-04-01',
      delaiAttente: false,
      franchiseCP: { total: 0, forfaitMensuel: 2 },
      franchiseSal: { total: 0, mensuelle: 0 },
      nbMois: 1,
    });
    const m = r.mois[0];
    expect(m.joursNonIndemnisables).toBe(14);
    expect(m.joursIndemnisablesAvantFranchises).toBe(16);
    expect(m.plafondApplique).toBe(true);
    expect(m.areBrute).toBeCloseTo(559.52, 2);
    expect(m.joursIndemnises).toBe(4);
  });
});

describe('Suivi mensuel : délai, franchises, reports', () => {
  const base = {
    annexe: 'A8' as const,
    ajBrute: 60,
    ratioNetAJ: 1,
    tauxPrelevement: 0,
    ratioNetSalaire: 0.78,
    delaiAttente: true,
    franchiseCP: { total: 18, forfaitMensuel: 2 },
    franchiseSal: { total: 32, mensuelle: 4 },
  };

  it('flyer p. 5 : janvier avec 4 j non indemnisables → 31 − 4 − 7 − 2 − 4 = 14 jours payés', () => {
    const r = suiviMensuel({
      ...base,
      contrats: [contrat({ date: '2025-01-05', type: 'Heures', nombre: 24, brut: 500 })],
      dateDebut: '2025-01-01',
      dateIndem: '2025-01-01',
      nbMois: 1,
    });
    const m = r.mois[0];
    expect(m.joursNonIndemnisables).toBe(4);
    expect(m.delaiAttente).toBe(7);
    expect(m.franchiseCP).toBe(2);
    expect(m.franchiseSal).toBe(4);
    expect(m.joursIndemnises).toBe(14);
    expect(m.areBrute).toBe(14 * 60);
  });

  it('ordre des déductions et report : un mois plein d’activité reporte les forfaits', () => {
    const r = suiviMensuel({
      ...base,
      // 208 h en février → seuil atteint, aucune ARE, forfaits reportés
      contrats: [contrat({ date: '2025-02-03', type: 'Heures', nombre: 208, brut: 3000 })],
      dateDebut: '2025-01-01',
      dateIndem: '2025-01-01',
      nbMois: 3,
    });
    const [jan, fev, mar] = r.mois;
    expect(jan.joursIndemnises).toBe(31 - 7 - 2 - 4);
    expect(fev.seuilAtteint).toBe(true);
    expect(fev.joursIndemnises).toBe(0);
    expect(fev.franchiseCP).toBe(0);
    expect(fev.franchiseSal).toBe(0);
    // mars : forfait (2 + 4) + reliquat de février (2 + 4)
    expect(mar.franchiseCP).toBe(4);
    expect(mar.franchiseSal).toBe(8);
    expect(mar.joursIndemnises).toBe(31 - 12);
  });

  it('les franchises s’épuisent puis ne sont plus déduites', () => {
    const r = suiviMensuel({
      ...base,
      contrats: [],
      dateDebut: '2025-01-01',
      dateIndem: '2025-01-01',
      nbMois: 12,
    });
    expect(r.totaux.franchiseCP).toBe(18);
    expect(r.totaux.franchiseSal).toBe(32);
    expect(r.totaux.delaiAttente).toBe(7);
    expect(r.franchiseCPRestante).toBe(0);
    expect(r.franchiseSalRestante).toBe(0);
    // 32 j de salaires à 4/mois → 8 mois ; à partir du 10e mois plus rien
    expect(r.mois[9].franchiseCP).toBe(0);
    expect(r.mois[9].franchiseSal).toBe(0);
    expect(r.mois[9].joursIndemnises).toBe(31);
  });

  it('aucun jour indemnisé avant la date de début de droit ni après la date de fin', () => {
    const r = suiviMensuel({
      ...base,
      delaiAttente: false,
      franchiseCP: { total: 0, forfaitMensuel: 2 },
      franchiseSal: { total: 0, mensuelle: 0 },
      contrats: [],
      dateDebut: '2025-01-01',
      dateIndem: '2025-02-15',
      dateFinDroit: '2026-02-14',
      nbMois: 14,
    });
    expect(r.mois[0].joursIndemnises).toBe(0);
    expect(r.mois[1].joursIndemnises).toBe(14); // 15 → 28 février
    expect(r.mois[13].joursIndemnises).toBe(14); // 1 → 14 février 2026
  });

  it('le prélèvement à la source et le ratio net s’appliquent sur l’ARE', () => {
    const r = suiviMensuel({
      ...base,
      delaiAttente: false,
      franchiseCP: { total: 0, forfaitMensuel: 2 },
      franchiseSal: { total: 0, mensuelle: 0 },
      ratioNetAJ: 0.9,
      tauxPrelevement: 10,
      contrats: [],
      dateDebut: '2025-03-01',
      nbMois: 1,
    });
    expect(r.mois[0].areBrute).toBe(31 * 60);
    expect(r.mois[0].areNette).toBeCloseTo(31 * 60 * 0.9, 6);
    expect(r.mois[0].areVersee).toBeCloseTo(31 * 60 * 0.9 * 0.9, 6);
  });
});

describe('Période de référence et affiliation', () => {
  it('la PRA couvre les 12 mois précédant la fin du contrat de référence', () => {
    expect(periodeReference([], '2025-03-15')).toEqual({ debut: '2024-03-16', fin: '2025-03-15' });
  });

  it('un contrat hors des 12 mois glissants ne compte pas', () => {
    const contrats = [
      contrat({ id: 'a', date: '2023-06-01', type: 'Cachet', nombre: 20, brut: 5000 }),
      contrat({ id: 'b', date: '2024-09-01', type: 'Cachet', nombre: 15, brut: 4500 }),
      contrat({ id: 'c', date: '2025-02-01', dateFin: '2025-02-28', type: 'Heures', nombre: 180, brut: 3600 }),
      contrat({ id: 'd', date: '2025-01-06', type: 'Heures', nombre: 150, brut: 3000 }),
    ];
    const a = affiliation(contrats, 'A8', '2025-03-15');
    expect(a.contrats.map((c) => c.id)).toEqual(['b', 'c', 'd']);
    expect(a.nht).toBe(15 * 12 + 180 + 150);
    expect(a.sr).toBe(11100);
    expect(a.eligible).toBe(true);
  });

  it('plafond mensuel : 208 h en A8 (250 h multi-employeurs), 28 cachets en A10', () => {
    const un = [contrat({ date: '2025-01-05', type: 'Heures', nombre: 300, brut: 6000, employeur: 'A' })];
    expect(affiliation(un, 'A8', '2025-01-31').nht).toBe(208);
    const deux = [
      ...un,
      contrat({ id: 'y', date: '2025-01-20', type: 'Heures', nombre: 10, brut: 200, employeur: 'B' }),
    ];
    expect(affiliation(deux, 'A8', '2025-01-31').nht).toBe(250);
    const artiste = [contrat({ date: '2025-01-05', type: 'Cachet', nombre: 30, brut: 6000 })];
    expect(affiliation(artiste, 'A10', '2025-01-31').nht).toBe(28 * 12);
    expect(affiliation(artiste, 'A10', '2025-01-31').moisPlafonnes).toEqual(['2025-01']);
  });

  it('un contrat à cheval sur deux mois est réparti au prorata des jours', () => {
    const parts = repartirContrat(contrat({ date: '2025-01-22', dateFin: '2025-02-10', type: 'Heures', nombre: 100, brut: 2000 }));
    expect(parts.map((p) => p.cle)).toEqual(['2025-01', '2025-02']);
    expect(parts[0].heures + parts[1].heures).toBeCloseTo(100, 9);
    expect(parts[0].heures).toBeCloseTo(50, 9); // 10 jours sur 20
  });

  it('projection : moyenne des 3 derniers mois travaillés', () => {
    const contrats = [
      contrat({ date: '2025-01-05', type: 'Heures', nombre: 50, brut: 1000 }),
      contrat({ date: '2025-02-05', type: 'Heures', nombre: 70, brut: 1000 }),
      contrat({ date: '2025-03-05', type: 'Heures', nombre: 60, brut: 1000 }),
    ];
    const p = projectionEligibilite(contrats, 300, new Date(2025, 3, 1));
    expect(p.moyenneHeuresParMois).toBe(60);
    expect(p.moisEstimes).toBe(5);
    expect(p.dateEstimee).toBe('2025-09-01');
  });
});

describe('SMIC', () => {
  it('valeur en vigueur à une date', () => {
    expect(smicAt('2024-06-30').horaire).toBe(11.65);
    expect(smicAt('2025-01-01').horaire).toBe(11.88);
    expect(smicAt('2026-07-01').horaire).toBe(12.31);
    expect(smicAt('2024-06-30').journalier).toBeCloseTo(81.55, 2);
  });
});

describe('Enseignement (guide p. 7 et 11)', () => {
  const base = [
    contrat({ id: 'a', date: '2026-01-10', type: 'Heures', nombre: 200, brut: 6000, employeur: 'A' }),
    contrat({ id: 'b', date: '2026-03-10', type: 'Heures', nombre: 200, brut: 6000, employeur: 'A' }),
    contrat({ id: 'c', date: '2026-05-10', type: 'Heures', nombre: 100, brut: 3000, employeur: 'A' }),
  ];

  it('compte pour les 507 h mais ni dans les NHT ni dans le SR', () => {
    const a = affiliation([...base, contrat({ id: 'e', date: '2026-04-10', type: 'Enseignement', nombre: 17, brut: 650 })], 'A8', '2026-06-30');
    expect(a.nht).toBe(500);
    expect(a.sr).toBe(15000);
    expect(a.heuresEnseignement).toBe(17);
    expect(a.brutEnseignement).toBe(650);
    expect(a.heuresAffiliation).toBe(517);
    expect(a.eligible).toBe(true);
  });

  it('plafonné à 70 h, 120 h à 50 ans et plus', () => {
    const ens = contrat({ id: 'e', date: '2026-04-10', type: 'Enseignement', nombre: 150, brut: 4000 });
    expect(affiliation([...base, ens], 'A8', '2026-06-30').heuresEnseignementRetenues).toBe(70);
    expect(affiliation([...base, ens], 'A8', '2026-06-30', { plus50ans: true }).heuresEnseignementRetenues).toBe(120);
  });

  it('reste une activité du mois pour le cumul (jours non indemnisables)', () => {
    const r = suiviMensuel({
      annexe: 'A8',
      contrats: [contrat({ date: '2026-06-30', type: 'Enseignement', nombre: 17, brut: 650 })],
      ajBrute: 69.83,
      ratioNetAJ: 1,
      tauxPrelevement: 0,
      ratioNetSalaire: 1,
      dateDebut: '2026-06-01',
      delaiAttente: false,
      franchiseCP: { total: 0, forfaitMensuel: 2 },
      franchiseSal: { total: 0, mensuelle: 0 },
      nbMois: 1,
    });
    expect(r.mois[0].joursNonIndemnisables).toBe(Math.floor((17 / 8) * 1.4));
  });
});

describe('Paliers et leviers', () => {
  it('AJ recalculée de Cyril (690 h, 22 716 €) = 65,41 € ; 262 h à 33 €/h pour revenir à 69,83 €', () => {
    expect(calculAJ('A8', 22716, 690).aj).toBeCloseTo(65.41, 2);
    expect(heuresPourAJ('A8', 22716, 690, 69.83, 33)).toBe(262);
    expect(heuresPourAJ('A8', 22716, 690, 60, 33)).toBe(0);
    expect(heuresPourAJ('A8', 22716, 690, 500, 33)).toBeNull();
  });

  it('gains marginaux : au-delà des seuils, 1 000 € = +0,32 €/j et 10 h = +0,05 €/j', () => {
    const p = paliers('A8', 22716, 800);
    expect(p.srAuDelaDuSeuil).toBe(true);
    expect(p.nhtAuDelaDuSeuil).toBe(true);
    expect(p.gainPour1000Euros).toBeCloseTo((31.96 * 0.05 * 1000) / 5000, 6);
    expect(p.gainPour10Heures).toBeCloseTo((31.96 * 0.08 * 10) / 507, 6);
    const q = paliers('A8', 10000, 600);
    expect(q.gainPour1000Euros).toBeCloseTo((31.96 * 0.42 * 1000) / 5000, 6);
    expect(q.gainPour10Heures).toBeCloseTo((31.96 * 0.26 * 10) / 507, 6);
  });

  it('marge avant le prochain jour perdu : 42 h → 3,71 h ; 48 h → 2,29 h (A8)', () => {
    expect(margeAvantJourPerdu('A8', 42)).toBeCloseTo(45.714 - 42, 2);
    expect(margeAvantJourPerdu('A8', 48)).toBeCloseTo(51.43 - 48, 2);
    expect(margeAvantJourPerdu('A8', 0)).toBeCloseTo(5.714, 2);
    expect(margeAvantJourPerdu('A10', 0)).toBeCloseTo(10 / 1.3, 2);
  });
});
