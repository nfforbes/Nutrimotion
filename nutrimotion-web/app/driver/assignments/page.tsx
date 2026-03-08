/**
 * Driver Assignments Page
 * Shows detailed view of driver's assigned deliveries
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchAssignmentsRequest, updateDeliveryStatusRequest } from '@/store/slices/deliverySlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { OrderStatus } from '@/types/commerce';

export default function DriverAssignmentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { assignments } = useAppSelector((state) => state.delivery);
  const auth = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    dispatch(fetchAssignmentsRequest());
    
    // Poll for new assignments every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchAssignmentsRequest());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
  const handleStartDelivery = (assignmentId: string) => {
    dispatch(
      updateDeliveryStatusRequest({
        assignmentId,
        status: OrderStatus.OUT_FOR_DELIVERY,
      })
    );
  };
  
  const handleMarkDelivered = (assignmentId: string) => {
    dispatch(
      updateDeliveryStatusRequest({
        assignmentId,
        status: OrderStatus.DELIVERED,
      })
    );
  };
  
  const menuItems = getAllMenuItemsForUser(auth.permissions);
  
  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AssignmentIcon fontSize="large" color="primary" />
          <Typography variant="h4">
            My Deliveries
          </Typography>
        </Box>
        
        {assignments.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No active deliveries at the moment
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6">{assignment.customerName}</Typography>
                    <Chip
                      label={assignment.status}
                      color={assignment.status === 'out_for_delivery' ? 'primary' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  <List dense>
                    <ListItem>
                      <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <ListItemText
                        primary="Phone"
                        secondary={assignment.customerPhone || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <LocationOnIcon sx={{ mr: 2, color: 'text.secondary' }} />
                      <ListItemText
                        primary="Address"
                        secondary={
                          assignment.customerAddress
                            ? `${assignment.customerAddress.street}, ${assignment.customerAddress.city}, ${assignment.customerAddress.state} ${assignment.customerAddress.zipCode}`
                            : 'Not provided'
                        }
                      />
                    </ListItem>
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {assignment.status === 'preparing' && (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleStartDelivery(assignment.id)}
                      >
                        Start Delivery
                      </Button>
                    )}
                    {assignment.status === 'out_for_delivery' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={() => handleMarkDelivered(assignment.id)}
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
}
