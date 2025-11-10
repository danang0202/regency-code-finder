"use client";

import React from "react";
import { Group, Header as MantineHeader, Container, Avatar, Menu, Text, Button } from "@mantine/core";
import { IconLogout, IconLogin } from "@tabler/icons-react";
import { useAuth } from "./auth/AuthProvider";

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') {
        window.location.replace('/auth');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.replace('/auth');
    }
  };

  return (
    <MantineHeader height={64} px="md">
      <Container size="lg" style={{ height: "100%" }}>
        <Group position="apart" align="center" style={{ height: "100%" }}>
          <Group spacing="sm" align="center">
            <Text weight={700} size="lg">Region Code Finder</Text>
          </Group>

          <Group spacing={16}>
            <Text>Home</Text>
            <Text>Upload</Text>
            <Text>About</Text>
          </Group>

          {isLoading ? (
            <div>Loading...</div>
          ) : isAuthenticated && user ? (
            <Menu>
              <Menu.Target>
                <Avatar color="blue" radius="xl" style={{ cursor: 'pointer' }}>
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.username}</Menu.Label>
                <Menu.Item 
                  icon={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button 
              leftIcon={<IconLogin size={14} />}
              onClick={handleLogin}
              variant="light"
            >
              Login
            </Button>
          )}
        </Group>
      </Container>
    </MantineHeader>
  );
}
