# Multi-Role User Guide

## Overview

Nutrimotion supports **multi-role users**, meaning a single user can have multiple roles simultaneously. This is useful for:

- **Admin who also wants to order meals** (ADMINISTRATOR + CLIENT)
- **Admin who also delivers** (ADMINISTRATOR + DRIVER)
- **Driver who also orders meals** (DRIVER + CLIENT)
- **Super users with all roles** (ADMINISTRATOR + CLIENT + DRIVER)

## How Multi-Role Works

### Permissions System
Each role has specific permissions:
- **CLIENT**: View catalog, manage cart, place orders, track deliveries
- **ADMINISTRATOR**: All client permissions + manage meals, users, orders, content
- **DRIVER**: View deliveries, update status, share location

### Permission Aggregation
When you have multiple roles, you get **ALL permissions from ALL roles**:

```
CLIENT permissions: [view:meals, manage:cart, checkout, ...]
ADMINISTRATOR permissions: [view:meals, manage:cart, checkout, manage:meals, manage:users, ...]

CLIENT + ADMINISTRATOR = All permissions combined
```

### Menu Display
The sidebar menu automatically organizes items by section:

1. **Browse** - Public pages (Meals, Training, Books, etc.)
2. **My Account** - Client-specific pages (Orders, Profile, Cart)
3. **Administration** - Admin pages (only if you have ADMINISTRATOR role)
4. **Driver Portal** - Driver pages (only if you have DRIVER role)

### Role Badges
The top AppBar displays colored badges showing your active roles:
- 🔴 **Admin** - Red badge (ADMINISTRATOR role)
- 🔵 **Driver** - Blue badge (DRIVER role)
- ⚪ **Client** - Gray badge (CLIENT role)

## Setting Up Multi-Role Users

### Method 1: Using the Helper Script

```bash
# Make a user have multiple roles
node scripts/make-admin.js user@example.com

# Then manually add more roles in MongoDB
```

### Method 2: Direct MongoDB Update

```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/nutrimotion

// Give user multiple roles
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { roles: ["client", "administrator"] } }
)

// Or add all roles
db.users.updateOne(
  { email: "superuser@example.com" },
  { $set: { roles: ["client", "administrator", "driver"] } }
)
```

### Method 3: Enhanced Script (Recommended)

I'll create an enhanced role management script below.

## Use Cases

### Use Case 1: Admin Who Orders Meals
**Roles**: `["client", "administrator"]`

**Menu Sections Visible**:
- ✅ Browse (Meals, Training, Books)
- ✅ My Account (Orders, Profile, Cart)
- ✅ Administration (Meal Management, Orders, Users)

**Benefits**:
- Test the ordering flow as a customer
- Manage meals and orders as admin
- See both perspectives in one account

### Use Case 2: Admin Who Delivers
**Roles**: `["driver", "administrator"]`

**Menu Sections Visible**:
- ✅ Browse (Public pages)
- ✅ Administration (Full admin access)
- ✅ Driver Portal (Deliveries, Location)

**Benefits**:
- Manage system as admin
- Handle deliveries as driver
- Monitor entire delivery pipeline

### Use Case 3: Driver Who Orders
**Roles**: `["client", "driver"]`

**Menu Sections Visible**:
- ✅ Browse (Meals, Training, Books)
- ✅ My Account (Orders, Profile, Cart)
- ✅ Driver Portal (Deliveries, Assignments)

**Benefits**:
- Order meals for personal use
- Deliver orders to other customers
- Track both roles separately

### Use Case 4: Super User (All Roles)
**Roles**: `["client", "administrator", "driver"]`

**Menu Sections Visible**:
- ✅ Browse (All public pages)
- ✅ My Account (Full client access)
- ✅ Administration (Full admin access)
- ✅ Driver Portal (Full driver access)

**Benefits**:
- Complete system access
- Test all flows end-to-end
- Perfect for development/testing

## Visual Indicators

### Top AppBar
Shows role badges:
```
[Nutrimotion]  [Admin] [Driver] [Cart] [Profile] [Logout]
                  🔴      🔵
```

### Sidebar Menu
Organized by sections with headers:

```
┌─────────────────────┐
│ Browse              │ ← Public pages
│ • Meals             │
│ • Training          │
│ • Books             │
├─────────────────────┤
│ My Account          │ ← Client pages
│ • Profile           │
│ • My Orders         │
│ • Cart              │
├─────────────────────┤
│ ADMINISTRATION      │ ← Admin pages (red)
│ • Admin Dashboard   │
│ • Meal Management   │
│ • Order Management  │
│ • Users             │
├─────────────────────┤
│ DRIVER PORTAL       │ ← Driver pages (blue)
│ • Driver Dashboard  │
│ • My Deliveries     │
└─────────────────────┘
```

## Managing Multiple Roles

### Add a Role
```javascript
// Add ADMINISTRATOR to existing roles
db.users.updateOne(
  { email: "user@example.com" },
  { $addToSet: { roles: "administrator" } }
)
```

### Remove a Role
```javascript
// Remove DRIVER role
db.users.updateOne(
  { email: "user@example.com" },
  { $pull: { roles: "driver" } }
)
```

### Replace All Roles
```javascript
// Set specific roles
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { roles: ["client", "administrator"] } }
)
```

### View Current Roles
```javascript
// Check user's roles
db.users.findOne(
  { email: "user@example.com" },
  { email: 1, name: 1, roles: 1 }
)
```

## Testing Multi-Role Functionality

### Step 1: Create a Multi-Role User
```bash
# First, log in once to create the account
# Then run:
mongosh mongodb://localhost:27017/nutrimotion

db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { roles: ["client", "administrator"] } }
)
```

### Step 2: Log Out and Log Back In
The session caches your roles, so you must re-login after role changes.

### Step 3: Verify the Display
After logging in, you should see:

1. **Top bar**: Multiple role badges (e.g., "Client" and "Admin")
2. **Sidebar**: Multiple sections with menu items from all your roles
3. **Dashboard**: Access to features from all your roles

### Step 4: Test Navigation
- Navigate to admin pages (e.g., `/admin/dashboard`)
- Navigate to client pages (e.g., `/client/orders`)
- All should be accessible

## Permission Inheritance

### How Permissions Work
```javascript
// Example user with CLIENT + ADMINISTRATOR roles
const user = {
  roles: ["client", "administrator"],
  permissions: [
    // All CLIENT permissions
    "view:meals", "manage:cart", "checkout", "view:orders", ...
    
    // All ADMINISTRATOR permissions (includes all client permissions + admin ones)
    "manage:meals", "manage:users", "manage:orders", "view:analytics", ...
  ]
}
```

### Permission Checking
The system automatically checks if you have the required permission(s):

```typescript
// User needs "manage:meals" permission
// If user has ADMINISTRATOR role → ✅ Has permission
// If user has CLIENT role → ❌ No permission
// If user has BOTH → ✅ Has permission
```

## Troubleshooting

### Not Seeing Admin Menu Items

**Problem**: Updated roles but don't see admin menu items

**Solution**:
1. ✅ Verify roles in MongoDB: `db.users.findOne({ email: "your@email.com" })`
2. ✅ Log out completely from the application
3. ✅ Clear browser cookies for `localhost:3000`
4. ✅ Log back in
5. ✅ Check role badges in top bar

### Role Badges Not Showing

**Problem**: Don't see role badges in AppBar

**Solution**:
1. Check Redux state is loaded: Open browser DevTools → Redux tab
2. Ensure `/api/auth/me` endpoint returns roles
3. Verify `fetchUserRequest()` saga runs on dashboard load

### Menu Items Overlapping

**Problem**: Seeing duplicate menu items

**Solution**:
This shouldn't happen as menu items have unique IDs. If it does:
1. Check for duplicate menu item definitions
2. Clear browser cache
3. Restart development server

## Best Practices

### For Development
- Use a super user account with all roles: `["client", "administrator", "driver"]`
- Test features from each role perspective
- Verify permission boundaries

### For Production
- **Limit multi-role assignments**: Only assign multiple roles when necessary
- **Use principle of least privilege**: Give minimum required roles
- **Regular audits**: Review who has what roles periodically
- **Separate accounts**: Consider separate accounts for different roles in production

### For Testing
- Create test users with different role combinations
- Test permission boundaries between roles
- Verify menu visibility logic
- Test role switching (log out/in after role change)

## Role Management Script

Enhanced script to manage roles easily:

```bash
# Make user admin (keeps existing roles)
npm run make-admin user@example.com

# For other role combinations, use MongoDB directly
```

## Technical Details

### How Menu Items Are Filtered

1. **Get user's roles** from MongoDB: `["client", "administrator"]`
2. **Calculate permissions** by combining all role permissions
3. **Filter menu items** by checking if user has required permissions
4. **Organize by sections** based on route prefixes
5. **Display in sidebar** with section headers

### Code Flow
```typescript
// 1. User logs in
session = auth0.getSession()

// 2. Get user from database
user = User.findOne({ auth0Sub: session.user.sub })

// 3. Get permissions from ALL roles
permissions = getPermissionsForRoles(user.roles)
// Example: ["view:meals", "manage:cart", "manage:meals", "manage:users", ...]

// 4. Filter menu items
menuItems = getAllMenuItemsForUser(permissions)

// 5. Display in sidebar organized by sections
```

### Permission Matrix
See `lib/permissions/matrix.ts` for the complete permission mapping.

## Support

If you need help with multi-role setup:
1. Check MongoDB to verify roles: `db.users.findOne({ email: "your@email.com" })`
2. Verify you've logged out and back in after role changes
3. Check browser console for permission errors
4. Review `lib/permissions/matrix.ts` for permission definitions
5. Check `lib/permissions/menu-config.ts` for menu item definitions

## Future Enhancements

Potential features for multi-role support:
- Role switching UI (switch active role without logging out)
- Role-based dashboard layouts
- Recent role activity tracking
- Role-specific notifications
- Custom role definitions
