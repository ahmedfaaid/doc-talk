import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface LegalDocumentMarkerProps {
  fileId: string;
  userId: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export default function LegalDocumentMarker({
  fileId,
  userId,
  onSuccess,
  onError
}: LegalDocumentMarkerProps) {
  const [jurisdiction, setJurisdiction] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/files/legal/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fileId,
          jurisdiction,
          documentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark file as legal document');
      }

      setSuccess('File marked as legal document successfully');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h3 className="text-lg font-medium mb-2">Mark as Legal Document</h3>
      <Separator className="mb-4" />
      
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-2 rounded mb-4 text-sm">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jurisdiction" className="block text-sm font-medium mb-1">
            Jurisdiction
          </label>
          <Input
            id="jurisdiction"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="e.g., California, Federal"
            required
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
            required
          />
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Mark as Legal Document'}
        </Button>
      </form>
    </div>
  );
}