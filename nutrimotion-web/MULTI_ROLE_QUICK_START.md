# Multi-Role Quick Start

## TL;DR - Make Yourself Admin + Keep Client Access

```bash
# 1. Log in once at https://localhost:3000 to create your account

# 2. Add administrator role (keeps existing client role)
npm run manage-roles add your-email@example.com administrator

# 3. Log out and log back in

# 4. You'll now see:
#    - Role badges: [Client] [Admin] in top bar
#    - Menu sections: Browse, My Account, Administration
```

## Quick Commands

### Add Administrator Role
```bash
npm run manage-roles add your-email@example.com administrator
```

### Add Driver Role  
```bash
npm run manage-roles add your-email@example.com driver
```

### Give All Roles (Super User)
```bash
npm run manage-roles set your-email@example.com client,administrator,driver
```

### Remove a Role
```bash
npm run manage-roles remove your-email@example.com driver
```

### Check Current Roles
```bash
npm run manage-roles list your-email@example.com
```

## What You'll See

### With CLIENT Role Only
- Menu: Browse, My Account
- Badge: [Client]
- Access: Order meals, view orders, manage profile

### With ADMINISTRATOR Role Added
- Menu: Browse, My Account, **Administration**
- Badges: [Client] [Admin]
- Access: Everything above + manage meals, users, orders, content

### With DRIVER Role Added
- Menu: Browse, My Account, Administration, **Driver Portal**
- Badges: [Client] [Admin] [Driver]
- Access: Everything above + view deliveries, update status

## Important Notes

1. **Always log out and back in** after changing roles
2. **Role badges** appear in the top right of the AppBar
3. **Menu is auto-organized** by sections based on your roles
4. **Permissions are combined** from all your roles

## Menu Organization

Your sidebar will show sections based on your roles:

```
┌─────────────────────────┐
│ Browse                  │ ← Everyone sees this
│ • Meals                 │
│ • Training              │
│ • Books                 │
├─────────────────────────┤
│ My Account              │ ← CLIENT role
│ • Profile               │
│ • My Orders             │
│ • Cart                  │
├─────────────────────────┤
│ ADMINISTRATION          │ ← ADMINISTRATOR role
│ • Admin Dashboard       │
│ • Meal Management       │
│ • Order Management      │
│ • Content               │
│   - Books               │
│   - Videos              │
│   - Recipes             │
│   - Training            │
│ • Deliveries            │
│ • Users                 │
│ • Analytics             │
├─────────────────────────┤
│ DRIVER PORTAL           │ ← DRIVER role
│ • Driver Dashboard      │
│ • My Deliveries         │
└─────────────────────────┘
```

## Complete Guide

See **`MULTI_ROLE_GUIDE.md`** for comprehensive documentation on:
- How multi-role permissions work
- Use cases and examples
- Troubleshooting
- Technical details
- Best practices
