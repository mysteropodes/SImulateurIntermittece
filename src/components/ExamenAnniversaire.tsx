import React from 'react';
import { CalendarX2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Card, Aide, eur, nb } from './ui';
import { affiliation, calculAJ, dateAnniversaireDepuis, formatDateFR, estSpectacle, finContrat, addDays, parseDate, toISODate } from '../lib/calculs';

/**
 * Travailler le jour de la date anniversaire reporte l'examen au premier jour
 * chômé (guide p. 18, exemple 13). On compare les deux scénarios.
 */
const ExamenAnniversaire: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const ex = sim.examen;
  const opts = { plus50ans: data.plus50ans };

  // Scénario « sans travailler le jour J » : sans les contrats en cours ce jour-là
  const idsEnCours = new Set(ex.contratsEnCours.map((c) => c.id));
  const sans = data.contrats.filter((c) => !idsEnCours.has(c.id));
  const finSans = sans.filter(estSpectacle).map(finContrat).filter((f) => f <= sim.dateAnniversaire).sort().slice(-1)[0];
  const affSans = finSans ? affiliation(sans, data.annexe, finSans, opts) : null;
  const affAvec = sim.affiliation;
  const aj = (a: typeof affAvec | null) => (a && a.eligible ? calculAJ(data.annexe, a.sr, a.nht).aj : null);

  if (!ex.reporte) {
    if (compact)
      return (
        <div className="flex flex-col gap-3 rounded-4xl bg-lime-200 p-4 text-sm text-brand-900 sm:flex-row sm:items-center sm:p-5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-900/10">
            <CalendarX2 className="h-4 w-4" />
          </span>
          <p className="flex-1 leading-relaxed">
            <b>Date anniversaire le {formatDateFR(sim.dateAnniversaire)}.</b> Si un contrat spectacle est en cours ce jour-là, l'examen est reporté au premier jour
            sans contrat et votre date anniversaire suivante recule. Avant d'accepter ou de dater un contrat autour de cette date, regardez le calcul.{' '}
            <Aide terme="reportExamen" />
          </p>
          <Link to="/echeances" className="btn-primary flex-shrink-0 py-2">
            Voir le calcul <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      );
    return (
      <Card title="Le jour de la date anniversaire" aide="reportExamen" icon={<CalendarX2 className="h-4 w-4" />}>
        <p className="text-sm leading-relaxed text-slate-600">
          Votre date anniversaire est le <b className="text-slate-900">{formatDateFR(sim.dateAnniversaire)}</b>. Si un contrat spectacle est en cours ce jour-là,
          l'examen est <b>reporté au premier jour sans contrat</b> et votre prochaine date anniversaire recule d'autant. Aucun contrat saisi ne tombe ce jour-là :
          examen prévu le <b className="text-slate-900">{formatDateFR(sim.dateReexamen)}</b>.
        </p>
        <p className="mt-2 text-xs text-slate-500">Un contrat hors spectacle ou une activité non salariée ce jour-là ne reporte rien.</p>
      </Card>
    );
  }

  const lignes: [string, React.ReactNode, React.ReactNode][] = [
    ['Examen le', formatDateFR(toISODate(addDays(parseDate(sim.dateAnniversaire), 1))), formatDateFR(ex.dateExamen)],
    ['Fin de la période de référence', finSans ? formatDateFR(finSans) : '—', formatDateFR(affAvec.periode.fin)],
    ['Heures pour les 507 h', affSans ? `${nb(affSans.heuresAffiliation)} h` : '—', `${nb(affAvec.heuresAffiliation)} h`],
    ['AJ recalculée', aj(affSans) != null ? eur(aj(affSans)!) : 'non éligible', aj(affAvec) != null ? eur(aj(affAvec)!) : 'non éligible'],
    ['Date anniversaire suivante', finSans ? formatDateFR(dateAnniversaireDepuis(finSans)) : '—', formatDateFR(dateAnniversaireDepuis(affAvec.periode.fin))],
  ];
  const ecart = aj(affAvec) != null && aj(affSans) != null ? aj(affAvec)! - aj(affSans)! : null;

  return (
    <section className="rounded-4xl bg-amber-50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <CalendarX2 className="h-4 w-4" />
        </span>
        <h2 className="text-base font-semibold text-amber-950">Vous travaillez le jour de votre date anniversaire</h2>
        <Aide terme="reportExamen" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-amber-900">
        {ex.contratsEnCours.map((c) => c.employeur || 'Contrat').join(', ')} en cours le {formatDateFR(sim.dateAnniversaire)} : l'examen est reporté au{' '}
        <b>{formatDateFR(ex.dateExamen)}</b>, premier jour sans contrat spectacle.
        {ecart != null && (
          <>
            {' '}
            Avec ce report, votre AJ serait {ecart >= 0 ? 'plus élevée' : 'plus basse'} de <b>{eur(Math.abs(ecart))}</b> par jour
            {ecart < 0 ? ' : finir ce contrat la veille de la date anniversaire serait plus avantageux.' : '.'}
          </>
        )}
      </p>
      {!compact && (
        <div className="mt-4 overflow-x-auto rounded-3xl bg-white">
          <table className="num w-full min-w-[480px] text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium"></th>
                <th className="px-4 py-2 text-right font-medium">Contrat terminé la veille</th>
                <th className="px-4 py-2 text-right font-medium">Avec le report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.map(([l, a, b]) => (
                <tr key={l}>
                  <td className="px-4 py-2 text-slate-600">{l}</td>
                  <td className="px-4 py-2 text-right">{a}</td>
                  <td className="px-4 py-2 text-right font-semibold">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-amber-800">
        « Contrat terminé la veille » : sans les heures du contrat en cours ce jour-là. En pratique, c'est la date de fin sur le contrat (et l'attestation employeur)
        qui compte.
      </p>
    </section>
  );
};

export default ExamenAnniversaire;
