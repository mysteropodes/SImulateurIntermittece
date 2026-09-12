import React from 'react';
import { Link } from 'react-router-dom';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { AlertCircle, ArrowRight, Calendar, Clock, FileSpreadsheet } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';
import { Card, Stat, Notice, eur, nb } from '../components/ui';
import { SEUIL_HEURES, formatDateFR } from '../lib/calculs';

const SynthesePage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff, ajCalculee } = sim;
  const tauxPAS = (parseFloat(data.tauxPrelevement) || 0) / 100;
  const areMoisType = sim.retenues.net * 30 * (1 - tauxPAS);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Synthèse d'indemnisation</h1>
        <p className="text-gray-600">Vue d'ensemble de votre simulation ({data.annexe === 'A8' ? 'annexe 8' : 'annexe 10'}).</p>
      </div>

      <ImportExportBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Période de référence (507 h)">
          <div className="flex items-center mb-4 text-sm">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-semibold mr-2">PRA :</span>
            {formatDateFR(aff.periode.debut)} au {formatDateFR(aff.periode.fin)}
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            <Stat label="Heures retenues (NHT)" value={`${nb(aff.nht, 1)} h`} hint={`${aff.contrats.length} contrat(s) dans la PRA`} />
            <Stat
              label="Statut"
              value={<span className={aff.eligible ? 'text-green-600' : 'text-red-600'}>{aff.eligible ? 'Éligible ARE' : 'Non éligible'}</span>}
            />
            <Stat label="Jours de travail" value={nb(aff.joursTravail, 1)} hint={`NHT / ${data.annexe === 'A8' ? 8 : 10}`} />
            <Stat label="Salaire de référence (SR)" value={eur(aff.sr)} />
            <Stat label="Salaire journalier moyen (SJM)" value={eur(sim.sjm)} />
            <Stat label="Date anniversaire" value={formatDateFR(sim.dateAnniversaire)} hint="fin du droit (début + 12 mois)" />
          </div>

          {!aff.eligible && (
            <Notice tone="error" icon={<AlertCircle className="w-5 h-5 text-red-600" />} className="mt-4">
              <p className="font-semibold">Seuil non atteint</p>
              <p>
                Il vous manque {nb(aff.heuresManquantes, 1)} heures pour atteindre {SEUIL_HEURES} h dans la période de référence.
                {sim.projection.moisEstimes ? ` Au rythme des 3 derniers mois (${nb(sim.projection.moyenneHeuresParMois, 0)} h/mois), environ ${sim.projection.moisEstimes} mois.` : ''}
              </p>
            </Notice>
          )}
        </Card>

        <Card title="Allocation journalière">
          <div className="grid grid-cols-2 gap-y-4">
            <div className="col-span-2">
              <div className="text-sm text-gray-600">AJ brute {sim.sourceAJ === 'notifiee' ? '(notifiée)' : '(calculée)'}</div>
              <div className="text-2xl font-bold text-blue-600">{sim.ajBrute > 0 ? `${eur(sim.ajBrute)} / jour` : 'Non éligible'}</div>
            </div>
            {aff.eligible && (
              <>
                <Stat label="Partie A (salaires)" value={eur(ajCalculee.A)} />
                <Stat label="Partie B (heures)" value={eur(ajCalculee.B)} />
                <Stat label="Partie C (fixe)" value={eur(ajCalculee.C)} />
                <Stat label="Plancher / plafond" value={`${eur(ajCalculee.plancher)} / ${eur(ajCalculee.plafond)}`} />
              </>
            )}
            {sim.ajBrute > 0 && (
              <>
                <Stat
                  label="AJ nette (avant impôt)"
                  value={eur(sim.retenues.net)}
                  hint={`− ${eur(sim.retenues.retraiteComplementaire)} retraite compl.${sim.retenues.csgCrds > 0 ? ` − ${eur(sim.retenues.csgCrds)} CSG/CRDS` : ''}`}
                />
                <Stat label={`Après prélèvement (${data.tauxPrelevement || 0} %)`} value={eur(sim.retenues.net * (1 - tauxPAS))} />
                <Stat
                  className="col-span-2"
                  label="ARE d'un mois sans activité (30 j)"
                  value={eur(areMoisType)}
                  hint="net versé, hors franchises et délai d'attente"
                />
              </>
            )}
          </div>

          {sim.ajBrute > 0 && (
            <Notice icon={<Clock className="w-5 h-5 text-blue-600" />} className="mt-4">
              <p className="font-semibold">Franchises et délai</p>
              <p>
                {data.delaiAttente ? '7 jours de délai d\'attente, ' : ''}
                {sim.franchiseCP.total} j de franchise congés payés ({sim.franchiseCP.forfaitMensuel} j/mois), {sim.franchiseSal.total} j de franchise
                salaires{sim.franchiseSal.total > 0 ? ` (${sim.franchiseSal.mensuelle} j/mois)` : ''}. Indemnisation du {formatDateFR(sim.dateIndem)} au{' '}
                {formatDateFR(sim.dateFinDroit)}.
              </p>
            </Notice>
          )}

          <div className="mt-4 flex gap-3">
            <Link to="/suivi-mensuel" className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <ArrowRight className="w-4 h-4 mr-2" />
              Suivi mensuel
            </Link>
            <Link to="/export" className="flex items-center px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exporter Excel
            </Link>
          </div>
        </Card>
      </div>

      <Notice tone="warn" icon={<AlertCircle className="w-5 h-5 text-amber-600" />}>
        <p className="font-semibold mb-1">Important</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Règles issues du guide « Intermittents du spectacle » de France Travail (annexes 8 et 10, AJ minimale 31,96 €).</li>
          <li>Les montants sont indicatifs : seule la notification de France Travail fait foi. Saisissez son AJ dans l'onglet Mon AJ pour l'utiliser.</li>
          <li>Vos données restent dans votre navigateur (aucun envoi) ; exportez-les en JSON pour les conserver.</li>
        </ul>
      </Notice>
    </div>
  );
};

export default SynthesePage;
