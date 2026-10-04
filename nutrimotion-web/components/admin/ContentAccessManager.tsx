'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

export interface AccessItem {
  _id: string;
  title: string;
  isFree?: boolean;
  freeShortUrl?: string;
}

interface AccessSettings {
  spotlightMode: 'preferred' | 'random';
  preferredIds: string[];
  randomCount: number;
  weekStart: string;
  thisWeekIds: string[];
}

export interface ContentAccessManagerProps {
  library: 'recipes' | 'videos';
  items: AccessItem[];
  onItemsChanged: () => void;
}

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback;
  }
  return fallback;
}

export default function ContentAccessManager({ library, items, onItemsChanged }: ContentAccessManagerProps) {
  const [settings, setSettings] = useState<AccessSettings | null>(null);
  const [randomCount, setRandomCount] = useState('3');
  const [shortUrls, setShortUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const isVideos = library === 'videos';
  const noun = isVideos ? 'video' : 'recipe';

  const loadSettings = async () => {
    try {
      const { data } = await axios.get<AccessSettings>(`/api/admin/content-access?library=${library}`);
      setSettings(data);
      setRandomCount(String(data.randomCount));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Could not load access settings.'));
    }
  };

  useEffect(() => {
    loadSettings();
  }, [library, items.length]);

  useEffect(() => {
    setShortUrls(Object.fromEntries(items.map((item) => [item._id, item.freeShortUrl ?? ''])));
  }, [items]);

  const saveSettings = async (patch: Record<string, unknown>) => {
    try {
      const { data } = await axios.patch<AccessSettings>('/api/admin/content-access', { library, ...patch });
      setSettings(data);
      setRandomCount(String(data.randomCount));
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Could not save.'));
    }
  };

  const patchItem = async (id: string, patch: Record<string, unknown>) => {
    try {
      await axios.patch(`/api/admin/uploads/${library}/${id}`, patch);
      setError(null);
      onItemsChanged();
    } catch (e) {
      setError(errorMessage(e, `Could not update the ${noun}.`));
    }
  };

  const togglePreferred = (id: string, checked: boolean) => {
    if (!settings) return;
    const next = checked
      ? [...new Set([...settings.preferredIds, id])]
      : settings.preferredIds.filter((existing) => existing !== id);
    saveSettings({ preferredIds: next });
  };

  const thisWeek = new Set(settings?.thisWeekIds ?? []);
  const preferred = new Set(settings?.preferredIds ?? []);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Who can see these {noun}s
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Subscribers see everything. Everyone else sees free {noun}s and this week&apos;s picks
          {isVideos ? ', plus the short clip of any video with a free short' : ''}.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {settings && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">This week (from {settings.weekStart}):</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={settings.spotlightMode}
              onChange={(_, mode) => mode && saveSettings({ spotlightMode: mode })}
            >
              <ToggleButton value="preferred">Preferred</ToggleButton>
              <ToggleButton value="random">Random</ToggleButton>
            </ToggleButtonGroup>
            {settings.spotlightMode === 'random' && (
              <>
                <TextField
                  size="small"
                  type="number"
                  label={`How many ${noun}s`}
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  sx={{ width: 150 }}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <Button variant="outlined" onClick={() => saveSettings({ randomCount: Number(randomCount) })}>
                  Save count
                </Button>
                <Button onClick={() => saveSettings({ reshuffle: true })}>Pick again</Button>
              </>
            )}
          </Box>
        )}

        {items.length === 0 ? (
          <Typography color="text.secondary">No {noun}s yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Free for everyone</TableCell>
                <TableCell>This week</TableCell>
                {isVideos && <TableCell>Free short URL</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.isFree === true}
                      onChange={(_, checked) => patchItem(item._id, { isFree: checked })}
                      inputProps={{ 'aria-label': `Free for everyone: ${item.title}` }}
                    />
                  </TableCell>
                  <TableCell>
                    {settings?.spotlightMode === 'preferred' ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={preferred.has(item._id)}
                            onChange={(_, checked) => togglePreferred(item._id, checked)}
                          />
                        }
                        label=""
                        aria-label={`This week: ${item.title}`}
                      />
                    ) : (
                      <Typography variant="body2" color={thisWeek.has(item._id) ? 'primary' : 'text.secondary'}>
                        {thisWeek.has(item._id) ? 'Picked' : '—'}
                      </Typography>
                    )}
                  </TableCell>
                  {isVideos && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="https://…"
                          value={shortUrls[item._id] ?? ''}
                          onChange={(e) => setShortUrls((prev) => ({ ...prev, [item._id]: e.target.value }))}
                          sx={{ minWidth: 220 }}
                        />
                        <Button
                          size="small"
                          disabled={(shortUrls[item._id] ?? '') === (item.freeShortUrl ?? '')}
                          onClick={() => patchItem(item._id, { freeShortUrl: shortUrls[item._id] ?? '' })}
                        >
                          Save
                        </Button>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
