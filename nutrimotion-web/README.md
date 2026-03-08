# Nutrimotion - Meal Planning & Delivery Platform

A comprehensive meal planning and delivery service with role-based access for Administrators, Clients, and Drivers.

## Features

- **Multi-role authentication** via Auth0 (Administrator, Client, Driver)
- **Meal planning** with calendar-based scheduling
- **E-commerce** with cart, checkout, and discount codes
- **Real-time delivery tracking** with live driver location
- **Content management** for meals, training packages, books, recipes, and videos
- **Subscription management** for recurring content access
- **Responsive design** for mobile, tablet, and desktop

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **State Management**: Redux Toolkit + Redux-Saga
- **Authentication**: Auth0
- **Database**: MongoDB with Mongoose
- **Testing**: Jest + React Testing Library (TDD approach)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
/app                    # Next.js App Router pages and API routes
  /api                  # API endpoints
  /(auth)               # Auth-protected routes
  /(public)             # Public routes
/components             # Reusable React components
/lib                    # Utility functions and services
  /auth                 # Auth0 helpers and middleware
  /db                   # MongoDB connection and models
  /services             # Business logic services
/store                  # Redux store configuration
  /sagas                # Redux-Saga side effects
  /slices               # Redux Toolkit slices
/types                  # TypeScript type definitions
/__tests__              # Test files
```

## Testing

This project follows Test-Driven Development (TDD) practices:

- Write tests before implementation
- Run tests: `npm test`
- Run with coverage: `npm test:coverage`

## License

Private - All rights reserved
