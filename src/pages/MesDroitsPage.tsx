import React, { useState } from 'react';
import { LifeBuoy, Baby, Palmtree, HeartPulse, Landmark, Scale, Users, Building2, Gavel, Check, X, ExternalLink, AlertTriangle, CalendarClock } from 'lucide-react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Card, Kpi, Notice, Badge, PageHeader, Tabs, Field, Segmented, InputSuffix, Ring, Aide, eur, nb } from '../components/ui';
import {
  diagnosticAnniversaire,
  simulerRattrapage,
  afd,
  simulerConge,
  congesSpectacles,
  heuresAnneeCivile,
  CONGES,
  SEUIL_RATTRAPAGE,
  SAUVEGARDE_JOURS,
  AFD_JOUR,
  type TypeConge,
  type Issue,
} from '../lib/droits';
import { AJ_MIN, SEUIL_HEURES, formatDateFR, toISODate } from '../lib/calculs';
import { trimestresRetraite, JOURS_CHOMAGE_PAR_TRIMESTRE, HEURES_SMIC_PAR_TRIMESTRE } from '../lib/retraite';

type Onglet = 'perte' | 'maternite' | 'conges' | 'retraite' | 'audiens' | 'recours';

/** ok = true (rempli), false (non rempli) ou null (à vérifier auprès de France Travail). */
const Condition: React.FC<{ ok: boolean | null; children: React.ReactNode }> = ({ ok, children }) => (
  <li className="flex items-start gap-2">
    <span
      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        ok === true ? 'bg-lime-300 text-brand-900' : ok === false ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'
      }`}
      title={ok === null ? 'à vérifier' : undefined}
    >
      {ok === true ? <Check className="h-3 w-3" strokeWidth={3} /> : ok === false ? <X className="h-3 w-3" strokeWidth={3} /> : '?'}
    </span>
    <span className={ok === false ? 'text-slate-500' : 'text-slate-800'}>{children}</span>
  </li>
);

const Lien: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-600">
    {children}
    <ExternalLink className="h-3.5 w-3.5" />
  </a>
);

const TITRES: Record<Issue, { titre: string; texte: string }> = {
  readmission: { titre: 'Nouveau droit', texte: 'Vous avez vos 507 h : un nouveau droit s’ouvre à la date anniversaire.' },
  rattrapage: { titre: 'Clause de rattrapage', texte: 'Entre 338 et 506 h avec 5 ans d’ancienneté : 6 mois à votre AJ actuelle pour compléter vos heures.' },
  'rattrapage-sans-anciennete': {
    titre: 'Rattrapage impossible',
    texte: 'Vous avez les 338 h mais pas les 5 ans d’ancienneté : France Travail étudiera l’APS ou l’AFD.',
  },
  solidarite: { titre: 'Allocations de solidarité', texte: 'Moins de 338 h : pas de rattrapage. France Travail étudiera l’APS ou l’AFD, selon vos heures.' },
};

// ---------------------------------------------------------------------------

const PerteOnglet: React.FC = () => {
  const { data, setData } = useIntermittence();
  const sim = useSimulation();
  const profil = data.profil;
  const setProfil = (p: Partial<typeof profil>) => setData((d) => ({ ...d, profil: { ...d.profil, ...p } }));
  const heuresActuelles = Math.round(sim.affiliation.heuresAffiliation);
  const [heures, setHeures] = useState<number>(heuresActuelles);
  const diag = diagnosticAnniversaire(heures, profil);
  const aj = sim.ajBrute;
  const tauxPAS = (parseFloat(data.tauxPrelevement) || 0) / 100;
  const versement = (brut: number) => brut * sim.ratioNetAJ * (1 - tauxPAS);
  const rattrapage = simulerRattrapage(sim.dateReexamen, aj, sim.franchiseCPAuto.total, sim.franchiseSalAuto.total);
  const droitAFD = afd(profil);
  const t = TITRES[diag.issue];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-6 rounded-4xl bg-brand-700 p-6 text-white sm:flex-row sm:items-center lg:col-span-2">
          <Ring value={heures} max={SEUIL_HEURES} size={148} dark>
            <span className="num text-3xl font-medium text-lime-300">{nb(heures)}</span>
            <span className="text-xs text-brand-200">/ {SEUIL_HEURES} h</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm text-brand-100">
              À la date anniversaire du {formatDateFR(sim.dateAnniversaire)} <Aide terme="dateAnniversaire" dark />
            </p>
            <p className="mt-2 text-3xl font-medium tracking-tight text-lime-300">{t.titre}</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-100">{t.texte}</p>
            <div className="mt-5">
              <label className="flex items-center justify-between text-xs text-brand-200">
                <span>Et si j'avais… (vos contrats actuels : {nb(heuresActuelles)} h)</span>
                <span className="num font-semibold text-white">{nb(heures)} h</span>
              </label>
              <input
                type="range"
                min={0}
                max={Math.max(700, heuresActuelles)}
                step={1}
                value={heures}
                onChange={(e) => setHeures(+e.target.value)}
                className="mt-2 w-full accent-lime-300"
                aria-label="Heures à la date anniversaire"
              />
              <div className="relative mt-1 h-4 text-[10px] text-brand-200">
                <span className="absolute -translate-x-1/2" style={{ left: `${(SEUIL_RATTRAPAGE / Math.max(700, heuresActuelles)) * 100}%` }}>
                  338 h
                </span>
                <span className="absolute -translate-x-1/2" style={{ left: `${(SEUIL_HEURES / Math.max(700, heuresActuelles)) * 100}%` }}>
                  507 h
                </span>
              </div>
            </div>
          </div>
        </div>

        <Card title="Votre ancienneté" className="lg:col-span-1">
          <div className="space-y-4">
            <Field label="Années d'indemnisation continue" aide="afd">
              <InputSuffix suffix="ans">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={profil.ancienneteAns}
                  onChange={(e) => setProfil({ ancienneteAns: Math.max(0, +e.target.value || 0) })}
                  className="input"
                />
              </InputSuffix>
            </Field>
            <Field label="5 droits A8/A10 (ou 2 535 h) en 10 ans" aide="rattrapage">
              <Segmented value={profil.cinqAnsSur10} onChange={(v) => setProfil({ cinqAnsSur10: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
            </Field>
            <Field label="AFD déjà perçues">
              <input type="number" min={0} step={1} value={profil.afdDeja} onChange={(e) => setProfil({ afdDeja: Math.max(0, Math.floor(+e.target.value || 0)) })} className="input" />
            </Field>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Clause de rattrapage" aide="rattrapage" className={diag.issue === 'rattrapage' ? 'ring-4 ring-lime-300' : ''}>
          <ul className="space-y-2 text-sm">
            <Condition ok={heures >= SEUIL_RATTRAPAGE}>
              338 h dans les 12 mois {heures < SEUIL_RATTRAPAGE && <span className="text-slate-400">(il manque {nb(diag.manquantPourRattrapage)} h)</span>}
            </Condition>
            <Condition ok={heures < SEUIL_HEURES}>moins de 507 h (sinon, nouveau droit)</Condition>
            <Condition ok={profil.cinqAnsSur10}>5 ans d'ancienneté en annexe 8 / 10</Condition>
          </ul>
          <div className="mt-5 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">6 mois à votre AJ de {eur(aj)}, sans activité</p>
            <p className="num mt-1 text-3xl font-medium tracking-tight text-slate-900">{eur(versement(rattrapage.totalBrut), 0)}</p>
            <p className="text-xs text-slate-500">
              versés nets · {rattrapage.joursIndemnises} jours · jusqu'au {formatDateFR(rattrapage.fin)}
            </p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Pour revenir à un droit normal : {nb(Math.max(0, SEUIL_HEURES - heures))} h à faire pendant ces 6 mois, soit ≈ {nb(Math.ceil(Math.max(0, SEUIL_HEURES - heures) / 6))} h
            par mois. <b className="text-slate-700">À demander dans les 30 jours</b> après le refus, sinon vous perdez aussi l'APS et l'AFD.
          </p>
        </Card>

        <Card title="APS" aide="aps">
          <ul className="space-y-2 text-sm">
            <Condition ok={heures < SEUIL_HEURES}>pas de réadmission ARE possible (moins de 507 h)</Condition>
            <Condition ok={null}>507 h en comptant plus large : cours jusqu'à 120 h, maladie de 3 mois et plus à 5 h/jour</Condition>
          </ul>
          <div className="mt-5 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Même montant que l'ARE, pendant 12 mois</p>
            <p className="num mt-1 text-3xl font-medium tracking-tight text-slate-900">{sim.ajCalculee.aj > 0 ? eur(sim.ajCalculee.aj) : '—'}</p>
            <p className="text-xs text-slate-500">par jour, sans délai d'attente ni retenue retraite</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Cas rare : surtout quand les 507 h ne sont atteintes qu'avec des heures que l'ARE ne compte pas (cours au-delà de 70 h, arrêt maladie long) ou après un
            rattrapage (507 h cherchées sur 18 mois).
          </p>
        </Card>

        <Card title="AFD" aide="afd" className={diag.issue !== 'readmission' && diag.issue !== 'rattrapage' ? 'ring-4 ring-lime-300' : ''}>
          <ul className="space-y-2 text-sm">
            <Condition ok={diag.issue !== 'readmission' && diag.issue !== 'rattrapage'}>ni ARE, ni rattrapage, ni APS</Condition>
            <Condition ok={droitAFD.possible}>
              {profil.afdDeja} AFD déjà perçue(s) sur {droitAFD.maxOuvertures} possible(s)
            </Condition>
            <Condition ok={null}>507 h dans les 12 mois avant votre dernier contrat (les heures de l'ancien droit peuvent resservir)</Condition>
          </ul>
          <div className="mt-5 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              {AFD_JOUR} € nets × {droitAFD.jours} jours
            </p>
            <p className="num mt-1 text-3xl font-medium tracking-tight text-slate-900">{eur(droitAFD.total, 0)}</p>
            <p className="text-xs text-slate-500">au total, les mois sans activité</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Les mois où vous travaillez : jours payés = jours du mois − salaire brut ÷ 50. Durée : 61 j (&lt; 5 ans), 92 j (5 ans), 182 j (10 ans et plus).
          </p>
        </Card>

        <Card title="Clause de sauvegarde" aide="sauvegarde">
          <p className="text-sm text-slate-600">Si vous avez alterné spectacle et autres métiers sans remplir aucune règle.</p>
          <div className="mt-4 rounded-3xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              {SAUVEGARDE_JOURS} jours × {eur(AJ_MIN)}
            </p>
            <p className="num mt-1 text-3xl font-medium tracking-tight text-slate-900">{eur(SAUVEGARDE_JOURS * AJ_MIN, 0)}</p>
          </div>
          <p className="mt-3 text-xs text-slate-500">130 jours ou 910 h tous régimes sur 28 mois (36 mois à partir de 53 ans).</p>
        </Card>

        <Card title="Régime général">
          <p className="text-sm leading-relaxed text-slate-600">
            Si vous avez aussi travaillé hors spectacle : 6 mois de travail (130 jours ou 910 h) sur 24 mois ouvrent une ARE « classique ». Vos heures spectacle
            sont alors comptées avec. France Travail choisit le droit A8/A10 si vous remplissez les deux.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Simulateur officiel : <Lien href="https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocations/allocations-et-aides-quelles-sont/simulateur-des-allocations-chomage.html">France Travail</Lien>
          </p>
        </Card>

        <Card title="Autres filets de sécurité">
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li>
              <b className="text-slate-800">RSA et prime d'activité</b> selon vos revenus et votre foyer —{' '}
              <Lien href="https://www.mesdroitssociaux.gouv.fr/">mesdroitssociaux.gouv.fr</Lien>
            </li>
            <li>
              <b className="text-slate-800">Audiens</b> : entretien professionnel et aides en cas de difficulté —{' '}
              <Lien href="https://www.artistesettechniciensduspectacle.fr/">artistesettechniciensduspectacle.fr</Lien>
            </li>
            <li>
              <b className="text-slate-800">Afdas</b> : formation pour rebondir, les heures de formation comptent jusqu'à 338 h.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const MaterniteOnglet: React.FC = () => {
  const { data, setData } = useIntermittence();
  const sim = useSimulation();
  const profil = data.profil;
  const type = (profil.congeType in CONGES ? profil.congeType : 'maternite-1-2') as TypeConge;
  const debut = profil.congeDebut || toISODate(new Date());
  const [indemnise, setIndemnise] = useState(sim.ajBrute > 0);
  const s = simulerConge(data.contrats, data.annexe, debut, type, sim.affiliation, indemnise);
  const tauxPAS = (parseFloat(data.tauxPrelevement) || 0) / 100;
  const areEquivalente = sim.retenues.net * s.jours;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Votre congé" icon={<Baby className="h-4 w-4" />}>
          <div className="space-y-4">
            <Field label="Type de congé">
              <select value={type} onChange={(e) => setData((d) => ({ ...d, profil: { ...d.profil, congeType: e.target.value } }))} className="input">
                {Object.entries(CONGES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Début du congé">
              <input type="date" value={debut} onChange={(e) => setData((d) => ({ ...d, profil: { ...d.profil, congeDebut: e.target.value } }))} className="input" />
            </Field>
            <Field label="Indemnisé(e) par France Travail à ce moment-là">
              <Segmented value={indemnise} onChange={setIndemnise} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
            </Field>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <Kpi variant="dark" label="Indemnité journalière" aide="ij" value={s.eligible ? eur(s.ij) : '—'} sub={`plafond ${eur(s.ijPlafond)} / jour`} />
          <Kpi
            variant="lime"
            label={`Sur ${s.jours} jours`}
            value={s.eligible ? eur(s.total, 0) : 'Non éligible'}
            sub={`du ${formatDateFR(debut)} au ${formatDateFR(s.fin)}`}
          />
          <Kpi
            label="Salaires des 12 mois civils avant"
            value={eur(s.salaires12Mois, 0)}
            sub="base de calcul des IJ (Sécurité sociale)"
            className="sm:col-span-2"
            footer={
              sim.ajBrute > 0 ? (
                <>
                  L'ARE s'arrête pendant le congé. À titre de comparaison, {s.jours} jours d'ARE nette feraient {eur(areEquivalente, 0)} (
                  {s.total - areEquivalente >= 0 ? '+' : '−'}
                  {eur(Math.abs(s.total - areEquivalente), 0)} pour les IJ, avant impôt de {nb(tauxPAS * 100, 1)} %).
                </>
              ) : undefined
            }
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Conditions d'ouverture" aide="ij">
          <p className="mb-3 text-xs text-slate-500">Une seule suffit.</p>
          <ul className="space-y-2 text-sm">
            {s.conditions.map((c) => (
              <Condition key={c.label} ok={c.ok}>
                {c.label} <span className="num text-slate-400">— {c.detail}</span>
              </Condition>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Démarches et détails : <Lien href="https://www.ameli.fr/assure/remboursements/indemnites-journalieres-maladie-maternite-paternite/indemnites-journalieres-et-prestations-maternite-paternite-adoption/conge-maternite-salariee">ameli.fr</Lien>
          </p>
        </Card>

        {CONGES[type].maternite ? (
          <Card title="Effet sur votre prochain droit" aide="maternite">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-500">Heures assimilées pour les 507 h</dt>
                <dd className="num mt-1 text-2xl font-medium">+{nb(s.heuresAssimilees)} h</dd>
                <dd className="text-xs text-slate-400">5 h par jour hors contrat</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Salaire de référence recalculé</dt>
                <dd className="num mt-1 text-2xl font-medium">{s.srAmenage != null ? eur(s.srAmenage, 0) : '—'}</dd>
                <dd className="text-xs text-slate-400">au lieu de {eur(sim.affiliation.sr, 0)}</dd>
              </div>
              <div className="col-span-2 rounded-3xl bg-lime-200 p-4 text-brand-900">
                <dt className="text-xs">AJ au prochain réexamen, si le congé tombe dans la période de référence</dt>
                <dd className="num mt-1 text-3xl font-medium">
                  {s.ajAvec != null ? eur(s.ajAvec) : '—'}{' '}
                  <span className="text-sm font-semibold">au lieu de {s.ajSans != null ? eur(s.ajSans) : '—'}</span>
                </dd>
              </div>
            </dl>
          </Card>
        ) : (
          <Card title="Congé paternité / 2e parent">
            <p className="text-sm leading-relaxed text-slate-600">
              25 jours (32 pour des naissances multiples), en plus des 3 jours de naissance payés par l'employeur. Les IJ se calculent comme pour la maternité.
              Contrairement au congé maternité, il ne compte pas comme heures assimilées pour les 507 h.
            </p>
          </Card>
        )}
      </div>

      <Notice icon={<AlertTriangle className="h-4 w-4" />}>
        Estimation : la CPAM peut retenir 3 mois au lieu de 12 si votre activité est régulière, et ajoute certaines indemnités (Congés Spectacles). Pensez à prévenir
        France Travail du congé lors de votre actualisation.
      </Notice>
    </div>
  );
};

// ---------------------------------------------------------------------------

const CongesOnglet: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const periodes = congesSpectacles(data.contrats).reverse();
  const courante = periodes.find((p) => p.enCours);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi
          variant="lime"
          label="En cours d'acquisition"
          aide="congesSpectacles"
          value={courante ? eur(courante.indemniteBrute, 0) : '—'}
          sub={courante ? `10 % de ${eur(courante.salaires, 0)} depuis le ${formatDateFR(courante.debut)}` : 'Aucun salaire depuis le 1er avril'}
          icon={<Palmtree className="h-4 w-4" />}
        />
        <Kpi
          variant="dark"
          label="Payable à partir du"
          value={courante ? formatDateFR(courante.payableDes) : '—'}
          sub="demande sur votre espace Audiens, à partir de mi-avril"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <Kpi label="Net estimé" value={courante ? eur(courante.indemniteBrute * sim.ratioNetSalaire, 0) : '—'} sub="soumis aux mêmes cotisations qu'un salaire" />
      </div>

      <Card title="Par période (1er avril → 31 mars)" bodyClassName="">
        {periodes.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-slate-500">Aucun contrat saisi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="num w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="px-6 py-2 font-medium">Période</th>
                  <th className="px-3 py-2 text-right font-medium">Salaires spectacle</th>
                  <th className="px-3 py-2 text-right font-medium">Indemnité brute</th>
                  <th className="px-3 py-2 text-right font-medium">Net estimé</th>
                  <th className="px-6 py-2 text-right font-medium">Payable dès</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodes.map((p) => (
                  <tr key={p.debut}>
                    <td className="px-6 py-3">
                      {formatDateFR(p.debut)} → {formatDateFR(p.fin)} {p.enCours && <Badge tone="lime">en cours</Badge>}
                    </td>
                    <td className="px-3 py-3 text-right">{eur(p.salaires, 0)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{eur(p.indemniteBrute, 0)}</td>
                    <td className="px-3 py-3 text-right text-slate-500">{eur(p.indemniteBrute * sim.ratioNetSalaire, 0)}</td>
                    <td className="px-6 py-3 text-right text-slate-500">{formatDateFR(p.payableDes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Notice icon={<AlertTriangle className="h-4 w-4" />}>
        Les salaires d'enseignement sont exclus. Certaines conventions collectives plafonnent l'indemnité par jour : le montant réel peut être un peu inférieur. Ces
        congés créent la <b>franchise congés payés</b> <Aide terme="franchiseCP" /> déduite de votre ARE. Demande et suivi :{' '}
        <Lien href="https://www.audiens.org/solutions/vos-conges-spectacles.html">audiens.org</Lien>
      </Notice>
    </div>
  );
};

// ---------------------------------------------------------------------------

const AudiensOnglet: React.FC = () => {
  const { data } = useIntermittence();
  const annee = new Date().getFullYear() - 1;
  const heures = heuresAnneeCivile(data.contrats, annee);
  const ok = heures >= SEUIL_HEURES;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Kpi
          variant={ok ? 'lime' : 'light'}
          label={`Heures en ${annee}`}
          value={`${nb(heures)} h`}
          sub={ok ? 'Vous avez droit à la réduction de cotisation santé' : `Il faut ${SEUIL_HEURES} h sur l'année civile pour la réduction`}
          icon={<HeartPulse className="h-4 w-4" />}
          footer={<>Calculé sur vos contrats saisis de {annee}. Pensez à saisir l'année entière.</>}
        />
        <Card title="Garantie santé intermittents" aide="audiens">
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li>Complémentaire santé dédiée, trois niveaux de garanties.</li>
            <li>
              <b className="text-slate-800">Cotisation réduite</b> grâce au Fonds collectif si vous justifiez {SEUIL_HEURES} h l'année civile précédente.
            </li>
            <li>
              <b className="text-slate-800">Enfants de moins de 16 ans</b> couverts gratuitement.
            </li>
          </ul>
          <p className="mt-4 text-xs">
            <Lien href="https://www.audiens.org/solutions/garantie-sante-intermittents-du-spectacle-une-couverture-sante-complete.html">Garantie santé sur audiens.org</Lien>
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Prévoyance">
          <p className="text-sm leading-relaxed text-slate-600">
            Vos employeurs cotisent pour vous à une prévoyance collective (maladie, invalidité, décès). Vérifiez les garanties ouvertes en cas d'arrêt ou de
            congé maternité.
          </p>
        </Card>
        <Card title="Congés Spectacles">
          <p className="text-sm leading-relaxed text-slate-600">
            10 % de vos salaires spectacle chaque année, versés par Audiens : voir l'onglet Congés Spectacles.
          </p>
        </Card>
        <Card title="Accompagnement">
          <p className="text-sm leading-relaxed text-slate-600">
            Entretien professionnel, soutien et aides ponctuelles en cas de difficulté (fin de droits, maladie…).
          </p>
          <p className="mt-3 text-xs">
            <Lien href="https://www.artistesettechniciensduspectacle.fr/">artistesettechniciensduspectacle.fr</Lien>
          </p>
        </Card>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const RetraiteOnglet: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const annees = trimestresRetraite(
    data.contrats,
    sim.suivi.mois.map((m) => ({ cle: m.cle, jours: m.joursIndemnises }))
  ).reverse();
  const courante = annees.find((a) => a.annee === new Date().getFullYear());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi
          variant="dark"
          label={`Trimestres ${new Date().getFullYear()}`}
          value={courante ? `${courante.total} / 4` : '—'}
          sub={courante ? `${courante.trimestresSalaires} par vos salaires · ${courante.trimestresChomage} par le chômage` : 'aucune donnée cette année'}
          icon={<Landmark className="h-4 w-4" />}
        />
        <Kpi
          variant="lime"
          label="1 trimestre ="
          value={courante ? eur(courante.seuilTrimestre, 0) : '—'}
          sub={`de salaire brut (${HEURES_SMIC_PAR_TRIMESTRE} × SMIC horaire au 1er janvier)`}
        />
        <Kpi label="ou" value={`${JOURS_CHOMAGE_PAR_TRIMESTRE} jours`} sub="de chômage indemnisé (trimestre assimilé)" />
      </div>

      <Card title="Par année" bodyClassName="">
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr>
                <th className="px-6 py-2 font-medium">Année</th>
                <th className="px-3 py-2 text-right font-medium">Salaires bruts</th>
                <th className="px-3 py-2 text-right font-medium">Par les salaires</th>
                <th className="px-3 py-2 text-right font-medium">Jours indemnisés</th>
                <th className="px-3 py-2 text-right font-medium">Par le chômage</th>
                <th className="px-6 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {annees.map((a) => (
                <tr key={a.annee}>
                  <td className="px-6 py-3 font-semibold">{a.annee}</td>
                  <td className="px-3 py-3 text-right">{eur(a.salaires, 0)}</td>
                  <td className="px-3 py-3 text-right">
                    {a.trimestresSalaires}
                    {a.manquePourSuivant != null && a.manquePourSuivant > 0 && (
                      <div className="text-[11px] text-slate-400">+{eur(a.manquePourSuivant, 0)} pour le suivant</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">{a.joursIndemnises || '—'}</td>
                  <td className="px-3 py-3 text-right">{a.trimestresChomage}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`h-3 w-6 rounded-full ${i < a.total ? 'bg-lime-400' : 'bg-slate-100'}`} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Notice icon={<AlertTriangle className="h-4 w-4" />}>
        Les jours indemnisés ne sont connus que pour votre droit en cours (estimation du suivi mensuel) ; les années précédentes n'en comptent donc pas ici. Les
        revenus non salariés valident des trimestres auprès de la Sécurité sociale des indépendants, avec d'autres seuils. Votre relevé officiel :{' '}
        <Lien href="https://www.info-retraite.fr/">info-retraite.fr</Lien>
      </Notice>
    </div>
  );
};

const Etape: React.FC<{ n: number; titre: string; children: React.ReactNode }> = ({ n, titre, children }) => (
  <li className="flex gap-3">
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-lime-300">{n}</span>
    <div className="text-sm leading-relaxed text-slate-600">
      <p className="font-semibold text-slate-900">{titre}</p>
      {children}
    </div>
  </li>
);

const RecoursOnglet: React.FC = () => (
  <div className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Un désaccord avec France Travail" icon={<Landmark className="h-4 w-4" />}>
        <p className="mb-4 text-sm text-slate-500">AJ mal calculée, heures oubliées, trop-perçu, radiation… Gratuit à chaque étape.</p>
        <ol className="space-y-4">
          <Etape n={1} titre="Réclamation">
            Depuis votre espace personnel ou en agence, avec vos justificatifs (contrats, bulletins, attestations). Réponse écrite sous 7 jours en principe.
          </Etape>
          <Etape n={2} titre="Médiateur régional de France Travail">
            Si la réponse ne vous convient pas ou sans réponse sous 15 jours. Par courriel ou courrier, avec toutes les pièces. Pour certains litiges, cette
            médiation est obligatoire avant le tribunal.
          </Etape>
          <Etape n={3} titre="Tribunal">Judiciaire ou administratif selon la décision, dans le délai indiqué sur la notification.</Etape>
        </ol>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Lien href="https://www.francetravail.fr/candidat/vos-droits-et-demarches/reclamations/comment-contester-une-decision-d.html">Contester une décision</Lien>
          <Lien href="https://www.francetravail.fr/candidat/vos-droits-et-demarches/reclamations/le-mediateur-de-pole-emploi.html">Le médiateur</Lien>
        </p>
      </Card>

      <Card title="Un désaccord avec un employeur" icon={<Building2 className="h-4 w-4" />}>
        <p className="mb-4 text-sm text-slate-500">Salaire ou cachet impayé, attestation employeur (AEM) jamais envoyée, heures mal déclarées…</p>
        <ol className="space-y-4">
          <Etape n={1} titre="Demande écrite">
            Réclamez par courriel ou lettre recommandée ce qui manque (paiement, AEM, bulletin). Gardez une copie : elle servira de preuve. Prévenez France
            Travail si une AEM manque, avec vos bulletins de paie.
          </Etape>
          <Etape n={2} titre="Inspection du travail">Gratuite, elle renseigne et peut intervenir auprès de l'employeur.</Etape>
          <Etape n={3} titre="Conseil de prud'hommes">
            Gratuit, sans avocat obligatoire. Les salaires impayés se réclament sur les 3 dernières années.
          </Etape>
        </ol>
        <p className="mt-4 text-xs">
          <Lien href="https://code.travail.gouv.fr/">Code du travail numérique</Lien>
        </p>
      </Card>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Entre intermittents" icon={<Users className="h-4 w-4" />}>
        <ul className="space-y-3 text-sm text-slate-600">
          <li>
            <b className="text-slate-900">CIP-IDF</b> : permanence gratuite sur les droits des intermittents, le lundi de 15 h à 18 h (Paris 12e), ou par courriel à{' '}
            <a href="mailto:cap@cip-idf.org" className="font-semibold text-brand-700">
              cap@cip-idf.org
            </a>
            . <Lien href="https://www.cip-idf.org/">cip-idf.org</Lien>
          </li>
          <li>
            <b className="text-slate-900">Matermittentes</b> : maternité et intermittence. <Lien href="https://www.matermittentes.com/">matermittentes.com</Lien>
          </li>
          <li>
            <b className="text-slate-900">Syndicats du spectacle</b> (artistes, musiciens, techniciens) : conseil et défense de leurs adhérents.
          </li>
        </ul>
      </Card>

      <Card title="Consultations juridiques gratuites" icon={<Gavel className="h-4 w-4" />}>
        <ul className="space-y-3 text-sm text-slate-600">
          <li>
            <b className="text-slate-900">Point-justice</b> (ex-maisons de la justice et du droit) : avocats et juristes, gratuit et confidentiel. <Lien href="https://www.justice.fr/">justice.fr</Lien>
          </li>
          <li>
            <b className="text-slate-900">Aide juridictionnelle</b> : frais d'avocat pris en charge selon vos ressources.
          </li>
          <li>
            <b className="text-slate-900">Défenseur des droits</b> : litiges avec un service public, dont France Travail. <Lien href="https://www.defenseurdesdroits.fr/">defenseurdesdroits.fr</Lien>
          </li>
        </ul>
      </Card>

      <Card title="Accompagnement social" icon={<HeartPulse className="h-4 w-4" />}>
        <p className="text-sm leading-relaxed text-slate-600">
          Audiens propose aux intermittents en difficulté un entretien, un suivi social et des aides ponctuelles.
        </p>
        <p className="mt-3 text-xs">
          <Lien href="https://www.artistesettechniciensduspectacle.fr/">artistesettechniciensduspectacle.fr</Lien>
        </p>
      </Card>
    </div>

    <Notice icon={<Scale className="h-4 w-4" />}>
      Avant toute démarche, rassemblez vos contrats, bulletins de paie, attestations employeur et la notification de France Travail : l'export JSON et l'export Excel
      du simulateur vous donnent le récapitulatif de vos heures et salaires.
    </Notice>
  </div>
);

const MesDroitsPage: React.FC = () => {
  const [onglet, setOnglet] = useState<Onglet>('perte');
  return (
    <div>
      <PageHeader
        title="Mes droits"
        accent="au-delà de l'ARE"
        description="Ce qui se passe si vous n'avez pas vos heures, pendant un congé maternité ou paternité, et ce que vous versent les Congés Spectacles et Audiens."
      />
      <Tabs
        value={onglet}
        onChange={setOnglet}
        tabs={[
          { value: 'perte', label: 'Si je perds l’intermittence', icon: <LifeBuoy className="h-4 w-4" /> },
          { value: 'maternite', label: 'Maternité / paternité', icon: <Baby className="h-4 w-4" /> },
          { value: 'conges', label: 'Congés Spectacles', icon: <Palmtree className="h-4 w-4" /> },
          { value: 'retraite', label: 'Retraite', icon: <Landmark className="h-4 w-4" /> },
          { value: 'audiens', label: 'Audiens', icon: <HeartPulse className="h-4 w-4" /> },
          { value: 'recours', label: 'Aide et recours', icon: <Scale className="h-4 w-4" /> },
        ]}
      />
      {onglet === 'perte' && <PerteOnglet />}
      {onglet === 'maternite' && <MaterniteOnglet />}
      {onglet === 'conges' && <CongesOnglet />}
      {onglet === 'retraite' && <RetraiteOnglet />}
      {onglet === 'audiens' && <AudiensOnglet />}
      {onglet === 'recours' && <RecoursOnglet />}
    </div>
  );
};

export default MesDroitsPage;
