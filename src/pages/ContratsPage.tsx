import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Plus, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Card, Kpi, Notice, Badge, PageHeader, Aide, eur, nb } from '../components/ui';
import { TYPES, GROUPES } from '../lib/typesContrat';
import {
  heuresContrat,
  estSpectacle,
  PLAFOND_HEURES_MOIS,
  PLAFOND_ENSEIGNEMENT,
  PLAFOND_ENSEIGNEMENT_50_ANS,
  formatDateFR,
  type TypeContrat,
  type Annexe,
} from '../lib/calculs';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const ContratsPage: React.FC = () => {
  const { data, updateContrat, addContrat, removeContrat } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff } = sim;
  const dansPRA = new Set(aff.contrats.map((c) => c.id));
  const contrats = [...data.contrats].sort((a, b) => b.date.localeCompare(a.date));
  const margeParMois = new Map(sim.suivi.mois.map((m) => [m.cle, m]));
  const plafondEns = data.plus50ans ? PLAFOND_ENSEIGNEMENT_50_ANS : PLAFOND_ENSEIGNEMENT;
  const nbCols = data.multiAnnexe ? 11 : 10;

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
        accent="et heures"
        description={
          <>
            Spectacle, autres activités et périodes assimilées. Les 507 h sont recherchées du <b>{formatDateFR(aff.periode.debut)}</b> au{' '}
            <b>{formatDateFR(aff.periode.fin)}</b>.
          </>
        }
        actions={
          <button onClick={addContrat} className="btn-primary">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          variant="dark"
          aide="h507"
          label="Heures pour les 507 h"
          value={`${nb(aff.heuresAffiliation, 1)} h`}
          sub={aff.eligible ? 'Seuil atteint' : `Il manque ${nb(aff.heuresManquantes, 1)} h`}
        />
        <Kpi aide="nht" label="Heures pour l'AJ" value={`${nb(aff.nht, 1)} h`} sub={aff.heuresArret > 0 ? `dont ${nb(aff.heuresArret)} h d'arrêt` : 'spectacle'} />
        <Kpi
          aide="sr"
          label="Salaire de référence"
          value={eur(aff.sr, 0)}
          sub={aff.sr !== aff.srBrut ? `aménagé (arrêt) · ${eur(aff.srBrut, 0)} réels` : 'bruts spectacle'}
        />
        <Kpi
          aide="enseignement"
          label="Cours et formation"
          value={`${nb(aff.heuresEnseignementRetenues + aff.heuresFormationRetenues, 1)} h`}
          sub={`cours ${nb(aff.heuresEnseignement, 1)} h (max ${plafondEns}) · formation ${nb(aff.heuresFormation, 1)} h`}
        />
      </div>

      {aff.moisPlafonnes.length > 0 && (
        <Notice tone="warn" icon={<AlertTriangle className="h-4 w-4" />}>
          Plafond mensuel appliqué ({PLAFOND_HEURES_MOIS[data.annexe]} h{data.annexe === 'A8' ? ', 250 h avec plusieurs employeurs' : ' = 28 cachets'}) sur{' '}
          {aff.moisPlafonnes.join(', ')} : {nb(aff.nht - aff.heuresArret, 1)} h retenues au lieu de {nb(aff.heuresBrutes, 1)}.
        </Notice>
      )}

      <Card bodyClassName="pt-2">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${data.multiAnnexe ? 'min-w-[1080px]' : 'min-w-[1000px]'}`}>
            <thead className="whitespace-nowrap text-left text-xs font-medium text-slate-400">
              <tr>
                <th className="px-3 py-3">Début</th>
                <th className="px-3 py-3">Fin</th>
                <th className="px-3 py-3">Employeur</th>
                <th className="px-3 py-3">Type</th>
                {data.multiAnnexe && <th className="px-3 py-3">Annexe</th>}
                <th className="px-3 py-3 text-right">Nombre</th>
                <th className="px-3 py-3 text-right">Brut (€)</th>
                <th className="px-3 py-3 text-right">Heures</th>
                <th className="px-3 py-3 text-right">€ / h</th>
                <th className="px-3 py-3 text-center">
                  <span className="inline-flex items-center gap-1">
                    507 h <Aide terme="pra" />
                  </span>
                </th>
                <th className="w-10 px-2 py-3"></th>
              </tr>
            </thead>
            {groupes.map((g) => {
              const [annee, mois] = g.cle.split('-').map(Number);
              const m = margeParMois.get(g.cle);
              const activites = g.items.filter((c) => c.type !== 'Arret' && c.type !== 'Formation');
              const heuresMois = activites.reduce((a, c) => a + heuresContrat(c), 0);
              const brutMois = activites.reduce((a, c) => a + c.brut, 0);
              return (
                <tbody key={g.cle} className="border-t border-slate-100">
                  <tr>
                    <td colSpan={nbCols} className="px-3 pb-1.5 pt-4 text-xs text-slate-500">
                      <span className="text-sm font-semibold capitalize text-slate-800">
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
                              {m.joursNonIndemnisables} j non indemnisables · <span className="text-slate-700">encore {nb(m.margeHeures, 1)} h avant d'en perdre un de plus</span>
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                  {g.items.map((c) => {
                    const t = TYPES[c.type];
                    const heures = heuresContrat(c);
                    const compte = c.type !== 'RegimeGeneral' && c.type !== 'NonSalarie';
                    const inPRA = compte && dansPRA.has(c.id);
                    return (
                      <tr key={c.id} className={`group hover:bg-slate-50/70 ${compte && !inPRA ? 'text-slate-400' : ''}`}>
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
                            placeholder={c.type === 'Arret' ? 'Motif (facultatif)' : c.type === 'Formation' ? 'Organisme' : 'Employeur'}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <select value={c.type} onChange={(e) => updateContrat(c.id, 'type', e.target.value as TypeContrat)} className="input-sm min-w-[150px]" title={t.aide}>
                            {GROUPES.map((gr) => (
                              <optgroup key={gr} label={gr}>
                                {(Object.keys(TYPES) as TypeContrat[])
                                  .filter((k) => TYPES[k].groupe === gr)
                                  .map((k) => (
                                    <option key={k} value={k}>
                                      {TYPES[k].label}
                                    </option>
                                  ))}
                              </optgroup>
                            ))}
                          </select>
                        </td>
                        {data.multiAnnexe && (
                          <td className="px-3 py-1.5">
                            {estSpectacle(c) ? (
                              <select value={c.annexe ?? data.annexe} onChange={(e) => updateContrat(c.id, 'annexe', e.target.value as Annexe)} className="input-sm w-20">
                                <option value="A8">A8</option>
                                <option value="A10">A10</option>
                              </select>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-1.5">
                          {t.aNombre ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                value={c.nombre}
                                onChange={(e) => updateContrat(c.id, 'nombre', Math.max(0, parseFloat(e.target.value) || 0))}
                                className="input-sm w-20 text-right"
                                min="0"
                                step={c.type === 'Cachet' || c.type === 'Arret' ? 1 : 0.5}
                              />
                              <span className="w-12 text-xs text-slate-400">{t.unite}</span>
                            </div>
                          ) : (
                            <span className="block pr-14 text-right text-xs text-slate-400" title={t.aide}>
                              auto
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {t.aBrut ? (
                            <input
                              type="number"
                              value={c.brut}
                              onChange={(e) => updateContrat(c.id, 'brut', Math.max(0, parseFloat(e.target.value) || 0))}
                              className="input-sm w-24 text-right"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span className="block pr-3 text-right text-slate-300">—</span>
                          )}
                        </td>
                        <td className="num px-3 py-1.5 text-right">
                          <Badge tone={t.tone}>{nb(heures, 1)} h</Badge>
                        </td>
                        <td className="num px-3 py-1.5 text-right text-slate-500">{t.aBrut && heures > 0 ? nb(c.brut / heures, 1) : '—'}</td>
                        <td className="px-3 py-1.5 text-center">
                          {!compte ? (
                            <span className="text-xs text-slate-300" title={t.aide}>
                              non
                            </span>
                          ) : inPRA ? (
                            <Badge tone="lime">oui</Badge>
                          ) : (
                            <Badge>hors</Badge>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeContrat(c.id)}
                            className="rounded-full p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 group-hover:text-slate-400"
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
        <div className="border-t border-slate-100 px-2 pt-3">
          <button onClick={addContrat} className="btn-ghost">
            <Plus className="h-4 w-4" /> Ajouter une ligne
          </button>
        </div>
      </Card>

      <Card title="Quel type choisir ?" icon={<Info className="h-4 w-4" />}>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(TYPES) as TypeContrat[]).map((k) => (
            <div key={k}>
              <dt>
                <Badge tone={TYPES[k].tone}>{TYPES[k].label}</Badge>
              </dt>
              <dd className="mt-1 text-slate-600">{TYPES[k].aide}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          Cours : établissement agréé, {PLAFOND_ENSEIGNEMENT} h ({PLAFOND_ENSEIGNEMENT_50_ANS} h à 50 ans et plus). Arrêts : seulement hors contrat (maladie de longue
          durée, accident du travail prolongé, maternité ou adoption).
        </p>
      </Card>
    </div>
  );
};

export default ContratsPage;
