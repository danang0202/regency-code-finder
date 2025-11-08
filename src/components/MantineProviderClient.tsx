"use client";

import React from "react";
import {
  MantineProvider,
} from "@mantine/core";

export default function MantineProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider withNormalizeCSS withGlobalStyles theme={{ colorScheme: 'light' }}>
      {children}
    </MantineProvider>
  );
}
