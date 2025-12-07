import type { Metadata } from "next";
import "./globals.css";
import { VesselProvider } from "./context/VesselContext";
import { CaseProvider } from "./context/CaseContext";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./components/SidebarLayout";
import Sidebar from "./components/Sidebar";
import MainContentWrapper from "./components/MainContentWrapper";
import VesselLoadingOverlay from "./components/VesselLoadingOverlay";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PostHogProvider } from "./provider";

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
      <body className="font-inter antialiased">
        <PostHogProvider>
          <ErrorBoundary>
            <AuthProvider>
              <ErrorBoundary>
                <VesselProvider>
                  <ErrorBoundary>
                    <CaseProvider>
                      <ErrorBoundary>
                        <SidebarProvider>
                          <Sidebar />
                          <VesselLoadingOverlay />
                          <MainContentWrapper>
                            {children}
                          </MainContentWrapper>
                        </SidebarProvider>
                      </ErrorBoundary>
                    </CaseProvider>
                  </ErrorBoundary>
                </VesselProvider>
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  );
}
