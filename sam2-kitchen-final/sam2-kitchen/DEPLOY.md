# Deploy SAM² Kitchen (GitHub + Cloudflare Pages, free)

Folder layout: `site/` is the website (this is the only folder that goes public). `backend/` is the Google Apps Script code (copy-paste into Google, not hosted). `brand/` holds the original logo.

## A. GitHub
1. Sign up at github.com (free). Click + > New repository. Name: `sam2-kitchen`. Choose **Private**. Create.
2. Click "uploading an existing file". Open this unzipped folder, select everything inside it (site, backend, brand, README files) and drag it into the page. Click Commit changes.

## B. Cloudflare Pages
1. Sign up at dash.cloudflare.com (free, no card needed for Pages).
2. Workers & Pages > Create > Pages > Connect to Git (or "Import an existing Git repository"). Authorize GitHub, choose `sam2-kitchen`.
3. Project name: `sam2kitchen` (this becomes sam2kitchen.pages.dev; if taken, try sam2-kitchen).
4. Framework preset: None. Build command: leave EMPTY. **Build output directory: `site`**. Save and Deploy.
5. After 1 to 2 minutes you get your permanent URL.

## C. After it is live
- Open the URL on your phone, check the menu loads, and tap an Order button.
- Open `YOUR-URL/admin/`, log in, change a price, then refresh the main site (allow up to 1 minute).
- Tell Claude the final URL so the QR code can be generated (Phase 8).

## Updating the website later
Edit a file on GitHub (pencil icon) and commit. Cloudflare redeploys automatically. Menu changes never need this: use the admin page.
