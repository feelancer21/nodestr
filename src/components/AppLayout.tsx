import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';
import { HeaderArea } from './layout/HeaderArea';

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Mobile/Tablet header - visible below xl */}
      <MobileHeader />

      <div className="mx-auto flex max-w-7xl items-stretch gap-6 px-2 sm:px-6 pt-20 pb-2 sm:pb-8 xl:pt-8">
        <AppSidebar />
        {/* Right side wrapper: HeaderArea + Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Desktop header - only above main content, not sidebar */}
          <HeaderArea />
          <main className="flex-1 min-w-0 space-y-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
