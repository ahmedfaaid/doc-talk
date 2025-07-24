import { uploadedFiles } from '@/lib/data';
import { UploadFile } from '@/types';
import { FileText, Plus, Upload } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

interface UploadFilesDialog {
  isUploadDialogOpen: boolean;
  setIsUploadDialogOpen: Dispatch<SetStateAction<boolean>>;
  handleFileUpload: (e: FileList | null) => void;
  uploadFiles: UploadFile[];
}

export default function UploadFilesDialog({
  isUploadDialogOpen,
  setIsUploadDialogOpen,
  handleFileUpload,
  uploadFiles
}: UploadFilesDialog) {
  return (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button className='bg-palette-pink hover:bg-palette-coral text-palette-white w-full rounded-full shadow-md transition-all duration-200'>
          <Upload className='mr-2 h-4 w-4' />
          Upload files
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-palette-white border-palette-light-gray max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-palette-navy'>
            Manage Documents
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          {/* Already Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className='space-y-3'>
              <h4 className='text-palette-navy text-sm font-medium'>
                Uploaded Files
              </h4>
              <ScrollArea className='max-h-40'>
                <div className='space-y-2'>
                  {uploadedFiles.map((fileName, index) => (
                    <div
                      key={index}
                      className='bg-palette-warm-white border-palette-cool-gray flex items-center gap-2 rounded-lg border p-2'
                    >
                      <FileText className='text-palette-blue h-4 w-4' />
                      <span className='text-palette-navy flex-1 truncate text-sm'>
                        {fileName}
                      </span>
                      <Badge className='bg-green-100 text-xs text-green-800'>
                        Ready
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Select Files Button */}
          <div className='border-palette-light-gray border-t pt-4'>
            <input
              type='file'
              multiple
              className='hidden'
              id='file-upload'
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              className='bg-palette-orange hover:bg-palette-amber text-palette-white w-full rounded-full'
            >
              <Plus className='mr-2 h-4 w-4' />
              Select files
            </Button>
          </div>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className='border-palette-light-gray space-y-3 border-t pt-4'>
              <h4 className='text-palette-navy text-sm font-medium'>
                Upload Progress
              </h4>
              {uploadFiles.map((file, index) => (
                <div key={index} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <FileText className='text-palette-blue h-4 w-4' />
                      <span className='text-palette-navy truncate text-sm'>
                        {file.name}
                      </span>
                    </div>
                    <Badge
                      variant={
                        file.status === 'completed' ? 'default' : 'secondary'
                      }
                      className={`text-xs ${
                        file.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : file.status === 'processing'
                            ? 'bg-palette-amber text-palette-navy'
                            : 'bg-palette-cool-gray text-palette-navy'
                      }`}
                    >
                      {file.status === 'uploading'
                        ? 'Uploading'
                        : file.status === 'processing'
                          ? 'Processing'
                          : file.status === 'completed'
                            ? 'Ready'
                            : 'Error'}
                    </Badge>
                  </div>
                  <Progress value={file.progress} className='h-2' />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
