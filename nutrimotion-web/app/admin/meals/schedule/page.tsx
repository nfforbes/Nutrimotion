/**
 * Legacy meal schedule URL — redirects to the calendar Meal Management page.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AdminMealScheduleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/meals');
  }, [router]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 8 }}>
      <CircularProgress size={28} />
      <Typography color="text.secondary">Redirecting to Meal Management…</Typography>
    </Box>
  );
}
