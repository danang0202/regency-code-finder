'use client';

import { useState } from 'react';
import { Container, Center, Loader, Text } from '@mantine/core';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from './AuthProvider';

export function AuthPage() {
  const { login, register, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');

  const handleLogin = async (credential: string, password: string) => {
    try {
      setError('');
      await login(credential, password);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Login failed');
      }
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      setError('');
      await register(username, email, password);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Registration failed');
      }
    }
  };

  const switchToRegister = () => {
    setIsLoginMode(false);
    setError('');
  };

  const switchToLogin = () => {
    setIsLoginMode(true);
    setError('');
  };

  if (isLoading) {
    return (
      <Container size="sm" style={{ minHeight: '100vh' }}>
        <Center style={{ height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md">Loading...</Text>
          </div>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="sm" style={{ minHeight: '100vh', paddingTop: '10vh' }}>
      {isLoginMode ? (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={switchToRegister}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={switchToLogin}
          isLoading={isLoading}
          error={error}
        />
      )}
    </Container>
  );
}