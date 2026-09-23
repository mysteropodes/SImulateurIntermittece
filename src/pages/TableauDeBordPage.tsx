import React from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { PieChart, TrendingUp, AlertCircle, Check, Clock, Scale } from 'lucide-react';
import { Card, Kpi, Notice, Progress, PageHeader, eur, nb } from '../components/ui';
import { SEUIL_HEURES, agregerParMois, parseDate, formatDateFR, toISODate, finContrat, type TypeContrat } from '../lib/calculs';

const TableauDeBordPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const { affiliation: aff, projection } = sim;

  const parMois = [...agregerParMois(data.contrats).values()].sort((a, b) => a.cle.localeCompare(b.cle));
  const maxBrut = Math.max(1, ...parMois.map((m) => m.brut));
  const revenus: Record<TypeContrat, number> = { Cachet: 0, Heures: 0, Enseignement: 0 };
  data.contrats.forEach((c) => (revenus[c.type] += c.brut));
  const totalRev = revenus.Cachet + revenus.Heures + revenus.Enseignement;

  // Frise : début du droit → date anniversaire
  const debut = parseDate(sim.dateIndem).getTime();
  const fin = parseDate(sim.dateAnniversaire).getTime();
  const duree = Math.max(1, fin - debut);
  const pos = (iso: string) => Math.min(100, Math.max(0, ((parseDate(iso).getTime() - debut) / duree) * 100));
  const aujourdhui = toISODate(new Date());
  const dernierContrat = data.contrats.reduce((max, c) => (finContrat(c) > max ? finContrat(c) : max), '');
  const marqueurs: Date[] = [];
  const d0 = parseDate(sim.dateIndem);
  for (let cur = new Date(d0.getFullYear(), d0.getMonth() + 1, 1); cur < parseDate(sim.dateAnniversaire); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)) {
    marqueurs.push(cur);
  }

  const ajActuelle = sim.sourceAJ === 'notifiee' ? sim.ajBrute : null;
  const ajRecalc = aff.eligible ? sim.ajCalculee.aj : null;
  const ecart = ajActuelle != null && ajRecalc != null ? ajRecalc - ajActuelle : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Tableau de bord" description="Où vous en êtes sur votre droit, et ce que donnerait un réexamen." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Heures sur 12 mois"
          value={`${nb(aff.heuresAffiliation, 0)} h`}
          sub={`sur ${SEUIL_HEURES} h requises`}
          tone={aff.eligible ? 'green' : 'amber'}
          footer={<Progress value={aff.heuresAffiliation} max={SEUIL_HEURES} tone={aff.eligible ? 'green' : 'amber'} />}
        />
        <Kpi label="Jours de travail" value={nb(aff.joursTravail, 1)} sub={`NHT / ${data.annexe === 'A8' ? 8 : 10}`} footer={<>SJM : {eur(sim.sjm)}</>} />
        <Kpi
          label="Allocation journalière"
          value={sim.ajBrute > 0 ? eur(sim.ajBrute) : 'Non éligible'}
          sub={sim.ajBrute > 0 ? `${eur(sim.retenues.net)} net / jour` : undefined}
          tone={sim.ajBrute > 0 ? 'brand' : 'red'}
          footer={<>Fin du droit : {formatDateFR(sim.dateFinDroit)}</>}
        />
        <Kpi label="Salaire de référence" value={eur(aff.sr, 0)} sub="bruts dans la période" footer={<>≈ {eur(aff.sr * sim.ratioNetSalaire, 0)} net</>} />
      </div>

      <Card title="Frise du droit" icon={<Clock className="h-4 w-4" />}>
        <p className="mb-8 text-xs text-slate-500">
          {Math.round(duree / 86400000)} jours de droit · période de référence des 507 h : {formatDateFR(aff.periode.debut)} → {formatDateFR(aff.periode.fin)}
        </p>
        <div className="relative mx-4 h-20">
          <div className="absolute left-0 right-0 top-6 h-2 rounded-full bg-slate-100" />
          {aujourdhui > sim.dateIndem && <div className="absolute left-0 top-6 h-2 rounded-full bg-brand-300" style={{ width: `${pos(aujourdhui)}%` }} />}
          {marqueurs.map((d, i) => (
            <div key={i} className="absolute -translate-x-1/2 text-center" style={{ left: `${((d.getTime() - debut) / duree) * 100}%`, top: 20 }}>
              <div className="mx-auto h-4 w-px bg-slate-300" />
              <div className="mt-1 text-[10px] text-slate-400">{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)}</div>
            </div>
          ))}
          <Marker left={0} color="bg-emerald-500" label={`Début ${formatDateFR(sim.dateIndem)}`} align="start" />
          <Marker left={100} color="bg-slate-800" label={`Anniversaire ${formatDateFR(sim.dateAnniversaire)}`} align="end" />
          {aujourdhui >= sim.dateIndem && aujourdhui <= sim.dateAnniversaire && <Marker left={pos(aujourdhui)} color="bg-brand-600" label="Aujourd'hui" below />}
          {dernierContrat && dernierContrat >= sim.dateIndem && dernierContrat <= sim.dateAnniversaire && (
            <Marker left={pos(dernierContrat)} color="bg-rose-500" label={`Dernier contrat ${formatDateFR(dernierContrat)}`} />
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={aff.eligible ? 'Réexamen' : 'Projection'} icon={aff.eligible ? <Scale className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}>
          {!aff.eligible ? (
            <div className="space-y-3 text-sm">
              <p>
                Il manque <b>{nb(projection.heuresManquantes, 1)} h</b> dans la période de référence.
              </p>
              {projection.moisEstimes != null && projection.dateEstimee ? (
                <p className="text-slate-600">
                  Au rythme des 3 derniers mois ({nb(projection.moyenneHeuresParMois, 0)} h/mois) : environ <b>{projection.moisEstimes} mois</b> (
                  {formatDateFR(projection.dateEstimee)}).
                </p>
              ) : (
                <p className="text-slate-500">Saisissez des contrats récents pour estimer une date.</p>
              )}
              <Notice tone="warn" icon={<AlertCircle className="h-4 w-4" />}>
                En 4 mois : au moins {Math.ceil(projection.heuresManquantes / 4)} h par mois ({Math.ceil(projection.heuresManquantes / 4 / 12)} cachets).
              </Notice>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <Notice tone="success" icon={<Check className="h-4 w-4" />}>
                {nb(aff.heuresAffiliation, 0)} h sur la période du {formatDateFR(aff.periode.debut)} au {formatDateFR(aff.periode.fin)} : seuil atteint.
              </Notice>
              {ecart != null && ajActuelle != null && ajRecalc != null ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">AJ actuelle (notifiée)</div>
                      <div className="num text-lg font-semibold">{eur(ajActuelle)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">AJ si réexamen aujourd'hui</div>
                      <div className={`num text-lg font-semibold ${ecart >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {eur(ajRecalc)} <span className="text-sm">({ecart >= 0 ? '+' : ''}{eur(ecart)})</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600">
                    {ecart > 2
                      ? 'Une réadmission anticipée serait avantageuse.'
                      : ecart < -2
                        ? `Une réadmission anticipée serait défavorable (≈ ${eur(Math.abs(ecart) * 330, 0)} brut de moins sur un an). Voir les paliers dans la Synthèse pour savoir combien d'heures il faudrait d'ici la date anniversaire.`
                        : 'Pas de différence significative.'}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Saisissez l'AJ de votre notification (Mon droit) pour comparer avec un réexamen.</p>
              )}
            </div>
          )}
        </Card>

        <Card title="Répartition des revenus" icon={<PieChart className="h-4 w-4" />}>
          {parMois.length === 0 && <p className="text-sm text-slate-500">Aucun contrat.</p>}
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {parMois.map((m) => (
              <div key={m.cle} className="text-sm">
                <div className="num flex justify-between text-xs">
                  <span className="text-slate-600">
                    {m.cle.slice(5)}/{m.cle.slice(0, 4)} · {nb(m.heures, 0)} h
                  </span>
                  <span className="font-medium text-slate-800">{eur(m.brut, 0)}</span>
                </div>
                <Progress value={m.brut} max={maxBrut} className="mt-1" />
              </div>
            ))}
          </div>
          {totalRev > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="bg-brand-500" style={{ width: `${(revenus.Cachet / totalRev) * 100}%` }} />
                <div className="bg-sky-400" style={{ width: `${(revenus.Heures / totalRev) * 100}%` }} />
                <div className="bg-emerald-400" style={{ width: `${(revenus.Enseignement / totalRev) * 100}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                {(['Cachet', 'Heures', 'Enseignement'] as const).map((t, i) =>
                  revenus[t] > 0 ? (
                    <span key={t} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-sm ${['bg-brand-500', 'bg-sky-400', 'bg-emerald-400'][i]}`} />
                      {t === 'Cachet' ? 'Cachets' : t} · {((revenus[t] / totalRev) * 100).toFixed(0)} %
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Marker: React.FC<{ left: number; color: string; label: string; below?: boolean; align?: 'start' | 'end' }> = ({ left, color, label, below, align }) => (
  <div className="absolute z-10" style={{ left: `${left}%`, top: 17 }}>
    <div className={`-ml-2.5 h-5 w-5 rounded-full border-2 border-white shadow ${color}`} />
    <div
      className={`absolute whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 ${
        below ? 'top-7' : '-top-8'
      } ${align === 'start' ? 'left-0 -translate-x-2.5' : align === 'end' ? 'right-0 translate-x-2.5' : 'left-0 -translate-x-1/2'}`}
    >
      {label}
    </div>
  </div>
);

export default TableauDeBordPage;
