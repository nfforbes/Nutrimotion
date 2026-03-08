/**
 * Client Dashboard Page
 * Redirects to main dashboard or shows client-specific dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function ClientDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main dashboard
    router.replace('/dashboard');
  }, [router]);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}
