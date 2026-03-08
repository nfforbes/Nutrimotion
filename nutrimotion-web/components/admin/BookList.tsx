'use client';

import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface BookDoc {
  _id: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl?: string;
  price: number;
  isbn?: string;
}

export interface BookListProps {
  books: BookDoc[];
}

export default function BookList({ books }: BookListProps) {
  if (books.length === 0) {
    return (
      <Typography color="text.secondary">
        No books yet. Click &quot;Add Book&quot; to create one.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      {books.map((book) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book._id}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={book.coverImageUrl || '/placeholder-book.jpg'}
              alt={book.title}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {book.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                by {book.author}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                ${book.price}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton size="small">
                <EditIcon />
              </IconButton>
              <IconButton size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
