import { NotificationProvider } from "@/components/shared/notification-provider";
import { NotificationButton } from "@/components/shared/notification-button";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-muted p-4 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Votex</h2>
            <NotificationButton />
          </div>
          
          {/* Navigation links would go here */}
          <nav className="space-y-2">
            {/* Navigation items */}
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </NotificationProvider>
  );
} 