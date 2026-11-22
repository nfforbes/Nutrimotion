/**
 * Admin book — update one book.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requirePermissions } from '@/lib/auth/middleware';
import { Permission } from '@/types/auth';
import connectDB from '@/lib/db/connection';

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    coverImageUrl: { type: String, required: true },
    price: { type: Number, default: 0, min: 0 },
    pdfUrl: { type: String },
    buyUrl: { type: String },
    pageCount: { type: Number },
    isbn: { type: String },
  },
  { timestamps: true }
);

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requirePermissions(request, [Permission.MANAGE_BOOKS]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid book id' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const coverImageUrl = typeof body.coverImageUrl === 'string' ? body.coverImageUrl.trim() : '';
    const pdfUrl = typeof body.pdfUrl === 'string' ? body.pdfUrl.trim() : '';
    const buyUrl = typeof body.buyUrl === 'string' ? body.buyUrl.trim() : '';
    const isbn = typeof body.isbn === 'string' ? body.isbn.trim() : '';
    const price = body.price === undefined || body.price === '' ? 0 : Number(body.price);

    if (!title || !author || !description || !coverImageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'Price must be a number 0 or greater.' }, { status: 400 });
    }
    if (buyUrl) {
      if (!isHttpUrl(buyUrl)) {
        return NextResponse.json({ error: 'Buy link must be a valid web address' }, { status: 400 });
      }
    } else if (!pdfUrl) {
      return NextResponse.json({ error: 'Add a PDF URL and price, or a buy link' }, { status: 400 });
    }

    const book = await Book.findByIdAndUpdate(
      id,
      {
        title,
        author,
        description,
        coverImageUrl,
        price,
        pdfUrl: pdfUrl || undefined,
        buyUrl: buyUrl || undefined,
        isbn: isbn || undefined,
      },
      { new: true }
    );
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

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
    });
  } catch {
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}
