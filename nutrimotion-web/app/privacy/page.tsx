/**
 * Privacy Policy Page
 */

import { Container, Typography, Box } from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Link from 'next/link';
import { Metadata } from 'next';
import { getContactWhatsApp, whatsAppLink } from '@/lib/contact/whatsapp';
import { formatWhatsAppDisplay } from '@/lib/contact/whatsappLink';

export const metadata: Metadata = {
  title: 'Privacy Policy - Nutrimotion',
  description: 'Nutrimotion privacy policy and data practices',
};

export const dynamic = 'force-dynamic';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        {title}
      </Typography>
      {children}
    </>
  );
}

export default async function PrivacyPage() {
  const whatsapp = await getContactWhatsApp();

  return (
    <>
      <AppBar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: October 12, 2026
        </Typography>
        <Typography variant="body1" paragraph>
          Nutrimotion (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) runs this website and the Nutrimotion
          mobile app for meal planning and delivery. This policy explains what information we collect, how we use it,
          who we share it with, and how you can delete it.
        </Typography>

        <Section title="Information We Collect">
          <Typography variant="body1" component="div">
            <ul>
              <li>
                <strong>Account details</strong> - your name and email address, provided when you sign in.
              </li>
              <li>
                <strong>Contact and delivery details</strong> - phone number, delivery address and delivery
                instructions you enter in your profile or at checkout.
              </li>
              <li>
                <strong>Orders</strong> - the meals, packages and other items you order, and their status.
              </li>
              <li>
                <strong>Driver location</strong> - only for delivery drivers, and only when a driver taps
                &quot;Share location&quot; on a delivery. Customers never share their location with us.
              </li>
              <li>
                <strong>Device push token</strong> - if you allow notifications, so we can send order updates.
              </li>
              <li>
                <strong>Photos</strong> - only staff who choose to upload a meal photo. The app only receives the
                photo you pick.
              </li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph>
            We do not use advertising identifiers, we do not track you across other companies&apos; apps or
            websites, and we do not sell your personal information.
          </Typography>
        </Section>

        <Section title="How We Use Your Information">
          <Typography variant="body1" paragraph>
            We use your information to run your account, prepare and deliver your orders, let you follow your
            delivery, send order updates, and - only if you turn on promotional notifications in your profile - send
            news and offers. You can turn promotional notifications off at any time in your profile.
          </Typography>
        </Section>

        <Section title="Who We Share It With">
          <Typography variant="body1" paragraph>
            We share information only with the service providers that run Nutrimotion for us: Auth0 (sign-in),
            MongoDB Atlas (database), Vercel (hosting and image storage), and Apple Push Notification service and
            Google Firebase Cloud Messaging (notifications). They may use the information only to provide their
            service to us and must protect it at least as well as this policy does. Your delivery driver sees the
            name, address and phone number needed to deliver your order.
          </Typography>
        </Section>

        <Section title="How Long We Keep It">
          <Typography variant="body1" paragraph>
            We keep your account information while your account is open. When you delete your account, we delete
            your profile, cart, subscriptions, coupons and notification settings straight away. Records of completed
            orders are kept for bookkeeping without your address. Orders still being prepared or delivered keep the
            delivery address until they are delivered.
          </Typography>
        </Section>

        <Section title="Deleting Your Account">
          <Typography variant="body1" paragraph>
            In the mobile app, open Profile and tap &quot;Delete account&quot;. You can also ask us to delete your
            account using the contact details below.
          </Typography>
        </Section>

        <Section title="Children">
          <Typography variant="body1" paragraph>
            Nutrimotion is not directed at children under 13, and we do not knowingly collect their information.
          </Typography>
        </Section>

        <Section title="Contact">
          <Typography variant="body1" paragraph>
            For questions about this policy or your data, message us on WhatsApp at{' '}
            <a href={whatsAppLink(whatsapp)} style={{ color: 'inherit' }}>
              {formatWhatsAppDisplay(whatsapp)}
            </a>
            .
          </Typography>
        </Section>

        <Box sx={{ mt: 4 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Typography component="span" color="primary.main">← Back to Home</Typography>
          </Link>
        </Box>
      </Container>
    </>
  );
}
