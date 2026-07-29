# Deployment Guide

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

#### Setup Steps:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/[username]/Smart-md-viewer.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: Select **GitHub Actions**
   - Save the settings

3. **Trigger Deployment:**
   - The workflow automatically runs on every push to `main`
   - Or manually trigger it from the **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

4. **Access Your Site:**
   - Your site will be available at: `https://[username].github.io/Smart-md-viewer/`
   - Note: Replace `[username]` with your GitHub username

#### Configure Base Path

If your repository name is different from "Smart-md-viewer", update the base path in `vite.config.ts`:

```typescript
base: process.env.GITHUB_ACTIONS ? '/your-repo-name/' : '/',
```

### Manual Deployment

If you prefer manual deployment:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder:**
   - The `dist` folder contains your built application
   - Upload this to any static hosting service

## Alternative Hosting Platforms

### Netlify

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Base path: Set to `/` in `vite.config.ts`

### Vercel

1. Import your GitHub repository to Vercel
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Base path: Set to `/` in `vite.config.ts`

### Custom Server

1. Build the project: `npm run build`
2. Copy the `dist` folder to your server
3. Configure your web server to serve the files
4. Ensure proper routing for SPA (redirect all routes to index.html)

## Environment Configuration

For production deployments, you may want to:

1. Set appropriate meta tags in `index.html`
2. Configure your custom domain
3. Update Open Graph images
4. Set up analytics (Google Analytics, etc.)

## Troubleshooting

### 404 on Page Refresh

If you get 404 errors when refreshing pages:
- Ensure your hosting supports SPA routing
- For GitHub Pages, the workflow includes proper configuration
- For other hosts, configure redirects to `index.html`

### Assets Not Loading

If CSS/JS files don't load:
- Check the `base` path in `vite.config.ts`
- Ensure it matches your deployment URL structure

### Build Fails

If the build fails:
- Run `npm ci` to clean install dependencies
- Check for linting errors: `npm run lint`
- Verify Node.js version (v20 recommended)

