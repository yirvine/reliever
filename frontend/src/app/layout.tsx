import type { Metadata } from "next";
import "./globals.css";
import { VesselProvider } from "./context/VesselContext";
import { CaseProvider } from "./context/CaseContext";
import { SidebarProvider } from "./components/SidebarLayout";
import Sidebar from "./components/Sidebar";
import MainContentWrapper from "./components/MainContentWrapper";

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
        className="font-inter antialiased"
      >
        <CaseProvider>
          <VesselProvider>
            <SidebarProvider>
              <Sidebar />
              <MainContentWrapper>
                {children}
              </MainContentWrapper>
            </SidebarProvider>
          </VesselProvider>
        </CaseProvider>
      </body>
    </html>
  );
}
