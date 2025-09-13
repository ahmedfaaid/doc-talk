import { useState, useEffect } from 'react';
import FileUpload from '@/components/file-upload';
import FileList from '@/components/file-list';

export default function FilesPage() {
  const [userId, setUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('list');

  useEffect(() => {
    // Simulate getting the user ID from authentication
    // In a real app, this would come from your auth context or service
    setUserId('current-user-id');
  }, []);

  const handleUploadSuccess = () => {
    // Switch to the list tab after successful upload
    setActiveTab('list');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">File Management</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`${activeTab === 'list' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Your Files
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`${activeTab === 'upload' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upload New File
            </button>
          </nav>
        </div>
      </div>
      
      <div>
        {activeTab === 'upload' ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload 
              userId={userId} 
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        ) : (
          <FileList />
        )}
      </div>
    </div>
  );
}