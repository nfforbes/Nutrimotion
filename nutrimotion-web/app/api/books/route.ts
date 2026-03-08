/**
 * Books API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import connectDB from '@/lib/db/connection';
import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  coverImageUrl: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  pdfUrl: { type: String, required: true },
  pageCount: { type: Number },
  isbn: { type: String },
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    
    const books = await Book.find().sort({ createdAt: -1 });
    
    return NextResponse.json(books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      description: book.description,
      coverImageUrl: book.coverImageUrl,
      price: book.price,
      pdfUrl: book.pdfUrl,
      pageCount: book.pageCount,
      isbn: book.isbn,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    })));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
