/**
 * Root Layout
 */

import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ReduxProvider from '@/components/providers/ReduxProvider';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: 'Nutrimotion - Meal Planning & Delivery',
  description: 'Professional meal planning and delivery service with personalized training',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Auth0Provider>
          <ReduxProvider>
            <ThemeProvider>
              <TopBar />
              <main style={{ flex: 1 }}>
                {children}
              </main>
              <Footer />
            </ThemeProvider>
          </ReduxProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
