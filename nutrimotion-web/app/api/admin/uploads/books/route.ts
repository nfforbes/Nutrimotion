/**
 * Admin Books API
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
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
  const authResult = await requirePermissions(request, [Permission.MANAGE_BOOKS]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const books = await Book.find({}).sort({ createdAt: -1 });
    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_BOOKS]);
  if (authResult instanceof NextResponse) return authResult;
  
  try {
    await connectDB();
    const body = await request.json();
    
    const { title, author, description, coverImageUrl, price, pdfUrl, isbn, pageCount } = body;
    
    if (!title || !author || !description || !coverImageUrl || price === undefined || !pdfUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const book = await Book.create({
      title,
      author,
      description,
      coverImageUrl,
      price,
      pdfUrl,
      isbn,
      pageCount,
    });
    
    return NextResponse.json({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      description: book.description,
      coverImageUrl: book.coverImageUrl,
      price: book.price,
      pdfUrl: book.pdfUrl,
      isbn: book.isbn,
      pageCount: book.pageCount,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}
