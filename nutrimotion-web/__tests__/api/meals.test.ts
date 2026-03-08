/**
 * Meals API Tests
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/meals/route';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  requireAuth: jest.fn().mockResolvedValue({ session: { user: { sub: 'test-user' } } }),
}));

jest.mock('@/lib/db/connection', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/db/models', () => ({
  MealPackage: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          _id: '1',
          name: 'Test Meal',
          description: 'Test Description',
          imageUrl: 'https://example.com/image.jpg',
          price: 12.99,
          slot: 'breakfast',
          scheduledDate: new Date(),
          available: true,
        },
      ]),
    }),
  },
}));

describe('GET /api/meals', () => {
  it('should return meals successfully', async () => {
    const request = new NextRequest('http://localhost:3030/api/meals');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('price');
  });
  
  it('should filter by date', async () => {
    const date = new Date().toISOString();
    const request = new NextRequest(`http://localhost:3030/api/meals?date=${date}`);
    const response = await GET(request);
    
    expect(response.status).toBe(200);
  });
  
  it('should filter by slot', async () => {
    const request = new NextRequest('http://localhost:3030/api/meals?slot=breakfast');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
  });
});
