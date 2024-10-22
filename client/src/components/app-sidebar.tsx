import { open } from '@tauri-apps/plugin-dialog';
import { FolderPlus, FolderUp } from 'lucide-react';
import { useContext } from 'react';
import { SelectedDirectoryContext } from '../context/directory-dialog';
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
  const { setDirectory } = useContext(SelectedDirectoryContext);

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
      <SidebarHeader className='px-4'>
        <SidebarMenu>
          <SidebarMenuItem>
            <span className='text-sm text-slate-700'>
              You have not selected a folder to index
            </span>
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
              disabled
              className='p-5 bg-green-800 text-white hover:bg-green-900 hover:text-white'
            >
              <FolderUp />
              Index folder
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
