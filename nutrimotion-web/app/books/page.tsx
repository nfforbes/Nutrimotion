/**
 * Books Page
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
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';

interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
  price: number;
}

export default function BooksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAppSelector((state) => state.auth);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  // Mock books - replace with API call
  const books: Book[] = [];

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Health & Nutrition Books
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover books about nutrition, wellness, and healthy living
        </Typography>

        {books.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                No books available at the moment. Check back soon!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={book.coverImageUrl || '/placeholder-book.jpg'}
                    alt={book.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {book.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      by {book.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {book.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      ${book.price}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddShoppingCartIcon />}
                    >
                      Add to Cart
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
