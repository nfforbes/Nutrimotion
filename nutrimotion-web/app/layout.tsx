/**
 * Root Layout
 */

import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ReduxProvider from '@/components/providers/ReduxProvider';

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
      <body suppressHydrationWarning>
        <Auth0Provider>
          <ReduxProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ReduxProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
