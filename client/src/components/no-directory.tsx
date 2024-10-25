import { FolderX } from 'lucide-react';

export default function NoDirectory() {
  return (
    <div className='w-full h-full flex items-center justify-center flex-col'>
      <FolderX className='h-20 w-20 text-red-400' />
      <p className='leading-7 text-xl mt-2'>
        You have not selected a folder to index
      </p>
      <p className='leading-7 text-lg mt-2 italic'>
        Select a folder to index and chat with in the sidebar
      </p>
    </div>
  );
}
