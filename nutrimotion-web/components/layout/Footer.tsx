/**
 * Footer / Bottom Bar
 * Shows Privacy Policy and Terms of Service links across the app.
 */

'use client';

import { Box, Typography, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        mt: 'auto',
        py: 2,
        px: { xs: 2, sm: 2 },
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <MuiLink
          component={Link}
          href="/privacy"
          color="text.secondary"
          underline="hover"
          sx={{ fontSize: '0.875rem' }}
        >
          Privacy Policy
        </MuiLink>
        <Typography component="span" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          •
        </Typography>
        <MuiLink
          component={Link}
          href="/terms"
          color="text.secondary"
          underline="hover"
          sx={{ fontSize: '0.875rem' }}
        >
          Terms of Service
        </MuiLink>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontSize: '0.875rem' }}>
          © {currentYear} Nutrimotion
        </Typography>
      </Box>
    </Box>
  );
}
