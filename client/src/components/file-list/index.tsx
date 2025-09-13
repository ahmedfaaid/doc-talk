import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FileDetails from '@/components/file-details';

interface File {
  id: string;
  filename: string;
  extension: string;
  size: string;
  uploadStatus: 'uploading' | 'completed' | 'failed';
  isLegalDocument: boolean;
}

export default function FileList() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>(''); // This would come from authentication context in a real app

  useEffect(() => {
    // Simulate getting the user ID from authentication
    // In a real app, this would come from your auth context or service
    setUserId('current-user-id');
    
    const fetchFiles = async () => {
      try {
        // This is a placeholder for the actual API call
        // In a real implementation, you would fetch the files from your API
        const response = await fetch('/api/files');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch files');
        }
        
        setFiles(data.files);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId === selectedFileId ? null : fileId);
  };

  if (loading) {
    return <div className="p-4">Loading files...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (files.length === 0) {
    return <div className="p-4">No files found. Upload some files to get started.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Your Files</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">File List</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div 
                key={file.id} 
                className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedFileId === file.id ? 'bg-blue-50 border-blue-300' : ''}`}
                onClick={() => handleFileSelect(file.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{file.filename}</p>
                    <p className="text-sm text-gray-500">{file.extension} • {file.size}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.isLegalDocument && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Legal
                      </span>
                    )}
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${
                        file.uploadStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : file.uploadStatus === 'failed' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {file.uploadStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded-md">
          {selectedFileId ? (
            <FileDetails fileId={selectedFileId} userId={userId} />
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>Select a file to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}