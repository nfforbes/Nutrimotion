/**
 * Terms of Service Page
 */

import { Container, Typography, Box } from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Nutrimotion',
  description: 'Nutrimotion terms of service and use',
};

export default function TermsPage() {
  return (
    <>
      <AppBar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: {new Date().toLocaleDateString('en-US')}
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to Nutrimotion. By accessing or using our meal planning, delivery, and related services
          (&quot;Services&quot;), you agree to be bound by these Terms of Service.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Use of Services
        </Typography>
        <Typography variant="body1" paragraph>
          You must use the Services in compliance with applicable laws and these terms. You are responsible
          for maintaining the confidentiality of your account and for all activity under your account.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Orders and Payment
        </Typography>
        <Typography variant="body1" paragraph>
          Orders are subject to availability. Payment is due at the time of order unless otherwise agreed.
          We reserve the right to refuse or cancel orders. Refund and cancellation policies are described
          at checkout.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Changes
        </Typography>
        <Typography variant="body1" paragraph>
          We may update these terms from time to time. Continued use of the Services after changes
          constitutes acceptance of the updated terms.
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
