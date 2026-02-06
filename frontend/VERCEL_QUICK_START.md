# Vercel Deployment - Quick Start

## Deploy to Vercel in 5 Minutes

### Step 1: Set Environment Variable
In Vercel Dashboard → Settings → Environment Variables, add:

```
REACT_APP_BACKEND_URL = https://your-backend-url.com
```

Replace `your-backend-url.com` with your actual backend URL.

### Step 2: Deploy
Vercel will automatically build and deploy when you push to your main branch.

### Step 3: Update Backend CORS
Add your Vercel URL to backend's CORS_ORIGINS:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
```

## Important Notes

- ✅ Use HTTPS for production backend
- ✅ No trailing slash in `REACT_APP_BACKEND_URL`
- ✅ No `/api` suffix in the URL
- ✅ Redeploy after adding environment variables

## Need More Help?

See the complete guide: `/VERCEL_DEPLOYMENT_GUIDE.md`

## Test Your Deployment

1. Visit your Vercel URL
2. Login with: `admin` / `admin123`
3. Check browser console for errors

## Common Issues

**"Login failed"** → Check backend URL and CORS
**"Network error"** → Verify backend is accessible
**CORS error** → Add Vercel domain to backend CORS_ORIGINS
