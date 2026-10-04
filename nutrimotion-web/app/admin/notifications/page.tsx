'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { formatWhatsAppDisplay, normalizeWhatsApp } from '@/lib/contact/whatsappLink';

interface Recipient {
  id: string;
  name: string;
  email: string;
  devices: number;
  platforms: string[];
}

interface HistoryRow {
  id: string;
  target: 'user' | 'all';
  userLabel: string | null;
  title: string;
  message: string;
  devices: number;
  reached: number;
  failed: number;
  sentBy: string | null;
  createdAt: string;
}

interface NotificationsState {
  configured: { android: boolean; ios: boolean };
  totalDevices: number;
  recipients: Recipient[];
  history: HistoryRow[];
}

type Feedback = { ok: boolean; text: string } | null;

function errorText(e: unknown, fallback: string): string {
  return (axios.isAxiosError(e) && (e.response?.data?.error || e.response?.data?.message)) || fallback;
}

function WhatsAppCard() {
  const [saved, setSaved] = useState('');
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    axios
      .get<{ whatsapp: string }>('/api/admin/contact')
      .then(({ data }) => {
        setSaved(data.whatsapp);
        setValue(data.whatsapp);
      })
      .catch(() => setFeedback({ ok: false, text: 'Could not load the WhatsApp number.' }));
  }, []);

  const digits = normalizeWhatsApp(value);

  const save = async () => {
    try {
      const { data } = await axios.patch<{ whatsapp: string }>('/api/admin/contact', { whatsapp: value });
      setSaved(data.whatsapp);
      setValue(data.whatsapp);
      setFeedback({ ok: true, text: 'Saved. The website and app now use this number.' });
    } catch (e) {
      setFeedback({ ok: false, text: errorText(e, 'Could not save the number.') });
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WhatsAppIcon sx={{ color: '#25D366' }} />
          <Typography variant="h6">WhatsApp number</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customers who tap &quot;WhatsApp Us&quot; on the website or app message this number. Include the
          country code.
        </Typography>
        <TextField
          fullWidth
          size="small"
          label="WhatsApp number"
          placeholder="18764282339"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={value.length > 0 && !digits}
          helperText={digits ? formatWhatsAppDisplay(digits) : 'Digits only, 10–15 with country code'}
        />
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={save}
          disabled={!digits || digits === saved}
        >
          Save
        </Button>
        {feedback && (
          <Alert severity={feedback.ok ? 'success' : 'error'} sx={{ mt: 2 }}>
            {feedback.text}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function SendCard({ state, onSent }: { state: NotificationsState | null; onSent: () => void }) {
  const [target, setTarget] = useState<'user' | 'all'>('user');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const configured = state?.configured;
  const anyConfigured = !!configured && (configured.android || configured.ios);
  const canSend =
    !sending && anyConfigured && title.trim() && message.trim() && (target === 'all' || recipient);

  const send = async () => {
    setSending(true);
    setFeedback(null);
    try {
      const { data } = await axios.post<{ devices: number; reached: number; failed: number; errors: string[] }>(
        '/api/admin/notifications',
        { target, userId: recipient?.id, title, message }
      );
      const ok = data.reached > 0;
      setFeedback({
        ok,
        text: ok
          ? `Delivered to ${data.reached} of ${data.devices} phone${data.devices === 1 ? '' : 's'}.`
          : `Not delivered (${data.failed} failed). ${data.errors?.[0] ?? ''}`.trim(),
      });
      if (ok) {
        setTitle('');
        setMessage('');
      }
      onSent();
    } catch (e) {
      setFeedback({ ok: false, text: errorText(e, 'Could not send the notification.') });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <NotificationsActiveIcon color="primary" />
          <Typography variant="h6">Send a push notification</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Appears in the phone&apos;s notification tray. Only customers who signed in to the app and allowed
          notifications can receive it.
        </Typography>
        {configured && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              size="small"
              color={configured.android ? 'success' : 'default'}
              label={`Android ${configured.android ? 'ready' : 'not set up'}`}
            />
            <Chip
              size="small"
              color={configured.ios ? 'success' : 'default'}
              label={`iPhone ${configured.ios ? 'ready' : 'not set up'}`}
            />
          </Box>
        )}
        {configured && !anyConfigured && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Push is not set up yet. Add the Firebase and Apple keys to the website settings to start sending.
          </Alert>
        )}

        <RadioGroup row value={target} onChange={(e) => setTarget(e.target.value as 'user' | 'all')}>
          <FormControlLabel value="user" control={<Radio />} label="One customer" />
          <FormControlLabel
            value="all"
            control={<Radio />}
            label={`Everyone${state ? ` (${state.totalDevices} phone${state.totalDevices === 1 ? '' : 's'})` : ''}`}
          />
        </RadioGroup>

        {target === 'user' && (
          <Autocomplete
            sx={{ mt: 1 }}
            options={state?.recipients ?? []}
            value={recipient}
            onChange={(_, v) => setRecipient(v)}
            getOptionLabel={(r) => `${r.name} (${r.email})`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="No customers have enabled notifications yet"
            renderInput={(params) => <TextField {...params} size="small" label="Customer" />}
          />
        )}

        <TextField
          fullWidth
          size="small"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 2 }}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mt: 2 }}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={send} disabled={!canSend}>
          {sending ? 'Sending…' : 'Send notification'}
        </Button>
        {feedback && (
          <Alert severity={feedback.ok ? 'success' : 'error'} sx={{ mt: 2 }}>
            {feedback.text}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminNotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);
  const [state, setState] = useState<NotificationsState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    axios
      .get<NotificationsState>('/api/admin/notifications')
      .then(({ data }) => {
        setState(data);
        setLoadError(null);
      })
      .catch((e) => setLoadError(errorText(e, 'Could not load notifications.')));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Contact &amp; notifications
        </Typography>
        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <WhatsAppCard />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <SendCard state={state} onSent={load} />
          </Grid>
        </Grid>

        <Typography variant="h5" sx={{ mt: 5, mb: 1 }}>
          Sent notifications
        </Typography>
        {state && state.history.length === 0 ? (
          <Typography color="text.secondary">Nothing sent yet.</Typography>
        ) : (
          <Card variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sent</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell align="right">Delivered</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {state?.history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{row.target === 'all' ? 'Everyone' : row.userLabel}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>{row.message}</TableCell>
                    <TableCell align="right">
                      {row.reached}/{row.devices}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Container>
    </>
  );
}
