'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddVideoForm from '@/components/admin/AddVideoForm';
import VideoList from '@/components/admin/VideoList';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

interface VideoDoc {
  _id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  category?: string;
}

export default function AdminVideosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [videos, setVideos] = useState<VideoDoc[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get<VideoDoc[]>('/api/admin/uploads/videos');
      setVideos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Videos Management</Typography>
          {!showAddForm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)}>
              Add Video
            </Button>
          )}
        </Box>

        {showAddForm ? (
          <AddVideoForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchVideos();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <VideoList videos={videos} />
        )}
      </Container>
    </>
  );
}
