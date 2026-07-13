'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import type { CouponDoc } from './AddCouponForm';

interface ClientOption {
  id: string;
  name: string;
  email: string;
}

export interface SendCouponDialogProps {
  coupon: CouponDoc | null;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export default function SendCouponDialog({ coupon, open, onClose, onSent }: SendCouponDialogProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selected, setSelected] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError(null);
    setSuccess(null);
    setLoadingClients(true);
    axios
      .get<ClientOption[]>('/api/admin/coupons/clients')
      .then((res) => setClients(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoadingClients(false));
  }, [open]);

  const handleSend = async () => {
    if (!coupon || selected.length === 0) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.post(`/api/admin/coupons/${coupon._id}/send`, {
        userIds: selected.map((c) => c.id),
      });
      const { sent, alreadySent } = res.data;
      const parts = [];
      if (sent > 0) parts.push(`sent to ${sent} client${sent === 1 ? '' : 's'}`);
      if (alreadySent > 0) parts.push(`${alreadySent} already had this coupon`);
      setSuccess(parts.join('; ') || 'Done');
      onSent?.();
      if (sent > 0) {
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to send coupon';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send coupon to clients</DialogTitle>
      <DialogContent>
        {coupon && (
          <Box sx={{ mb: 2 }}>
            <Chip label={coupon.code} color="primary" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary" component="span">
              {coupon.description}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loadingClients ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Autocomplete
            multiple
            options={clients}
            getOptionLabel={(o) => `${o.name} (${o.email})`}
            value={selected}
            onChange={(_, v) => setSelected(v)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select clients"
                placeholder="Search by name or email"
                helperText="Selected clients will see this coupon on their dashboard when they log in"
              />
            )}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          onClick={handleSend}
          disabled={sending || selected.length === 0 || !coupon}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
