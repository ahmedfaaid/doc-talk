import { ReactNode } from 'react';
import SelectedDirectoryProvider from '../context/directory-dialog';
import AppSidebar from './app-sidebar';
import { SidebarProvider } from './ui/sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SelectedDirectoryProvider>
      <SidebarProvider>
        <AppSidebar />
        <main>{children}</main>
      </SidebarProvider>
    </SelectedDirectoryProvider>
  );
}
