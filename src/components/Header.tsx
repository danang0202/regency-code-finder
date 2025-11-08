"use client";

import React from "react";
import { Group, Header as MantineHeader, Container, Avatar, Menu, Text } from "@mantine/core";
import { IconUser, IconMenu2 } from "@tabler/icons-react";

export default function Header() {
  return (
    <MantineHeader height={64} px="md">
      <Container size="lg" style={{ height: "100%" }}>
        <Group position="apart" align="center" style={{ height: "100%" }}>
          <Group spacing="sm" align="center">
            <img src="/logo.png" alt="logo" style={{ height: 36 }} />
            <Text weight={700}>MyApp</Text>
          </Group>

          <Group spacing={16}>
            <Text>Home</Text>
            <Text>Upload</Text>
            <Text>About</Text>
          </Group>

          <Menu>
            <Menu.Target>
              <Avatar color="blue" radius="xl">
                <IconUser />
              </Avatar>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconMenu2 />}>Profile</Menu.Item>
              <Menu.Item>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Container>
    </MantineHeader>
  );
}
