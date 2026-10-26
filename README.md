# SnapTools — Free Photo & PDF Utilities

A static, browser-first website starter for:
- Passport-style photo cropping and output sizing
- Image/signature resizing and JPEG compression
- PDF merge and page extraction

## Privacy and security model
- Files are processed locally in the browser; there is no upload API or file storage backend.
- Image input is restricted to JPEG, PNG and WebP, with a 10 MB limit and pixel-dimension guard.
- PDF input is restricted to PDF files, 15 MB each and up to 5 files.
- No user files are sent to a server by the application code.
- PDF processing uses `pdf-lib` loaded from jsDelivr CDN. The site needs an internet connection for this library and Google Fonts.
- This does not guarantee all files are harmless: keep dependencies updated and test carefully.

## Run locally in VS Code
1. Extract this ZIP into a folder.
2. Open that folder in VS Code.
3. Install the **Live Server** extension (Ritwick Dey) if you do not already have it.
4. Right-click `index.html` → **Open with Live Server**.
5. Test photo, image and PDF tools with non-sensitive sample files.

You can also use any simple local static web server. Avoid opening the site from an untrusted folder or adding unknown extensions.

## Free deployment with Cloudflare Pages
1. Create a GitHub account if you don't have one.
2. Create a new public or private repository and upload `index.html`, `styles.css`, `app.js`, and this README.
3. Create/sign in to a Cloudflare account and open **Workers & Pages**.
4. Choose **Create application** → **Pages** → connect to Git.
5. Select the repository. Because this is a static site, leave the build command empty and set the output directory to `/` (or the repository root, depending on the current dashboard UI).
6. Deploy. Cloudflare provides a `*.pages.dev` address.
7. Open the deployed URL on desktop and mobile, test every tool, and check the browser console for errors.

Dashboard labels may change over time; follow Cloudflare's current Pages documentation if the UI differs.

## Before public launch
- Replace `hello@example.com` with a real contact address.
- Add a proper Privacy Policy and Terms page before applying for advertising.
- Add a custom domain only when ready; it is optional for testing.
- Confirm any country/application photo requirements using official instructions. This tool does not guarantee acceptance.
- Do not add ads that obscure the tool or mislead users. Apply to an ad network only after you have substantial useful content and comply with its policies.
- Consider self-hosting pinned dependencies after reviewing license and security update practices. CDN-loaded scripts can be changed by their publisher and require an internet connection.
- Add a content security policy and further hardening before production. A strict CSP requires updating the current inline-free HTML setup and allowing only required script/style/font sources.
- Keep upload limits and privacy statements accurate. This starter does not have server-side uploads.

## Current limitations
- Background dropdown changes the output canvas color; it does not remove the original photo background.
- Photo crop is centered; there is no drag-to-position editor in this first version.
- Image target-size compression iteratively reduces JPEG quality, but exact KB targets cannot always be reached without reducing dimensions.
- PDF operations may fail for encrypted, damaged or complex documents.
- It does not include OCR, PDF-to-Excel, image background removal, accounts, analytics or ads.
