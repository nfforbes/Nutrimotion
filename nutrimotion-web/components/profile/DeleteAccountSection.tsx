'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import axios from 'axios';

/**
 * In-app account deletion (App Store / Play Store requirement).
 * Calls DELETE /api/users/me, then signs the user out.
 */
export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await axios.delete('/api/users/me');
      // Clear the Auth0 session after the account is gone.
      window.location.href = '/auth/logout';
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Could not delete your account. Please try again.';
      setError(message);
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="h6" gutterBottom>
        Delete account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Permanently removes your account, profile, cart, subscriptions and notification settings.
        Orders already on the way will still be delivered. This cannot be undone.
      </Typography>
      <Button color="error" variant="outlined" onClick={() => { setError(null); setOpen(true); }}>
        Delete my account
      </Button>

      <Dialog open={open} onClose={() => !deleting && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This permanently deletes your Nutrimotion account and personal data. You will be signed out
            afterwards. This cannot be undone.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
