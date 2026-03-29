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
        <Skeleton variant="rounded" height={{ xs: 420, md: 520 }} sx={{ mb: 3, borderRadius: 0, width: '100%' }} />
        <Container maxWidth="lg" sx={{ py: 4, width: '100%', px: { xs: 2, sm: 3 } }}>
          <Skeleton variant="rounded" height={48} sx={{ mb: 2, maxWidth: 480 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: { xs: 2, md: 3 },
              width: '100%',
            }}
          >
            {[0, 1, 2].map((idx) => (
              <Skeleton key={idx} variant="rounded" height={320} sx={{ width: '100%' }} />
            ))}
          </Box>
        </Container>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppBar />
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            minHeight: { xs: 'min(100dvh, 720px)', md: 'min(85dvh, 820px)' },
            overflow: 'hidden',
          }}
        >
          <Box
            component="video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src="/Camera_pan_people_202603281424.mp4" type="video/mp4" />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(18, 18, 18, 0.5)',
              pointerEvents: 'none',
            }}
          />
          <Container
            maxWidth="lg"
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              px: { xs: 2, sm: 3 },
              py: { xs: 6, md: 10 },
              minHeight: { xs: 'min(100dvh, 720px)', md: 'min(85dvh, 820px)' },
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '58%' } }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3.4rem' },
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  mb: 2,
                  textShadow: '0 2px 24px rgba(0,0,0,0.35)',
                }}
              >
                Personal training and meal prep subscriptions built for real life.
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  maxWidth: 640,
                  color: 'rgba(255,255,255,0.92)',
                  textShadow: '0 1px 12px rgba(0,0,0,0.4)',
                }}
              >
                Join Nutrimotion to train smarter, eat with structure, and learn fitness topics through curated meals and books.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1.5,
                  flexWrap: 'wrap',
                  mb: 3,
                  width: '100%',
                  '& > *': { width: { xs: '100%', sm: 'auto' } },
                }}
              >
                <Button
                  component={Link}
                  href="/training"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: BRAND.primary,
                    color: BRAND.text,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#da451f' },
                  }}
                >
                  Start Personal Training
                </Button>
                <Button
                  component={Link}
                  href="/meals"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.85)',
                    color: '#ffffff',
                    '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Explore Meal Prep
                </Button>
              </Box>
              <Alert
                severity="info"
                sx={{
                  width: '100%',
                  maxWidth: 640,
                  bgcolor: 'rgba(255,255,255,0.92)',
                  color: 'text.primary',
                }}
              >
                Subscriptions cover meal planning, training guidance, and book-based education for long-term results.
              </Alert>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4, width: '100%', px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: { xs: 2, md: 3 },
              width: '100%',
              mb: 4,
            }}
          >
            {highlightCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.id}
                  sx={{
                    height: '100%',
                    width: '100%',
                    minWidth: 0,
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
                      display: 'block',
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
              );
            })}
          </Box>

          <Card
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: '1px solid rgba(0,0,0,0.08)',
              bgcolor: BRAND.surface,
              width: '100%',
              boxSizing: 'border-box',
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
              fullWidth
              sx={{
                bgcolor: '#121212',
                '&:hover': { bgcolor: '#1f1f1f' },
                display: { xs: 'flex', sm: 'inline-flex' },
                width: { xs: '100%', sm: 'auto' },
              }}
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
