import { describe, it, expect } from 'vitest';
import { migrate } from './IntermittenceContext';

describe('migrate (import JSON)', () => {
  it('convertit un export v1', () => {
    const v1 = {
      annexe: 'Artiste (Annexe 10)',
      montantNet: '1200',
      dateIndem: '2025-01-01',
      dateFinContrat: '2024-12-31',
      delaiAttente: true,
      franchiseConges: '10',
      joursConges: '2',
      franchiseSalaires: '',
      joursSalaires: '',
      ajNette: '60',
      ajBrute: '65.5',
      tauxPrelevement: '5',
      contrats: [
        { date: '2024-01-01', employeur: 'Théâtre ABC', type: 'Cachet', nombre: 2, brut: 600 },
        { date: '2024-01-15', employeur: 'Production XYZ', type: 'Heures', nombre: 35, brut: 875 },
      ],
    };
    const d = migrate(v1);
    expect(d.version).toBe(2);
    expect(d.annexe).toBe('A10');
    expect(d.ajBruteNotifiee).toBe('65.5');
    expect(d.franchisesAuto).toBe(false);
    expect(d.tauxPrelevement).toBe('5');
    expect(d.contrats).toHaveLength(2);
    expect(d.contrats[0].id).toBeTruthy();
    expect(d.contrats[0].type).toBe('Cachet');
    expect(d.contrats[1].nombre).toBe(35);
  });

  it('assainit les valeurs invalides', () => {
    const d = migrate({ annexe: 'n’importe quoi', contrats: [{ type: 'X', nombre: 'abc', brut: -5 }, null, 'zz'] });
    expect(d.annexe).toBe('A8');
    expect(d.contrats).toHaveLength(1);
    expect(d.contrats[0].type).toBe('Heures');
    expect(d.contrats[0].nombre).toBe(0);
    expect(d.contrats[0].brut).toBe(0);
    expect(d.franchisesAuto).toBe(true);
  });

  it('rejette ce qui n’est pas un objet', () => {
    expect(() => migrate(null)).toThrow();
    expect(() => migrate('x')).toThrow();
  });
});

describe('données d’exemple', () => {
  it('sont marquées fictives et décalées pour rester actuelles', async () => {
    const { exempleData } = await import('./IntermittenceContext');
    const e = exempleData(new Date(2027, 2, 10)); // 6 mois après la référence de septembre 2026
    expect(e.exemple).toBe(true);
    expect(e.dateIndem).toBe('2026-09-15');
    expect(e.contrats[0].date).toBe('2025-10-07');
    expect(exempleData(new Date(2026, 8, 23)).dateIndem).toBe('2026-03-15');
  });

  it('un fichier importé n’est pas un exemple', () => {
    expect(migrate({ contrats: [] }).exemple).toBe(false);
  });

  it('neutralise un fichier piégé : dates invalides, textes géants, listes énormes, __proto__', () => {
    const fichier = JSON.stringify({
      dateIndem: 'pas une date',
      dateFinContrat: '2025-02-30',
      dateFinPRA: '31/12/2025',
      contrats: [
        { date: '<script>', dateFin: 'x', employeur: 'A'.repeat(10_000), type: 'Heures', nombre: 10, brut: 100 },
        ...Array.from({ length: 6000 }, () => ({ date: '2025-01-01', nombre: 1, brut: 1 })),
      ],
      historique: [{ dateDebut: 'n/a', ajBrute: 50 }, { dateDebut: '2024-03-02', ajBrute: 60 }],
    }).replace('{', '{"__proto__":{"pollue":true},');
    const m = migrate(JSON.parse(fichier));
    expect(m.dateIndem).toBe('');
    expect(m.dateFinContrat).toBe('');
    expect(m.dateFinPRA).toBe('2025-12-31');
    expect(m.contrats[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(m.contrats[0].dateFin).toBeUndefined();
    expect(m.contrats[0].employeur.length).toBe(200);
    expect(m.contrats.length).toBe(5000);
    expect(m.historique.map((h) => h.dateDebut)).toEqual(['2024-03-02']);
    expect(({} as Record<string, unknown>).pollue).toBeUndefined();
    expect((m as unknown as Record<string, unknown>).pollue).toBeUndefined();
  });
});
