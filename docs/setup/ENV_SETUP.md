# Environment Setup Guide

## Gemini API Key Configuration

### Local Development

1. **Create `.env.local` file** in the project root (same directory as `package.json`):
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

2. **Get your API key** from:
   - https://makersuite.google.com/app/apikey
   - Or Google AI Studio: https://aistudio.google.com/app/apikey

3. **Restart your dev server** after creating/updating `.env.local`:
   ```bash
   npm run dev
   ```

### Production (Netlify)

1. **Go to Netlify Dashboard** → Your Site → Site Settings → Environment Variables

2. **Add new variable**:
   - Key: `VITE_GEMINI_API_KEY`
   - Value: `your_api_key_here`

3. **Redeploy** your site after adding the variable

### Production (GitHub Pages / Other)

For GitHub Pages or other static hosting:

1. **Set environment variable** in your CI/CD pipeline (GitHub Actions, etc.)
2. **Add to build script** or use GitHub Secrets

Example for GitHub Actions:
```yaml
env:
  VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

## Important: API Key Restrictions

If you get a **403 Forbidden** error, check your API key restrictions:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → Credentials
3. **Click on your API key**
4. **Check "API restrictions"**:
   - Make sure "Generative Language API" is enabled
5. **Check "Application restrictions"**:
   - If set to "HTTP referrers", add your domain:
     - `https://kreodev.netlify.app/*`
     - `https://yourdomain.com/*`
     - `http://localhost:8082/*` (for local dev)
   - Or set to "None" for testing (less secure)

## Security Notes

- ✅ `.env.local` is already in `.gitignore` (won't be committed)
- ✅ Never commit API keys to git
- ✅ Regenerate keys if accidentally exposed
- ⚠️ Client-side API keys are visible in browser - consider rate limiting in Google Cloud Console




