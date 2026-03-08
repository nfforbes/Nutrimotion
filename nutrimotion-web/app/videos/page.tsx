/**
 * Videos Page
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  category: string;
  duration: number;
}

export default function VideosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  // Mock videos - replace with API call
  const videos: Video[] = [];

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Video Library
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Access cooking tutorials and personal training videos
        </Typography>

        {videos.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No videos available at the moment. Check back soon!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video.id}>
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
                      {video.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip label={video.category} size="small" />
                      <Chip label={`${Math.floor(video.duration / 60)} min`} size="small" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button fullWidth variant="contained" startIcon={<PlayArrowIcon />}>
                      Watch Video
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
