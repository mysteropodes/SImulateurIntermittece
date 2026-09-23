import React from 'react';
import { Link } from 'react-router-dom';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { AlertCircle, ArrowRight, Calendar, Clock, Euro, Hourglass, Wallet } from 'lucide-react';
import { Card, Kpi, Stat, Notice, Progress, Badge, PageHeader, eur, nb } from '../components/ui';
import PaliersPanel from '../components/PaliersPanel';
import { SEUIL_HEURES, formatDateFR, parseDate, cleMois } from '../lib/calculs';

const SynthesePage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff, ajCalculee } = sim;
  const tauxPAS = (parseFloat(data.tauxPrelevement) || 0) / 100;
  const moisCourant = sim.suivi.mois.find((m) => m.cle === cleMois(new Date()));
  const joursRestants = Math.max(0, Math.round((parseDate(sim.dateAnniversaire).getTime() - Date.now()) / 86400000));
  const total = ajCalculee.A + ajCalculee.B + ajCalculee.C;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Synthèse"
        description={
          <>
            {data.annexe === 'A8' ? 'Ouvrier / technicien (annexe 8)' : 'Artiste (annexe 10)'} — droit du {formatDateFR(sim.dateIndem)} au{' '}
            {formatDateFR(sim.dateFinDroit)}.
          </>
        }
        actions={
          <Link to="/contrats" className="btn-primary">
            Mes contrats <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Allocation journalière"
          value={sim.ajBrute > 0 ? eur(sim.ajBrute) : 'Non éligible'}
          sub={sim.ajBrute > 0 ? `${eur(sim.retenues.net * (1 - tauxPAS))} versés / jour` : `Seuil de ${SEUIL_HEURES} h non atteint`}
          tone={sim.ajBrute > 0 ? 'brand' : 'red'}
          icon={<Euro className="h-4 w-4" />}
          footer={sim.sourceAJ === 'notifiee' ? <>AJ notifiée · recalculée sur vos contrats : {eur(ajCalculee.aj)}</> : 'AJ calculée sur vos contrats'}
        />
        <Kpi
          label="Heures sur 12 mois"
          value={`${nb(aff.heuresAffiliation, 0)} h`}
          sub={aff.eligible ? `Seuil de ${SEUIL_HEURES} h atteint` : `Il manque ${nb(aff.heuresManquantes, 0)} h`}
          tone={aff.eligible ? 'green' : 'amber'}
          icon={<Hourglass className="h-4 w-4" />}
          footer={<Progress value={aff.heuresAffiliation} max={SEUIL_HEURES} tone={aff.eligible ? 'green' : 'amber'} />}
        />
        <Kpi
          label={moisCourant ? `ARE de ${moisCourant.label}` : 'ARE du mois'}
          value={moisCourant ? eur(moisCourant.areVersee, 0) : '—'}
          sub={moisCourant ? `${moisCourant.joursIndemnises} jours indemnisés · ${nb(moisCourant.heures, 0)} h travaillées` : 'Hors période de droit'}
          tone="green"
          icon={<Wallet className="h-4 w-4" />}
          footer={
            moisCourant && moisCourant.joursHorsDroit < moisCourant.joursDansMois ? (
              <>Encore {nb(moisCourant.margeHeures, 1)} h ce mois avant de perdre un jour d'ARE</>
            ) : undefined
          }
        />
        <Kpi
          label="Date anniversaire"
          value={formatDateFR(sim.dateAnniversaire)}
          sub={`dans ${joursRestants} jours — réexamen du droit`}
          icon={<Calendar className="h-4 w-4" />}
          footer={`Période de référence : ${formatDateFR(aff.periode.debut)} → ${formatDateFR(aff.periode.fin)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Calcul de l'AJ" icon={<Euro className="h-4 w-4" />} className="lg:col-span-3">
          {aff.eligible ? (
            <>
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-brand-500" style={{ width: `${(ajCalculee.A / total) * 100}%` }} title="Partie A" />
                <div className="bg-sky-400" style={{ width: `${(ajCalculee.B / total) * 100}%` }} title="Partie B" />
                <div className="bg-slate-300" style={{ width: `${(ajCalculee.C / total) * 100}%` }} title="Partie C" />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="A · salaires" value={eur(ajCalculee.A)} hint={`SR ${eur(aff.sr, 0)}`} />
                <Stat label="B · heures" value={eur(ajCalculee.B)} hint={`${nb(aff.nht, 0)} h`} />
                <Stat label="C · part fixe" value={eur(ajCalculee.C)} hint={data.annexe === 'A8' ? '31,96 € × 0,40' : '31,96 € × 0,70'} />
                <Stat label="AJ calculée" value={eur(ajCalculee.aj)} hint={`plancher ${eur(ajCalculee.plancher, 0)} · plafond ${eur(ajCalculee.plafond)}`} />
              </dl>
              {sim.ajBrute > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <Stat
                    label="AJ nette (avant impôt)"
                    value={eur(sim.retenues.net)}
                    hint={`retraite compl. ${eur(sim.retenues.retraiteComplementaire)}${sim.retenues.csgCrds > 0 ? ` · CSG/CRDS ${eur(sim.retenues.csgCrds)}` : ''}`}
                  />
                  <Stat label={`Après impôt (${nb(parseFloat(data.tauxPrelevement) || 0, 2)} %)`} value={eur(sim.retenues.net * (1 - tauxPAS))} />
                  <Stat label="Mois sans activité (30 j)" value={eur(sim.retenues.net * 30 * (1 - tauxPAS), 0)} hint="hors franchises" />
                </div>
              )}
            </>
          ) : (
            <Notice tone="error" icon={<AlertCircle className="h-4 w-4" />} title="Seuil non atteint">
              Il vous manque {nb(aff.heuresManquantes, 1)} h pour atteindre {SEUIL_HEURES} h dans la période de référence.
              {sim.projection.moisEstimes
                ? ` Au rythme des 3 derniers mois (${nb(sim.projection.moyenneHeuresParMois, 0)} h/mois), environ ${sim.projection.moisEstimes} mois.`
                : ''}
            </Notice>
          )}
        </Card>

        <Card title="Période de référence" icon={<Clock className="h-4 w-4" />} className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-4">
            <Stat label="Heures retenues (NHT)" value={`${nb(aff.nht, 1)} h`} hint={`${aff.contrats.length} contrat(s)`} />
            <Stat label="Jours de travail" value={nb(aff.joursTravail, 1)} hint={`NHT / ${data.annexe === 'A8' ? 8 : 10}`} />
            <Stat label="Salaire journalier moyen" value={eur(sim.sjm)} />
            <Stat
              label="Enseignement"
              value={`${nb(aff.heuresEnseignementRetenues, 1)} h`}
              hint={aff.heuresEnseignement > 0 ? 'comptent pour les 507 h, pas pour l’AJ' : 'aucune'}
            />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {data.delaiAttente && <Badge tone="amber">Délai d'attente 7 j</Badge>}
            <Badge tone="amber">Franchise CP {sim.franchiseCP.total} j</Badge>
            <Badge tone={sim.franchiseSal.total > 0 ? 'amber' : 'neutral'}>Franchise salaires {sim.franchiseSal.total} j</Badge>
            {aff.moisPlafonnes.length > 0 && <Badge tone="red">Plafond mensuel d'heures atteint</Badge>}
          </div>
        </Card>
      </div>

      {aff.eligible && <PaliersPanel />}
    </div>
  );
};

export default SynthesePage;
