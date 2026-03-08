/**
 * Auth0 v4 Configuration
 * 
 * Auth0 v4 uses Auth0Client for server-side operations
 * Routes are automatically mounted by middleware
 * 
 * Required environment variables:
 * - AUTH0_SECRET
 * - APP_BASE_URL (or AUTH0_BASE_URL for backward compatibility)
 * - AUTH0_DOMAIN (or AUTH0_ISSUER_BASE_URL)
 * - AUTH0_CLIENT_ID
 * - AUTH0_CLIENT_SECRET
 */

import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client();
