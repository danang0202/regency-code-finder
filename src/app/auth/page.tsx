'use client';

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { AuthPage } from '@/components/auth/AuthPage';

function AuthPageContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    // Redirect to home page or dashboard
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
    return <div>Redirecting...</div>;
  }

  return <AuthPage />;
}

export default function AuthPageWrapper() {
  return (
    <AuthProvider>
      <AuthPageContent />
    </AuthProvider>
  );
}