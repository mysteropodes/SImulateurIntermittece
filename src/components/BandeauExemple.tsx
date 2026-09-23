import React, { useRef } from 'react';
import { FlaskConical, RotateCcw, Upload } from 'lucide-react';
import { useIntermittence } from '../context/IntermittenceContext';

/** Signale les données d'exemple fictives et propose de repartir de zéro. */
const BandeauExemple: React.FC = () => {
  const { data, viderExemple, importData } = useIntermittence();
  const fichier = useRef<HTMLInputElement>(null);
  if (!data.exemple) return null;

  const lire = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const contenu = ev.target?.result as string;
      if (contenu) importData(contenu);
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  return (
    <div role="status" className="flex flex-col gap-4 rounded-4xl bg-amber-100 p-5 text-amber-950 sm:flex-row sm:items-center sm:p-6">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
        <FlaskConical className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <p className="text-base font-semibold">Ce sont des données d'exemple, entièrement fictives.</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-900">
          Elles servent à découvrir le simulateur. Réinitialisez pour saisir vos propres contrats, ou importez votre fichier si vous en avez déjà un.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={viderExemple} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Réinitialiser
        </button>
        <button type="button" onClick={() => fichier.current?.click()} className="btn-outline">
          <Upload className="h-4 w-4" /> Importer mon fichier
        </button>
        <input ref={fichier} type="file" accept=".json,application/json" onChange={lire} className="hidden" />
      </div>
    </div>
  );
};

export default BandeauExemple;
