/**
 * Root Layout
 */

import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ReduxProvider from '@/components/providers/ReduxProvider';
import Footer from '@/components/layout/Footer';
import TopBar from '@/components/layout/TopBar';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Nutrimotion Jamaica | Premium Meal Prep & Personal Training',
  description: 'Professional meal planning, healthy delivery services, and personal training coaching in Jamaica. Transform your body with structured nutrition.',
  openGraph: {
    title: 'Nutrimotion Jamaica | Premium Meal Prep & Personal Training',
    description: 'Professional meal planning, healthy delivery services, and personal training coaching in Jamaica. Transform your body with structured nutrition.',
    url: 'https://www.nutrimotionjamaica.com',
    siteName: 'Nutrimotion Jamaica',
    locale: 'en_JM',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nutrimotion Jamaica | Premium Meal Prep & Personal Training',
    description: 'Professional meal planning, healthy delivery services, and personal training coaching in Jamaica. Transform your body with structured nutrition.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
        }}
      >
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xloiqdp9xb");
          `}
        </Script>
        <Auth0Provider>
          <ReduxProvider>
            <ThemeProvider>
              <TopBar />
              <main
                style={{
                  flex: 1,
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
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
