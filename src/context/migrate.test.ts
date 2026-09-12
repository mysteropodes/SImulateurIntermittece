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
