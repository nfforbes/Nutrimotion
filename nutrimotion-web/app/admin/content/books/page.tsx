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
import AddBookForm from '@/components/admin/AddBookForm';
import BookList from '@/components/admin/BookList';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

interface BookDoc {
  _id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
  price: number;
  isbn?: string;
}

export default function AdminBooksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [books, setBooks] = useState<BookDoc[]>([]);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get<BookDoc[]>('/api/admin/uploads/books');
      setBooks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Books Management</Typography>
          {!showAddForm && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddForm(true)}>
              Add Book
            </Button>
          )}
        </Box>

        {showAddForm ? (
          <AddBookForm
            onSuccess={() => {
              setShowAddForm(false);
              fetchBooks();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <BookList books={books} />
        )}
      </Container>
    </>
  );
}
