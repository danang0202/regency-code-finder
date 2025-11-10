import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MantineProviderClient from "../components/MantineProviderClient";
import { AuthProvider } from "../components/auth/AuthProvider";
import ProtectedLayout from "../components/ProtectedLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Regency Code Finder",
  description: "Upload and process CSV/Excel files with real-time collaboration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MantineProviderClient>
          <AuthProvider>
            <ProtectedLayout>
              {children}
            </ProtectedLayout>
          </AuthProvider>
        </MantineProviderClient>
      </body>
    </html>
  );
}
