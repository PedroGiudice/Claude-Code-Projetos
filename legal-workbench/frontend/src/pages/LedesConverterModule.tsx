import React from 'react';
import { useLedesConverterStore } from '../store/ledesConverterStore';
import { DropZone } from '../components/upload/DropZone';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const LedesConverterModule: React.FC = () => {
  const { file, isConverting, conversionResult, conversionError, uploadProgress, setFile, convertFile, reset } = useLedesConverterStore();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleConvert = () => {
    convertFile();
  };

  const handleReset = () => {
    reset();
  };

  const handleDownload = () => {
    if (conversionResult && file) {
      const blob = new Blob([conversionResult], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${file.name.replace('.docx', '')}.txt`; // Adjust filename for LEDES
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 bg-gray-50">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">DOCX to LEDES Converter</h1>

        <div className="mb-6">
          <DropZone onFileSelect={handleFileSelect} accept=".docx" />
          {file && <p className="mt-3 text-sm text-gray-700 text-center">Selected file: <span className="font-medium">{file.name}</span></p>}
          {conversionError && <p className="mt-3 text-sm text-red-600 text-center">Error: {conversionError}</p>}
        </div>

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6 justify-center">
          <Button onClick={handleConvert} disabled={!file || isConverting} className="w-full sm:w-auto">
            {isConverting ? (
              <span className="flex items-center"><LoadingSpinner size="sm" className="mr-2" /> Converting...</span>
            ) : (
              'Convert to LEDES'
            )}
          </Button>
          <Button onClick={handleReset} variant="secondary" disabled={isConverting} className="w-full sm:w-auto">
            Reset
          </Button>
        </div>

        {isConverting && uploadProgress > 0 && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-700">Processing file...</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Progress: {uploadProgress}%</p>
          </div>
        )}

        {conversionResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-300">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Conversion Result (LEDES)</h2>
            <textarea
              readOnly
              className="w-full h-64 p-3 text-sm font-mono bg-white border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={conversionResult}
            ></textarea>
            <div className="flex justify-end mt-4">
              <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
                Download LEDES
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedesConverterModule;
