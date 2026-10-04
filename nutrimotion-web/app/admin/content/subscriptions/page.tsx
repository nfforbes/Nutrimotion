'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { Permission } from '@/types/auth';

type Library = 'recipes' | 'videos';

const LIBRARIES: { library: Library; label: string; permission: Permission }[] = [
  { library: 'recipes', label: 'Recipes', permission: Permission.MANAGE_RECIPES },
  { library: 'videos', label: 'Videos', permission: Permission.MANAGE_VIDEOS },
];

function PriceCard({ library, label }: { library: Library; label: string }) {
  const [saved, setSaved] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    axios
      .get<{ monthlyPrice: number }>(`/api/admin/content-access?library=${library}`)
      .then(({ data }) => {
        setSaved(data.monthlyPrice);
        setPrice(String(data.monthlyPrice));
      })
      .catch(() => setMessage({ ok: false, text: 'Could not load the price.' }));
  }, [library]);

  const save = async () => {
    try {
      const { data } = await axios.patch<{ monthlyPrice: number }>('/api/admin/content-access', {
        library,
        monthlyPrice: Number(price),
      });
      setSaved(data.monthlyPrice);
      setPrice(String(data.monthlyPrice));
      setMessage({ ok: true, text: 'Saved' });
    } catch (e) {
      const text = axios.isAxiosError(e) ? e.response?.data?.error : null;
      setMessage({ ok: false, text: text || 'Could not save the price.' });
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {label} subscription
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Monthly price. Customers cannot subscribe while the price is 0.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            type="number"
            label="Price per month"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              htmlInput: { min: 0, step: '0.01' },
            }}
          />
          <Button variant="contained" onClick={save} disabled={saved !== null && Number(price) === saved}>
            Save
          </Button>
        </Box>
        {message && (
          <Alert severity={message.ok ? 'success' : 'error'} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSubscriptionPricesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);
  const visible = LIBRARIES.filter((l) => auth.permissions?.includes(l.permission));

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Subscription prices
        </Typography>
        <Grid container spacing={3}>
          {visible.map((l) => (
            <Grid size={{ xs: 12, sm: 6 }} key={l.library}>
              <PriceCard library={l.library} label={l.label} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
