import React from 'react';
import { Link } from 'react-router-dom';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { AlertCircle, ArrowRight, Calendar, Euro, Wallet } from 'lucide-react';
import { Card, Kpi, Stat, Notice, Ring, Aide, PageHeader, eur, nb } from '../components/ui';
import PaliersPanel from '../components/PaliersPanel';
import ExamenAnniversaire from '../components/ExamenAnniversaire';
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
        accent="de votre intermittence"
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
          variant="dark"
          className="sm:col-span-2"
          label="Allocation journalière"
          aide="aj"
          value={sim.ajBrute > 0 ? eur(sim.ajBrute) : 'Non éligible'}
          sub={sim.ajBrute > 0 ? `${eur(sim.retenues.net * (1 - tauxPAS))} versés par jour indemnisé` : `Seuil de ${SEUIL_HEURES} h non atteint`}
          icon={<Euro className="h-4 w-4" />}
          footer={sim.sourceAJ === 'notifiee' ? <>AJ de votre notification · recalculée sur vos contrats actuels : {eur(ajCalculee.aj)}</> : 'AJ calculée sur vos contrats'}
        />
        <Kpi
          variant="lime"
          label={moisCourant ? `ARE de ${moisCourant.label}` : 'ARE du mois'}
          value={moisCourant ? eur(moisCourant.areVersee, 0) : '—'}
          sub={moisCourant ? `${moisCourant.joursIndemnises} jours payés · ${nb(moisCourant.heures, 0)} h travaillées` : 'Hors période de droit'}
          icon={<Wallet className="h-4 w-4" />}
          footer={
            moisCourant && moisCourant.joursHorsDroit < moisCourant.joursDansMois ? (
              <span className="flex items-center gap-1.5">
                Encore {nb(moisCourant.margeHeures, 1)} h avant de perdre un jour <Aide terme="marge" />
              </span>
            ) : undefined
          }
        />
        <div className="flex flex-col rounded-4xl bg-white p-5 sm:p-6">
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            Heures sur 12 mois <Aide terme="h507" />
          </p>
          <div className="mt-3 flex items-center gap-4">
            <Ring value={aff.heuresAffiliation} max={SEUIL_HEURES} size={92} stroke={9}>
              <span className="num text-lg font-semibold leading-none">{nb(aff.heuresAffiliation, 0)}</span>
              <span className="text-[10px] text-slate-400">/ {SEUIL_HEURES} h</span>
            </Ring>
            <p className={`text-sm font-semibold ${aff.eligible ? 'text-brand-700' : 'text-amber-600'}`}>
              {aff.eligible ? 'Seuil atteint' : `Il manque ${nb(aff.heuresManquantes, 0)} h`}
            </p>
          </div>
          <div className="mt-auto pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3">
              du {formatDateFR(aff.periode.debut)} au {formatDateFR(aff.periode.fin)} <Aide terme="pra" />
            </div>
          </div>
        </div>
      </div>

      <ExamenAnniversaire compact />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Date anniversaire" aide="dateAnniversaire" value={formatDateFR(sim.dateAnniversaire)} sub={`dans ${joursRestants} jours`} icon={<Calendar className="h-4 w-4" />} />
        <Kpi label="Salaire de référence" aide="sr" value={eur(aff.sr, 0)} sub="bruts dans la période" />
        <Kpi label="Heures pour l'AJ" aide="nht" value={`${nb(aff.nht, 0)} h`} sub={`${nb(aff.joursTravail, 1)} jours de travail`} />
        <Kpi label="Franchises" aide="franchiseCP" value={`${sim.franchiseCP.total + sim.franchiseSal.total + (data.delaiAttente ? 7 : 0)} j`} sub={`${data.delaiAttente ? 'délai 7 · ' : ''}CP ${sim.franchiseCP.total} · salaires ${sim.franchiseSal.total}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Calcul de l'AJ" aide="abc" icon={<Euro className="h-4 w-4" />} className="lg:col-span-5">
          {aff.eligible ? (
            <>
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-brand-500" style={{ width: `${(ajCalculee.A / total) * 100}%` }} title="Partie A" />
                <div className="bg-brand-300" style={{ width: `${(ajCalculee.B / total) * 100}%` }} title="Partie B" />
                <div className="bg-slate-300" style={{ width: `${(ajCalculee.C / total) * 100}%` }} title="Partie C" />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat aide="sr" label="A · salaires" value={eur(ajCalculee.A)} hint={`SR ${eur(aff.sr, 0)}`} />
                <Stat aide="nht" label="B · heures" value={eur(ajCalculee.B)} hint={`${nb(aff.nht, 0)} h`} />
                <Stat label="C · part fixe" value={eur(ajCalculee.C)} hint={data.annexe === 'A8' ? '31,96 € × 0,40' : '31,96 € × 0,70'} />
                <Stat label="AJ calculée" value={eur(ajCalculee.aj)} hint={`plancher ${eur(ajCalculee.plancher, 0)} · plafond ${eur(ajCalculee.plafond)}`} />
              </dl>
              {sim.ajBrute > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <Stat
                    aide="ajNette"
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

      </div>

      {aff.eligible && <PaliersPanel />}
    </div>
  );
};

export default SynthesePage;
