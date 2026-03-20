/**
 * Home Page
 * Marketing-first layout for subscriptions with auth redirect for logged-in users.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AppBar from '@/components/layout/AppBar';
import Link from 'next/link';

const BRAND = {
  primary: '#ee4d24',
  surface: '#ffffff',
  text: '#121212',
};

const highlightCards = [
  {
    id: 'training',
    title: 'Personal Training',
    description:
      'Work with trainers who tailor plans to your schedule, fitness level, and body goals.',
    icon: FitnessCenterIcon,
    href: '/training',
    image:
      'https://images.pexels.com/photos/6456150/pexels-photo-6456150.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    id: 'meals',
    title: 'Meal Prep Service',
    description:
      'Fresh meal prep subscriptions with portions, macros, and delivery windows built around your week.',
    icon: RestaurantIcon,
    href: '/meals',
    image:
      'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    id: 'books',
    title: 'Fitness Topics in Meals and Books',
    description:
      'Subscribe for practical learning on fat loss, mobility, recovery, strength, hydration, and food prep.',
    icon: MenuBookIcon,
    href: '/books',
    image:
      'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
];

const topics = [
  'Strength training nutrition',
  'Fat-loss meal structure',
  'Mobility and recovery',
  'High-protein meal prep',
  'Performance hydration',
  'Sustainable habit building',
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

  if (isLoading) {
    return (
      <>
        <AppBar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rounded" height={280} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {[0, 1, 2].map((idx) => (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Skeleton variant="rounded" height={320} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppBar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ pt: { xs: 0, md: 2 } }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '3.4rem' },
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    color: BRAND.text,
                    mb: 2,
                  }}
                >
                  Personal training and meal prep subscriptions built for real life.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 640 }}>
                  Join Nutrimotion to train smarter, eat with structure, and learn fitness topics through curated meals and books.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                  <Button
                    component={Link}
                    href="/training"
                    variant="contained"
                    sx={{
                      bgcolor: BRAND.primary,
                      color: BRAND.text,
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#da451f' },
                    }}
                  >
                    Start Personal Training
                  </Button>
                  <Button component={Link} href="/meals" variant="outlined" color="inherit">
                    Explore Meal Prep
                  </Button>
                </Box>
                <Alert severity="info" sx={{ maxWidth: 640 }}>
                  Subscriptions cover meal planning, training guidance, and book-based education for long-term results.
                </Alert>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                component="img"
                src="https://images.pexels.com/photos/6456207/pexels-photo-6456207.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Nutrimotion personal training member"
                sx={{
                  width: '100%',
                  height: { xs: 320, md: 460 },
                  objectFit: 'cover',
                  borderRadius: 5,
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)',
                }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {highlightCards.map((item) => {
              const Icon = item.icon;
              return (
                <Grid size={{ xs: 12, md: 4 }} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 12px 30px -18px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.title}
                      sx={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                      }}
                    />
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Icon sx={{ color: BRAND.primary }} />
                        <Typography variant="h6">{item.title}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                      <Button
                        component={Link}
                        href={item.href}
                        variant="text"
                        sx={{ p: 0, fontWeight: 700, color: BRAND.primary }}
                      >
                        View details
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Card
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: BRAND.surface,
            }}
          >
            <Typography variant="h5" sx={{ mb: 2 }}>
              Fitness Topics Covered in Meals and Books
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {topics.map((topic) => (
                <Chip key={topic} label={topic} sx={{ bgcolor: 'rgba(238,77,36,0.08)', color: '#8a2b16' }} />
              ))}
            </Box>
            <Button
              component={Link}
              href="/books"
              variant="contained"
              sx={{ bgcolor: '#121212', '&:hover': { bgcolor: '#1f1f1f' } }}
            >
              Subscribe for Meals and Books
            </Button>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70dvh' }}>
      <Typography color="text.secondary">Redirecting to dashboard...</Typography>
    </Box>
  );
}
