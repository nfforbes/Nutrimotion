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
  IconButton,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import AppBar from '@/components/layout/AppBar';
import Link from 'next/link';

const heroContent = [
  {
    image: "/hero_pilates_studio.png",
    subheadline: "personal training",
  },
  {
    image: "/healthy_food.png",
    subheadline: "Premium meal prep",
  },
  {
    image: "/virtual_coaching.png",
    subheadline: "virtual coaching and nutrition support designed for real results.",
  }
];

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
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'meals',
    title: 'Meal Prep Service',
    description:
      'Fresh meal prep subscriptions with portions, macros, and delivery windows built around your week.',
    icon: RestaurantIcon,
    href: '/meals',
    image:
      '/meal_prep.png',
  },
  {
    id: 'books',
    title: 'Fitness Topics in Meals and Books',
    description:
      'Subscribe for practical learning on fat loss, mobility, recovery, strength, hydration, and food prep.',
    icon: MenuBookIcon,
    href: '/books',
    image:
      '/pilates_topics.png',
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

const wellnessContent = [
  {
    title: 'Holistic Health',
    description: 'Embrace a comprehensive approach to well-being that nurtures your physical, mental, and emotional health.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Stress Management',
    description: 'Learn proven techniques to lower cortisol levels, build resilience, and maintain inner calm in a busy world.',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Mindful Eating',
    description: 'Transform your relationship with food by cultivating awareness, savoring each bite, and listening to your body.',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Sleep Optimization',
    description: 'Unlock the power of restorative rest with strategies to improve sleep architecture and wake up energized.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Work-Life Balance',
    description: 'Create sustainable boundaries that allow you to excel professionally while thriving in your personal life.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Longevity',
    description: 'Implement science-backed protocols for healthspan extension, maintaining vitality and mobility as you age.',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=800&auto=format&fit=crop',
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroContent.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const nextImage = () => setCurrentHeroIndex((prev) => (prev + 1) % heroContent.length);
  const prevImage = () => setCurrentHeroIndex((prev) => (prev - 1 + heroContent.length) % heroContent.length);

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
        <Skeleton
          variant="rounded"
          sx={{ mb: 3, borderRadius: 0, width: '100%', height: { xs: 420, md: 520 } }}
        />
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
            component="img"
            src={heroContent[currentHeroIndex].image}
            alt="Hero background"
            key={currentHeroIndex}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              animation: 'fadeIn 0.5s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0.8 },
                '100%': { opacity: 1 },
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(18, 18, 18, 0.5)',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              right: { xs: 16, md: 32 },
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              zIndex: 2,
            }}
          >
            {heroContent.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: index === currentHeroIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: index === currentHeroIndex ? '#ffffff' : 'rgba(255,255,255,0.8)',
                    transform: 'scale(1.2)'
                  }
                }}
              />
            ))}
          </Box>
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
                Transform Your Body With Structured Nutrition &amp; Expert Coaching
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  maxWidth: 640,
                  color: 'rgba(255,255,255,0.92)',
                  textShadow: '0 1px 12px rgba(0,0,0,0.4)',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  textTransform: 'capitalize',
                }}
              >
                {heroContent[currentHeroIndex].subheadline}
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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, md: 3 },
              width: '100%',
            }}
          >
            <Card
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: BRAND.surface,
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Wellness & Lifestyle Integration
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                Discover how training and nutrition combine to create a holistic lifestyle designed for long-term health, real results, and optimal well-being.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 'auto', pb: 3, pt: 2 }}>
                {wellnessContent.map((item, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <Box 
                      key={item.title} 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: isEven ? 'row' : 'row-reverse' }, 
                        alignItems: 'center',
                        gap: 3,
                        bgcolor: 'rgba(0,0,0,0.02)',
                        p: 2,
                        borderRadius: 3
                      }}
                    >
                      <Box 
                        component="img" 
                        src={item.image} 
                        alt={item.title} 
                        sx={{ 
                          width: { xs: '100%', md: '45%' }, 
                          height: 200, 
                          objectFit: 'cover', 
                          borderRadius: 2 
                        }} 
                      />
                      <Box sx={{ width: { xs: '100%', md: '55%' }, px: { md: 2 } }}>
                        <Typography variant="h6" sx={{ mb: 1, color: BRAND.primary }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              <Button
                component={Link}
                href="/training"
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: '#121212',
                  '&:hover': { bgcolor: '#1f1f1f' },
                  display: { xs: 'flex', sm: 'inline-flex' },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                Start Your Wellness Journey
              </Button>
            </Card>

            <Card
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: BRAND.surface,
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Fitness Topics Covered in Meals and Books
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 'auto', pb: 3 }}>
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
          </Box>
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
