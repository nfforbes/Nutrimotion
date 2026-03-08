# Administrator Access Setup Guide

## Overview

By default, new users are assigned the **CLIENT** role when they first log in. To access administrator pages, you need to change your role to **ADMINISTRATOR**.

## Quick Setup (Recommended)

### Step 1: Log In Once
First, log in to the application at least once to create your user account in the database:

1. Visit: `https://localhost:3000`
2. Click "Sign In"
3. Complete Auth0 login
4. You'll be redirected to the dashboard (with CLIENT role)

### Step 2: Make Yourself Admin

Use the provided script to upgrade your account:

```bash
# Replace with your actual email address
npm run make-admin your-email@example.com
```

Example:
```bash
npm run make-admin admin@nutrimotion.com
```

### Step 3: Re-login

1. Log out from the application
2. Log back in
3. Visit admin pages: `https://localhost:3000/admin/dashboard`

## Admin Pages Available

Once you have the ADMINISTRATOR role, you can access:

### Main Admin Dashboard
- **URL**: `https://localhost:3000/admin/dashboard`
- Overview of system metrics, recent orders, and quick actions

### Meal Management
- **URL**: `https://localhost:3000/admin/meals`
- Create and edit meal packages
- **URL**: `https://localhost:3000/admin/meals/schedule`
- Calendar-based meal scheduling (breakfast, lunch, dinner)

### Order Management
- **URL**: `https://localhost:3000/admin/orders`
- View all orders
- Update order statuses
- Assign drivers to deliveries

### Delivery Management
- **URL**: `https://localhost:3000/admin/deliveries`
- Manage delivery assignments
- Track delivery statuses

### User Management
- **URL**: `https://localhost:3000/admin/users`
- View and manage user accounts
- Assign roles

### Content Management
- **URL**: `https://localhost:3000/admin/content`
- Hub for managing all content
- **URL**: `https://localhost:3000/admin/content/books`
- Upload and manage books (with DRM)
- **URL**: `https://localhost:3000/admin/content/videos`
- Upload and manage video content
- **URL**: `https://localhost:3000/admin/content/recipes`
- Create and manage recipes
- **URL**: `https://localhost:3000/admin/content/training`
- Manage training packages

### Analytics
- **URL**: `https://localhost:3000/admin/analytics`
- View system analytics and reports

## Manual Database Method

If you prefer to update the database directly:

### Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/nutrimotion

# Find your user
db.users.find({ email: "your-email@example.com" })

# Update to ADMINISTRATOR role
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { roles: ["administrator"] } }
)

# Verify the change
db.users.find({ email: "your-email@example.com" })
```

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `nutrimotion`
4. Select collection: `users`
5. Find your user document (by email)
6. Edit the document
7. Change `roles` array to: `["administrator"]`
8. Click "Update"

## User Roles Explained

### CLIENT (Default)
- Access to public pages (meals, training, books, recipes)
- Can manage cart and place orders
- View own profile and orders
- Track own deliveries

### ADMINISTRATOR
- **All CLIENT permissions** +
- Create and manage meal packages
- Schedule meals on calendar
- View and manage all orders
- Assign drivers to deliveries
- Upload content (books, videos, recipes, training)
- Manage users and roles
- View analytics

### DRIVER
- View assigned deliveries
- Update delivery statuses
- Share location
- View client delivery information

## Permissions System

The system uses a granular permission system. Administrators have these key permissions:

- `manage:meals` - Create/edit meal packages
- `schedule:meals` - Calendar scheduling
- `manage:orders` - View/update all orders
- `assign:drivers` - Assign deliveries
- `manage:users` - User management
- `upload:content` - Upload books/videos
- `view:analytics` - System analytics
- And more...

## Troubleshooting

### "You don't have permission to access this page"

**Problem**: You're seeing a permission error on admin pages

**Solutions**:
1. Verify your role is set to `administrator` in the database
2. Log out and log back in (session needs to refresh)
3. Clear browser cookies and try again
4. Check that MongoDB is running

### Admin Script Not Working

**Problem**: `npm run make-admin` fails

**Check**:
1. MongoDB is running: `mongosh mongodb://localhost:27017/nutrimotion`
2. User exists in database (logged in at least once)
3. Correct email address provided
4. Environment variables are set (`.env` file exists)

### Still Shows CLIENT Dashboard

**Problem**: After updating role, still seeing client views

**Solution**:
1. **Log out completely** from the application
2. Clear browser cookies for `localhost:3000`
3. Close browser
4. Reopen browser
5. Log in again

The session caches your roles, so you must log out/in after role changes.

## Creating Additional Admin Users

To create more administrator accounts:

```bash
# Log in as each user first (to create their account)
# Then run the script for each user
npm run make-admin admin1@example.com
npm run make-admin admin2@example.com
npm run make-admin admin3@example.com
```

## Security Notes

1. **Protect Admin Access**: Only grant administrator role to trusted users
2. **Use Strong Passwords**: Admin accounts should use strong Auth0 passwords
3. **Enable MFA**: Consider enabling Multi-Factor Authentication in Auth0 for admin users
4. **Audit Logs**: Monitor admin actions in production
5. **Regular Reviews**: Periodically review who has administrator access

## Next Steps

After gaining admin access:

1. **Explore the Admin Dashboard**
   - Familiarize yourself with the layout
   - Check system metrics

2. **Create Test Content**
   - Add a sample meal package
   - Schedule meals on the calendar
   - Upload test content

3. **Test Order Flow**
   - Create a test order (as CLIENT)
   - Process it (as ADMINISTRATOR)
   - Assign to a driver

4. **Configure System**
   - Set up delivery drivers (create driver accounts)
   - Configure discount codes
   - Customize content

## Support

If you encounter issues:
1. Check MongoDB connection
2. Verify Auth0 configuration
3. Check browser console for errors
4. Review server logs
5. Ensure you've logged out and back in after role change
