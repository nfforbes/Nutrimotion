/**
 * Privacy Policy Page
 */

import { Container, Typography, Box } from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Nutrimotion',
  description: 'Nutrimotion privacy policy and data practices',
};

export default function PrivacyPage() {
  return (
    <>
      <AppBar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: {new Date().toLocaleDateString('en-US')}
        </Typography>
        <Typography variant="body1" paragraph>
          Nutrimotion (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
          This policy describes how we collect, use, and safeguard your information when you use our meal planning
          and delivery services.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We may collect personal information you provide, such as name, email address, delivery address,
          payment information, and dietary preferences. We also collect usage data to improve our services.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          Your information is used to process orders, personalize your experience, communicate with you,
          and improve our platform. We do not sell your personal information to third parties.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Contact
        </Typography>
        <Typography variant="body1" paragraph>
          For questions about this privacy policy, please contact us through the app or at the contact
          information provided in your account settings.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <Typography component="span" color="primary.main">← Back to Home</Typography>
          </Link>
        </Box>
      </Container>
    </>
  );
}
