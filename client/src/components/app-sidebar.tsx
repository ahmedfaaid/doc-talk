import { open } from '@tauri-apps/plugin-dialog';
import { FolderPlus, FolderUp } from 'lucide-react';
import { useContext } from 'react';
import { SelectedDirectoryContext } from '../context/directory-dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from './ui/sidebar';

export default function AppSidebar() {
  const { directory, setDirectory } = useContext(SelectedDirectoryContext);

  const handleSelectDirectory = async () => {
    const directory = await open({
      multiple: false,
      directory: true
    });

    if (directory) {
      setDirectory(directory);
    } else {
      setDirectory(null);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className='p-4'>
        <SidebarMenu>
          <SidebarMenuItem>
            {directory ? (
              <span className='text-sm text-slate-700 break-words'>
                <span className='font-semibold'>Selected folder:</span>{' '}
                {directory}
              </span>
            ) : (
              <span className='text-sm text-slate-700'>
                You have not selected a folder to index
              </span>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem className='mb-2'>
            <SidebarMenuButton
              onClick={handleSelectDirectory}
              className='p-5 bg-sky-700 text-white hover:bg-sky-900 hover:text-white'
            >
              <FolderPlus />
              Select a folder to index
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              disabled={!directory}
              className='p-5 bg-green-800 text-white hover:bg-green-900 hover:text-white'
            >
              <FolderUp />
              Index folder
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      {/* TODO: Handle multiple chat threads in the future */}
      <SidebarContent className='p-4'>
        <Button>Start a new chat</Button>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
