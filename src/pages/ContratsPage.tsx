import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Plus, Trash2, AlertTriangle, GraduationCap } from 'lucide-react';
import { Card, Kpi, Notice, Badge, PageHeader, eur, nb } from '../components/ui';
import {
  heuresContrat,
  SEUIL_HEURES,
  PLAFOND_HEURES_MOIS,
  PLAFOND_ENSEIGNEMENT,
  PLAFOND_ENSEIGNEMENT_50_ANS,
  formatDateFR,
  type TypeContrat,
} from '../lib/calculs';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const typeTone = { Cachet: 'brand', Heures: 'blue', Enseignement: 'green' } as const;

const ContratsPage: React.FC = () => {
  const { data, updateContrat, addContrat, removeContrat } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff } = sim;
  const dansPRA = new Set(aff.contrats.map((c) => c.id));
  const contrats = [...data.contrats].sort((a, b) => b.date.localeCompare(a.date));
  const margeParMois = new Map(sim.suivi.mois.map((m) => [m.cle, m]));
  const plafondEns = data.plus50ans ? PLAFOND_ENSEIGNEMENT_50_ANS : PLAFOND_ENSEIGNEMENT;

  // regroupement par mois (plus récent en haut)
  const groupes: { cle: string; items: typeof contrats }[] = [];
  for (const c of contrats) {
    const cle = c.date.slice(0, 7);
    const g = groupes[groupes.length - 1];
    if (g && g.cle === cle) g.items.push(c);
    else groupes.push({ cle, items: [c] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrats"
        description={
          <>
            1 cachet = 12 h. Les 507 h sont recherchées du <b>{formatDateFR(aff.periode.debut)}</b> au <b>{formatDateFR(aff.periode.fin)}</b> ; les autres
            contrats servent au suivi mensuel.
          </>
        }
        actions={
          <button onClick={addContrat} className="btn-primary">
            <Plus className="h-4 w-4" /> Ajouter un contrat
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Heures pour les 507 h"
          value={`${nb(aff.heuresAffiliation, 1)} h`}
          sub={aff.eligible ? 'Seuil atteint' : `Il manque ${nb(aff.heuresManquantes, 1)} h`}
          tone={aff.eligible ? 'green' : 'amber'}
        />
        <Kpi label="Heures pour l'AJ (NHT)" value={`${nb(aff.nht, 1)} h`} sub="hors enseignement" />
        <Kpi label="Salaire de référence" value={eur(aff.sr, 0)} sub="bruts hors enseignement" />
        <Kpi
          label="Enseignement"
          value={`${nb(aff.heuresEnseignement, 1)} h`}
          sub={`${nb(aff.heuresEnseignementRetenues, 1)} h retenues (max ${plafondEns} h)`}
          tone={aff.heuresEnseignement > plafondEns ? 'amber' : 'neutral'}
        />
      </div>

      {aff.moisPlafonnes.length > 0 && (
        <Notice tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
          Plafond mensuel appliqué ({PLAFOND_HEURES_MOIS[data.annexe]} h{data.annexe === 'A8' ? ', 250 h avec plusieurs employeurs' : ' = 28 cachets'}) sur{' '}
          {aff.moisPlafonnes.join(', ')} : {nb(aff.nht, 1)} h retenues au lieu de {nb(aff.heuresBrutes, 1)}.
        </Notice>
      )}

      <Card bodyClassName="">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 whitespace-nowrap bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Début</th>
                <th className="px-3 py-2.5">Fin</th>
                <th className="px-3 py-2.5">Employeur</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Nombre</th>
                <th className="px-3 py-2.5 text-right">Brut (€)</th>
                <th className="px-3 py-2.5 text-right">Heures</th>
                <th className="px-3 py-2.5 text-right">€ / h</th>
                <th className="px-3 py-2.5 text-center">507 h</th>
                <th className="w-10 px-2 py-2.5"></th>
              </tr>
            </thead>
            {groupes.map((g) => {
              const [annee, mois] = g.cle.split('-').map(Number);
              const m = margeParMois.get(g.cle);
              const heuresMois = g.items.reduce((a, c) => a + heuresContrat(c), 0);
              const brutMois = g.items.reduce((a, c) => a + c.brut, 0);
              return (
                <tbody key={g.cle} className="border-t border-slate-100">
                  <tr className="bg-slate-50/70">
                    <td colSpan={10} className="px-3 py-1.5 text-xs text-slate-500">
                      <span className="font-semibold capitalize text-slate-700">
                        {MOIS[mois - 1]} {annee}
                      </span>
                      <span className="num ml-3">
                        {nb(heuresMois, 1)} h · {eur(brutMois, 0)}
                      </span>
                      {m && m.joursHorsDroit < m.joursDansMois && (
                        <span className="ml-3">
                          {m.seuilAtteint ? (
                            <Badge tone="red">seuil de jours atteint : pas d'ARE ce mois</Badge>
                          ) : (
                            <>
                              {m.joursNonIndemnisables} j non indemnisables ·{' '}
                              <span className="text-slate-700">encore {nb(m.margeHeures, 1)} h avant d'en perdre un de plus</span>
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                  {g.items.map((c) => {
                    const heures = heuresContrat(c);
                    const inPRA = dansPRA.has(c.id);
                    return (
                      <tr key={c.id} className={`group border-t border-slate-100 hover:bg-slate-50/60 ${inPRA ? '' : 'text-slate-400'}`}>
                        <td className="px-3 py-1.5">
                          <input type="date" value={c.date} onChange={(e) => updateContrat(c.id, 'date', e.target.value)} className="input-sm" />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="date"
                            value={c.dateFin ?? ''}
                            min={c.date}
                            onChange={(e) => updateContrat(c.id, 'dateFin', e.target.value || undefined)}
                            className="input-sm"
                            title="Facultatif : répartit le contrat sur plusieurs mois"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            value={c.employeur}
                            onChange={(e) => updateContrat(c.id, 'employeur', e.target.value)}
                            className="input-sm min-w-[140px]"
                            placeholder="Employeur"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <select
                            value={c.type}
                            onChange={(e) => updateContrat(c.id, 'type', e.target.value as TypeContrat)}
                            className="input-sm min-w-[128px]"
                          >
                            <option value="Heures">Heures</option>
                            <option value="Cachet">Cachets</option>
                            <option value="Enseignement">Enseignement</option>
                          </select>
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            value={c.nombre}
                            onChange={(e) => updateContrat(c.id, 'nombre', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="input-sm w-20 text-right"
                            min="0"
                            step={c.type === 'Cachet' ? 1 : 0.5}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            value={c.brut}
                            onChange={(e) => updateContrat(c.id, 'brut', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="input-sm w-24 text-right"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="num px-3 py-1.5 text-right">
                          <Badge tone={typeTone[c.type]}>{nb(heures, 1)} h</Badge>
                        </td>
                        <td className="num px-3 py-1.5 text-right text-slate-500">{heures > 0 ? nb(c.brut / heures, 1) : '—'}</td>
                        <td className="px-3 py-1.5 text-center">
                          {inPRA ? <Badge tone="green">oui</Badge> : <Badge>non</Badge>}
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeContrat(c.id)}
                            className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 group-hover:text-slate-400"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
        {contrats.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Aucun contrat. Ajoutez votre premier contrat pour commencer.</p>}
        <div className="border-t border-slate-100 p-3">
          <button onClick={addContrat} className="btn-ghost">
            <Plus className="h-4 w-4" /> Ajouter un contrat
          </button>
        </div>
      </Card>

      <Notice icon={<GraduationCap className="h-4 w-4" />} title="Heures d'enseignement">
        Cours donnés dans un établissement agréé (écoles, conservatoires, universités, organismes AFDAS…) : ils comptent pour les {SEUIL_HEURES} h dans la
        limite de {PLAFOND_ENSEIGNEMENT} h ({PLAFOND_ENSEIGNEMENT_50_ANS} h à 50 ans et plus), mais ni leurs heures ni leur salaire n'entrent dans le calcul de
        l'AJ. Ils restent une activité du mois pour le cumul avec l'ARE. Pour un technicien, le contrat doit être terminé dans la période de référence.
      </Notice>
    </div>
  );
};

export default ContratsPage;
