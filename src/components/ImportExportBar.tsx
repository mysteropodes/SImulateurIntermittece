import React, { useRef } from 'react';
import { useIntermittence } from '../context/IntermittenceContext';
import { Upload, Save } from 'lucide-react';

const ImportExportBar: React.FC = () => {
  const { exportData, importData } = useIntermittence();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importData(content);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center justify-end space-x-3 mb-4 border-b pb-3">
      <button
        onClick={exportData}
        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
      >
        <Save className="w-4 h-4 mr-2" />
        Exporter JSON
      </button>
      
      <button
        onClick={handleImportClick}
        className="flex items-center px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition duration-200"
      >
        <Upload className="w-4 h-4 mr-2" />
        Importer JSON
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImportExportBar; 