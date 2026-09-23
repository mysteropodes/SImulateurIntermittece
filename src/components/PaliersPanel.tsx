import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { Card, Progress, eur, nb } from './ui';
import { calculAJ, heuresPourAJ, parseDate, AJ_MAX } from '../lib/calculs';

/**
 * Montre où l'on se situe par rapport aux deux seuils de la formule
 * (salaire et heures) et ce que rapporte du travail en plus d'ici la
 * date anniversaire.
 */
const PaliersPanel: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const aff = sim.affiliation;
  const p = sim.paliers;
  const ajActuelle = sim.ajCalculee.aj;

  const tauxDefaut = sim.tauxHoraireMoyen > 0 ? Math.round(sim.tauxHoraireMoyen) : 30;
  const cibleDefaut = sim.sourceAJ === 'notifiee' ? sim.ajBrute : Math.ceil(ajActuelle + 2);
  const [heuresEnPlus, setHeuresEnPlus] = useState(50);
  const [taux, setTaux] = useState<number>(tauxDefaut);
  const [cible, setCible] = useState<number>(Math.round(cibleDefaut * 100) / 100);

  const ajSimulee = calculAJ(data.annexe, aff.sr + heuresEnPlus * taux, aff.nht + heuresEnPlus).aj;
  const heuresNecessaires = heuresPourAJ(data.annexe, aff.sr, aff.nht, cible, taux);

  const moisRestants = Math.max(
    1,
    Math.round((parseDate(sim.dateAnniversaire).getTime() - Date.now()) / (30.44 * 86400000))
  );

  const bar = (valeur: number, seuil: number) => Math.max(seuil * 1.6, valeur * 1.1);

  return (
    <Card title="Paliers et leviers de votre AJ" icon={<Layers className="h-4 w-4" />}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">Salaire de référence (partie A)</span>
              <span className="num text-slate-900">{eur(aff.sr, 0)}</span>
            </div>
            <Progress value={aff.sr} max={bar(aff.sr, p.seuilSR)} marker={p.seuilSR} tone={p.srAuDelaDuSeuil ? 'amber' : 'brand'} />
            <p className="mt-1.5 text-xs text-slate-500">
              Seuil à {eur(p.seuilSR, 0)}.{' '}
              {p.srAuDelaDuSeuil ? (
                <>
                  Vous êtes au-delà : <b className="text-slate-700">+1 000 € de salaire = +{eur(p.gainPour1000Euros)}/jour</b> seulement (au lieu de{' '}
                  {eur((31.96 * (data.annexe === 'A8' ? 0.42 : 0.36) * 1000) / 5000)} en dessous).
                </>
              ) : (
                <>
                  <b className="text-slate-700">+1 000 € = +{eur(p.gainPour1000Euros)}/jour</b> jusqu'au seuil (encore {eur(p.seuilSR - aff.sr, 0)}), puis
                  beaucoup moins.
                </>
              )}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">Heures travaillées (partie B)</span>
              <span className="num text-slate-900">{nb(aff.nht, 0)} h</span>
            </div>
            <Progress value={aff.nht} max={bar(aff.nht, p.seuilNHT)} marker={p.seuilNHT} tone={p.nhtAuDelaDuSeuil ? 'amber' : 'brand'} />
            <p className="mt-1.5 text-xs text-slate-500">
              Seuil à {p.seuilNHT} h.{' '}
              {p.nhtAuDelaDuSeuil ? (
                <>
                  Vous êtes au-delà : <b className="text-slate-700">+10 h = +{eur(p.gainPour10Heures)}/jour</b>.
                </>
              ) : (
                <>
                  <b className="text-slate-700">+10 h = +{eur(p.gainPour10Heures)}/jour</b> jusqu'au seuil (encore {nb(p.seuilNHT - aff.nht, 0)} h), puis 3× moins.
                </>
              )}
            </p>
          </div>

          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Au-delà des deux seuils, le <b>taux horaire</b> pèse plus que le volume : un contrat mieux payé fait monter la partie A sans trop augmenter les jours
            non indemnisables du mois. Les heures d'enseignement ne comptent pas ici (seulement pour les 507 h).
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-sm font-medium text-slate-700">
            Et si je travaille plus d'ici la date anniversaire ? <span className="font-normal text-slate-500">(~{moisRestants} mois)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-500">
              Heures en plus
              <input type="number" min={0} step={5} value={heuresEnPlus} onChange={(e) => setHeuresEnPlus(Math.max(0, +e.target.value || 0))} className="input mt-1" />
            </label>
            <label className="text-xs text-slate-500">
              Taux horaire brut (€)
              <input type="number" min={1} step={1} value={taux} onChange={(e) => setTaux(Math.max(1, +e.target.value || 1))} className="input mt-1" />
            </label>
          </div>
          <div className="flex items-baseline justify-between rounded-lg bg-white p-3 shadow-sm">
            <span className="text-sm text-slate-600">AJ recalculée</span>
            <span className="num text-lg font-semibold text-slate-900">
              {eur(ajSimulee)}{' '}
              <span className={`text-sm font-medium ${ajSimulee - ajActuelle >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({ajSimulee - ajActuelle >= 0 ? '+' : ''}
                {eur(ajSimulee - ajActuelle)})
              </span>
            </span>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="text-xs text-slate-500">
              AJ visée (€ / jour){sim.sourceAJ === 'notifiee' && ' — par défaut, votre AJ actuelle'}
              <input type="number" min={0} step={0.5} value={cible} onChange={(e) => setCible(Math.max(0, +e.target.value || 0))} className="input mt-1" />
            </label>
            <p className="mt-2 text-sm text-slate-700">
              {heuresNecessaires == null ? (
                <>Inatteignable (plafond de {eur(AJ_MAX)}).</>
              ) : heuresNecessaires === 0 ? (
                <>Déjà atteinte avec vos contrats actuels ({eur(ajActuelle)}).</>
              ) : (
                <>
                  Il faut <b className="num">{nb(heuresNecessaires)} h</b> de plus à {eur(taux, 0)}/h, soit{' '}
                  <b className="num">≈ {nb(Math.ceil(heuresNecessaires / moisRestants))} h/mois</b> et {eur(heuresNecessaires * taux, 0)} bruts.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PaliersPanel;
