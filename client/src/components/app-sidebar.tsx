import { useAuth } from '@/context/auth';
import { chatThreads } from '@/lib/data';
import { error, success } from '@/lib/toasts';
import { UploadFile } from '@/types';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Thread from './thread';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import UploadFilesDialog from './upload-files-dialog';

export default function AppSidebar() {
  // const { directory, setDirectory, indexed, setIndexed, name, setName } =
  //   useContext(SelectedDirectoryContext);
  const { user, token, logout } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  // const folderNameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (directory !== null && !indexed) {
  //     folderNameRef.current!.focus();
  //   }
  // }, [directory, indexed]);

  const handleLogout = async () => {
    const res = await logout(token as string);

    if (res.success) {
      success(res.message as string);
      navigate('/login');
    } else {
      error(res.message as string);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = Array.from(files).map((file) => ({
      name: file.name,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadFiles(newFiles);

    // Simulate upload progress
    newFiles.forEach((_file, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadFiles((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, progress: 100, status: 'processing' } : f
            )
          );

          // Simulate processing
          setTimeout(() => {
            setUploadFiles((prev) =>
              prev.map((f, i) =>
                i === index ? { ...f, status: 'completed' } : f
              )
            );
            // Add completed file to uploaded files list
            // setUploadedFiles((prev) => [...prev, file.name])
          }, 2000);
        } else {
          setUploadFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          );
        }
      }, 200);
    });
  };

  return (
    <div className='bg-palette-white border-palette-light-gray flex w-80 flex-col border-r shadow-lg'>
      {/* Header */}
      <div className='from-palette-navy to-palette-dark-blue bg-gradient-to-r p-6'>
        {/* File Management Section */}
        <div className='space-y-3'>
          <UploadFilesDialog
            isUploadDialogOpen={isUploadDialogOpen}
            setIsUploadDialogOpen={setIsUploadDialogOpen}
            handleFileUpload={handleFileUpload}
            uploadFiles={uploadFiles}
          />
        </div>
      </div>

      {/* Chat Threads */}
      <div className='bg-palette-warm-white flex flex-1 flex-col'>
        <div className='p-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-primary font-medium'>Chat History</h2>
            <Button
              size='sm'
              className='bg-palette-coral hover:bg-palette-orange text-palette-white rounded-full p-2 shadow-md'
            >
              <Plus className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <ScrollArea className='flex-1'>
          <div className='space-y-2 p-2'>
            {chatThreads.map((thread) => (
              <Thread thread={thread} key={thread.id} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* User Profile */}
      <div className='border-palette-light-gray from-palette-navy to-palette-dark-blue border-t bg-gradient-to-r p-4'>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild className='cursor-pointer'>
            <div className='flex items-center gap-3'>
              <Avatar className='ring-palette-pink h-10 w-10 ring-2'>
                <AvatarImage src='https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' />
                <AvatarFallback className='from-palette-coral to-palette-orange text-palette-white bg-gradient-to-r font-semibold'>
                  AF
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='text-palette-white text-sm font-medium'>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className='text-palette-cream truncate text-xs'>
                  {user?.email}
                </p>
              </div>
            </div>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            side='right'
            className='ml-4 w-44 rounded-sm bg-white p-4'
          >
            <DropdownMenu.Item className='hover:outline-none'>
              <Button
                className='bg-palette-coral w-full'
                onClick={handleLogout}
              >
                <LogOut /> Logout
              </Button>
            </DropdownMenu.Item>
            <DropdownMenu.Arrow className='fill-white' />
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
