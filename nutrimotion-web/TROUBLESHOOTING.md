# Troubleshooting: "Too Many Redirects" Error

## Trust the dev certificate (stop repeated prompts)

The app uses a **self-signed certificate** for `https://localhost:3000`. Browsers don’t trust it by default, so they can prompt on every request or each time you open the site.

**Fix: trust the certificate once in Windows**

1. Open **PowerShell as Administrator** (right‑click → Run as administrator).
2. Run (use the path to your project’s `cert` folder):

   ```powershell
   certutil -addstore -f "Root" "C:\Git\NutrimotionV1\nutrimotion-web\cert\localhost.pem"
   ```

3. Restart your browser and open `https://localhost:3000` again. The warning should stop.

**If you see `ERR_CERT_COMMON_NAME_INVALID`:** the dev certificate must include Subject Alternative Names (SAN). Regenerate it with:

```powershell
cd C:\Git\NutrimotionV1\nutrimotion-web
npm run cert:generate -- --force
```

Then add the new cert to the trust store (step 2 above) and restart the app.

To remove the cert later (e.g. when you leave the project):

```powershell
certutil -delstore "Root" "localhost"
```

(Use the same store and subject as when adding. If you used a different CN, list certs first with `certutil -store Root`.)

### net::ERR_CERT_AUTHORITY_INVALID

This means the certificate is **not trusted**. You must add it to Windows Trusted Root (see Option A above). Easiest: open **PowerShell as Administrator** and run:

```powershell
cd C:\Git\NutrimotionV1\nutrimotion-web
.\scripts\trust-cert.ps1
```

Then restart your browser. If you prefer not to trust a cert, use **Option B** above and run the app with `npm run dev:http` over HTTP.

---

## Immediate Fix Steps

### 1. Clear Browser Data
1. Open Chrome/Edge DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Or manually delete cookies for `localhost:3000`
4. Close and reopen your browser

### 2. Restart Development Server
```powershell
# Kill the process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Restart server
cd c:\Git\NutrimotionV1\nutrimotion-web
npm run dev
```

### 3. Verify Auth0 Configuration
Go to: https://manage.auth0.com → Applications → Your Application → Settings

**CRITICAL: These must match exactly:**

| Setting | Value |
|---------|-------|
| **Allowed Callback URLs** | `https://localhost:3000/api/auth/callback` |
| **Allowed Logout URLs** | `https://localhost:3000` |
| **Allowed Web Origins** | `https://localhost:3000` |
| **Allowed Origins (CORS)** | `https://localhost:3000` |

### 4. Test in Incognito/Private Window
Open a new incognito/private window and visit `https://localhost:3000`

## Root Cause Analysis

### Why Redirect Loops Happen

1. **Stale Cookies**: Old session cookies from previous attempts cause Auth0 to think you're logged in, but the session is invalid
2. **Callback URL Mismatch**: Auth0 redirects to a URL that doesn't match what your app expects
3. **HTTP vs HTTPS**: Mixing HTTP and HTTPS in configuration
4. **Port Mismatch**: Callback URL uses wrong port

### Debugging Steps

1. **Check Network Tab**:
   - Open DevTools → Network tab
   - Visit `https://localhost:3000`
   - Look for redirect chain (Status 302/307)
   - Note which URLs are being called

2. **Check Console Tab**:
   - Look for Auth0 errors
   - Look for cookie errors

3. **Verify Environment Variables**:
   ```powershell
   cd c:\Git\NutrimotionV1\nutrimotion-web
   type .env
   ```
   
   Ensure:
   - `AUTH0_BASE_URL=https://localhost:3000` (HTTPS, not HTTP)
   - `AUTH0_ISSUER_BASE_URL` matches your Auth0 domain
   - `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` are correct

## Common Scenarios

### Scenario 1: Loop on First Visit (Before Login)
**Symptom**: Redirect loop immediately when visiting `https://localhost:3000`
**Cause**: Corrupted cookies from previous session
**Fix**: Clear cookies and restart browser

### Scenario 2: Loop After Clicking "Sign In"
**Symptom**: Redirect loop between `/api/auth/login` → Auth0 → `/api/auth/callback` → `/api/auth/login`
**Cause**: Callback URL mismatch in Auth0 dashboard
**Fix**: Verify callback URL is exactly `https://localhost:3000/api/auth/callback`

### Scenario 3: Loop After Successful Login
**Symptom**: Auth0 login succeeds but redirects back to login page
**Cause**: Session not being saved, or returnTo parameter issue
**Fix**: Check `AUTH0_SECRET` is set in `.env`

## Clean Slate Procedure

If nothing else works, follow this procedure:

```powershell
# 1. Stop server
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# 2. Clear Node modules and reinstall
cd c:\Git\NutrimotionV1\nutrimotion-web
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install --legacy-peer-deps

# 3. Regenerate certificates
npm run cert:generate

# 4. Clear browser completely
# - Close ALL browser windows
# - Clear browsing data (cookies, cache, etc.)
# - Reopen browser

# 5. Restart server
npm run dev

# 6. Test in incognito window
# Visit: https://localhost:3000
```

## Still Not Working?

Check these additional items:

1. **MongoDB Connection**: Ensure MongoDB is running
   ```powershell
   # Check if MongoDB is accessible
   # This should work if MongoDB is running locally
   ```

2. **Auth0 Application Type**: Ensure your Auth0 application is type "Regular Web Application" (not SPA or Native)

3. **Browser Extensions**: Disable browser extensions that might interfere with cookies or redirects

4. **Hosts File**: Ensure `localhost` resolves correctly
   ```powershell
   ping localhost
   # Should respond from 127.0.0.1 or ::1
   ```

5. **Firewall/Antivirus**: Temporarily disable to test if they're blocking HTTPS connections
