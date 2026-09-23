import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Annexe, Contrat } from '../lib/calculs';

/** Droit passé, saisi depuis une notification France Travail. */
export interface DroitPasse {
  id: string;
  /** Premier jour indemnisable du droit. */
  dateDebut: string;
  /** AJ brute notifiée. */
  ajBrute: number;
  /** Heures travaillées retenues (facultatif). */
  heures?: number;
  /** Salaire de référence (facultatif). */
  salaires?: number;
}

export interface IntermittenceData {
  version: 2;
  annexe: Annexe;
  /** Fin du contrat ayant ouvert le droit en cours (sert de défaut au début du droit). */
  dateFinContrat: string;
  /** Facultatif : fige la fin de la période de référence (sinon = fin du dernier contrat). */
  dateFinPRA: string;
  /** Premier jour indemnisable (début du droit). */
  dateIndem: string;
  delaiAttente: boolean;
  /** 50 ans ou plus à la fin du contrat retenu (120 h d'enseignement au lieu de 70). */
  plus50ans: boolean;
  /** AJ brute figurant sur la notification France Travail (vide = AJ calculée). */
  ajBruteNotifiee: string;
  /** Franchises calculées automatiquement ou saisies (notification). */
  franchisesAuto: boolean;
  franchiseConges: string;
  joursConges: string;
  franchiseSalaires: string;
  joursSalaires: string;
  /** Taux de prélèvement à la source, en %. */
  tauxPrelevement: string;
  /** Taux de CSG sur l'ARE : 6,2 % (taux plein) ou 3,8 % (taux réduit). */
  tauxCSG: '6.2' | '3.8';
  /** Cotisations salariales estimées sur les salaires, en %. */
  tauxCotisationsSalaire: string;
  contrats: Contrat[];
  /** Droits précédents, pour suivre la progression d'une date anniversaire à l'autre. */
  historique: DroitPasse[];
  /** Profil pour l'onglet « Mes droits » (perte de l'intermittence, congés). */
  profil: {
    ancienneteAns: number;
    cinqAnsSur10: boolean;
    afdDeja: number;
    congeDebut: string;
    congeType: string;
  };
}

interface IntermittenceContextProps {
  data: IntermittenceData;
  setData: React.Dispatch<React.SetStateAction<IntermittenceData>>;
  updateField: <K extends keyof IntermittenceData>(field: K, value: IntermittenceData[K]) => void;
  updateContrat: <K extends keyof Contrat>(id: string, field: K, value: Contrat[K]) => void;
  addContrat: () => void;
  removeContrat: (id: string) => void;
  resetData: () => void;
  addDroit: (d?: Partial<DroitPasse>) => void;
  updateDroit: <K extends keyof DroitPasse>(id: string, field: K, value: DroitPasse[K]) => void;
  removeDroit: (id: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
}

const STORAGE_KEY = 'simulateur-intermittence:v2';

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const defaultData: IntermittenceData = {
  version: 2,
  annexe: 'A8',
  dateFinContrat: '',
  dateFinPRA: '',
  dateIndem: '',
  delaiAttente: false,
  plus50ans: false,
  ajBruteNotifiee: '',
  franchisesAuto: true,
  franchiseConges: '',
  joursConges: '',
  franchiseSalaires: '',
  joursSalaires: '',
  tauxPrelevement: '0',
  tauxCSG: '6.2',
  tauxCotisationsSalaire: '22',
  contrats: [],
  historique: [],
  profil: { ancienneteAns: 0, cinqAnsSur10: false, afdDeja: 0, congeDebut: '', congeType: 'maternite-1-2' },
};

/** Exemple de départ pour découvrir l'outil. */
export const exempleData = (): IntermittenceData => ({
  ...defaultData,
  dateFinContrat: '2025-06-30',
  dateIndem: '2025-07-01',
  delaiAttente: true,
  contrats: [
    { id: newId(), date: '2024-09-02', dateFin: '2024-09-27', employeur: 'Théâtre ABC', type: 'Heures', nombre: 140, brut: 3200 },
    { id: newId(), date: '2024-11-04', dateFin: '2024-11-29', employeur: 'Production XYZ', type: 'Heures', nombre: 151, brut: 3500 },
    { id: newId(), date: '2025-02-10', employeur: 'Festival 123', type: 'Cachet', nombre: 6, brut: 1800 },
    { id: newId(), date: '2025-04-01', dateFin: '2025-04-30', employeur: 'Compagnie DEF', type: 'Heures', nombre: 120, brut: 2800 },
    { id: newId(), date: '2025-06-02', dateFin: '2025-06-30', employeur: 'Théâtre ABC', type: 'Heures', nombre: 100, brut: 2400 },
    { id: newId(), date: '2025-09-15', dateFin: '2025-09-19', employeur: 'Production XYZ', type: 'Heures', nombre: 35, brut: 900 },
  ],
});

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : v == null ? fallback : String(v));

/**
 * Accepte les JSON de la v1 (annexe en libellé, ajBrute/ajNette…) comme de la v2,
 * et remet chaque champ dans un état sûr.
 */
export function migrate(raw: unknown): IntermittenceData {
  if (!raw || typeof raw !== 'object') throw new Error('format invalide');
  const r = raw as Record<string, unknown>;

  const annexeRaw = str(r.annexe, 'A8');
  const annexe: Annexe = annexeRaw === 'A10' || /10|artiste/i.test(annexeRaw) ? 'A10' : 'A8';

  const contratsRaw = Array.isArray(r.contrats) ? r.contrats : [];
  const contrats: Contrat[] = contratsRaw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({
      id: str(c.id) || newId(),
      date: str(c.date) || new Date().toISOString().slice(0, 10),
      dateFin: str(c.dateFin) || undefined,
      employeur: str(c.employeur),
      type: c.type === 'Cachet' || c.type === 'Enseignement' ? c.type : 'Heures',
      nombre: Math.max(0, num(c.nombre, 0)),
      brut: Math.max(0, num(c.brut, 0)),
    }));

  const historiqueRaw = Array.isArray(r.historique) ? r.historique : [];
  const historique: DroitPasse[] = historiqueRaw
    .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object' && typeof h.dateDebut === 'string')
    .map((h) => ({
      id: str(h.id) || newId(),
      dateDebut: str(h.dateDebut),
      ajBrute: Math.max(0, num(h.ajBrute, 0)),
      heures: h.heures == null || h.heures === '' ? undefined : Math.max(0, num(h.heures, 0)),
      salaires: h.salaires == null || h.salaires === '' ? undefined : Math.max(0, num(h.salaires, 0)),
    }));

  const v1 = r.version !== 2;
  const franchisesSaisies = !!(str(r.franchiseConges) || str(r.franchiseSalaires));

  return {
    version: 2,
    annexe,
    dateFinContrat: str(r.dateFinContrat),
    dateFinPRA: str(r.dateFinPRA),
    dateIndem: str(r.dateIndem),
    delaiAttente: !!r.delaiAttente,
    plus50ans: !!r.plus50ans,
    ajBruteNotifiee: str(r.ajBruteNotifiee ?? (v1 ? r.ajBrute : '')),
    franchisesAuto: typeof r.franchisesAuto === 'boolean' ? r.franchisesAuto : !franchisesSaisies,
    franchiseConges: str(r.franchiseConges),
    joursConges: str(r.joursConges),
    franchiseSalaires: str(r.franchiseSalaires),
    joursSalaires: str(r.joursSalaires),
    tauxPrelevement: str(r.tauxPrelevement, '0') || '0',
    tauxCSG: r.tauxCSG === '3.8' ? '3.8' : '6.2',
    tauxCotisationsSalaire: str(r.tauxCotisationsSalaire, '22') || '22',
    contrats,
    historique,
    profil: (() => {
      const p = (r.profil && typeof r.profil === 'object' ? r.profil : {}) as Record<string, unknown>;
      return {
        ancienneteAns: Math.max(0, num(p.ancienneteAns, 0)),
        cinqAnsSur10: !!p.cinqAnsSur10,
        afdDeja: Math.max(0, Math.floor(num(p.afdDeja, 0))),
        congeDebut: str(p.congeDebut),
        congeType: str(p.congeType, 'maternite-1-2') || 'maternite-1-2',
      };
    })(),
  };
}

function loadInitial(): IntermittenceData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrate(JSON.parse(saved));
  } catch {
    /* stockage indisponible ou corrompu : on repart de l'exemple */
  }
  return exempleData();
}

export const IntermittenceContext = createContext<IntermittenceContextProps>({} as IntermittenceContextProps);

export const useIntermittence = () => useContext(IntermittenceContext);

export const IntermittenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<IntermittenceData>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota ou navigation privée : l'export JSON reste disponible */
    }
  }, [data]);

  const updateField: IntermittenceContextProps['updateField'] = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateContrat: IntermittenceContextProps['updateContrat'] = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      contrats: prev.contrats.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const addContrat = () => {
    setData((prev) => ({
      ...prev,
      contrats: [
        ...prev.contrats,
        { id: newId(), date: new Date().toISOString().slice(0, 10), employeur: '', type: 'Cachet', nombre: 1, brut: 0 },
      ],
    }));
  };

  const removeContrat = (id: string) => {
    setData((prev) => ({ ...prev, contrats: prev.contrats.filter((c) => c.id !== id) }));
  };

  const addDroit = (d: Partial<DroitPasse> = {}) => {
    setData((prev) => {
      // par défaut : un an avant le droit le plus ancien connu
      const plusAncien = [prev.dateIndem, ...prev.historique.map((h) => h.dateDebut)].filter(Boolean).sort()[0];
      const y = plusAncien ? Number(plusAncien.slice(0, 4)) - 1 : new Date().getFullYear() - 1;
      const dateDebut = plusAncien ? `${y}${plusAncien.slice(4)}` : `${y}-01-01`;
      return { ...prev, historique: [...prev.historique, { id: newId(), dateDebut, ajBrute: 0, ...d }] };
    });
  };

  const updateDroit: IntermittenceContextProps['updateDroit'] = (id, field, value) => {
    setData((prev) => ({ ...prev, historique: prev.historique.map((h) => (h.id === id ? { ...h, [field]: value } : h)) }));
  };

  const removeDroit = (id: string) => {
    setData((prev) => ({ ...prev, historique: prev.historique.filter((h) => h.id !== id) }));
  };

  const resetData = () => {
    if (confirm('Effacer toutes les données saisies ?')) setData({ ...defaultData, contrats: [] });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_intermittence.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData: string) => {
    try {
      setData(migrate(JSON.parse(jsonData)));
    } catch (error) {
      console.error("Erreur lors de l'import des données", error);
      alert('Le fichier importé contient des données invalides.');
    }
  };

  const value = { data, setData, updateField, updateContrat, addContrat, removeContrat, resetData, addDroit, updateDroit, removeDroit, exportData, importData };

  return <IntermittenceContext.Provider value={value}>{children}</IntermittenceContext.Provider>;
};
