# Gemini API Key Setup Guide

## Where to Configure the API Key

### For Local Development

1. **Create `.env.local` file** in the project root (same directory as `package.json`):
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

2. **Get your API key** from:
   - https://makersuite.google.com/app/apikey
   - Or Google Cloud Console: https://console.cloud.google.com/apis/credentials

3. **Important**: Add `.env.local` to `.gitignore` (it should already be there)

### For Production (Netlify, Vercel, GitHub Pages, etc.)

#### Netlify
1. Go to your site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add new variable:
   - **Key**: `VITE_GEMINI_API_KEY`
   - **Value**: Your API key
4. Redeploy your site

#### Vercel
1. Go to your project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add:
   - **Key**: `VITE_GEMINI_API_KEY`
   - **Value**: Your API key
   - **Environment**: Production, Preview, Development (select all)
4. Redeploy

#### GitHub Pages (via GitHub Actions)
Add to your GitHub repository secrets:
1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add new secret:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your API key
3. Update your build workflow to use the secret

## API Key Restrictions (IMPORTANT for 403 Errors)

If you're getting **403 Forbidden** errors, your API key likely has domain restrictions.

### Fix API Key Restrictions

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key and click **Edit**
3. Under **Application restrictions**:
   - **Option 1 (Recommended for production)**: Select "HTTP referrers (web sites)"
     - Add your domains:
       - `https://yourdomain.com/*`
       - `https://*.netlify.app/*` (if using Netlify)
       - `https://*.vercel.app/*` (if using Vercel)
       - `http://localhost:*` (for local development)
   
   - **Option 2 (Less secure)**: Select "None" (allows all domains)
     - ⚠️ **Warning**: This allows anyone to use your API key if they find it
     - Only use for testing

4. Under **API restrictions**:
   - Select "Restrict key"
   - Enable "Generative Language API"
   - Save

5. **Wait 5-10 minutes** for changes to propagate

### Security Best Practices

1. **Regenerate your key** if it was exposed in code or commits
2. **Use domain restrictions** in production
3. **Monitor usage** in Google Cloud Console
4. **Set up quota limits** to prevent abuse
5. **Consider using a backend proxy** for production apps (more secure)

## Troubleshooting 403 Errors

### Common Causes:
1. ✅ API key restrictions don't include your domain
2. ✅ Generative Language API not enabled
3. ✅ API key invalid or expired
4. ✅ Changes to restrictions need time to propagate (5-10 min)

### Check Your Setup:
```bash
# Verify the key is loaded (in browser console)
console.log(import.meta.env.VITE_GEMINI_API_KEY ? 'Key loaded' : 'Key missing');
```

### Test API Key:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Alternative: Backend Proxy (More Secure)

For production, consider creating a backend endpoint that:
1. Stores the API key server-side (never exposed)
2. Your frontend calls your backend
3. Backend calls Gemini API
4. Returns results to frontend

This keeps your API key completely private.





