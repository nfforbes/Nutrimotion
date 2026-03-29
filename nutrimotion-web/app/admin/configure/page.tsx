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
  ToggleButton,
  ToggleButtonGroup,
  Link,
  Divider,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

const MS365_FIELDS = [
  { key: 'MS365_CLIENT_ID', label: 'Azure / App Client ID', type: 'text' as const },
  { key: 'MS365_CLIENT_SECRET', label: 'Client secret', type: 'password' as const, placeholder: 'Leave blank to keep current' },
  { key: 'MS365_TENANT_ID', label: 'Tenant ID', type: 'text' as const },
  { key: 'MS365_SHAREPOINT_SITE_ID', label: 'SharePoint site ID', type: 'text' as const },
  { key: 'MS365_VIDEOS_FOLDER_PATH', label: 'Videos folder path (SharePoint)', type: 'text' as const },
  { key: 'MS365_EMAIL_FROM', label: 'Email from (Graph)', type: 'text' as const },
] as const;

const GOOGLE_FIELDS = [
  { key: 'GOOGLE_CLIENT_ID', label: 'OAuth Client ID', type: 'text' as const },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'OAuth Client Secret', type: 'password' as const, placeholder: 'Leave blank to keep current' },
  { key: 'GOOGLE_REFRESH_TOKEN', label: 'OAuth Refresh Token', type: 'password' as const, placeholder: 'Leave blank to keep current' },
  { key: 'GOOGLE_DRIVE_FOLDER_ID', label: 'Default Drive folder ID', type: 'text' as const },
] as const;

type Ms365Key = (typeof MS365_FIELDS)[number]['key'];
type GoogleKey = (typeof GOOGLE_FIELDS)[number]['key'];

type FileProvider = 'microsoft365' | 'google_drive';

const EMPTY_MS365: Record<Ms365Key, string> = {
  MS365_CLIENT_ID: '',
  MS365_CLIENT_SECRET: '',
  MS365_TENANT_ID: '',
  MS365_SHAREPOINT_SITE_ID: '',
  MS365_VIDEOS_FOLDER_PATH: '',
  MS365_EMAIL_FROM: '',
};

const EMPTY_GOOGLE: Record<GoogleKey, string> = {
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GOOGLE_REFRESH_TOKEN: '',
  GOOGLE_DRIVE_FOLDER_ID: '',
};

export default function AdminConfigurePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fileStorageProvider, setFileStorageProvider] = useState<FileProvider>('microsoft365');
  const [ms365, setMs365] = useState<Record<Ms365Key, string>>(EMPTY_MS365);
  const [googleDrive, setGoogleDrive] = useState<Record<GoogleKey, string>>(EMPTY_GOOGLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const auth = useAppSelector((state) => state.auth);
  const menuItems = getAllMenuItemsForUser(auth.permissions);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get<{
          fileStorageProvider: FileProvider;
          ms365: Record<Ms365Key, string>;
          googleDrive: Record<GoogleKey, string>;
        }>('/api/admin/settings/app');
        if (!cancelled) {
          setFileStorageProvider(res.data.fileStorageProvider ?? 'microsoft365');
          setMs365({
            ...EMPTY_MS365,
            ...res.data.ms365,
            MS365_CLIENT_SECRET: '',
          });
          setGoogleDrive({
            ...EMPTY_GOOGLE,
            ...res.data.googleDrive,
            GOOGLE_CLIENT_SECRET: '',
            GOOGLE_REFRESH_TOKEN: '',
          });
        }
      } catch {
        if (!cancelled) setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMs365Change = (key: Ms365Key) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMs365((prev) => ({ ...prev, [key]: e.target.value }));
    setMessage(null);
  };

  const handleGoogleChange = (key: GoogleKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoogleDrive((prev) => ({ ...prev, [key]: e.target.value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.put('/api/admin/settings/app', {
        fileStorageProvider,
        ms365,
        googleDrive,
      });
      setMessage({
        type: 'success',
        text:
          fileStorageProvider === 'google_drive'
            ? 'Storage settings saved. Active provider: Google Drive.'
            : 'Storage settings saved. Active provider: Microsoft 365 (SharePoint).',
      });
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
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Choose where file storage and related integrations should point: Microsoft 365 (SharePoint) or Google Drive
          (OAuth). You can configure both; only the active provider is used.
        </Typography>

        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Active file storage provider
                </Typography>
                <ToggleButtonGroup
                  value={fileStorageProvider}
                  exclusive
                  color="primary"
                  size="small"
                  sx={{ mb: 1 }}
                  onChange={(_, v: FileProvider | null) => {
                    if (v) {
                      setFileStorageProvider(v);
                      setMessage(null);
                    }
                  }}
                >
                  <ToggleButton value="microsoft365">Microsoft 365 (SharePoint)</ToggleButton>
                  <ToggleButton value="google_drive">Google Drive</ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="body2" color="text.secondary">
                  Select which integration upload features should use. Credentials for both sides can be saved below.
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Microsoft 365 & SharePoint
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  App registration in Azure AD, Graph, and SharePoint site for images, videos, and mail.
                </Typography>
                {MS365_FIELDS.map((field) => (
                  <TextField
                    key={field.key}
                    fullWidth
                    label={field.label}
                    type={field.type}
                    value={ms365[field.key]}
                    onChange={handleMs365Change(field.key)}
                    placeholder={'placeholder' in field ? field.placeholder : undefined}
                    margin="normal"
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                  />
                ))}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Google Drive (OAuth)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Uses the Google Drive API with an OAuth2 refresh token, similar to the{' '}
                  <Link
                    href="https://github.com/sickn33/antigravity-awesome-skills/blob/main/skills/google-drive-automation/SKILL.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    google-drive-automation
                  </Link>{' '}
                  skill: create an OAuth client in Google Cloud, enable the Drive API, authorize with the right scopes,
                  then store the refresh token here.{' '}
                  <strong>Google Workspace</strong> is recommended for production; consumer Gmail has tighter quotas.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Typical scope: <code>https://www.googleapis.com/auth/drive.file</code> (or broader{' '}
                  <code>drive</code> if you need full Drive access). Folder ID is the last segment of a Drive folder URL.
                </Typography>
                <Divider sx={{ my: 2 }} />
                {GOOGLE_FIELDS.map((field) => (
                  <TextField
                    key={field.key}
                    fullWidth
                    label={field.label}
                    type={field.type}
                    value={googleDrive[field.key]}
                    onChange={handleGoogleChange(field.key)}
                    placeholder={'placeholder' in field ? field.placeholder : undefined}
                    margin="normal"
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                  />
                ))}
              </CardContent>
            </Card>

            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save storage settings'}
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
}
