import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { CalendarDays, FileCheck, Scissors, Receipt } from 'lucide-react';
import { Card, Field, Segmented, InputSuffix, PageHeader, Badge, eur, nb } from '../components/ui';
import { AJ_MIN, formatDateFR, repartitionFranchiseSalaires } from '../lib/calculs';

const MonAJPage: React.FC = () => {
  const { data, updateField } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff, ajCalculee } = sim;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon droit"
        accent="et mes paramètres"
        description="Paramètres de votre situation. L'AJ, les franchises et le suivi mensuel se calculent à partir de vos contrats."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Situation" icon={<CalendarDays className="h-4 w-4" />} bodyClassName="p-5 space-y-5">
          <Field label="Annexe">
            <Segmented
              value={data.annexe}
              onChange={(v) => updateField('annexe', v)}
              options={[
                { value: 'A8', label: 'Technicien (annexe 8)' },
                { value: 'A10', label: 'Artiste (annexe 10)' },
              ]}
            />
          </Field>

          <Field label="Contrats dans les deux annexes ?" hint="Oui : vous choisissez l'annexe de chaque contrat, et le droit s'ouvre dans l'annexe où vous avez le plus d'heures.">
            <Segmented value={data.multiAnnexe} onChange={(v) => updateField('multiAnnexe', v)} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
          </Field>
          {data.multiAnnexe && (
            <div className="rounded-3xl bg-slate-50 p-4 text-sm">
              <p className="num text-slate-600">
                Annexe 8 : <b>{nb(aff.heuresParAnnexe.A8)} h</b> · Annexe 10 : <b>{nb(aff.heuresParAnnexe.A10)} h</b>
              </p>
              {aff.annexeMajoritaire !== data.annexe ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-amber-700">Votre droit devrait s'ouvrir en annexe {aff.annexeMajoritaire === 'A8' ? '8' : '10'}.</span>
                  <button type="button" className="btn-lime py-1.5" onClick={() => updateField('annexe', aff.annexeMajoritaire)}>
                    Passer en annexe {aff.annexeMajoritaire === 'A8' ? '8' : '10'}
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-brand-700">L'annexe choisie est bien l'annexe majoritaire.</p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Indemnisable à partir du" aide="dateAnniversaire" hint="Début du droit en cours.">
              <input type="date" value={data.dateIndem} onChange={(e) => updateField('dateIndem', e.target.value)} className="input" />
            </Field>
            <Field label="Fin du contrat ayant ouvert le droit" hint="Les heures jusqu'à cette date ont servi à ouvrir le droit : elles ne comptent plus pour le suivant.">
              <input type="date" value={data.dateFinContrat} onChange={(e) => updateField('dateFinContrat', e.target.value)} className="input" />
            </Field>
          </div>

          <Field
            aide="pra"
            label="Figer la fin de la période de référence"
            hint={
              <>
                Facultatif. Par défaut, les 507 h sont cherchées sur les 12 mois précédant votre dernier contrat — actuellement du{' '}
                {formatDateFR(aff.periode.debut)} au {formatDateFR(aff.periode.fin)}.
              </>
            }
          >
            <input type="date" value={data.dateFinPRA} onChange={(e) => updateField('dateFinPRA', e.target.value)} className="input sm:max-w-[50%]" />
          </Field>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Délai d'attente (7 j)</span>
              <Segmented value={data.delaiAttente} onChange={(v) => updateField('delaiAttente', v)} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">50 ans ou plus</span>
              <Segmented value={data.plus50ans} onChange={(v) => updateField('plus50ans', v)} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-500">À 50 ans et plus, 120 h d'enseignement comptent pour les 507 h (70 h sinon).</p>
        </Card>

        <Card title="Droit notifié par France Travail" icon={<FileCheck className="h-4 w-4" />} bodyClassName="p-5 space-y-5">
          <Field
            aide="aj"
            label="AJ brute de votre notification"
            hint={
              sim.sourceAJ === 'notifiee' ? (
                <>
                  Utilisée pour le suivi mensuel. Recalculée sur vos contrats actuels : <b>{eur(ajCalculee.aj)}</b> (
                  {ajCalculee.aj - sim.ajBrute >= 0 ? '+' : ''}
                  {eur(ajCalculee.aj - sim.ajBrute)}).
                </>
              ) : (
                'Facultatif. Vide = AJ calculée sur vos contrats.'
              )
            }
          >
            <InputSuffix suffix="€ / jour">
              <input
                type="number"
                step="0.01"
                min="0"
                value={data.ajBruteNotifiee}
                onChange={(e) => updateField('ajBruteNotifiee', e.target.value)}
                className="input pr-20"
                placeholder={aff.eligible ? ajCalculee.aj.toFixed(2) : ''}
              />
            </InputSuffix>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prélèvement à la source">
              <InputSuffix suffix="%">
                <input type="number" min="0" max="100" step="0.1" value={data.tauxPrelevement} onChange={(e) => updateField('tauxPrelevement', e.target.value)} className="input pr-8" />
              </InputSuffix>
            </Field>
            <Field label="Cotisations sur salaires" hint="Estimation du net (≈ 22 %).">
              <InputSuffix suffix="%">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={data.tauxCotisationsSalaire}
                  onChange={(e) => updateField('tauxCotisationsSalaire', e.target.value)}
                  className="input pr-8"
                />
              </InputSuffix>
            </Field>
          </div>

          <Field label="CSG sur l'ARE">
            <Segmented
              value={data.tauxCSG}
              onChange={(v) => updateField('tauxCSG', v)}
              options={[
                { value: '6.2', label: 'Taux plein 6,2 %' },
                { value: '3.8', label: 'Taux réduit 3,8 %' },
              ]}
            />
          </Field>
        </Card>

        <Card
          title="Franchises"
          aide="franchiseCP"
          icon={<Scissors className="h-4 w-4" />}
          action={
            <Segmented
              value={data.franchisesAuto}
              onChange={(v) => updateField('franchisesAuto', v)}
              options={[
                { value: true, label: 'Calculées' },
                { value: false, label: 'Notification' },
              ]}
            />
          }
          bodyClassName="p-5"
        >
          {data.franchisesAuto && sim.affOuverture && sim.affOuverture.heuresAffiliation === 0 && (
            <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
              Les contrats qui ont ouvert votre droit (avant le {formatDateFR(sim.affOuverture.periode.fin)}) ne sont pas saisis : les franchises ne peuvent pas être
              calculées. Saisissez ces contrats, ou passez en « Notification » et recopiez les franchises de votre courrier France Travail.
            </p>
          )}
          {data.franchisesAuto ? (
            <dl className="space-y-4 text-sm">
              <div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-slate-700">Congés payés</dt>
                  <dd>
                    <Badge tone="amber">
                      {sim.franchiseCPAuto.total} j · {sim.franchiseCPAuto.forfaitMensuel} j/mois
                    </Badge>
                  </dd>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  ⌊{nb((sim.affOuverture ?? aff).joursTravail, 1)} jours travaillés{sim.affOuverture ? ' (période qui a ouvert le droit)' : ''} × 2,5 / 24⌋, 30 j max ; 2 j/mois jusqu'à 24 j, 3 j au-delà.
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-slate-700">Salaires</dt>
                  <dd>
                    <Badge tone={sim.franchiseSalAuto.total > 0 ? 'amber' : 'neutral'}>
                      {sim.franchiseSalAuto.total} j{sim.franchiseSalAuto.total > 0 && ` · ${repartitionFranchiseSalaires(sim.franchiseSalAuto).join(' + ')}`}
                    </Badge>
                  </dd>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  ⌊(salaires / SMIC mensuel) × (SJM / 3 SMIC journaliers)⌋ − 27, sur 8 mois. SJM {eur(sim.sjm)}, SMIC {eur(sim.smic.horaire)}/h au{' '}
                  {formatDateFR(aff.periode.fin)}.
                </p>
              </div>
            </dl>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Franchise CP (total)">
                <InputSuffix suffix="j">
                  <input type="number" min="0" value={data.franchiseConges} onChange={(e) => updateField('franchiseConges', e.target.value)} className="input" />
                </InputSuffix>
              </Field>
              <Field label="par mois">
                <InputSuffix suffix="j">
                  <input type="number" min="0" value={data.joursConges} onChange={(e) => updateField('joursConges', e.target.value)} className="input" placeholder="2 ou 3" />
                </InputSuffix>
              </Field>
              <Field label="Franchise salaires (total)">
                <InputSuffix suffix="j">
                  <input type="number" min="0" value={data.franchiseSalaires} onChange={(e) => updateField('franchiseSalaires', e.target.value)} className="input" />
                </InputSuffix>
              </Field>
              <Field label="par mois">
                <InputSuffix suffix="j">
                  <input type="number" min="0" value={data.joursSalaires} onChange={(e) => updateField('joursSalaires', e.target.value)} className="input" placeholder="total / 8" />
                </InputSuffix>
              </Field>
            </div>
          )}
        </Card>

        <Card title="De l'AJ brute à ce qui est versé" aide="ajNette" icon={<Receipt className="h-4 w-4" />}>
          {sim.ajBrute > 0 ? (
            <table className="num w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-slate-600">AJ brute {sim.sourceAJ === 'notifiee' ? '(notifiée)' : '(calculée)'}</td>
                  <td className="py-2 text-right font-medium">{eur(sim.ajBrute)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">− retraite complémentaire (0,93 % du SJM)</td>
                  <td className="py-2 text-right text-rose-600">{sim.retenues.retraiteComplementaire > 0 ? `− ${eur(sim.retenues.retraiteComplementaire)}` : '—'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">− CSG / CRDS {sim.ajBrute <= 60 && '(pas en dessous de 60 €)'}</td>
                  <td className="py-2 text-right text-rose-600">{sim.retenues.csgCrds > 0 ? `− ${eur(sim.retenues.csgCrds)}` : '—'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-slate-700">AJ nette</td>
                  <td className="py-2 text-right font-medium">{eur(sim.retenues.net)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">− impôt à la source ({nb(parseFloat(data.tauxPrelevement) || 0, 2)} %)</td>
                  <td className="py-2 text-right text-rose-600">− {eur(sim.retenues.net * ((parseFloat(data.tauxPrelevement) || 0) / 100))}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-slate-900">Versé par jour indemnisé</td>
                  <td className="py-2 text-right text-lg font-semibold text-brand-600">
                    {eur(sim.retenues.net * (1 - (parseFloat(data.tauxPrelevement) || 0) / 100))}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">Aucune AJ : seuil des 507 h non atteint et pas d'AJ notifiée.</p>
          )}
          <p className="mt-3 text-xs text-slate-400">Aucune retenue jusqu'à {eur(AJ_MIN)} brut ; CSG et CRDS au-delà de 60 €.</p>
        </Card>
      </div>
    </div>
  );
};

export default MonAJPage;
