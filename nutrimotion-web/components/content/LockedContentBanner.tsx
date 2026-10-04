'use client';

import Link from 'next/link';
import { Alert, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import type { ContentAccess } from '@/types/catalog';

export interface LockedContentBannerProps {
  access: ContentAccess | null;
  /** Singular noun, e.g. "recipe" or "video". */
  noun: string;
  planLabel: string;
}

export default function LockedContentBanner({ access, noun, planLabel }: LockedContentBannerProps) {
  if (!access || access.subscribed || access.lockedCount <= 0) return null;
  const plural = access.lockedCount === 1 ? noun : `${noun}s`;
  const price = access.monthlyPrice > 0 ? ` for $${access.monthlyPrice.toFixed(2)}/month` : '';

  return (
    <Alert
      severity="info"
      icon={<LockIcon />}
      sx={{ mb: 3 }}
      action={
        <Button color="inherit" size="small" component={Link} href="/client/subscriptions">
          Subscribe
        </Button>
      }
    >
      You&apos;re missing {access.lockedCount} {plural}. Get them all with a {planLabel} subscription{price}.
    </Alert>
  );
}
