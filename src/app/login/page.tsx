'use client';

import { AuthPage } from '@/components/auth/AuthPage';

export default function LoginPage() {
  return (
    // Don't wrap with ProtectedLayout - this is standalone
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <AuthPage />
    </div>
  );
}