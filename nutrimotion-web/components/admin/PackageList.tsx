'use client';

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  CardActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface PackageDoc {
  _id: string;
  name: string;
  description?: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  cost?: number;
  daysOption: 'any' | 'specific';
  specificDays: number[];
  active: boolean;
}

export interface PackageListProps {
  packages: PackageDoc[];
  onEdit?: (pkg: PackageDoc) => void;
}

export default function PackageList({ packages, onEdit }: PackageListProps) {
  if (packages.length === 0) {
    return (
      <Typography color="text.secondary">
        No packages yet. Click &quot;Add Package&quot; to define one (e.g. number of breakfasts, lunches, dinners and any or specific days).
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {packages.map((pkg) => (
        <Grid size={{ xs: 12 }} size={{ sm: 6 }} size={{ md: 4 }} key={pkg._id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6">{pkg.name}</Typography>
                {!pkg.active && (
                  <Chip label="Inactive" size="small" color="default" />
                )}
              </Box>
              {pkg.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {pkg.description}
                </Typography>
              )}
              <Typography variant="body2">
                Breakfasts: {pkg.breakfastCount} · Lunches: {pkg.lunchCount} · Dinners: {pkg.dinnerCount}
              </Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ mt: 0.5 }}>
                Cost: ${(pkg.cost ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pkg.daysOption === 'any'
                  ? 'Any days'
                  : `Days: ${pkg.specificDays.map((d) => DAY_LABELS[d]).join(', ')}`}
              </Typography>
            </CardContent>
            {onEdit && (
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEdit(pkg)}
                  aria-label="Edit package"
                >
                  <EditIcon />
                </IconButton>
              </CardActions>
            )}
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
