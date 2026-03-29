'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

export interface CouponDoc {
  _id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount?: number;
  stackable: boolean;
  oneTimePerUser: boolean;
  active: boolean;
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function toInputDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface AddCouponFormProps {
  initialCoupon?: CouponDoc | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddCouponForm({ initialCoupon, onSuccess, onCancel }: AddCouponFormProps) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [code, setCode] = useState(initialCoupon?.code ?? '');
  const [description, setDescription] = useState(initialCoupon?.description ?? '');
  const [type, setType] = useState<'percentage' | 'fixed'>(initialCoupon?.type ?? 'percentage');
  const [value, setValue] = useState(initialCoupon?.value ?? 10);
  const [minOrderAmount, setMinOrderAmount] = useState(
    initialCoupon?.minOrderAmount != null ? String(initialCoupon.minOrderAmount) : ''
  );
  const [maxDiscount, setMaxDiscount] = useState(
    initialCoupon?.maxDiscount != null ? String(initialCoupon.maxDiscount) : ''
  );
  const [validFrom, setValidFrom] = useState(
    initialCoupon ? toInputDate(new Date(initialCoupon.validFrom)) : toInputDate(now)
  );
  const [validUntil, setValidUntil] = useState(
    initialCoupon ? toInputDate(new Date(initialCoupon.validUntil)) : toInputDate(weekFromNow)
  );
  const [usageLimit, setUsageLimit] = useState(
    initialCoupon?.usageLimit != null ? String(initialCoupon.usageLimit) : ''
  );
  /** Exactly one redemption total across all accounts (`usageLimit === 1`). */
  const [singleUseGlobal, setSingleUseGlobal] = useState(initialCoupon?.usageLimit === 1);
  const [stackable, setStackable] = useState(initialCoupon?.stackable ?? false);
  const [oneTimePerUser, setOneTimePerUser] = useState(initialCoupon?.oneTimePerUser ?? false);
  const [active, setActive] = useState(initialCoupon?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCoupon) {
      setCode(initialCoupon.code);
      setDescription(initialCoupon.description);
      setType(initialCoupon.type);
      setValue(initialCoupon.value);
      setMinOrderAmount(initialCoupon.minOrderAmount != null ? String(initialCoupon.minOrderAmount) : '');
      setMaxDiscount(initialCoupon.maxDiscount != null ? String(initialCoupon.maxDiscount) : '');
      setValidFrom(toInputDate(new Date(initialCoupon.validFrom)));
      setValidUntil(toInputDate(new Date(initialCoupon.validUntil)));
      const lim = initialCoupon.usageLimit;
      setUsageLimit(lim != null ? String(lim) : '');
      setSingleUseGlobal(lim === 1);
      setStackable(initialCoupon.stackable);
      setOneTimePerUser(initialCoupon.oneTimePerUser);
      setActive(initialCoupon.active);
    }
  }, [initialCoupon]);

  const handleSubmit = async () => {
    setError(null);
    if (!code.trim()) {
      setError('Code is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount === '' ? undefined : Number(minOrderAmount),
        maxDiscount: maxDiscount === '' ? undefined : Number(maxDiscount),
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        usageLimit: singleUseGlobal ? 1 : usageLimit === '' ? undefined : Number(usageLimit),
        stackable,
        oneTimePerUser,
        active,
      };

      if (initialCoupon) {
        await axios.patch(`/api/admin/coupons/${initialCoupon._id}`, payload);
      } else {
        await axios.post('/api/admin/coupons', payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to save coupon';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onCancel} size="small">
            Back
          </Button>
          <Typography variant="h6">{initialCoupon ? 'Edit Coupon' : 'New Coupon'}</Typography>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              helperText="Shown to customers (uppercase)"
            />
            {!initialCoupon && (
              <Button variant="outlined" sx={{ mt: 1, flexShrink: 0 }} onClick={() => setCode(randomCode())}>
                Generate
              </Button>
            )}
          </Box>
          <TextField
            fullWidth
            label="Description (customer-facing)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <TextField select fullWidth label="Discount type" value={type} onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}>
            <MenuItem value="percentage">Percentage off</MenuItem>
            <MenuItem value="fixed">Fixed amount ($)</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label={type === 'percentage' ? 'Percent (0–100)' : 'Amount ($)'}
            type="number"
            inputProps={{ min: 0, max: type === 'percentage' ? 100 : undefined, step: type === 'percentage' ? 1 : 0.01 }}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          />
          <TextField
            fullWidth
            label="Valid from"
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Expires"
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Minimum order ($) — optional"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
          />
          {type === 'percentage' && (
            <TextField
              fullWidth
              label="Max discount ($) — optional cap"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
          )}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={singleUseGlobal}
                  onChange={(_, v) => {
                    setSingleUseGlobal(v);
                    if (v) {
                      setUsageLimit('1');
                    } else {
                      setUsageLimit('');
                    }
                  }}
                />
              }
              label="Single use worldwide (only one redemption total — first order wins, all accounts)"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mb: 1 }}>
              Different from &quot;one per customer&quot;: the coupon stops working for everyone after it is used once.
            </Typography>
          </Box>
          <TextField
            fullWidth
            disabled={singleUseGlobal}
            label="Max redemptions — optional"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            helperText={
              singleUseGlobal
                ? 'Locked to 1 total redemption.'
                : initialCoupon != null
                  ? `Used: ${initialCoupon.usageCount ?? 0}`
                  : undefined
            }
          />
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <FormControlLabel
              control={<Checkbox checked={stackable} onChange={(_, v) => setStackable(v)} />}
              label="Stackable (can combine with other stackable coupons)"
            />
            <FormControlLabel
              control={<Checkbox checked={oneTimePerUser} onChange={(_, v) => setOneTimePerUser(v)} />}
              label="One use per customer (tracked by account)"
            />
            <FormControlLabel
              control={<Checkbox checked={active} onChange={(_, v) => setActive(v)} />}
              label="Active"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving…' : initialCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
