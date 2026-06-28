# Supabase Configuration Fix

## Current Issue
The login is failing with `ERR_NAME_NOT_RESOLVED`, which means the Supabase URL cannot be resolved. This indicates:
- The Supabase project may not exist
- The URL in the configuration is incorrect
- The project may be paused or deleted

## How to Fix

### Step 1: Verify Your Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Sign in to your account
3. Check if your project exists and is active
4. If the project doesn't exist, create a new one

### Step 2: Get the Correct Configuration
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key under "Project API keys")

### Step 3: Update Configuration

**Option A: Update the code directly**
Edit `src/integrations/supabase/client.ts` and replace:
```typescript
const SUPABASE_URL = "https://xybjydgqwthvzpgwhgah.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key-here";
```

**Option B: Use environment variables (Recommended)**
1. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. The code will automatically use these values if they exist.

### Step 4: Verify the Fix
1. Restart your development server
2. Open the browser console (F12)
3. Navigate to the login page
4. Check the console for configuration logs
5. Try logging in again

## Testing the Connection
You can test the Supabase connection by:
1. Opening the browser console on the login page
2. Running: `await window.testSupabase()`

This will show you a detailed report of the connection status.

## Common Issues

### "ERR_NAME_NOT_RESOLVED"
- **Cause**: Incorrect Supabase URL
- **Fix**: Verify the URL in your Supabase dashboard

### "Invalid API key"
- **Cause**: Wrong anon key
- **Fix**: Copy the correct `anon` key from Settings → API

### "Project not found"
- **Cause**: Project was deleted or paused
- **Fix**: Create a new project or reactivate the existing one

## Need Help?
- Check Supabase documentation: https://supabase.com/docs
- Verify your project status in the Supabase dashboard
- Check the browser console for detailed error messages

