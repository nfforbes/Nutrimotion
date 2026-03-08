/**
 * Admin Content Management Page
 */

'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import Link from 'next/link';

const contentTypes = [
  {
    id: 'books',
    title: 'Books',
    description: 'Manage PDF books and e-books',
    icon: MenuBookIcon,
    href: '/admin/content/books',
    color: '#2196F3',
  },
  {
    id: 'recipes',
    title: 'Recipes',
    description: 'Manage recipe content',
    icon: ReceiptIcon,
    href: '/admin/content/recipes',
    color: '#9C27B0',
  },
  {
    id: 'videos',
    title: 'Videos',
    description: 'Manage video content',
    icon: VideoLibraryIcon,
    href: '/admin/content/videos',
    color: '#F44336',
  },
  {
    id: 'training',
    title: 'Training Packages',
    description: 'Manage training programs',
    icon: FitnessCenterIcon,
    href: '/admin/content/training',
    color: '#FF6F00',
  },
];

export default function AdminContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Content Management
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage books, recipes, videos, and training packages
        </Typography>

        <Grid container spacing={3}>
          {contentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={type.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: type.color,
                          borderRadius: '50%',
                          p: 2,
                          display: 'flex',
                        }}
                      >
                        <Icon sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
                    </Box>
                    <Typography variant="h6" align="center" gutterBottom>
                      {type.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {type.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      component={Link}
                      href={type.href}
                      sx={{ bgcolor: type.color }}
                    >
                      Manage
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </>
  );
}
