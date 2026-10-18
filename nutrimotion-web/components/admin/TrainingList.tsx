'use client';

import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TrainingDoc } from '@/components/admin/AddTrainingForm';

export interface TrainingListProps {
  packages: TrainingDoc[];
  onEdit: (pkg: TrainingDoc) => void;
  onDelete: (pkg: TrainingDoc) => void;
  deletingId?: string | null;
}

export default function TrainingList({ packages, onEdit, onDelete, deletingId }: TrainingListProps) {
  if (packages.length === 0) {
    return (
      <Typography color="text.secondary">
        No training packages yet. Click &quot;Add Package&quot; to create one.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {packages.map((pkg) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg._id}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={pkg.imageUrl || '/placeholder-training.jpg'}
              alt={pkg.name}
              sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {pkg.name}
              </Typography>
              {pkg.description && (
                <Typography variant="body2" color="text.secondary">
                  {pkg.description}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {[pkg.level, pkg.duration].filter(Boolean).join(' · ')}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                ${pkg.price}
              </Typography>
            </CardContent>
            <CardActions>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(pkg)} aria-label={`Edit ${pkg.name}`}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(pkg)}
                    disabled={deletingId === pkg._id}
                    aria-label={`Delete ${pkg.name}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
