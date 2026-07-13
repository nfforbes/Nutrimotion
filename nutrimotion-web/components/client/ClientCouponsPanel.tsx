'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { formatCouponValue } from '@/lib/discount/formatCoupon';

interface SentCoupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  stackable: boolean;
  oneTimePerUser: boolean;
  sentAt: string;
}

export default function ClientCouponsPanel() {
  const [coupons, setCoupons] = useState<SentCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    axios
      .get<SentCoupon[]>('/api/coupons/mine')
      .then((res) => setCoupons(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Could not load your coupons'))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setSnackbar(`Copied ${code}`);
    } catch {
      setSnackbar(code);
    }
  };

  const handleApply = async (code: string) => {
    setApplyingCode(code);
    try {
      await axios.post('/api/cart/discount', { code });
      setSnackbar(`${code} applied — opening cart`);
      setTimeout(() => router.push('/cart'), 800);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to apply coupon';
      setSnackbar(msg);
    } finally {
      setApplyingCode(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalOfferIcon color="primary" /> Your Coupons
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Coupons sent to you — valid and ready to use at checkout
      </Typography>

      <Grid container spacing={2}>
        {coupons.map((coupon) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={coupon.id}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderColor: 'primary.light',
                borderWidth: 1,
                borderStyle: 'dashed',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip label={coupon.code} color="primary" size="small" />
                  <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                    {formatCouponValue(coupon.type, coupon.value)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1.5, minHeight: 40 }}>
                  {coupon.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  Expires {new Date(coupon.validUntil).toLocaleDateString()}
                  {coupon.minOrderAmount != null && coupon.minOrderAmount > 0
                    ? ` · Min order $${coupon.minOrderAmount.toFixed(2)}`
                    : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => handleCopy(coupon.code)}
                  >
                    Copy
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={applyingCode === coupon.code}
                    onClick={() => handleApply(coupon.code)}
                  >
                    {applyingCode === coupon.code ? 'Applying…' : 'Use in cart'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
