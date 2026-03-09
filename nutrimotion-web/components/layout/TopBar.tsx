/**
 * Small top bar above the main AppBar.
 * Shows contact phone number with WhatsApp link on the right.
 */

'use client';

import { Box, Typography, Link } from '@mui/material';

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+1 (555) 123-4567';

/** Phone number digits only for WhatsApp (E.164 without +) */
function getWhatsAppHref(displayPhone: string): string {
  const digits = displayPhone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default function TopBar() {
  const whatsappHref = getWhatsAppHref(CONTACT_PHONE);

  return (
    <Box
      component="div"
      sx={{
        py: 0.75,
        px: 2,
        bgcolor: '#ee4d24',
        color: 'black',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        fontSize: '0.8125rem',
      }}
    >
      <Link
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: 'black',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          '&:hover': { color: 'grey.900', textDecoration: 'underline' },
        }}
      >
        <Typography component="span" sx={{ fontSize: 'inherit' }}>
          {CONTACT_PHONE}
        </Typography>
        <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600 }}>
          WhatsApp
        </Typography>
      </Link>
    </Box>
  );
}
