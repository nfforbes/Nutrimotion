/**
 * Driver Profile Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import axios from 'axios';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

interface ProfileDoc {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: { street?: string; parish?: string };
}

export default function DriverProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [parish, setParish] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<ProfileDoc>('/api/users/me/profile');
        if (cancelled) return;
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setStreet(data.address?.street || '');
        setParish(data.address?.parish || '');
      } catch {
        if (!cancelled) {
          setName(auth.user?.name || '');
          setEmail(auth.user?.email || '');
          setFeedback({ ok: false, text: 'Could not load your profile.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.user?.email, auth.user?.name]);

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await axios.patch('/api/users/me/profile', {
        name: name.trim(),
        phone,
        address: { street, parish },
      });
      setFeedback({ ok: true, text: 'Profile saved.' });
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Could not save your profile.';
      setFeedback({ ok: false, text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Driver Profile
        </Typography>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              {feedback && (
                <Alert severity={feedback.ok ? 'success' : 'error'} onClose={() => setFeedback(null)}>
                  {feedback.text}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <TextField fullWidth label="Email" value={email} disabled />
              <TextField
                fullWidth
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Parish"
                value={parish}
                onChange={(e) => setParish(e.target.value)}
                disabled={loading}
              />
              <Button variant="contained" fullWidth onClick={save} disabled={loading || saving || !name.trim()}>
                {saving ? 'Saving…' : 'Save Profile'}
              </Button>
              <DeleteAccountSection />
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
