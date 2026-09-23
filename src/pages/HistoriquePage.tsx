import React, { useMemo, useState } from 'react';
import { History, Plus, Trash2, BarChart3, GitCompare, Archive, Info } from 'lucide-react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { historiqueDroits, type LigneHistorique } from '../lib/simulation';
import { Card, Badge, Notice, PageHeader, eur, nb } from '../components/ui';
import { formatDateFR } from '../lib/calculs';

const statutBadge = (l: LigneHistorique) =>
  l.statut === 'en-cours' ? <Badge tone="brand">en cours</Badge> : l.statut === 'projection' ? <Badge tone="lime">prochaine</Badge> : <Badge>passé</Badge>;

const sourceLabel: Record<NonNullable<LigneHistorique['source']>, string> = {
  saisie: 'saisi',
  contrats: 'd’après vos contrats',
  'contrats-partiels': 'contrats incomplets',
};

const Ecart: React.FC<{ v: number | null; unite?: 'eur' | 'h'; dec?: number }> = ({ v, unite = 'eur', dec = 2 }) => {
  if (v == null) return <span className="text-slate-300">–</span>;
  const cls = Math.abs(v) < 1e-9 ? 'text-slate-500' : v > 0 ? 'text-brand-600' : 'text-rose-600';
  const txt = unite === 'eur' ? eur(Math.abs(v), dec) : `${nb(Math.abs(v), dec)} h`;
  return (
    <span className={`num font-medium ${cls}`}>
      {v > 0 ? '+' : v < 0 ? '−' : ''}
      {txt}
    </span>
  );
};

const HistoriquePage: React.FC = () => {
  const { data, setData, addDroit, updateDroit, removeDroit } = useIntermittence();
  const sim = useSimulation();
  const lignes = useMemo(() => historiqueDroits(data, sim), [data, sim]);
  const projection = lignes.find((l) => l.statut === 'projection')!;
  const comparables = lignes.filter((l) => l.statut !== 'projection');
  const [refId, setRefId] = useState<string | null>(null);
  const ref = comparables.find((l) => l.id === refId) ?? comparables[comparables.length - 1];

  const maxAJ = Math.max(1, ...lignes.map((l) => l.ajBrute ?? 0));
  const passes = lignes.filter((l) => l.statut === 'passe');

  const cloturer = () => {
    const enCours = lignes.find((l) => l.statut === 'en-cours');
    if (!enCours) return;
    if (
      !confirm(
        `Clôturer le droit du ${formatDateFR(enCours.dateDebut)} (AJ ${enCours.ajBrute != null ? eur(enCours.ajBrute) : '—'}) et démarrer le droit suivant au ${formatDateFR(
          sim.dateAnniversaire
        )} ?\n\nLe droit actuel passe dans l'historique ; saisissez ensuite la nouvelle AJ notifiée dans « Mon droit ».`
      )
    )
      return;
    setData((prev) => ({
      ...prev,
      historique: [
        ...prev.historique,
        {
          id: `${enCours.dateDebut}-${Date.now()}`,
          dateDebut: enCours.dateDebut,
          ajBrute: enCours.ajBrute ?? 0,
          heures: enCours.source === 'contrats' && enCours.heures != null ? Math.round(enCours.heures * 100) / 100 : undefined,
          salaires: enCours.source === 'contrats' && enCours.salaires != null ? Math.round(enCours.salaires * 100) / 100 : undefined,
        },
      ],
      dateIndem: sim.dateAnniversaire,
      dateFinContrat: '',
      dateFinPRA: '',
      ajBruteNotifiee: '',
      franchisesAuto: true,
      franchiseConges: '',
      joursConges: '',
      franchiseSalaires: '',
      joursSalaires: '',
    }));
  };

  const lignesComparaison: { label: string; avant: number | null; apres: number | null; unite: 'eur' | 'h' }[] = [
    { label: 'AJ brute', avant: ref?.ajBrute ?? null, apres: projection.ajBrute, unite: 'eur' },
    { label: 'Heures (NHT)', avant: ref?.heures ?? null, apres: projection.heures, unite: 'h' },
    { label: 'Salaire de référence', avant: ref?.salaires ?? null, apres: projection.salaires, unite: 'eur' },
    { label: 'Partie A · salaires', avant: ref?.ajFormule?.A ?? null, apres: projection.ajFormule?.A ?? null, unite: 'eur' },
    { label: 'Partie B · heures', avant: ref?.ajFormule?.B ?? null, apres: projection.ajFormule?.B ?? null, unite: 'eur' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique"
        accent="de vos droits"
        description="Votre AJ d'une date anniversaire à l'autre, et ce que donnerait la prochaine avec vos contrats actuels."
        actions={
          <>
            <button onClick={() => addDroit()} className="btn-outline">
              <Plus className="h-4 w-4" /> Ajouter un droit passé
            </button>
            <button onClick={cloturer} className="btn-outline" title="À faire au moment du réexamen, quand vous recevez la nouvelle notification">
              <Archive className="h-4 w-4" /> Clôturer le droit en cours
            </button>
          </>
        }
      />

      {passes.length === 0 && (
        <Notice icon={<Info className="h-4 w-4" />} title="Ajoutez vos droits précédents">
          Reprenez vos anciennes notifications France Travail (espace personnel › Mes courriers) : date de début du droit et AJ brute, et si possible les
          heures et le salaire de référence retenus. Si vos contrats de l'époque sont saisis, heures et salaires sont retrouvés automatiquement.
        </Notice>
      )}

      <Card title="AJ brute à chaque date anniversaire" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="flex h-56 items-end gap-3 sm:gap-6">
          {lignes.map((l) => {
            const h = l.ajBrute != null ? (l.ajBrute / maxAJ) * 100 : 0;
            const couleur = l.statut === 'projection' ? 'bg-lime-400' : l.statut === 'en-cours' ? 'bg-brand-700' : 'bg-brand-200';
            return (
              <div key={l.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="num text-center text-xs">
                  <div className="font-semibold text-slate-800">{l.ajBrute != null ? eur(l.ajBrute) : '—'}</div>
                  <div className="h-4">
                    <Ecart v={l.variation} />
                  </div>
                </div>
                <div className="flex h-40 w-full max-w-[88px] items-end">
                  <div
                    className={`w-full rounded-2xl ${couleur} ${l.statut === 'projection' ? 'bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgba(255,255,255,.45)_6px_12px)]' : ''}`}
                    style={{ height: `${Math.max(h, 2)}%` }}
                  />
                </div>
                <div className="w-full truncate text-center text-[11px] text-slate-500">{formatDateFR(l.dateDebut)}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-200" /> droits passés
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-700" /> droit en cours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400" /> prochaine date anniversaire (estimation sur vos contrats actuels)
          </span>
        </div>
      </Card>

      <Card title="Droits" icon={<History className="h-4 w-4" />} bodyClassName="">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="whitespace-nowrap text-left text-xs font-medium text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Début du droit</th>
                <th className="px-3 py-2.5">Anniversaire</th>
                <th className="px-3 py-2.5 text-right">AJ brute</th>
                <th className="px-3 py-2.5 text-right">Écart</th>
                <th className="px-3 py-2.5 text-right">Heures</th>
                <th className="px-3 py-2.5 text-right">Salaire de réf.</th>
                <th className="px-3 py-2.5">Source</th>
                <th className="w-10 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.map((l) => {
                const brut = data.historique.find((h) => h.id === l.id);
                return (
                  <tr key={l.id} className={l.statut === 'projection' ? 'bg-lime-100/60' : l.statut === 'en-cours' ? 'bg-brand-50/60' : ''}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {brut ? (
                          <input type="date" value={brut.dateDebut} onChange={(e) => updateDroit(l.id, 'dateDebut', e.target.value)} className="input-sm w-40" />
                        ) : (
                          <span className="num font-medium">{formatDateFR(l.dateDebut)}</span>
                        )}
                        {statutBadge(l)}
                      </div>
                    </td>
                    <td className="num px-3 py-2 text-slate-500">{formatDateFR(l.dateAnniversaire)}</td>
                    <td className="px-3 py-2 text-right">
                      {brut ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={brut.ajBrute || ''}
                          placeholder="AJ notifiée"
                          onChange={(e) => updateDroit(l.id, 'ajBrute', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="input-sm w-28 text-right"
                        />
                      ) : (
                        <span className="num font-semibold">{l.ajBrute != null ? eur(l.ajBrute) : '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Ecart v={l.variation} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {brut ? (
                        <input
                          type="number"
                          min="0"
                          value={brut.heures ?? ''}
                          placeholder={l.heures != null ? nb(l.heures, 0) : 'heures'}
                          onChange={(e) => updateDroit(l.id, 'heures', e.target.value === '' ? undefined : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="input-sm w-24 text-right"
                        />
                      ) : (
                        <span className="num">{l.heures != null ? `${nb(l.heures, 0)} h` : '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {brut ? (
                        <input
                          type="number"
                          min="0"
                          value={brut.salaires ?? ''}
                          placeholder={l.salaires != null ? nb(l.salaires, 0) : 'salaires'}
                          onChange={(e) => updateDroit(l.id, 'salaires', e.target.value === '' ? undefined : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="input-sm w-28 text-right"
                        />
                      ) : (
                        <span className="num">{l.salaires != null ? eur(l.salaires, 0) : '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {l.statut === 'projection' ? 'contrats actuels' : l.source ? sourceLabel[l.source] : 'non renseigné'}
                      {l.statut !== 'projection' && l.ajFormule && l.ajBrute != null && Math.abs(l.ajFormule.aj - l.ajBrute) > 0.5 && (
                        <div className="text-[11px] text-slate-400" title="AJ recalculée avec la formule et les paramètres actuels">
                          formule actuelle : {eur(l.ajFormule.aj)}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {brut && (
                        <button onClick={() => removeDroit(l.id)} className="rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600" title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-3">
          <button onClick={() => addDroit()} className="btn-ghost">
            <Plus className="h-4 w-4" /> Ajouter un droit passé
          </button>
        </div>
      </Card>

      <Card
        title="Progression"
        icon={<GitCompare className="h-4 w-4" />}
        action={
          <select value={ref?.id ?? ''} onChange={(e) => setRefId(e.target.value)} className="input-sm">
            {comparables.map((l) => (
              <option key={l.id} value={l.id}>
                {l.statut === 'en-cours' ? 'Droit en cours' : 'Droit'} du {formatDateFR(l.dateDebut)}
              </option>
            ))}
          </select>
        }
        bodyClassName=""
      >
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[520px] text-sm">
            <thead className="text-xs font-medium text-slate-400">
              <tr>
                <th className="px-4 py-2.5 text-left"></th>
                <th className="px-4 py-2.5 text-right">{ref ? `Droit du ${formatDateFR(ref.dateDebut)}` : 'Avant'}</th>
                <th className="px-4 py-2.5 text-right">Au {formatDateFR(projection.dateDebut)}</th>
                <th className="px-4 py-2.5 text-right">Écart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignesComparaison.map((r) => (
                <tr key={r.label}>
                  <td className="px-4 py-2 text-left text-slate-600">{r.label}</td>
                  <td className="px-4 py-2 text-right">{r.avant == null ? '—' : r.unite === 'eur' ? eur(r.avant, r.label === 'Salaire de référence' ? 0 : 2) : `${nb(r.avant, 0)} h`}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {r.apres == null ? '—' : r.unite === 'eur' ? eur(r.apres, r.label === 'Salaire de référence' ? 0 : 2) : `${nb(r.apres, 0)} h`}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Ecart v={r.avant != null && r.apres != null ? r.apres - r.avant : null} unite={r.unite} dec={r.label === 'Salaire de référence' || r.unite === 'h' ? 0 : 2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          La colonne de droite est une estimation : période de référence jusqu'à votre dernier contrat saisi ({formatDateFR(sim.affiliation.periode.fin)}), formule
          actuelle. Les parties A et B ne s'affichent que si heures et salaires du droit comparé sont connus.
        </p>
      </Card>
    </div>
  );
};

export default HistoriquePage;
