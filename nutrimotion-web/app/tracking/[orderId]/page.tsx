/**
 * Order Tracking Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import DeliveryMap from '@/components/tracking/DeliveryMap';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { OrderStatus } from '@/types/commerce';
import axios from 'axios';
import { useParams } from 'next/navigation';

const orderSteps = [
  OrderStatus.PURCHASED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchTrackingData();

    // Poll for updates every 10 seconds when out for delivery
    const interval = setInterval(() => {
      if (trackingData?.order?.status === OrderStatus.OUT_FOR_DELIVERY) {
        fetchTrackingData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, trackingData?.order?.status]);

  const fetchTrackingData = async () => {
    try {
      const response = await axios.get(`/api/tracking/${orderId}`);
      setTrackingData(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tracking data');
      setLoading(false);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  if (loading) {
    return (
      <>
        <AppBar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
        <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppBar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  const currentStepIndex = orderSteps.indexOf(trackingData.order.status);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Track Your Order
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Order #{trackingData.order.orderNumber}
              </Typography>
              <Chip
                label={trackingData.order.status}
                color={
                  trackingData.order.status === OrderStatus.DELIVERED
                    ? 'success'
                    : trackingData.order.status === OrderStatus.OUT_FOR_DELIVERY
                      ? 'primary'
                      : 'warning'
                }
              />
            </Box>

            <Stepper activeStep={currentStepIndex} alternativeLabel>
              {orderSteps.map((step) => (
                <Step key={step}>
                  <StepLabel
                    icon={
                      step === OrderStatus.DELIVERED ? (
                        <CheckCircleIcon color={currentStepIndex >= 3 ? 'success' : 'inherit'} />
                      ) : step === OrderStatus.OUT_FOR_DELIVERY ? (
                        <LocalShippingIcon color={currentStepIndex >= 2 ? 'primary' : 'inherit'} />
                      ) : undefined
                    }
                  >
                    {step.replace(/_/g, ' ')}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {trackingData.order.status === OrderStatus.OUT_FOR_DELIVERY && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live Tracking
              </Typography>

              {trackingData.driver && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Driver: {trackingData.driver.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {trackingData.driver.phone}
                  </Typography>
                </Box>
              )}

              <DeliveryMap
                driverLocation={trackingData.currentLocation}
                deliveryAddress={trackingData.order.deliveryAddress}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>
            <Typography variant="body2">
              {trackingData.order.deliveryAddress.street}
            </Typography>
            <Typography variant="body2">
              {trackingData.order.deliveryAddress.parish}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
