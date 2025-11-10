'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth/AuthProvider';
import { Loader, Center, Container } from '@mantine/core';
import Header from './Header';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        router.push('/auth');
      } else if (isAuthenticated && isPublicRoute) {
        // Already authenticated and trying to access auth page
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router]);

  if (isLoading) {
    return (
      <Container size="lg" style={{ minHeight: '100vh' }}>
        <Center style={{ minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <div style={{ marginTop: 16 }}>Loading...</div>
          </div>
        </Center>
      </Container>
    );
  }

  // Show auth page without header
  if (isPublicRoute) {
    return children;
  }

  // Show protected content with header
  if (isAuthenticated) {
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  // Fallback - shouldn't reach here due to useEffect redirect
  return null;
}