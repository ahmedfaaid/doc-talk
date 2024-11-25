import { ApiResponse } from '@/types';
import { invoke } from '@tauri-apps/api/core';
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
  const { directory, setDirectory, indexed, setIndexed } = useContext(
    SelectedDirectoryContext
  );

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

  const handleIndexDirectory = async () => {
    try {
      const indexDirectory: ApiResponse = await invoke('indexDirectory', {
        directory
      });

      if (indexDirectory.directory === null) {
        setIndexed(false);
        alert('Failed to index the directory');
      } else {
        setIndexed(true);
        alert('Directory indexed successfully');
      }
    } catch (error) {
      setIndexed(false);
      alert('Failed to index the directory');
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className='p-4'>
        <SidebarMenu>
          <SidebarMenuItem>
            {directory ? (
              <span className='break-words text-sm text-slate-700'>
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
              className='bg-sky-700 p-5 text-white hover:bg-sky-900 hover:text-white'
            >
              <FolderPlus />
              Select a folder to index
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              disabled={!directory || indexed}
              className='bg-green-800 p-5 text-white hover:bg-green-900 hover:text-white'
              onClick={handleIndexDirectory}
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
