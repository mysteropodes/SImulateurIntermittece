import React, { useState } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { useSimulation } from '../hooks/useSimulation';
import { FileSpreadsheet, Download } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';
import { Card, Notice } from '../components/ui';
import { heuresContrat, finContrat, formatDateFR } from '../lib/calculs';

const ExportExcelPage: React.FC = () => {
  const { data } = useIntermittence();
  const sim = useSimulation();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Simulateur Intermittence du Spectacle';
      wb.created = new Date();
      const bold = { bold: true } as const;
      const header = (ws: import('exceljs').Worksheet) => {
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      };
      const money = '#,##0.00 €';

      // 1. Contrats
      const wsC = wb.addWorksheet('Contrats');
      wsC.columns = [
        { header: 'Début', key: 'date', width: 12 },
        { header: 'Fin', key: 'fin', width: 12 },
        { header: 'Employeur', key: 'emp', width: 24 },
        { header: 'Type', key: 'type', width: 9 },
        { header: 'Nombre', key: 'nb', width: 9 },
        { header: 'Brut', key: 'brut', width: 12 },
        { header: 'Heures', key: 'h', width: 9 },
        { header: 'Net estimé', key: 'net', width: 12 },
        { header: 'Dans la PRA', key: 'pra', width: 12 },
      ];
      const dansPRA = new Set(sim.affiliation.contrats.map((c) => c.id));
      [...data.contrats]
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((c, i) => {
          const r = i + 2;
          wsC.addRow({
            date: c.date,
            fin: finContrat(c),
            emp: c.employeur,
            type: c.type,
            nb: c.nombre,
            brut: c.brut,
            h: { formula: `IF(D${r}="Cachet",E${r}*12,E${r})`, result: heuresContrat(c) },
            net: { formula: `F${r}*${sim.ratioNetSalaire}`, result: c.brut * sim.ratioNetSalaire },
            pra: dansPRA.has(c.id) ? 'oui' : 'non',
          });
        });
      wsC.getColumn('brut').numFmt = money;
      wsC.getColumn('net').numFmt = money;
      header(wsC);

      // 2. Synthèse
      const wsS = wb.addWorksheet('Synthèse');
      wsS.columns = [{ width: 44 }, { width: 22 }];
      const a = sim.affiliation;
      const rows: [string, string | number][] = [
        ['SIMULATION INTERMITTENCE', ''],
        ['Annexe', data.annexe === 'A8' ? 'Ouvrier / Technicien (annexe 8)' : 'Artiste (annexe 10)'],
        ['Période de référence (PRA)', `${formatDateFR(a.periode.debut)} → ${formatDateFR(a.periode.fin)}`],
        ['Heures retenues (NHT)', Math.round(a.nht * 100) / 100],
        ['Salaire de référence (SR)', Math.round(a.sr * 100) / 100],
        ['Jours de travail', Math.round(a.joursTravail * 100) / 100],
        ['Salaire journalier moyen (SJM)', Math.round(sim.sjm * 100) / 100],
        ['Statut', a.eligible ? 'Éligible ARE' : `Non éligible (manque ${Math.ceil(a.heuresManquantes)} h)`],
        ['', ''],
        ['ALLOCATION JOURNALIÈRE', ''],
        ['Partie A (salaires)', Math.round(sim.ajCalculee.A * 100) / 100],
        ['Partie B (heures)', Math.round(sim.ajCalculee.B * 100) / 100],
        ['Partie C (fixe)', Math.round(sim.ajCalculee.C * 100) / 100],
        ['A + B + C', Math.round(sim.ajCalculee.brutCalcule * 100) / 100],
        ['Plancher / plafond', `${sim.ajCalculee.plancher} € / ${sim.ajCalculee.plafond} €`],
        ['AJ brute calculée', a.eligible ? Math.round(sim.ajCalculee.aj * 100) / 100 : 'Non éligible'],
        ['AJ brute utilisée', sim.ajBrute > 0 ? Math.round(sim.ajBrute * 100) / 100 : '-'],
        ['Source', sim.sourceAJ === 'notifiee' ? 'Notification France Travail' : 'Calcul'],
        ['AJ nette (avant impôt)', Math.round(sim.retenues.net * 100) / 100],
        ['Taux de prélèvement à la source', `${data.tauxPrelevement || 0} %`],
        ['', ''],
        ['DROIT', ''],
        ['Début du droit', formatDateFR(sim.dateIndem)],
        ['Date anniversaire (fin du droit)', formatDateFR(sim.dateAnniversaire)],
        ["Délai d'attente", data.delaiAttente ? '7 jours' : 'Non'],
        ['Franchise congés payés', `${sim.franchiseCP.total} j (${sim.franchiseCP.forfaitMensuel} j / mois)`],
        ['Franchise salaires', `${sim.franchiseSal.total} j (${sim.franchiseSal.mensuelle} j / mois)`],
      ];
      rows.forEach(([k, v], i) => {
        const row = wsS.addRow([k, v]);
        if ([0, 9, 21].includes(i)) row.font = bold;
      });

      // 3. Suivi mensuel
      const wsM = wb.addWorksheet('Suivi mensuel');
      wsM.columns = [
        { header: 'Mois', width: 9 },
        { header: 'Jours', width: 7 },
        { header: 'Hors droit', width: 10 },
        { header: 'Heures', width: 8 },
        { header: 'Brut', width: 11 },
        { header: 'Net', width: 11 },
        { header: 'J. travail', width: 9 },
        { header: 'J. non indemn.', width: 13 },
        { header: 'Délai', width: 7 },
        { header: 'Fr. CP', width: 7 },
        { header: 'Fr. Sal.', width: 8 },
        { header: 'J. indemnisés', width: 12 },
        { header: 'ARE brute', width: 11 },
        { header: 'ARE nette versée', width: 15 },
        { header: 'Total net', width: 11 },
        { header: 'Plafond', width: 9 },
      ];
      sim.suivi.mois.forEach((m) => {
        wsM.addRow([
          m.label,
          m.joursDansMois,
          m.joursHorsDroit,
          Math.round(m.heures * 100) / 100,
          Math.round(m.brut * 100) / 100,
          Math.round(m.net * 100) / 100,
          Math.round(m.joursTravail * 100) / 100,
          m.seuilAtteint ? 'seuil' : m.joursNonIndemnisables,
          m.delaiAttente,
          m.franchiseCP,
          m.franchiseSal,
          m.joursIndemnises,
          Math.round(m.areBrute * 100) / 100,
          Math.round(m.areVersee * 100) / 100,
          Math.round(m.totalNet * 100) / 100,
          m.plafondApplique ? 'oui' : '',
        ]);
      });
      const t = sim.suivi.totaux;
      const total = wsM.addRow([
        'Total',
        '',
        '',
        Math.round(t.heures * 100) / 100,
        Math.round(t.brut * 100) / 100,
        Math.round(t.net * 100) / 100,
        Math.round(t.joursTravail * 100) / 100,
        '',
        t.delaiAttente,
        t.franchiseCP,
        t.franchiseSal,
        t.joursIndemnises,
        Math.round(t.areBrute * 100) / 100,
        Math.round(t.areVersee * 100) / 100,
        Math.round(t.totalNet * 100) / 100,
        '',
      ]);
      total.font = bold;
      [5, 6, 13, 14, 15].forEach((c) => (wsM.getColumn(c).numFmt = money));
      header(wsM);

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Simulateur_Intermittence.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de la génération Excel:', error);
      alert('Une erreur est survenue lors de la génération du fichier Excel.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Export Excel</h1>
        <p className="text-gray-600">Trois feuilles : Contrats, Synthèse (PRA, AJ, franchises) et Suivi mensuel — mêmes calculs que l'application.</p>
      </div>

      <ImportExportBar />

      <Card
        title={
          <>
            <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
            Générer le classeur
          </>
        }
        className="mb-6"
      >
        <button
          onClick={generateExcel}
          disabled={isGenerating}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGenerating ? 'Génération…' : 'Télécharger Simulateur_Intermittence.xlsx'}
        </button>
      </Card>

      <Notice>Le classeur contient des valeurs calculées (pas de formules à recopier) : modifiez vos contrats dans l'application puis exportez à nouveau.</Notice>
    </div>
  );
};

export default ExportExcelPage;
