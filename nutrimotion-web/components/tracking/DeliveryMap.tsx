/**
 * Delivery Map Component
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography>Loading Map...</Typography></Box>
});

interface DeliveryMapProps {
  driverLocation?: { lat: number; lng: number };
  deliveryAddress?: {
    street: string;
    parish: string;
    coordinates?: { lat: number; lng: number };
  };
}

export default function DeliveryMap({ driverLocation, deliveryAddress }: DeliveryMapProps) {
  return (
    <Box
      sx={{
        width: '100%',
        height: 450,
        bgcolor: '#f5f5f5',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}
    >
      <LeafletMap
        driverLocation={driverLocation}
        destination={deliveryAddress?.coordinates}
      />

      {!driverLocation && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(255,255,255,0.9)',
            px: 2,
            py: 1,
            borderRadius: 1,
            zIndex: 1000,
            boxShadow: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Waiting for real-time driver location...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
