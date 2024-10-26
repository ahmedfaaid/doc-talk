import { FolderX } from 'lucide-react';

export default function NoDirectory() {
  return (
    <div className='w-full h-full flex items-center justify-center flex-col'>
      <FolderX className='h-16 w-16 text-red-400' />
      <p className='leading-7 text-lg mt-2'>
        You have not selected a folder to index
      </p>
      <p className='leading-7 text-md mt-2 italic'>
        Select a folder to index and chat with in the sidebar
      </p>
    </div>
  );
}
