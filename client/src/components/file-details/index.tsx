import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LegalDocumentMarker from '@/components/legal-document-marker';

interface FileDetailsProps {
  fileId: string;
  userId: string;
}

interface FileData {
  id: string;
  filename: string;
  extension: string;
  size: string;
  uploadStatus: 'uploading' | 'completed' | 'failed';
  vectorStatus?: 'processing' | 'completed' | 'failed';
  isLegalDocument: boolean;
  jurisdiction?: string;
  documentType?: string;
}

export default function FileDetails({ fileId, userId }: FileDetailsProps) {
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLegalMarker, setShowLegalMarker] = useState(false);

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        // This is a placeholder for the actual API call
        // In a real implementation, you would fetch the file details from your API
        const response = await fetch(`/api/files/${fileId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch file details');
        }
        
        setFile(data.file);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFileDetails();
  }, [fileId]);

  const handleLegalDocumentSuccess = (response: any) => {
    // Update the file data with the new legal document information
    setFile(response.file);
    setShowLegalMarker(false);
  };

  if (loading) {
    return <div className="p-4">Loading file details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!file) {
    return <div className="p-4">File not found</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">File Details</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-500">Filename</p>
          <p>{file.filename}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Extension</p>
          <p>{file.extension}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Size</p>
          <p>{file.size}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Upload Status</p>
          <p className={`${file.uploadStatus === 'completed' ? 'text-green-600' : file.uploadStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
            {file.uploadStatus.charAt(0).toUpperCase() + file.uploadStatus.slice(1)}
          </p>
        </div>
        {file.vectorStatus && (
          <div>
            <p className="text-sm font-medium text-gray-500">Vector Status</p>
            <p className={`${file.vectorStatus === 'completed' ? 'text-green-600' : file.vectorStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
              {file.vectorStatus.charAt(0).toUpperCase() + file.vectorStatus.slice(1)}
            </p>
          </div>
        )}
      </div>

      {file.isLegalDocument ? (
        <div className="mb-6 p-4 border rounded-md bg-blue-50">
          <h3 className="text-lg font-medium mb-2">Legal Document Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Jurisdiction</p>
              <p>{file.jurisdiction}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Document Type</p>
              <p>{file.documentType}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {showLegalMarker ? (
            <LegalDocumentMarker 
              fileId={fileId} 
              userId={userId} 
              onSuccess={handleLegalDocumentSuccess}
              onError={(err) => setError(err.message)}
            />
          ) : (
            <Button onClick={() => setShowLegalMarker(true)}>
              Mark as Legal Document
            </Button>
          )}
        </div>
      )}

      {/* Additional actions or information can be added here */}
    </div>
  );
}