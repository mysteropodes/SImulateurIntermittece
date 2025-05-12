import React, { useState } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { FileSpreadsheet, Download, Clock } from 'lucide-react';
import ImportExportBar from '../components/ImportExportBar';

const ExportExcelPage: React.FC = () => {
  const { data } = useIntermittence();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      // Importer ExcelJS dynamiquement pour éviter les problèmes de bundling
      const ExcelJS = (await import('exceljs')).default;
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Simulateur Intermittence du Spectacle';
      workbook.created = new Date();
      
      // Ajout des feuilles (simplifiées pour cet exemple)
      const contratsSheet = workbook.addWorksheet('Contrats');
      contratsSheet.columns = [
        { header: 'Date', width: 14 },
        { header: 'Employeur', width: 22 },
        { header: 'Type', width: 12 },
        { header: 'Nombre', width: 10 },
        { header: 'Brut', width: 12 },
        { header: 'Heures converties', width: 18 }
      ];
      
      // Remplir avec les données des contrats
      data.contrats.forEach(contrat => {
        const heuresConverties = contrat.type === 'Cachet' ? contrat.nombre * 12 : contrat.nombre;
        contratsSheet.addRow([
          contrat.date,
          contrat.employeur,
          contrat.type,
          contrat.nombre,
          contrat.brut,
          heuresConverties
        ]);
      });
      
      // Générer le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Simulateur_Intermittence.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
        <p className="text-gray-600">
          Générez un fichier Excel complet avec toutes vos données d'intermittence.
        </p>
      </div>
      
      <ImportExportBar />
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FileSpreadsheet className="w-8 h-8 text-green-600 mr-3" />
          <div>
            <h2 className="text-lg font-bold">Générer un fichier Excel</h2>
            <p className="text-gray-600">
              Le fichier Excel contiendra toutes vos données avec mises en forme.
            </p>
          </div>
        </div>
        
        <button
          onClick={generateExcel}
          disabled={isGenerating}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center disabled:bg-gray-400"
        >
          {isGenerating ? (
            <>
              <Clock className="animate-spin h-5 w-5 mr-2" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Télécharger le fichier Excel
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportExcelPage; 