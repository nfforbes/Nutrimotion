/**
 * WhatsApp compose page — opens WhatsApp with the message pre-filled to the admin-configured number.
 */

'use client';

import { useState } from 'react';
import { Container, Typography, Card, CardContent, TextField, Button, Box } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { useContactWhatsApp } from '@/lib/contact/useContactWhatsApp';
import { formatWhatsAppDisplay, whatsAppLink } from '@/lib/contact/whatsappLink';

const WHATSAPP_GREEN = '#25D366';

export default function WhatsAppComposePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);
  const digits = useContactWhatsApp();
  const firstName = auth.user?.name?.split(' ')[0];
  const [message, setMessage] = useState(
    `Hi Nutrimotion${firstName ? `, this is ${firstName}` : ''}. `
  );

  const send = () => {
    window.open(whatsAppLink(digits, message.trim()), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={getAllMenuItemsForUser(auth.permissions)}
      />
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          WhatsApp Us
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Write your message and we&apos;ll open WhatsApp so you can send it to our team.
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WhatsAppIcon sx={{ color: WHATSAPP_GREEN }} />
              <Typography variant="subtitle1">{formatWhatsAppDisplay(digits)}</Typography>
            </Box>
            <TextField
              label="Your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
            <Button
              fullWidth
              variant="contained"
              startIcon={<WhatsAppIcon />}
              disabled={!message.trim()}
              onClick={send}
              sx={{ mt: 2, bgcolor: WHATSAPP_GREEN, color: '#fff', '&:hover': { bgcolor: '#1da851' } }}
            >
              Send on WhatsApp
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
