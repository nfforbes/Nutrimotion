'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { formatBytes, uploadMealPhoto, type MealPhotoUploadResult } from '@/lib/images/uploadMealPhoto';

interface MealPhotoDialogProps {
  open: boolean;
  mealName: string;
  currentUrl?: string;
  onClose: () => void;
  /** Called after the image is in storage; save the URL against the meal here. */
  onUploaded: (url: string) => Promise<void> | void;
}

function imageFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) return item.getAsFile();
  }
  return null;
}

export default function MealPhotoDialog({ open, mealName, currentUrl, onClose, onUploaded }: MealPhotoDialogProps) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<MealPhotoUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setDone(null);
      setDragging(false);
    }
  }, [open]);

  const handleFile = async (file: File | null | undefined) => {
    if (!file || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const result = await uploadMealPhoto(file, mealName || 'meal');
      await onUploaded(result.url);
      setDone(result);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (err instanceof Error ? err.message : 'Upload failed.');
      setError(message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleFileRef = useRef(handleFile);
  handleFileRef.current = handleFile;

  useEffect(() => {
    if (!open) return;
    const onPaste = (event: ClipboardEvent) => {
      const file = imageFromClipboard(event);
      if (!file) return;
      event.preventDefault();
      handleFileRef.current(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open]);

  const preview = done?.url || currentUrl;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Photo for {mealName || 'this meal'}</DialogTitle>
      <DialogContent>
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/')));
          }}
          onClick={() => !busy && fileInputRef.current?.click()}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            bgcolor: dragging ? 'action.hover' : 'grey.50',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {busy ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 2 }}>
              <CircularProgress size={24} />
              <Typography>Uploading…</Typography>
            </Box>
          ) : preview ? (
            <Box
              component="img"
              src={preview}
              alt={mealName}
              sx={{ maxWidth: '100%', maxHeight: 260, borderRadius: 1, objectFit: 'contain' }}
            />
          ) : (
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
          )}
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            <strong>Paste a screenshot (Ctrl+V)</strong>, drag an image here, or click to choose a file.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            JPG, PNG or WebP. Images over 5 MB are reduced automatically.
          </Typography>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            handleFile(file);
          }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {done && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Photo saved
            {done.reduced
              ? ` — reduced from ${formatBytes(done.originalBytes)} to ${formatBytes(done.finalBytes)}.`
              : ` (${formatBytes(done.finalBytes)}).`}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {done ? 'Done' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
