import { ReactNode } from 'react';
import AppSidebar from './app-sidebar';
import { SidebarProvider } from './ui/sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className='w-full min-h-full'>{children}</main>
      </SidebarProvider>
    </>
  );
}
