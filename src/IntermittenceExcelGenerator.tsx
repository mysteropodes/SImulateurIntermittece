import { useState } from 'react';
import ExcelJS from 'exceljs';
import { Download, FileSpreadsheet, Calculator, Info } from 'lucide-react';

export default function IntermittenceExcelGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Nouveaux états pour les champs du formulaire
  const [annexe, setAnnexe] = useState('Ouvrier/Technicien (Annexe 8)');
  const [montantNet, setMontantNet] = useState('');
  const [dateIndem, setDateIndem] = useState('');
  const [dateFinContrat, setDateFinContrat] = useState('');
  const [delaiAttente, setDelaiAttente] = useState(false);
  const [franchiseConges, setFranchiseConges] = useState('');
  const [joursConges, setJoursConges] = useState('');
  const [franchiseSalaires, setFranchiseSalaires] = useState('');
  const [joursSalaires, setJoursSalaires] = useState('');
  const [ajNette, setAjNette] = useState('');
  const [ajBrute, setAjBrute] = useState('');

  // Ajout d'un état pour la liste des contrats modifiables
  const [contrats, setContrats] = useState([
    { date: '2024-01-01', employeur: 'Théâtre ABC', type: 'Cachet', nombre: 2, brut: 600 },
    { date: '2024-01-15', employeur: 'Production XYZ', type: 'Heures', nombre: 35, brut: 875 },
    { date: '2024-02-01', employeur: 'Festival 123', type: 'Cachet', nombre: 3, brut: 900 }
  ]);

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      // Calculs globaux (une seule fois)
      const now = new Date();
      const contratsJS = contrats.map(c => ({ ...c, date: new Date(c.date) }));
      const totalHeures = contratsJS.reduce((acc, c) => acc + (c.type === 'Cachet' ? c.nombre * 12 : c.nombre), 0);
      const totalBrut = contratsJS.reduce((acc, c) => acc + c.brut, 0);
      const joursTrav = Math.round(totalHeures / 8);
      const sjr = joursTrav > 0 ? totalBrut / joursTrav : 0;
      const ajBrute = 31.98 + sjr * 0.404;
      const plafond = sjr * 0.75;
      const plancher = Math.max(sjr * 0.57, 31.98);
      let ajNouv = 0;
      if (totalHeures >= 507 && joursTrav > 0) {
        ajNouv = Math.min(plafond, Math.max(plancher, ajBrute));
      }
      // Délai d'attente : 7 jours si > 12 mois depuis dernier contrat, sinon 0
      const lastContratDate = contratsJS.length > 0
        ? new Date(Math.max(...contratsJS.map(c => c.date.getTime())))
        : now;
      const diffJours = Math.floor((now.getTime() - lastContratDate.getTime()) / (1000 * 60 * 60 * 24));
      const delaiAttenteVal = diffJours > 365 ? 7 : 0;
      // Franchise CP (exemple : 15 jours, à raison de 2 ou 3 jours/mois)
      const franchiseCPVal = franchiseConges ? parseInt(franchiseConges, 10) : 0;
      // Franchise Salaires (exemple : 9 jours, répartis sur 8 mois)
      const franchiseSalVal = franchiseSalaires ? parseInt(franchiseSalaires, 10) : 0;
      // Correction de la période de référence : du lendemain du dernier contrat à aujourd'hui
      const refStart = new Date(lastContratDate);
      refStart.setDate(refStart.getDate() + 1);
      

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Intermittence Excel Generator';
      workbook.created = new Date();

      // 1. CONTRATS (avec style)
      const contratsSheet = workbook.addWorksheet('Contrats');
      contratsSheet.columns = [
        { header: 'Date', width: 14 },
        { header: 'Employeur', width: 22 },
        { header: 'Type', width: 12 },
        { header: 'Nombre', width: 10 },
        { header: 'Brut', width: 12 },
        { header: 'Heures converties', width: 18 },
        { header: 'Cotisations', width: 14 },
        { header: 'Net', width: 12 },
        { header: 'Heures cumulées', width: 18 },
        { header: 'Mois', width: 8 },
        { header: 'Année', width: 10 }
      ];
      contrats.forEach((contrat, idx) => {
        const rowNum = idx + 2; // +2 car header = 1
        const dateObj = new Date(contrat.date);
        const moisNum = dateObj.getMonth() + 1;
        const anneeNum = dateObj.getFullYear();
        const row = contratsSheet.addRow([
          contrat.date,
          contrat.employeur,
          contrat.type,
          contrat.nombre,
          contrat.brut,
          { formula: `IF(C${rowNum}="Cachet",D${rowNum}*12,D${rowNum})` },
          { formula: `E${rowNum}*0.23` },
          { formula: `E${rowNum}-F${rowNum}` },
          { formula: rowNum === 2 ? `F${rowNum}` : `I${rowNum-1}+F${rowNum}` },
          Number(moisNum),
          Number(anneeNum)
        ]);
        // Style alterné vert sur les lignes de contrats
        if (idx % 2 === 0) {
          row.eachCell((cell, colNumber) => {
            if (colNumber <= 5) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6E388' } };
            }
          });
        } else {
          row.eachCell((cell, colNumber) => {
            if (colNumber <= 5) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
            }
          });
        }
        // Colonnes calculées (heures converties, cotisations, net) en orange
        [6,7,8].forEach(col => {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7B2' } };
        });
        // Heures cumulées en jaune
        row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } };
      });
      // En-tête en gris foncé, texte en gras
      const headerRow = contratsSheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF434343' } };
      contratsSheet.eachRow(row => {
        row.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
      });

      // 2. SUIVI MENSUEL (logique Pôle Emploi, franchises/délai reportés, toutes colonnes)
      // Partir de la date de fin de contrat (dateFinContrat) et générer 12 mois
      let dateDebutSuivi = dateFinContrat ? new Date(dateFinContrat) : new Date();
      const moisLabels = [];
      
      // Générer 12 mois à partir de la date de fin de contrat
      for (let i = 0; i < 12; i++) {
        const currentDate = new Date(dateDebutSuivi);
        currentDate.setMonth(currentDate.getMonth() + i);
        
        moisLabels.push({
          label: `${(currentDate.getMonth()+1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`,
          moisNum: currentDate.getMonth()+1,
          anneeNum: currentDate.getFullYear(),
          joursDansMois: new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0).getDate()
        });
      }

      const contratsRange = contrats.length + 1; // +1 car header

      const suiviSheet = workbook.addWorksheet('Suivi Mensuel');
      suiviSheet.columns = [
        { header: 'Mois', width: 10 },
        { header: 'MoisNum', width: 8, hidden: true }, 
        { header: 'AnneeNum', width: 10, hidden: true },
        { header: 'Jours du mois', width: 12 },
        { header: 'Heures travaillées', width: 18 },
        { header: 'Revenus bruts', width: 15 },
        { header: 'Revenus nets', width: 15 },
        { header: 'Jours travaillés', width: 15 },
        { header: 'Délai d\'attente', width: 14 },
        { header: 'Franchise CP', width: 14 },
        { header: 'Franchise Salaires', width: 18 },
        { header: 'Jours non indemnisés', width: 18 },
        { header: 'Jours indemnisés', width: 16 },
        { header: 'ARE avant impôts', width: 18 },
        { header: 'Total net mensuel', width: 18 }
      ];

      // Calcul des franchises mois par mois avec épuisement progressif
      let resteCP = franchiseCPVal;
      let resteSalaires = franchiseSalVal;
      const joursCPParMois = joursConges ? parseInt(joursConges, 10) : 2; // Valeur par défaut : 2
      const joursSalairesParMois = joursSalaires ? parseInt(joursSalaires, 10) : 2; // Valeur par défaut : 2
      
      // Calculer les franchises pour chaque mois
      const franchisesMensuelles = moisLabels.map((_, idx) => {
        // Délai d'attente uniquement le premier mois
        const delaiCeMois = idx === 0 && delaiAttente ? 7 : 0;
        
        // Franchise CP : on prend le minimum entre jours configurés et ce qui reste
        let franchiseCPMois = 0;
        if (resteCP > 0) {
          franchiseCPMois = Math.min(joursCPParMois, resteCP);
          resteCP -= franchiseCPMois;
        }
        
        // Franchise Salaires : même logique
        let franchiseSalMois = 0;
        if (resteSalaires > 0) {
          franchiseSalMois = Math.min(joursSalairesParMois, resteSalaires);
          resteSalaires -= franchiseSalMois;
        }
        
        return {
          delai: delaiCeMois,
          franchiseCP: franchiseCPMois,
          franchiseSal: franchiseSalMois
        };
      });
      
      // Formules robustes pour les colonnes du Suivi Mensuel
      moisLabels.forEach((mois, idx) => {
        const rowNum = idx + 2;
        const franchise = franchisesMensuelles[idx];
        // Colonnes :
        // A: Mois, B: MoisNum, C: AnneeNum, D: Jours du mois, E: Heures, F: Bruts, G: Nets, H: Jours travaillés, I: Délai, J: Franchise CP, K: Franchise Salaires, L: Jours non indemnisés, M: Jours indemnisés, N: ARE, O: Total net
        const formuleHeures = `SUMPRODUCT((Contrats!$J$2:$J$1000=B${rowNum})*(Contrats!$K$2:$K$1000=C${rowNum})*(Contrats!$F$2:$F$1000))`;
        const formuleBruts = `SUMPRODUCT((Contrats!$J$2:$J$1000=B${rowNum})*(Contrats!$K$2:$K$1000=C${rowNum})*(Contrats!$E$2:$E$1000))`;
        const formuleNets = `SUMPRODUCT((Contrats!$J$2:$J$1000=B${rowNum})*(Contrats!$K$2:$K$1000=C${rowNum})*(Contrats!$H$2:$H$1000))`;
        const formuleJoursTrav = `ROUND(E${rowNum}/8,0)`;
        const formuleJoursNonIndem = `I${rowNum}+J${rowNum}+K${rowNum}`;
        const formuleJoursIndem = `MAX(0,D${rowNum}-L${rowNum})`;
        const formuleARE = `M${rowNum}*'Mon AJ'!$B$12`;
        const formuleTotalNet = `G${rowNum}+N${rowNum}`;
        suiviSheet.addRow([
          mois.label,
          mois.moisNum,
          mois.anneeNum,
          mois.joursDansMois,
          { formula: formuleHeures },
          { formula: formuleBruts },
          { formula: formuleNets },
          { formula: formuleJoursTrav },
          franchise.delai,
          franchise.franchiseCP,
          franchise.franchiseSal,
          { formula: formuleJoursNonIndem },
          { formula: formuleJoursIndem },
          { formula: formuleARE },
          { formula: formuleTotalNet }
        ]);
      });

      // Ligne Total avec formules dynamiques (adapter les colonnes si besoin)
      const totalRowNum = moisLabels.length + 2;
      suiviSheet.addRow([
        'Total',
        '',
        '',
        '',
        { formula: `SUM(E2:E${totalRowNum-1})` },
        { formula: `SUM(F2:F${totalRowNum-1})` },
        { formula: `SUM(G2:G${totalRowNum-1})` },
        { formula: `SUM(H2:H${totalRowNum-1})` },
        { formula: `SUM(I2:I${totalRowNum-1})` },
        { formula: `SUM(J2:J${totalRowNum-1})` },
        { formula: `SUM(K2:K${totalRowNum-1})` },
        { formula: `SUM(L2:L${totalRowNum-1})` },
        { formula: `SUM(M2:M${totalRowNum-1})` },
        { formula: `SUM(N2:N${totalRowNum-1})` }
      ]);
      // Style : en-tête et total
      const suiviHeader = suiviSheet.getRow(1);
      suiviHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      suiviHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF434343' } };
      const totalRow = suiviSheet.getRow(totalRowNum);
      totalRow.font = { bold: true };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      // Bordures et styles
      suiviSheet.eachRow(row => {
        row.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
      });
      // Style des cellules calculées
      for (let row = 2; row <= moisLabels.length + 1; row++) {
        // Heures, bruts, nets en vert clair
        ['E', 'F', 'G'].forEach(col => {
          suiviSheet.getCell(`${col}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6E388' } };
        });
        // Jours travaillés en jaune
        suiviSheet.getCell(`H${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } };
        // Franchises et délai en orange
        ['I', 'J', 'K'].forEach(col => {
          suiviSheet.getCell(`${col}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7B2' } };
        });
        // Jours non indemnisés, jours indemnisés et ARE en bleu clair
        ['L', 'M', 'N'].forEach(col => {
          suiviSheet.getCell(`${col}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB7E1FC' } };
        });
        // Total net mensuel en vert foncé
        suiviSheet.getCell(`O${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8BB678' } };
      }

      // 3. TABLEAU DE BORD
      const tableauSheet = workbook.addWorksheet('Tableau de Bord');
      tableauSheet.columns = [ { width: 38 }, { width: 40 } ];
      const tableauData = [
        ['TABLEAU DE BORD INTERMITTENCE', ''],
        ['', ''],
        ['SITUATION ACTUELLE', ''],
        ['Heures sur 12 mois glissants', { formula: `SUM(Contrats!F$2:F$${contratsRange})` }],
        ['Statut', { formula: `IF(B4>=507,"Eligible ARE","Non éligible")&" ("&B4&"/507h)"` }],
        ['Heures manquantes', { formula: `MAX(0,507-B4)` }],
        ['Progression', { formula: `MIN(100,B4/507*100)&"%"` }],
        ['', ''],
        ['ALLOCATIONS', ''],
        ['Allocation journalière', { formula: `IF(ISNUMBER(B15),B15&" €/jour","Non éligible")` }],
        ['Estimation mensuelle', { formula: `IF(ISNUMBER(B15),B15*20&" €","Non éligible")` }],
        ['Durée max d\'indemnisation', { formula: `IF(B4>=507,"243 jours","Non applicable")` }],
        ['', ''],
        ['PROJECTIONS', ''],
        ['Moyenne heures/mois (3 derniers)', { formula: `AVERAGE('Suivi Mensuel'!E2:E4)` }],
        ['Mois avant éligibilité', { formula: `IF(B4>=507,"Déjà éligible",ROUNDUP(B6/B15,0))` }],
        ['Date estimée d\'éligibilité', { formula: `IF(B4>=507,"Déjà éligible",TEXT(TODAY()+B16*30,"mmmm yyyy"))` }],
        ['', ''],
      ];
      tableauData.forEach((row, idx) => {
        const excelRow = tableauSheet.addRow(row);
        if ([0,2,8,13,18].includes(idx)) {
          excelRow.getCell(1).font = { bold: true };
          excelRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        }
        // Calculs en bleu
        if ([3,4,5,6,10,11,12,15,16,17].includes(idx)) {
          excelRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB7E1FC' } };
        }
        excelRow.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
      });
      // Ajout du contenu de Simulation ARE à la place des graphiques recommandés
      const simuAREData = [
        ['SIMULATION ALLOCATION RETOUR EMPLOI', ''],
        ['', ''],
        ['Période de référence (12 mois)', { formula: `TEXT('Mon AJ'!B6,"dd/mm/yyyy") & " au " & TEXT(TODAY(),"dd/mm/yyyy")` }],
        ['Total heures (12 mois glissants)', { formula: `SUM(Contrats!F$2:F$${contratsRange})` }],
        ['Total brut (12 mois glissants)', { formula: `SUM(Contrats!E$2:E$${contratsRange})` }],
        ['Salaire de référence (SR)', { formula: `B5` }],
        ['Nombre de jours travaillés', { formula: `ROUND(B4/8,0)` }],
        ['', ''],
        ['CALCUL ALLOCATION JOURNALIÈRE', ''],
        ['Partie fixe', 31.98],
        ['Partie proportionnelle (40,4%)', { formula: `IF(B4>=507,B6/B7*0.404,0)` }],
        ['Total AJ brut', { formula: `IF(B4>=507,B10+B11,0)` }],
        ['Plafond (75% du SJR)', { formula: `IF(B4>=507,B6/B7*0.75,0)` }],
        ['Plancher (57% du SJR)', { formula: `IF(B4>=507,MAX(B6/B7*0.57,31.98),0)` }],
        ['ALLOCATION JOURNALIÈRE', { formula: `IF(B4>=507,MIN(B13,MAX(B14,B12)),"Heures insuffisantes")` }],
        ['', ''],
        ['PROJECTIONS MENSUELLES', ''],
        ['Jours indemnisables/mois', 20],
        ['Indemnités mensuelles estimées', { formula: `IF(ISNUMBER(B15),B15*B18,0)` }],
        ['Durée d\'indemnisation max', { formula: `IF(B4>=507,"243 jours","Non éligible")` }]
      ];
      simuAREData.forEach((row, idx) => {
        const excelRow = tableauSheet.addRow(row);
        if (idx === 0 || idx === 8 || idx === 16) {
          excelRow.getCell(1).font = { bold: true };
          excelRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        }
        // Jaune pour les entrées modifiables (B10, B18)
        if (idx === 9 || idx === 17) {
          excelRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE59A' } };
        }
        // Bleu pour les calculs
        if ([10,11,12,13,14,15,19,20].includes(idx)) {
          excelRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB7E1FC' } };
        }
        excelRow.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
      });

      // --- Calculs pour Synthèse (dynamique) ---
      // Calcul des jours indemnisables pour chaque mois (en tenant compte des franchises)
      let resteCPSynthese = franchiseCPVal;
      let resteSalSynthese = franchiseSalVal;
      const joursCPParMoisSynthese = joursConges ? parseInt(joursConges, 10) : 2;
      const joursSalairesParMoisSynthese = joursSalaires ? parseInt(joursSalaires, 10) : 2;
      let syntheseIndem = [];
      
      moisLabels.forEach((m, idx) => {
        const joursDansMois = m.joursDansMois;
        let joursIndem = joursDansMois;
        
        // Déduire délai d'attente (seulement au premier mois)
        const delaiCeMois = idx === 0 && delaiAttente ? Math.min(7, joursIndem) : 0;
        joursIndem -= delaiCeMois;
        
        // Déduire franchise CP
        let cpCeMois = 0;
        if (resteCPSynthese > 0) {
          cpCeMois = Math.min(joursCPParMoisSynthese, resteCPSynthese, joursIndem);
          joursIndem -= cpCeMois;
          resteCPSynthese -= cpCeMois;
        }
        
        // Déduire franchise Salaires
        let salCeMois = 0;
        if (resteSalSynthese > 0) {
          salCeMois = Math.min(joursSalairesParMoisSynthese, resteSalSynthese, joursIndem);
          joursIndem -= salCeMois;
          resteSalSynthese -= salCeMois;
        }
        
        syntheseIndem.push({ 
          mois: m.label, 
          joursIndem, 
          resteDelai: idx === 0 ? Math.max(0, 7 - delaiCeMois) : 0, 
          resteCP: resteCPSynthese, 
          resteSal: resteSalSynthese 
        });
      });

      // --- Mise à jour de l'onglet Synthèse ---
      const syntheseDashboard = workbook.addWorksheet('Synthèse');
      syntheseDashboard.columns = [ { width: 45 }, { width: 45 } ];
      // Période de référence : concaténation de 'Mon AJ'!B6 et aujourd'hui, toutes deux formatées en texte (anglais pour ExcelJS)
      const periodeRefFormula = { formula: `TEXT('Mon AJ'!B6,"dd/mm/yyyy") & " au " & TEXT(TODAY(),"dd/mm/yyyy")` };
      syntheseDashboard.addRow(['Indemnisation en cours', '']).font = { bold: true, size: 13 };
      syntheseDashboard.addRow(['Période de référence', periodeRefFormula]);
      syntheseDashboard.addRow(['Date de début', { formula: `TEXT('Mon AJ'!B6,"dd/mm/yyyy")` }]);
      syntheseDashboard.addRow(['Date de fin', { formula: `TEXT(TODAY(),"dd/mm/yyyy")` }]);
      syntheseDashboard.addRow(['Heures travaillées', { formula: `SUM(Contrats!F$2:F$${contratsRange})` }]);
      syntheseDashboard.addRow(['Salaire brut', { formula: `SUM(Contrats!E$2:E$${contratsRange})` }]);
      syntheseDashboard.addRow(['Nombre de jours travaillés', { formula: `ROUND(SUM(Contrats!F$2:F$${contratsRange})/8,0)` }]);
      syntheseDashboard.addRow(['AJ nette', { formula: `'Mon AJ'!B11` }]);
      syntheseDashboard.addRow(['AJ brute', { formula: `'Mon AJ'!B12` }]);
      syntheseDashboard.addRow(['', '']);
      [1].forEach(rowIdx => {
        const row = syntheseDashboard.getRow(rowIdx);
        row.getCell(1).font = { bold: true, size: 13 };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      });
      syntheseDashboard.eachRow(row => {
        row.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
      });

      // --- Calcul dynamique de la nouvelle ARE dans le tableau de bord ---
      // Utilisation des variables déjà calculées plus haut : sjr, ajBrute, plafond, plancher, ajNouv
      // Ajout dans le tableau de bord
      tableauSheet.addRow(['Nouvelle ARE simulée (AJ)', ajNouv ? ajNouv.toFixed(2) + ' €' : 'Non éligible']);
      tableauSheet.addRow(['Détail calcul :', `AJ = 31,98 + 40,4% du SJR (${sjr.toFixed(2)} €)`]);
      tableauSheet.addRow(['Plafond (75% SJR)', plafond.toFixed(2) + ' €']);
      tableauSheet.addRow(['Plancher (57% SJR ou 31,98€)', plancher.toFixed(2) + ' €']);

      // 5. MON AJ
      const syntheseSheet = workbook.addWorksheet('Mon AJ');
      syntheseSheet.columns = [
        { header: 'Champ', width: 35 },
        { header: 'Valeur', width: 35 }
      ];
      const syntheseData = [
        ['Annexe d\'indemnisation', annexe],
        ['Montant Net', montantNet],
        ['Indemnisable à partir du', dateIndem],
        ['Sur base fin contrat de travail', dateFinContrat],
        ['7 jours de délai d\'attente', delaiAttenteVal ? 'Oui' : 'Non'],
        ['Franchise Congés Payés', franchiseCPVal],
        ['À raison de (jours par mois) - Congés', joursConges],
        ['Franchise Salaires', franchiseSalVal],
        ['À raison de (jours par mois) - Salaires', joursSalaires],
        ['A.J. nette Imposable', ajNette],
        ['A.J. Brute', ajBrute],
      ];
      syntheseSheet.addRow(['Synthèse des données saisies', '']).font = { bold: true, size: 14 };
      syntheseSheet.mergeCells('A1:B1');
      syntheseData.forEach(row => {
        const excelRow = syntheseSheet.addRow(row);
        excelRow.getCell(1).font = { bold: true };
        excelRow.getCell(2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFDE59A' }
        };
        excelRow.getCell(2).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      syntheseSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      syntheseSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB7E1FC' }
      };
      syntheseSheet.getRow(1).border = {
        top: { style: 'medium' },
        left: { style: 'medium' },
        bottom: { style: 'medium' },
        right: { style: 'medium' }
      };

      // 4. CHRONOLOGIE (frise)
      const chronoSheet = workbook.addWorksheet('Chronologie');
      chronoSheet.columns = [
        { header: 'Mois', width: 12 },
        { header: 'MoisNum', width: 8, hidden: true },
        { header: 'AnneeNum', width: 10, hidden: true },
        { header: 'Dans période de référence ?', width: 28 },
        { header: 'Heures travaillées', width: 20 },
        { header: 'Contrats présents', width: 20 }
      ];
      
      moisLabels.forEach((moisLabel, idx) => {
        const rowNum = idx + 2;
        
        // Dans période de référence = toujours OUI pour les mois générés
        const dansPeriode = "OUI";
        
        // Formule robuste pour les heures travaillées
        const formuleHeures = `SUMPRODUCT((Contrats!J2:J1000=${moisLabel.moisNum})*(Contrats!K2:K1000=${moisLabel.anneeNum})*(Contrats!F2:F1000))`;
        
        // Formule robuste pour détecter la présence de contrats
        const formuleContrats = `IF(E${rowNum}>0,"OUI","NON")`;
        
        chronoSheet.addRow([
          moisLabel.label,
          moisLabel.moisNum,
          moisLabel.anneeNum,
          dansPeriode,
          { formula: formuleHeures },
          { formula: formuleContrats }
        ]);
      });

      // Style en-tête
      const chronoHeader = chronoSheet.getRow(1);
      chronoHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      chronoHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF434343' } };
      chronoSheet.eachRow((row, idx) => {
        row.eachCell(cell => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
        // Mise en forme conditionnelle simplifiée
        if (idx > 1) {
          const cell = row.getCell(4); // Colonne "Dans période de référence ?"
          // Coloration systématique puisque tous les mois sont dans la période
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6E388' } };
        }
      });

      // Génération du fichier et téléchargement
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Simulateur_Intermittence_Spectacle.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      alert('Une erreur est survenue lors de la génération du fichier Excel.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <FileSpreadsheet className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Générateur Excel - Intermittence du Spectacle</h1>
        </div>

        {/* NOUVELLES SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Informations générales */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="font-semibold text-lg mb-2 flex items-center">Informations générales <Info className="w-4 h-4 ml-1 text-blue-400" /></h2>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Annexe d'indemnisation *</label>
              <select value={annexe} onChange={e => setAnnexe(e.target.value)} className="w-full border rounded px-2 py-1">
                <option>Ouvrier/Technicien (Annexe 8)</option>
                <option>Artiste (Annexe 10)</option>
              </select>
            </div>
          </div>

          {/* Vos droits ouverts */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="font-semibold text-lg mb-2 flex items-center">Vos droits ouverts <Info className="w-4 h-4 ml-1 text-blue-400" /></h2>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Montant Net *</label>
              <div className="flex items-center">
                <input type="number" value={montantNet} onChange={e => setMontantNet(e.target.value)} className="border rounded px-2 py-1 w-32 mr-2" />
                <span>€</span>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Indemnisable à partir du *</label>
              <input type="date" value={dateIndem} onChange={e => setDateIndem(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sur base fin contrat de travail *</label>
              <input type="date" value={dateFinContrat} onChange={e => setDateFinContrat(e.target.value)} className="border rounded px-2 py-1 w-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Votre indemnisation tiendra compte de */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="font-semibold text-lg mb-2 flex items-center">Votre indemnisation tiendra compte de <Info className="w-4 h-4 ml-1 text-blue-400" /></h2>
            <div className="mb-3 flex items-center">
              <span className="mr-2">7 jours de délai d'attente :</span>
              <button
                type="button"
                className={`px-3 py-1 rounded-l ${delaiAttente ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setDelaiAttente(true)}
              >Oui</button>
              <button
                type="button"
                className={`px-3 py-1 rounded-r ${!delaiAttente ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setDelaiAttente(false)}
              >Non</button>
            </div>
            <div className="mb-2">
              <label className="block text-sm">Franchise Congés Payés</label>
              <input type="number" value={franchiseConges} onChange={e => setFranchiseConges(e.target.value)} className="border rounded px-2 py-1 w-24 mr-2" />
              <span className="text-xs">jours</span>
            </div>
            <div className="mb-2">
              <label className="block text-sm">À raison de (jours par mois)</label>
              <input type="number" value={joursConges} onChange={e => setJoursConges(e.target.value)} className="border rounded px-2 py-1 w-24" />
            </div>
            <div className="mb-2">
              <label className="block text-sm">Franchise Salaires</label>
              <input type="number" value={franchiseSalaires} onChange={e => setFranchiseSalaires(e.target.value)} className="border rounded px-2 py-1 w-24 mr-2" />
              <span className="text-xs">jours</span>
            </div>
            <div>
              <label className="block text-sm">À raison de (jours par mois)</label>
              <input type="number" value={joursSalaires} onChange={e => setJoursSalaires(e.target.value)} className="border rounded px-2 py-1 w-24" />
            </div>
          </div>

          {/* Calculs Automatiques */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="font-semibold text-lg mb-2 flex items-center">Calculs Automatiques <Info className="w-4 h-4 ml-1 text-blue-400" /></h2>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">A.J. nette Imposable</label>
              <div className="flex items-center">
                <input type="number" value={ajNette} onChange={e => setAjNette(e.target.value)} className="border rounded px-2 py-1 w-32 mr-2" />
                <span>€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">A.J. Brute</label>
              <div className="flex items-center">
                <input type="number" value={ajBrute} onChange={e => setAjBrute(e.target.value)} className="border rounded px-2 py-1 w-32 mr-2" />
                <span>€</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Ce générateur crée un fichier Excel complet pour gérer et simuler vos droits à l'intermittence du spectacle.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Le fichier généré contient :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Feuille "Contrats" pour saisir tous vos contrats</li>
                  <li>Calcul automatique de votre allocation journalière ARE</li>
                  <li>Suivi mensuel de vos revenus (travail + ARE)</li>
                  <li>Tableau de bord avec indicateurs clés</li>
                  <li>Simulation pour une nouvelle ouverture de droits</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Fonctionnalités principales
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Conversion automatique cachets/heures</li>
                <li>• Calcul des cotisations sociales (~23%)</li>
                <li>• Suivi des 507 heures sur 12 mois</li>
                <li>• Projection avant éligibilité</li>
                <li>• Graphiques recommandés</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Règles appliquées</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Seuil : 507 heures sur 12 mois</li>
                <li>• 1 cachet = 12 heures</li>
                <li>• AJ = 31,98€ + 40,4% du SJR</li>
                <li>• Plafond : 75% du SJR</li>
                <li>• Plancher : 57% du SJR</li>
              </ul>
            </div>
          </div>
          <button
            onClick={generateExcel}
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Télécharger le fichier Excel
              </>
            )}
          </button>
        </div>
        <div className="border-t pt-4">
          <p className="text-xs text-gray-500">
            Note : Ce simulateur est basé sur les règles 2024 de l'intermittence du spectacle. 
            Les calculs sont indicatifs - consultez Pôle Emploi pour une simulation officielle.
          </p>
        </div>

        {/* Tableau des contrats */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-2">Vos contrats simulés</h2>
          <table className="w-full border text-sm mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Employeur</th>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Nombre</th>
                <th className="border px-2 py-1">Brut</th>
              </tr>
            </thead>
            <tbody>
              {contrats.map((contrat, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">
                    <input type="date" value={contrat.date} onChange={e => {
                      const newContrats = [...contrats];
                      newContrats[idx].date = e.target.value;
                      setContrats(newContrats);
                    }} className="w-32" />
                  </td>
                  <td className="border px-2 py-1">
                    <input type="text" value={contrat.employeur} onChange={e => {
                      const newContrats = [...contrats];
                      newContrats[idx].employeur = e.target.value;
                      setContrats(newContrats);
                    }} className="w-32" />
                  </td>
                  <td className="border px-2 py-1">
                    <select value={contrat.type} onChange={e => {
                      const newContrats = [...contrats];
                      newContrats[idx].type = e.target.value;
                      setContrats(newContrats);
                    }} className="w-24">
                      <option value="Cachet">Cachet</option>
                      <option value="Heures">Heures</option>
                    </select>
                  </td>
                  <td className="border px-2 py-1">
                    <input type="number" value={contrat.nombre} onChange={e => {
                      const newContrats = [...contrats];
                      newContrats[idx].nombre = parseInt(e.target.value, 10) || 0;
                      setContrats(newContrats);
                    }} className="w-16" />
                  </td>
                  <td className="border px-2 py-1">
                    <input type="number" value={contrat.brut} onChange={e => {
                      const newContrats = [...contrats];
                      newContrats[idx].brut = parseFloat(e.target.value) || 0;
                      setContrats(newContrats);
                    }} className="w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 