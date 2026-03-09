'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  TextField,
  Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

const FIELDS = [
  { key: 'MS365_CLIENT_ID', label: 'MS365 Client ID', type: 'text' },
  { key: 'MS365_CLIENT_SECRET', label: 'MS365 Client Secret', type: 'password', placeholder: 'Leave blank to keep current' },
  { key: 'MS365_TENANT_ID', label: 'MS365 Tenant ID', type: 'text' },
  { key: 'MS365_SHAREPOINT_SITE_ID', label: 'MS365 SharePoint Site ID', type: 'text' },
  { key: 'MS365_VIDEOS_FOLDER_PATH', label: 'MS365 Videos Folder Path', type: 'text' },
  { key: 'MS365_EMAIL_FROM', label: 'MS365 Email From', type: 'text' },
] as const;

type Ms365Keys = typeof FIELDS[number]['key'];

export default function AdminConfigurePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [values, setValues] = useState<Record<Ms365Keys, string>>({
    MS365_CLIENT_ID: '',
    MS365_CLIENT_SECRET: '',
    MS365_TENANT_ID: '',
    MS365_SHAREPOINT_SITE_ID: '',
    MS365_VIDEOS_FOLDER_PATH: '',
    MS365_EMAIL_FROM: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<Record<Ms365Keys, string>>('/api/admin/settings/ms365');
        if (!cancelled) {
          setValues({
            MS365_CLIENT_ID: res.data.MS365_CLIENT_ID ?? '',
            MS365_CLIENT_SECRET: '', // never prefill secret
            MS365_TENANT_ID: res.data.MS365_TENANT_ID ?? '',
            MS365_SHAREPOINT_SITE_ID: res.data.MS365_SHAREPOINT_SITE_ID ?? '',
            MS365_VIDEOS_FOLDER_PATH: res.data.MS365_VIDEOS_FOLDER_PATH ?? '',
            MS365_EMAIL_FROM: res.data.MS365_EMAIL_FROM ?? '',
          });
        }
      } catch {
        if (!cancelled) setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key: Ms365Keys) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.put('/api/admin/settings/ms365', values);
      setMessage({ type: 'success', text: 'MS365 settings saved. Image and video uploads can use Microsoft 365.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon /> Configure
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Microsoft 365 settings for uploading images and videos to SharePoint.
        </Typography>

        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Card>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                {message && (
                  <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                    {message.text}
                  </Alert>
                )}
                {FIELDS.map((field) => (
                  <TextField
                    key={field.key}
                    fullWidth
                    label={field.label}
                    type={field.type}
                    value={values[field.key]}
                    onChange={handleChange(field.key)}
                    placeholder={'placeholder' in field ? field.placeholder : undefined}
                    margin="normal"
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                  />
                ))}
                <Box sx={{ mt: 3 }}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Saving…' : 'Save MS365 settings'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}
