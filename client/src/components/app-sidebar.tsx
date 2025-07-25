import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';
import { error, success } from '@/lib/toasts';
import { ApiResponse } from '@/types';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderPlus, FolderUp, LogOut } from 'lucide-react';
import { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
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
  const { directory, setDirectory, indexed, setIndexed, name, setName } =
    useContext(SelectedDirectoryContext);
  const { user, token, logout } = useAuth();
  const folderNameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (directory !== null && !indexed) {
      folderNameRef.current!.focus();
    }
  }, [directory, indexed]);

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
      const indexDirectory: ApiResponse = await invoke('index_directory', {
        directoryPath: directory,
        name
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

  const handleLogout = async () => {
    const res = await logout(token as string);

    if (res.success) {
      success(res.message as string);
      navigate('/login');
    } else {
      error(res.message as string);
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
            <Input
              disabled={false}
              type='text'
              placeholder='Enter a name for your folder'
              className='focus-visible:ring-green-500'
              ref={folderNameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
      <SidebarFooter className='border-t'>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                asChild
                className='cursor-pointer rounded-sm p-4 data-[state=open]:bg-slate-400 hover:bg-slate-200'
              >
                <div className='flex items-center'>
                  <Avatar.Root className='mr-4 inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full align-middle'>
                    <Avatar.Image
                      src='https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
                      alt='Black business lady'
                      className='h-full w-full object-cover'
                    />
                    <Avatar.Fallback
                      className='flex h-full w-full items-center justify-center bg-white font-medium leading-none text-gray-700'
                      delayMs={600}
                    >
                      CT
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div className='flex flex-col'>
                    <span className='text-sm font-semibold'>
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className='text-xs text-gray-500'>{user?.email}</span>
                  </div>
                </div>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className='mb-4 w-40 rounded-sm bg-white p-4'>
                <DropdownMenu.Item className='hover:outline-none'>
                  <Button className='w-full' onClick={handleLogout}>
                    <LogOut /> Logout
                  </Button>
                </DropdownMenu.Item>
                <DropdownMenu.Arrow />
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
