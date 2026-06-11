/**
 * Small top bar above the main AppBar.
 * Shows contact phone number with WhatsApp link on the right.
 */

'use client';

import { Box, Typography, Link, SvgIcon, Button } from '@mui/material';

/** Default digits; wa.me link uses the same digits without separators. */
const CONTACT_PHONE_DISPLAY = '18764282339';

const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || CONTACT_PHONE_DISPLAY;

function WhatsAppIcon() {
  return (
    <SvgIcon viewBox="0 0 24 24" sx={{ width: 32, height: 32, color: 'white' }}>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
    />
  </SvgIcon>
  );
}

/** Phone number digits only for WhatsApp (E.164 without +) */
function getWhatsAppHref(displayPhone: string): string {
  const digits = displayPhone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default function TopBar() {
  const whatsappHref = getWhatsAppHref(CONTACT_PHONE);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        right: { xs: 16, md: 24 },
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2,
      }}
    >
      <Link
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        sx={{ display: 'block' }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            bgcolor: '#25D366',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
              bgcolor: '#20ba59'
            },
          }}
        >
          <WhatsAppIcon />
        </Box>
      </Link>
      
      <Button
        href="https://cal.com/malik-reid-sdeiig/consultations"
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
        sx={{
          bgcolor: '#ee4d24',
          color: 'white',
          borderRadius: 28,
          px: 3,
          py: 1.5,
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'transform 0.2s',
          '&:hover': {
            bgcolor: '#da451f',
            transform: 'scale(1.05)'
          }
        }}
      >
        Book Consultation
      </Button>
    </Box>
  );
}
