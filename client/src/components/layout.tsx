import { ReactNode } from 'react';
import AppSidebar from './app-sidebar';
import { SidebarProvider } from './ui/sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <main className='w-full h-screen'>{children}</main>
      </SidebarProvider>
    </div>
  );
}
