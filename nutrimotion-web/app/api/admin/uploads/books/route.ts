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
  price: { type: Number, default: 0, min: 0 },
  pdfUrl: { type: String },
  /** External store link (e.g. Amazon). Books with a buy link are sold outside the app. */
  buyUrl: { type: String },
  pageCount: { type: Number },
  isbn: { type: String },
}, { timestamps: true });

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

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
    
    const { title, author, description, coverImageUrl, price, pdfUrl, buyUrl, isbn, pageCount } = body;
    const cleanBuyUrl = typeof buyUrl === 'string' ? buyUrl.trim() : '';

    if (!title || !author || !description || !coverImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (cleanBuyUrl) {
      if (!isHttpUrl(cleanBuyUrl)) {
        return NextResponse.json({ error: 'Buy link must be a valid web address' }, { status: 400 });
      }
    } else if (price === undefined || !pdfUrl) {
      return NextResponse.json(
        { error: 'Add a PDF URL and price, or a buy link' },
        { status: 400 }
      );
    }
    
    const book = await Book.create({
      title,
      author,
      description,
      coverImageUrl,
      price: price ?? 0,
      pdfUrl: pdfUrl || undefined,
      buyUrl: cleanBuyUrl || undefined,
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
      buyUrl: book.buyUrl,
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
