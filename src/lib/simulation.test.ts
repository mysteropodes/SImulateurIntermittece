import { describe, it, expect } from 'vitest';
import { simulation } from './simulation';
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
    expect(s.affiliation.periode).toEqual({ debut: '2025-05-11', fin: '2026-05-10' });
    expect(s.affiliation.nht).toBe(600);
    expect(s.affiliation.eligible).toBe(true);
    expect(s.sourceAJ).toBe('notifiee');
    expect(s.ajBrute).toBe(69.83);
    expect(s.dateIndem).toBe('2025-12-28');
    expect(s.dateAnniversaire).toBe('2026-12-28');
  });

  it('dateFinPRA fige la période de référence', () => {
    const s = simulation({ ...data, dateFinPRA: '2025-12-26' }, new Date(2026, 8, 12));
    expect(s.affiliation.periode.fin).toBe('2025-12-26');
    expect(s.affiliation.nht).toBe(0);
    expect(s.affiliation.eligible).toBe(false);
  });

  it('le délai d’attente se consomme sur les premiers jours indemnisables (4 en décembre, 3 en janvier)', () => {
    const s = simulation(data, new Date(2026, 8, 12));
    expect(s.suivi.mois[0].label).toBe('12/2025');
    expect(s.suivi.mois[0].delaiAttente).toBe(4);
    expect(s.suivi.mois[1].delaiAttente).toBe(3);
  });
});
