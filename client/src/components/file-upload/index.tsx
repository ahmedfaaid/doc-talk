import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface FileUploadProps {
  userId: string;
  onUploadSuccess?: (fileData: any) => void;
  onUploadError?: (error: any) => void;
}

export default function FileUpload({ 
  userId, 
  onUploadSuccess, 
  onUploadError 
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLegalDocument, setIsLegalDocument] = useState(false);
  const [jurisdiction, setJurisdiction] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    // Validate legal document fields if applicable
    if (isLegalDocument && (!jurisdiction || !documentType)) {
      setError('Jurisdiction and document type are required for legal documents');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('filename', selectedFile.name);
    formData.append('extension', selectedFile.name.split('.').pop() || '');
    formData.append('originalPath', selectedFile.name);
    formData.append('size', selectedFile.size.toString());
    formData.append('batchId', crypto.randomUUID());
    formData.append('accessLevel', 'user'); // Default access level
    formData.append('isLegal', isLegalDocument.toString());
    
    if (isLegalDocument) {
      formData.append('jurisdiction', jurisdiction);
      formData.append('documentType', documentType);
    }

    try {
      // Upload the file
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || 'Failed to upload file');
      }

      // If we have a progress URL, monitor the upload progress
      if (uploadData.file.progressUrl) {
        const progressUrl = uploadData.file.progressUrl;
        const eventSource = new EventSource(progressUrl);

        eventSource.addEventListener('progress', (event) => {
          const progressData = JSON.parse(event.data);
          setUploadProgress(progressData.percentage || 0);
          
          if (progressData.status === 'completed') {
            eventSource.close();
            setSuccess('File uploaded successfully');
            setUploading(false);
            if (onUploadSuccess) onUploadSuccess(uploadData.file);
          } else if (progressData.status === 'failed') {
            eventSource.close();
            setError('File upload failed');
            setUploading(false);
            if (onUploadError) onUploadError(new Error('File upload failed'));
          }
        });

        eventSource.addEventListener('error', (event) => {
          eventSource.close();
          let errorMessage = 'Error monitoring upload progress';
          
          // Check if event is a MessageEvent with data
          if (event instanceof MessageEvent && event.data) {
            try {
              const errorData = JSON.parse(event.data);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // If JSON parsing fails, use the default error message
            }
          }
          
          setError(errorMessage);
          setUploading(false);
          if (onUploadError) onUploadError(new Error(errorMessage));
        });
      } else {
        // If no progress URL, assume upload is complete
        setSuccess('File uploaded successfully');
        setUploading(false);
        if (onUploadSuccess) onUploadSuccess(uploadData.file);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setUploading(false);
      if (onUploadError) onUploadError(err);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setIsLegalDocument(false);
    setJurisdiction('');
    setDocumentType('');
    setUploadProgress(0);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h3 className="text-lg font-medium mb-2">Upload File</h3>
      <Separator className="mb-4" />
      
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-2 rounded mb-4 text-sm">
          {success}
          <Button 
            variant="link" 
            className="text-green-700 p-0 h-auto text-sm" 
            onClick={resetForm}
          >
            Upload another file
          </Button>
        </div>
      )}
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-1">
            Select File
          </label>
          <Input
            ref={fileInputRef}
            id="file"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            required
          />
          {selectedFile && (
            <p className="mt-1 text-sm text-gray-500">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
        
        <div className="flex items-center">
          <input
            id="isLegalDocument"
            type="checkbox"
            checked={isLegalDocument}
            onChange={(e) => setIsLegalDocument(e.target.checked)}
            disabled={uploading}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="isLegalDocument" className="ml-2 block text-sm">
            This is a legal document
          </label>
        </div>
        
        {isLegalDocument && (
          <div className="space-y-4 p-3 border rounded-md bg-gray-50">
            <div>
              <label htmlFor="jurisdiction" className="block text-sm font-medium mb-1">
                Jurisdiction
              </label>
              <Input
                id="jurisdiction"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g., California, Federal"
                disabled={uploading}
                required={isLegalDocument}
              />
            </div>
            
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium mb-1">
                Document Type
              </label>
              <Input
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g., Contract, Statute, Case Law"
                disabled={uploading}
                required={isLegalDocument}
              />
            </div>
          </div>
        )}
        
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-sm text-gray-500 mt-1">
              Uploading: {uploadProgress}%
            </p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button type="submit" disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
          
          {selectedFile && !uploading && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}