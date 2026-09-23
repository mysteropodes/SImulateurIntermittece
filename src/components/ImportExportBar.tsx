import React, { useRef } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { Upload, Download, RotateCcw } from 'lucide-react';

/** Actions sur les données (export / import JSON, réinitialisation), affichées dans la barre latérale. */
const ImportExportBar: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { exportData, importData, resetData } = useIntermittence();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) importData(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cls = compact
    ? 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-100 hover:bg-white/10 hover:text-white'
    : 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-100 hover:bg-white/10 hover:text-white';

  return (
    <div className={compact ? 'flex gap-1' : 'flex flex-col gap-0.5'}>
      <button onClick={exportData} className={cls} title="Télécharger vos données (JSON)">
        <Download className="h-4 w-4" />
        <span className={compact ? 'hidden sm:inline' : ''}>Exporter</span>
      </button>
      <button onClick={() => fileInputRef.current?.click()} className={cls} title="Charger un fichier JSON">
        <Upload className="h-4 w-4" />
        <span className={compact ? 'hidden sm:inline' : ''}>Importer</span>
      </button>
      <button onClick={resetData} className={cls} title="Effacer toutes les données">
        <RotateCcw className="h-4 w-4" />
        <span className={compact ? 'hidden sm:inline' : ''}>Réinitialiser</span>
      </button>
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
    </div>
  );
};

export default ImportExportBar;
