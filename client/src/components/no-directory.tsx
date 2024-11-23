import { SelectedDirectoryContext } from '@/context/directory-dialog';
import { FolderUp, FolderX } from 'lucide-react';
import { useContext } from 'react';

export default function NoDirectory() {
  const { directory, indexed } = useContext(SelectedDirectoryContext);

  return (
    <>
      {!directory ? (
        <div className='flex h-full w-full flex-col items-center justify-center'>
          <FolderX className='h-16 w-16 text-red-400' />
          <p className='mt-2 text-lg leading-7'>
            You have not selected a folder to index
          </p>
          <p className='text-md mt-2 italic leading-7'>
            Select a folder to index and chat with in the sidebar
          </p>
        </div>
      ) : directory && !indexed ? (
        <div className='flex h-full w-full flex-col items-center justify-center'>
          <FolderUp className='h-16 w-16 text-red-400' />
          <p className='mt-2 text-lg leading-7'>
            You have selected: {directory}
          </p>
          <p className='text-md mt-2 italic leading-7'>
            Click the "Index Folder" button in the sidebar to index the folder
            and start chatting
          </p>
        </div>
      ) : null}
    </>
  );
}
