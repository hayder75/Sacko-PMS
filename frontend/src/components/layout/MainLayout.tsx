import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useUser();

  // Wait for user context to finish loading (UserContext already calls loadUser on mount)
  useEffect(() => {
    // UserContext loads user on mount, so we just wait for it to finish
    if (user !== null || isAuthenticated === false) {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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

