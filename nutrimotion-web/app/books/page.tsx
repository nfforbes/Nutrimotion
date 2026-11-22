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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from 'axios';
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
  /** External store link (e.g. Amazon). When set, the book is bought there, not in the cart. */
  buyUrl?: string;
}

function buyButtonLabel(url: string): string {
  try {
    return new URL(url).hostname.includes('amazon') || new URL(url).hostname === 'a.co'
      ? 'Buy on Amazon'
      : 'Buy now';
  } catch {
    return 'Buy now';
  }
}

export default function BooksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const auth = useAppSelector((state) => state.auth);

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  useEffect(() => {
    axios
      .get<Book[]>('/api/books')
      .then((response) => setBooks(Array.isArray(response.data) ? response.data : []))
      .catch((error) => console.error('Failed to load books:', error));
  }, []);

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
                    {!book.buyUrl && (
                      <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                        ${book.price}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    {book.buyUrl ? (
                      <Button
                        fullWidth
                        variant="contained"
                        href={book.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon />}
                      >
                        {buyButtonLabel(book.buyUrl)}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                      >
                        Add to Cart
                      </Button>
                    )}
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
