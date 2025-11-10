'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Stack, Alert, Paper, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface LoginFormProps {
  onLogin: (credential: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({ onLogin, onSwitchToRegister, isLoading, error }: LoginFormProps) {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Basic validation
    if (!credential.trim()) {
      setValidationError('Username or email is required');
      return;
    }

    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    try {
      await onLogin(credential.trim(), password);
    } catch (error) {
      console.error('Login form error:', error);
    }
  };

  return (
    <Paper shadow="md" p="xl" radius="md" style={{ maxWidth: 400, margin: 'auto' }}>
      <Title order={2} ta="center" mb="md">
        Login
      </Title>

      <form onSubmit={handleSubmit}>
        <Stack spacing="sm">
          {(error || validationError) && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              color="red"
              variant="light"
            >
              {error || validationError}
            </Alert>
          )}

          <TextInput
            label="Username or Email"
            placeholder="Enter your username or email"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            required
            disabled={isLoading}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!credential.trim() || !password.trim()}
          >
            Login
          </Button>

          <Button
            variant="subtle"
            fullWidth
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            Don&apos;t have an account? Register
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}