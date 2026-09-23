import { describe, it, expect } from 'vitest';
import { trimestresRetraite } from './retraite';
import { echeances, versICS } from './echeances';
import { recapMois, recapTexte } from './actualisation';
import type { Contrat } from './calculs';

const c = (over: Partial<Contrat>): Contrat => ({ id: Math.random().toString(), date: '2026-01-10', employeur: 'E', type: 'Heures', nombre: 10, brut: 100, ...over });

describe('retraite', () => {
  it('1 trimestre par 1 803 € en 2026, + 1 par 50 jours indemnisés, 4 max', () => {
    const r = trimestresRetraite([c({ brut: 4000 }), c({ date: '2026-02-10', type: 'NonSalarie', brut: 5000 })], [{ cle: '2026-03', jours: 31 }, { cle: '2026-04', jours: 30 }]);
    expect(r).toHaveLength(1);
    expect(r[0].seuilTrimestre).toBe(1803);
    expect(r[0].trimestresSalaires).toBe(2); // 4 000 € (le non-salarié n'est pas un salaire)
    expect(r[0].trimestresChomage).toBe(1);
    expect(r[0].total).toBe(3);
    expect(r[0].manquePourSuivant).toBeCloseTo(3 * 1803 - 4000, 6);
    const plein = trimestresRetraite([c({ brut: 20000 })], [{ cle: '2026-05', jours: 300 }]);
    expect(plein[0].total).toBe(4);
  });
});

describe('échéances', () => {
  it('liste datée et triée, rattrapage seulement si possible, export .ics valide', () => {
    const e = echeances({ aujourdHui: '2026-09-23', dateAnniversaire: '2026-12-28', rattrapagePossible: false });
    expect(e.map((x) => x.id)).toEqual(['actualisation', 'verif-contrats', 'demande-examen', 'anniversaire', 'cs-limite-2027', 'cs-ouverture-2027', 'cs-paiement-2027']);
    expect(e[0].date).toBe('2026-09-28');
    expect(e.find((x) => x.id === 'demande-examen')!.date).toBe('2026-12-13');
    expect(echeances({ aujourdHui: '2026-09-23', dateAnniversaire: '2026-12-28', rattrapagePossible: true }).some((x) => x.id === 'rattrapage')).toBe(true);
    const ics = versICS(e, new Date('2026-09-23T10:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261228');
    expect(ics).toContain('RRULE:FREQ=MONTHLY;COUNT=12');
    expect(ics.split('BEGIN:VEVENT')).toHaveLength(e.length + 1);
  });
});

describe('actualisation', () => {
  it('regroupe le mois par employeur, arrêts et formations à part', () => {
    const r = recapMois(
      [
        c({ employeur: 'Xilam', date: '2026-02-17', nombre: 35, brut: 950 }),
        c({ employeur: 'AuPlaisir', date: '2026-02-03', nombre: 40, brut: 1250 }),
        c({ employeur: 'Ailleurs', date: '2026-03-01', nombre: 10, brut: 300 }),
        c({ type: 'Arret', date: '2026-02-20', dateFin: '2026-03-05', nombre: 14, brut: 0 }),
        c({ type: 'Formation', employeur: 'Afdas', date: '2026-02-10', nombre: 21, brut: 0 }),
      ],
      '2026-02'
    );
    expect(r.lignes.map((l) => l.employeur)).toEqual(['AuPlaisir', 'Xilam']);
    expect(r.heures).toBe(75);
    expect(r.brut).toBe(2200);
    expect(r.arrets).toEqual([{ debut: '2026-02-20', fin: '2026-02-28', jours: 9 }]);
    expect(r.formations).toEqual([{ employeur: 'Afdas', heures: expect.any(Number) }]);
    expect(recapTexte(r, 'février 2026')).toMatch(/Total : 75 h — 2.200 € brut/); // espace fine insécable
  });
});

describe('retraite : années vides', () => {
  it('ignore une année sans salaire ni jour indemnisé', () => {
    const r = trimestresRetraite([c({ brut: 2000 })], [{ cle: '2025-12', jours: 0 }]);
    expect(r.map((a) => a.annee)).toEqual([2026]);
  });
});
