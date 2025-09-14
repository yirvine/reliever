import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VesselProvider } from "./context/VesselContext";
import { CaseProvider } from "./context/CaseContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReliefGuard - Pressure Relief & Rupture Disc Sizing",
  description: "Modern web application for sizing pressure relief valves and rupture discs following NFPA 30, API 521, and ASME VIII guidelines",
  icons: {
    icon: '/ReliefGuardLogoTransparent.png',
    shortcut: '/ReliefGuardLogoTransparent.png',
    apple: '/ReliefGuardLogoTransparent.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CaseProvider>
          <VesselProvider>
            {children}
          </VesselProvider>
        </CaseProvider>
      </body>
    </html>
  );
}
