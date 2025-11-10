'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Stack, Alert, Paper, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface RegisterFormProps {
  onRegister: (username: string, email: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string;
}

export function RegisterForm({ onRegister, onSwitchToLogin, isLoading, error }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Basic validation
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Invalid email format');
      return;
    }

    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await onRegister(username.trim(), email.trim(), password);
    } catch (error) {
      console.error('Register form error:', error);
    }
  };

  return (
    <Paper shadow="md" p="xl" radius="md" style={{ maxWidth: 400, margin: 'auto' }}>
      <Title order={2} ta="center" mb="md">
        Register
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
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />

          <TextInput
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
          >
            Register
          </Button>

          <Button
            variant="subtle"
            fullWidth
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Already have an account? Login
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}