/**
 * Home Page
 * Dashboard-style layout with Login in top right; redirects authenticated users to dashboard.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AppBar from '@/components/layout/AppBar';
import Link from 'next/link';

const BRAND_COLORS = {
  primary: '#ee4d24',
  dark: '#000000',
  darkOrange: '#c23d1a',
  mediumOrange: '#ff6f47',
};

const quickLinks = [
  {
    id: 'meals',
    title: 'Browse Meals',
    description: 'Explore our healthy meal options',
    icon: RestaurantIcon,
    href: '/meals',
  },
  {
    id: 'training',
    title: 'Training Packages',
    description: 'Get fit with our training programs',
    icon: FitnessCenterIcon,
    href: '/training',
  },
  {
    id: 'books',
    title: 'Health Books',
    description: 'Learn about nutrition and wellness',
    icon: MenuBookIcon,
    href: '/books',
  },
  {
    id: 'recipes',
    title: 'Recipes',
    description: 'Cook healthy meals at home',
    icon: ReceiptIcon,
    href: '/recipes',
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isCallback =
        urlParams.has('code') ||
        urlParams.has('state') ||
        window.location.pathname.includes('/auth');
      if (isCallback) return;
    }

    if (!isLoading && user && !hasRedirected) {
      setHasRedirected(true);
      router.replace('/dashboard');
    }
  }, [user, isLoading, router, hasRedirected]);

  if (!isLoading && !user) {
    return (
      <>
        <AppBar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Nutrimotion
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Your health and wellness journey starts here
          </Typography>
          <Grid container spacing={3}>
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={link.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: BRAND_COLORS.dark,
                            borderRadius: '50%',
                            p: 2,
                            display: 'flex',
                            width: 80,
                            height: 80,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon
                            sx={{
                              fontSize: 40,
                              color: BRAND_COLORS.primary,
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography
                        variant="h6"
                        align="center"
                        gutterBottom
                      >
                        {link.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        {link.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        fullWidth
                        variant="contained"
                        component={Link}
                        href={link.href}
                        sx={{
                          bgcolor: BRAND_COLORS.dark,
                          color: BRAND_COLORS.primary,
                          border: `2px solid ${BRAND_COLORS.dark}`,
                          '&:hover': {
                            bgcolor: BRAND_COLORS.primary,
                            color: BRAND_COLORS.dark,
                            borderColor: BRAND_COLORS.primary,
                          },
                        }}
                      >
                        Explore
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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Typography>Loading...</Typography>
    </Box>
  );
}
