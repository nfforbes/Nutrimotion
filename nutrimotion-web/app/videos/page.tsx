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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import LockedContentBanner from '@/components/content/LockedContentBanner';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchVideosRequest } from '@/store/slices/catalogSlice';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import type { VideoAsset } from '@/types/catalog';

export default function VideosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playing, setPlaying] = useState<VideoAsset | null>(null);
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const { videos, videosAccess, isLoading, error } = useAppSelector((state) => state.catalog);

  useEffect(() => {
    dispatch(fetchVideosRequest());
  }, [dispatch]);

  const menuItems = getAllMenuItemsForUser(auth.permissions);
  const playUrl = playing ? playing.videoUrl || playing.shortUrl || '' : '';

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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!isLoading && <LockedContentBanner access={videosAccess} noun="video" planLabel="Videos" />}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                {videosAccess && videosAccess.lockedCount > 0
                  ? 'Subscribe to unlock videos.'
                  : 'No videos available at the moment. Check back soon!'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={video.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ position: 'relative' }}>
                    {video.thumbnailUrl ? (
                      <CardMedia component="img" height="200" image={video.thumbnailUrl} alt={video.title} />
                    ) : (
                      <Box sx={{ height: 200, bgcolor: 'grey.900' }} />
                    )}
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
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {video.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={video.category} size="small" />
                      <Chip label={`${Math.max(1, Math.round(video.duration / 60))} min`} size="small" />
                      {video.thisWeek && <Chip label="This week" size="small" color="secondary" />}
                      {video.isFree && <Chip label="Free" size="small" color="success" />}
                      {video.access === 'short' && <Chip label="Free short" size="small" color="warning" />}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => setPlaying(video)}
                    >
                      {video.access === 'short' ? 'Watch short' : 'Watch video'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog open={!!playing} onClose={() => setPlaying(null)} maxWidth="md" fullWidth>
        {playing && (
          <>
            <DialogTitle>{playing.title}</DialogTitle>
            <DialogContent dividers>
              {playUrl ? (
                <Box component="video" src={playUrl} controls autoPlay sx={{ width: '100%', maxHeight: '70vh' }} />
              ) : (
                <Typography color="text.secondary">This video is not available.</Typography>
              )}
              {playing.access === 'short' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This is the free short. Subscribe to Videos to watch the full video.
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              {playUrl && (
                <Button component="a" href={playUrl} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </Button>
              )}
              <Button onClick={() => setPlaying(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
