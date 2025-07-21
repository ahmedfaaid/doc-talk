import { Outlet } from 'react-router';
import AppSidebar from './app-sidebar';
import { SidebarProvider } from './ui/sidebar';

export default function Layout() {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <main className='h-screen w-full pb-2'>
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
}
