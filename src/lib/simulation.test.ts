import { describe, it, expect } from 'vitest';
import { simulation, historiqueDroits } from './simulation';
import { calculAJ } from './calculs';
import { defaultData } from '../context/IntermittenceContext';
import type { Contrat } from './calculs';

const c = (date: string, nombre: number, brut: number): Contrat => ({ id: date + nombre, date, employeur: 'E', type: 'Heures', nombre, brut });

describe('simulation : droit en cours et contrats postérieurs', () => {
  const data = {
    ...defaultData,
    dateFinContrat: '2025-12-26',
    dateIndem: '2025-12-28',
    delaiAttente: true,
    ajBruteNotifiee: '69.83',
    contrats: [c('2026-01-10', 200, 6000), c('2026-03-10', 200, 6000), c('2026-05-10', 200, 6000)],
  };

  it('la PRA suit le dernier contrat, pas la fin du contrat ayant ouvert le droit', () => {
    const s = simulation(data, new Date(2026, 8, 12));
    // les heures d'avant la fin du contrat d'ouverture (26/12/2025) ont servi au droit en cours
    expect(s.affiliation.periode).toEqual({ debut: '2025-12-27', fin: '2026-05-10' });
    expect(s.affiliation.nht).toBe(600);
    expect(s.affiliation.eligible).toBe(true);
    expect(s.sourceAJ).toBe('notifiee');
    expect(s.ajBrute).toBe(69.83);
    expect(s.dateIndem).toBe('2025-12-28');
    // 12 mois (365 jours) après la fin du contrat d'ouverture (26/12/2025), examen le lendemain
    expect(s.dateAnniversaire).toBe('2026-12-26');
    expect(s.dateReexamen).toBe('2026-12-27');
  });

  it('dateFinPRA fige la période de référence', () => {
    const s = simulation({ ...data, dateFinPRA: '2025-12-26' }, new Date(2026, 8, 12));
    expect(s.affiliation.periode.fin).toBe('2025-12-26');
    expect(s.affiliation.nht).toBe(0);
    expect(s.affiliation.eligible).toBe(false);
  });

  it('le délai d’attente se consomme sur les premiers jours indemnisables (4 en décembre, 3 en janvier)', () => {
    // 50 h en janvier → 8 jours non indemnisables, il reste des jours pour finir le délai
    const s = simulation({ ...data, contrats: [c('2026-01-10', 50, 1650), ...data.contrats.slice(1)] }, new Date(2026, 8, 12));
    expect(s.suivi.mois[0].label).toBe('12/2025');
    expect(s.suivi.mois[0].delaiAttente).toBe(4);
    expect(s.suivi.mois[1].delaiAttente).toBe(3);
    // janvier : forfait CP (2) + reliquat de décembre (2) si franchise auto > 0, sinon rien
    expect(s.suivi.mois[1].joursIndemnises).toBe(31 - 8 - 3 - s.suivi.mois[1].franchiseCP - s.suivi.mois[1].franchiseSal);
  });
});

describe('historique des droits', () => {
  const base = {
    ...defaultData,
    dateIndem: '2025-12-28',
    ajBruteNotifiee: '69.83',
    contrats: [c('2026-01-10', 200, 6000), c('2026-03-10', 200, 6000), c('2026-05-10', 200, 6000)],
  };

  it('ordonne passé → en cours → projection et calcule les variations', () => {
    const data = {
      ...base,
      historique: [
        { id: 'h2', dateDebut: '2024-12-20', ajBrute: 66.5, heures: 800, salaires: 18000 },
        { id: 'h1', dateDebut: '2023-12-15', ajBrute: 60 },
      ],
    };
    const h = historiqueDroits(data, simulation(data, new Date(2026, 8, 12)));
    expect(h.map((l) => l.id)).toEqual(['h1', 'h2', 'en-cours', 'projection']);
    expect(h[0].variation).toBeNull();
    expect(h[1].variation).toBeCloseTo(6.5, 6);
    expect(h[2].variation).toBeCloseTo(69.83 - 66.5, 6);
    expect(h[1].source).toBe('saisie');
    expect(h[1].ajFormule?.aj).toBeCloseTo(calculAJ('A8', 18000, 800).aj, 6);
    expect(h[1].dateAnniversaire).toBe('2025-12-20');
    // projection = AJ recalculée sur la période de référence actuelle
    expect(h[3].statut).toBe('projection');
    expect(h[3].dateDebut).toBe('2026-12-28');
    expect(h[3].heures).toBe(600);
    expect(h[3].ajBrute).toBeCloseTo(calculAJ('A8', 18000, 600).aj, 6);
    expect(h[3].variation).toBeCloseTo(calculAJ('A8', 18000, 600).aj - 69.83, 6);
  });

  it('déduit heures et salaires des contrats quand ils couvrent la période d’un droit passé', () => {
    const data = { ...base, historique: [{ id: 'p', dateDebut: '2026-06-01', ajBrute: 50 }] };
    const h = historiqueDroits(data, simulation(data, new Date(2026, 8, 12)));
    const p = h.find((l) => l.id === 'p')!;
    expect(p.source).toBe('contrats');
    expect(p.heures).toBe(600);
    expect(p.salaires).toBe(18000);
  });
});


describe('prochain droit : les heures déjà utilisées ne resservent pas', () => {
  // Retour utilisateur : dernier contrat le 31/07/2026, droit ouvert le 01/08/2026 avec 510 h
  const ouverture = [c('2025-09-10', 170, 4000), c('2026-01-10', 170, 4000), c('2026-07-01', 170, 4000)].map((x, i) => ({
    ...x,
    id: `o${i}`,
    dateFin: x.date === '2026-07-01' ? '2026-07-31' : undefined,
  }));
  const base = { ...defaultData, dateFinContrat: '2026-07-31', dateIndem: '2026-08-01', contrats: ouverture };

  it('sans nouveau contrat : 0 h pour le prochain droit (pas les 510 h de l’ouverture)', () => {
    const s = simulation(base, new Date(2026, 8, 24));
    expect(s.dateAnniversaire).toBe('2027-07-31');
    expect(s.affiliation.periode.debut).toBe('2026-08-01');
    expect(s.affiliation.heuresAffiliation).toBe(0);
    expect(s.affiliation.eligible).toBe(false);
  });

  it('les contrats faits depuis l’ouverture s’additionnent', () => {
    const s = simulation({ ...base, contrats: [...ouverture, c('2026-09-07', 60, 1800), c('2026-10-12', 45, 1300)] }, new Date(2026, 9, 20));
    expect(s.affiliation.heuresAffiliation).toBe(105);
    expect(s.affiliation.sr).toBe(3100);
    expect(s.affiliation.periode).toEqual({ debut: '2026-08-01', fin: '2026-10-12' });
  });

  it('sans droit en cours saisi, la fenêtre reste les 12 mois avant le dernier contrat', () => {
    const s = simulation({ ...defaultData, contrats: ouverture }, new Date(2026, 8, 24));
    expect(s.affiliation.heuresAffiliation).toBe(510);
  });

  it('« figer la période » garde la fenêtre choisie, sans exclusion', () => {
    const s = simulation({ ...base, dateFinPRA: '2026-07-31' }, new Date(2026, 8, 24));
    expect(s.affiliation.heuresAffiliation).toBe(510);
  });
});

describe('droit en cours vs prochain droit', () => {
  const ouverture = [
    { ...c('2025-09-10', 170, 4000), id: 'o1' },
    { ...c('2026-01-10', 170, 4000), id: 'o2' },
    { ...c('2026-07-01', 170, 4000), id: 'o3', dateFin: '2026-07-31' },
  ];
  const base = { ...defaultData, dateFinContrat: '2026-07-31', dateIndem: '2026-08-01', contrats: ouverture };

  it('sans AJ notifiée : AJ, franchises et ARE du droit en cours viennent des 510 h d’ouverture', () => {
    const s = simulation(base, new Date(2026, 8, 24));
    expect(s.affOuverture?.heuresAffiliation).toBe(510);
    expect(s.ajOuverture).toBeCloseTo(calculAJ('A8', 12000, 510).aj, 6);
    expect(s.ajBrute).toBeCloseTo(s.ajOuverture, 6);
    // 510 h / 8 = 63,75 jours → ⌊63,75 × 2,5 / 24⌋ = 6 jours de franchise CP
    expect(s.franchiseCPAuto.total).toBe(6);
    const aout = s.suivi.mois.find((m) => m.cle === '2026-08')!;
    expect(aout.areBrute).toBeGreaterThan(0);
    // prochain droit : rien encore
    expect(s.affiliation.heuresAffiliation).toBe(0);
  });

  it('avec une AJ notifiée, c’est elle qui est utilisée', () => {
    const s = simulation({ ...base, ajBruteNotifiee: '58.20' }, new Date(2026, 8, 24));
    expect(s.ajBrute).toBe(58.2);
    expect(s.sourceAJ).toBe('notifiee');
  });

  it('sans droit en cours saisi, pas de période d’ouverture séparée', () => {
    const s = simulation({ ...defaultData, contrats: ouverture }, new Date(2026, 8, 24));
    expect(s.affOuverture).toBeNull();
    expect(s.ajBrute).toBeCloseTo(s.ajCalculee.aj, 6);
  });
});
