'use client';

import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface TrainingDoc {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  duration?: string;
  level?: string;
}

export interface TrainingListProps {
  packages: TrainingDoc[];
}

export default function TrainingList({ packages }: TrainingListProps) {
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
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {pkg.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pkg.description}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                ${pkg.price}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton size="small">
                <EditIcon />
              </IconButton>
              <IconButton size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
