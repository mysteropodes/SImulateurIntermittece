import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Contrat {
  date: string;
  employeur: string;
  type: 'Cachet' | 'Heures';
  nombre: number;
  brut: number;
}

interface IntermittenceData {
  // Données générales
  annexe: string;
  montantNet: string;
  dateIndem: string;
  dateFinContrat: string;
  delaiAttente: boolean;
  franchiseConges: string;
  joursConges: string;
  franchiseSalaires: string;
  joursSalaires: string;
  ajNette: string;
  ajBrute: string;
  // Liste des contrats
  contrats: Contrat[];
}

interface IntermittenceContextProps {
  data: IntermittenceData;
  setData: React.Dispatch<React.SetStateAction<IntermittenceData>>;
  
  // Fonctions utilitaires
  updateField: (field: keyof IntermittenceData, value: any) => void;
  updateContrat: (index: number, field: keyof Contrat, value: any) => void;
  addContrat: () => void;
  removeContrat: (index: number) => void;
  
  // Import/Export
  exportData: () => void;
  importData: (jsonData: string) => void;
}

const defaultData: IntermittenceData = {
  annexe: 'Ouvrier/Technicien (Annexe 8)',
  montantNet: '',
  dateIndem: '',
  dateFinContrat: '',
  delaiAttente: false,
  franchiseConges: '',
  joursConges: '',
  franchiseSalaires: '',
  joursSalaires: '',
  ajNette: '',
  ajBrute: '',
  contrats: [
    { date: '2024-01-01', employeur: 'Théâtre ABC', type: 'Cachet', nombre: 2, brut: 600 },
    { date: '2024-01-15', employeur: 'Production XYZ', type: 'Heures', nombre: 35, brut: 875 },
    { date: '2024-02-01', employeur: 'Festival 123', type: 'Cachet', nombre: 3, brut: 900 }
  ],
};

export const IntermittenceContext = createContext<IntermittenceContextProps>({} as IntermittenceContextProps);

export const useIntermittence = () => useContext(IntermittenceContext);

export const IntermittenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<IntermittenceData>(defaultData);

  const updateField = (field: keyof IntermittenceData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateContrat = (index: number, field: keyof Contrat, value: any) => {
    setData(prev => {
      const newContrats = [...prev.contrats];
      newContrats[index] = { ...newContrats[index], [field]: value };
      return { ...prev, contrats: newContrats };
    });
  };

  const addContrat = () => {
    setData(prev => ({
      ...prev,
      contrats: [
        ...prev.contrats,
        { date: new Date().toISOString().split('T')[0], employeur: '', type: 'Cachet', nombre: 1, brut: 0 }
      ]
    }));
  };

  const removeContrat = (index: number) => {
    setData(prev => {
      const newContrats = [...prev.contrats];
      newContrats.splice(index, 1);
      return { ...prev, contrats: newContrats };
    });
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
      const parsedData = JSON.parse(jsonData);
      setData(parsedData);
    } catch (error) {
      console.error('Erreur lors de l\'import des données', error);
      alert('Le fichier importé contient des données invalides.');
    }
  };

  const value = {
    data,
    setData,
    updateField,
    updateContrat,
    addContrat,
    removeContrat,
    exportData,
    importData
  };

  return (
    <IntermittenceContext.Provider value={value}>
      {children}
    </IntermittenceContext.Provider>
  );
}; 