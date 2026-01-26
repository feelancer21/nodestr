import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl items-stretch gap-6 px-6 py-8">
        <AppSidebar />
        <main className="flex-1 min-w-0 space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
