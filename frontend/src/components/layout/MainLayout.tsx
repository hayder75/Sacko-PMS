import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="lg:pl-60">
        <TopNav />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

