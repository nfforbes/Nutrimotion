# Auth0 Configuration Guide

## Redirect Loop Fix

If you're experiencing a "too many redirects" error, it's almost always due to incorrect Auth0 dashboard configuration.

## Required Auth0 Dashboard Settings

Go to: https://manage.auth0.com → Applications → Your Application → Settings

### 1. Allowed Callback URLs
**CRITICAL (Auth0 v4):** This must match exactly:
```
https://localhost:3000/auth/callback
```
**NOTE:** Auth0 v4 uses `/auth/callback` (not `/api/auth/callback`)

### 2. Allowed Logout URLs
```
https://localhost:3000
```

### 3. Allowed Web Origins
```
https://localhost:3000
```

### 4. Allowed Origins (CORS)
```
https://localhost:3000
```

## Verification Steps

1. **Check Callback URL**: The callback URL MUST be exactly `https://localhost:3000/auth/callback` (no trailing slash, exact match, Auth0 v4 uses `/auth/` not `/api/auth/`)

2. **Clear Browser Cookies**: After updating Auth0 settings, clear your browser cookies for `localhost:3000`

3. **Restart Server**: After changing `.env` or Auth0 settings, restart your development server

4. **Check Browser Console**: Open browser DevTools → Network tab to see the redirect chain

## Common Issues

### Issue: Callback URL doesn't match
- **Symptom**: Redirect loop between `/auth/login` and `/auth/callback`
- **Fix**: Ensure callback URL in Auth0 dashboard is exactly `https://localhost:3000/auth/callback` (Auth0 v4 format)

### Issue: HTTP vs HTTPS mismatch
- **Symptom**: Redirects fail or loop
- **Fix**: Ensure you're using `https://localhost:3000` (not `http://`) in both `.env` and Auth0 dashboard

### Issue: Port mismatch
- **Symptom**: Callback fails
- **Fix**: Ensure port `3000` matches in `.env` (`AUTH0_BASE_URL`) and Auth0 callback URL

## Testing

After configuration:
1. Visit `https://localhost:3000`
2. Click "Sign In"
3. Complete Auth0 login
4. Should redirect to `/dashboard` (not loop)

If still looping, check browser Network tab to see the exact redirect chain.
