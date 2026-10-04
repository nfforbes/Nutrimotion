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
import DeleteIcon from '@mui/icons-material/Delete';
import { groupPackages, PackageSort, PackageSpanFilter } from '@/lib/packages/organize';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface PackageDoc {
  _id: string;
  name: string;
  description?: string;
  breakfastCount: number;
  lunchCount: number;
  smoothieCount?: number;
  juiceShotCount?: number;
  dinnerCount?: number;
  cost?: number;
  daysOption: 'any' | 'specific';
  specificDays: number[];
  active: boolean;
}

export interface PackageListProps {
  packages: PackageDoc[];
  span?: PackageSpanFilter;
  sort?: PackageSort;
  onEdit?: (pkg: PackageDoc) => void;
  onDelete?: (pkg: PackageDoc) => void;
}

export default function PackageList({
  packages,
  span = 'all',
  sort = 'price-asc',
  onEdit,
  onDelete,
}: PackageListProps) {
  if (packages.length === 0) {
    return (
      <Typography color="text.secondary">
        No packages yet. Click &quot;Add Package&quot; to define one (e.g. breakfasts, lunches, smoothies, juice shots and any or specific days).
      </Typography>
    );
  }

  const groups = groupPackages(packages, span, sort);
  if (groups.length === 0) {
    return <Typography color="text.secondary">No packages in this group.</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {groups.map((group) => (
        <Box key={group.span}>
          <Typography variant="h5" gutterBottom>
            {group.label}
          </Typography>
          <Grid container spacing={3}>
            {group.packages.map((pkg) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg._id}>
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
                Breakfasts: {pkg.breakfastCount} · Lunches: {pkg.lunchCount} · Smoothies:{' '}
                {pkg.smoothieCount ?? pkg.dinnerCount ?? 0} · Juice Shots: {pkg.juiceShotCount ?? 0}
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
            {(onEdit || onDelete) && (
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                {onEdit && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEdit(pkg)}
                    aria-label="Edit package"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(pkg)}
                    aria-label="Delete package"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </CardActions>
            )}
          </Card>
        </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}
