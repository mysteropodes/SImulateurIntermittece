import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { BarChart3, PieChart, Calendar, TrendingUp, AlertCircle, Check, Clock } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';
import { Card, Notice, eur, nb } from '../components/ui';
import { SEUIL_HEURES, agregerParMois, parseDate, formatDateFR, toISODate, calculAJ } from '../lib/calculs';

const TableauDeBordPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff, projection } = sim;

  // Répartition mensuelle (tous contrats)
  const parMois = [...agregerParMois(data.contrats).values()].sort((a, b) => a.cle.localeCompare(b.cle));
  const totalBrutTous = parMois.reduce((a, m) => a + m.brut, 0);
  const revenus = data.contrats.reduce(
    (acc, c) => {
      acc[c.type] += c.brut;
      return acc;
    },
    { Cachet: 0, Heures: 0 }
  );
  const totalRev = revenus.Cachet + revenus.Heures;

  // Frise : début du droit → date anniversaire
  const debut = parseDate(sim.dateIndem).getTime();
  const fin = parseDate(sim.dateAnniversaire).getTime();
  const duree = Math.max(1, fin - debut);
  const pos = (iso: string) => Math.min(100, Math.max(0, ((parseDate(iso).getTime() - debut) / duree) * 100));
  const aujourdhui = toISODate(new Date());
  const dernierContrat = data.contrats.reduce((max, c) => ((c.dateFin ?? c.date) > max ? c.dateFin ?? c.date : max), '');
  const moisMarqueurs: Date[] = [];
  {
    const d = parseDate(sim.dateIndem);
    let cur = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const stop = parseDate(sim.dateAnniversaire);
    while (cur < stop) {
      moisMarqueurs.push(cur);
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
  }

  // Réexamen : AJ recalculée sur la PRA actuelle vs AJ en cours (notifiée)
  const ajActuelle = sim.sourceAJ === 'notifiee' ? sim.ajBrute : null;
  const ajRecalc = aff.eligible ? calculAJ(data.annexe, aff.sr, aff.nht).aj : null;
  const pct = Math.min(100, (aff.nht / SEUIL_HEURES) * 100);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de vos statistiques et projections.</p>
      </div>

      <ImportExportBar />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Heures dans la PRA</p>
              <h3 className="text-2xl font-bold">{nb(aff.nht, 0)}</h3>
              <p className="text-xs text-gray-500">sur {SEUIL_HEURES} h requises</p>
            </div>
            <div className={`rounded-full p-2 ${aff.eligible ? 'bg-green-100' : 'bg-orange-100'}`}>
              <BarChart3 className={`w-6 h-6 ${aff.eligible ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${aff.eligible ? 'bg-green-600' : 'bg-orange-600'}`} style={{ width: `${pct}%` }}></div>
            </div>
            <p className="text-xs text-right mt-1">{pct.toFixed(1)} %</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Jours de travail</p>
              <h3 className="text-2xl font-bold">{nb(aff.joursTravail, 1)}</h3>
              <p className="text-xs text-gray-500">dans la PRA (NHT / {data.annexe === 'A8' ? 8 : 10})</p>
            </div>
            <div className="rounded-full p-2 bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm">
              SJM : <span className="font-bold">{eur(sim.sjm)}</span>
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Allocation journalière</p>
              <h3 className="text-2xl font-bold">{sim.ajBrute > 0 ? eur(sim.ajBrute) : 'Non éligible'}</h3>
              <p className="text-xs text-gray-500">{sim.ajBrute > 0 ? `${eur(sim.retenues.net)} net/jour` : `Seuil ${SEUIL_HEURES} h non atteint`}</p>
            </div>
            <div className={`rounded-full p-2 ${sim.ajBrute > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-6 h-6 ${sim.ajBrute > 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm">
              Fin du droit : <span className="font-bold">{sim.ajBrute > 0 ? formatDateFR(sim.dateFinDroit) : '-'}</span>
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Salaire de référence</p>
              <h3 className="text-2xl font-bold">{eur(aff.sr)}</h3>
              <p className="text-xs text-gray-500">bruts dans la PRA</p>
            </div>
            <div className="rounded-full p-2 bg-purple-100">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-sm">
              Net estimé : <span className="font-bold">{eur(aff.sr * sim.ratioNetSalaire)}</span>
            </p>
          </div>
        </Card>
      </div>

      <Card
        title={
          <>
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Frise du droit
          </>
        }
        className="mb-6"
      >
        <p className="text-sm text-gray-600 mb-6">
          Du début du droit ({formatDateFR(sim.dateIndem)}) à la date anniversaire ({formatDateFR(sim.dateAnniversaire)}) —{' '}
          {Math.round(duree / 86400000)} jours. Période de référence des 507 h : {formatDateFR(aff.periode.debut)} → {formatDateFR(aff.periode.fin)}.
        </p>
        <div className="relative h-28 mx-6">
          <div className="absolute top-10 left-0 right-0 h-3 bg-gray-200 rounded-full"></div>
          {aujourdhui > sim.dateIndem && (
            <div className="absolute top-10 left-0 h-3 bg-blue-400 rounded-l-full" style={{ width: `${pos(aujourdhui)}%` }} title="Écoulé"></div>
          )}
          {moisMarqueurs.map((d, i) => {
            const p = ((d.getTime() - debut) / duree) * 100;
            return (
              <div key={i} className="absolute -translate-x-1/2" style={{ left: `${p}%`, top: '34px' }}>
                <div className="w-px h-6 bg-gray-400 mx-auto"></div>
                <div className={`text-[10px] text-gray-500 text-center ${i % 2 ? 'mt-3' : 'mt-0'}`}>
                  {new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)}
                </div>
              </div>
            );
          })}
          <Marker left={0} color="bg-green-500" label={`Début ${formatDateFR(sim.dateIndem)}`} top />
          <Marker left={100} color="bg-gray-700" label={`Anniversaire ${formatDateFR(sim.dateAnniversaire)}`} top />
          {aujourdhui >= sim.dateIndem && aujourdhui <= sim.dateAnniversaire && <Marker left={pos(aujourdhui)} color="bg-blue-600" label={`Aujourd'hui`} />}
          {dernierContrat && dernierContrat >= sim.dateIndem && dernierContrat <= sim.dateAnniversaire && (
            <Marker left={pos(dernierContrat)} color="bg-red-500" label={`Dernier contrat ${formatDateFR(dernierContrat)}`} top />
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card
          title={
            <>
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Projection
            </>
          }
        >
          {!aff.eligible ? (
            <>
              <p className="text-sm mb-2">
                Il manque <b>{nb(projection.heuresManquantes, 1)} h</b> dans la période de référence.
              </p>
              {projection.moisEstimes != null && projection.dateEstimee ? (
                <p className="text-sm">
                  Au rythme des 3 derniers mois travaillés ({nb(projection.moyenneHeuresParMois, 0)} h/mois), le seuil serait atteint dans environ{' '}
                  <b>{projection.moisEstimes} mois</b> ({formatDateFR(projection.dateEstimee)}) — si ces mois restent dans les 12 mois glissants.
                </p>
              ) : (
                <p className="text-sm text-gray-500">Saisissez des contrats récents pour estimer une date.</p>
              )}
              <Notice tone="warn" icon={<AlertCircle className="w-5 h-5 text-amber-600" />} className="mt-3">
                Pour atteindre {SEUIL_HEURES} h en 4 mois : au moins {Math.ceil(projection.heuresManquantes / 4)} h par mois (
                {Math.ceil(projection.heuresManquantes / 4 / 12)} cachets).
              </Notice>
            </>
          ) : (
            <>
              <Notice tone="success" icon={<Check className="w-5 h-5 text-green-600" />}>
                Seuil de {SEUIL_HEURES} h atteint : {nb(aff.nht, 0)} h sur la période du {formatDateFR(aff.periode.debut)} au {formatDateFR(aff.periode.fin)}.
              </Notice>
              {ajActuelle != null && ajRecalc != null && (
                <p className="text-sm mt-3">
                  <b>Réexamen :</b> l'AJ recalculée sur vos contrats actuels serait de {eur(ajRecalc)} contre {eur(ajActuelle)} notifiée (
                  {ajRecalc - ajActuelle >= 0 ? '+' : ''}
                  {eur(ajRecalc - ajActuelle)}).{' '}
                  {ajRecalc - ajActuelle > 2
                    ? 'Une réadmission anticipée serait avantageuse.'
                    : ajRecalc - ajActuelle < -2
                    ? 'Une réadmission anticipée serait défavorable.'
                    : 'Pas de différence significative.'}
                </p>
              )}
            </>
          )}
        </Card>

        <Card
          title={
            <>
              <PieChart className="w-5 h-5 mr-2 text-purple-600" />
              Répartition des revenus (tous contrats)
            </>
          }
        >
          {parMois.length === 0 && <p className="text-sm text-gray-500">Aucun contrat.</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {parMois.map((m) => (
              <div key={m.cle} className="text-sm">
                <div className="flex justify-between">
                  <span>
                    {m.cle.slice(5)}/{m.cle.slice(0, 4)} — {nb(m.heures, 0)} h
                  </span>
                  <span className="font-semibold">{eur(m.brut)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full bg-purple-500" style={{ width: `${totalBrutTous > 0 ? (m.brut / totalBrutTous) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          {totalRev > 0 && (
            <div className="mt-4 pt-3 border-t">
              <div className="text-sm text-gray-600 mb-1">Cachets vs heures</div>
              <div className="flex w-full h-4 rounded-full overflow-hidden text-white text-xs">
                {revenus.Cachet > 0 && (
                  <div className="bg-blue-500 flex items-center justify-center" style={{ width: `${(revenus.Cachet / totalRev) * 100}%` }}>
                    {((revenus.Cachet / totalRev) * 100).toFixed(0)} %
                  </div>
                )}
                {revenus.Heures > 0 && (
                  <div className="bg-green-500 flex items-center justify-center" style={{ width: `${(revenus.Heures / totalRev) * 100}%` }}>
                    {((revenus.Heures / totalRev) * 100).toFixed(0)} %
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Marker: React.FC<{ left: number; color: string; label: string; top?: boolean }> = ({ left, color, label, top }) => (
  <div className="absolute -translate-x-1/2 z-10" style={{ left: `${left}%`, top: '34px' }}>
    <div className={`w-5 h-5 ${color} rounded-full border-2 border-white shadow mx-auto`}></div>
    <div className={`absolute left-1/2 -translate-x-1/2 text-[11px] whitespace-nowrap bg-white/95 px-1.5 py-0.5 rounded shadow-sm ${top ? '-top-9' : 'top-7'}`}>{label}</div>
  </div>
);

export default TableauDeBordPage;
