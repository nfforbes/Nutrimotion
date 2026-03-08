'use client';

import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface VideoDoc {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  category?: string;
}

export interface VideoListProps {
  videos: VideoDoc[];
}

export default function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <Typography color="text.secondary">
        No videos yet. Click &quot;Add Video&quot; to create one.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {videos.map((video) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video._id}>
          <Card>
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="200"
                image={video.thumbnailUrl || '/placeholder-video.jpg'}
                alt={video.title}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: '50%',
                  p: 1,
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </Box>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {video.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {video.category} {video.duration ? `• ${video.duration}s` : ''}
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
