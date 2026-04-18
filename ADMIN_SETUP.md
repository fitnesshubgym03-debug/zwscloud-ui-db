# Admin User Setup Guide

## Quick Start

Your admin credentials are:
- **Email**: samvpslio@gmail.com
- **Password**: Sam@00000
- **Login URL**: `/zwsloginsam`

## Setup Methods

### Option 1: Automatic Setup (Recommended)
Run the seeding script to automatically create the admin user:

```bash
pnpm seed:admin
```

This requires `SUPABASE_SERVICE_ROLE_KEY` environment variable to be set.

### Option 2: Manual Setup via Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication → Users**
4. Click **Add user**
5. Enter the credentials:
   - Email: `samvpslio@gmail.com`
   - Password: `Sam@00000`
   - Check **Auto-confirm user**
6. Click **Create user**
7. Click on the user to edit
8. Go to **User metadata** tab
9. Add the following JSON:
```json
{
  "is_admin": true,
  "display_name": "Sam Admin"
}
```
10. Click **Save**

## Verify Setup

After creating the admin user, you should be able to:

1. Visit `/zwsloginsam`
2. Enter email: `samvpslio@gmail.com`
3. Enter password: `Sam@00000`
4. Click "Login"
5. You should be redirected to `/admin` dashboard

## Reset Password

If you need to reset the admin password:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user `samvpslio@gmail.com`
3. Click the three dots menu
4. Select **Reset password**
5. A reset link will be sent to the email

## Additional Admin Users

To add more admin users:

1. Create a new auth user in Supabase Dashboard
2. Add `"is_admin": true` to their user metadata
3. Create a corresponding record in `admin_profiles` table with:
   - `username`: unique identifier
   - `display_name`: display name for dashboard

## Environment Variables Required

For the automatic seeding script (`pnpm seed:admin`), ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

**Can't login?**
- Verify the email is correct: `samvpslio@gmail.com`
- Check that user is auto-confirmed in Supabase
- Ensure `is_admin: true` is in user metadata
- Check browser console for detailed errors

**Admin dashboard won't load?**
- Make sure you're logged in (check session cookie)
- Verify admin_profiles record exists for your user
- Check server logs for API errors
