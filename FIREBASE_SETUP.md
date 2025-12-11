# Firebase Authentication Setup Guide

## Fixing Google Sign-In 404 Error

If you're seeing a 404 error when trying to sign in with Google, follow these steps:

### 1. Configure Authorized Domains in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`treasure-seeker-a771e`)
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Ensure the following domains are added:
   - `treasure-seeker-a771e.firebaseapp.com` (Firebase Hosting domain)
   - `treasure-seeker-a771e.web.app` (Firebase Hosting domain)
   - Your custom domain (if applicable)
   - `localhost` (for local development)

### 2. Configure OAuth Consent Screen (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen:
   - User Type: External (or Internal if using Google Workspace)
   - App name: Treasure Seeker
   - User support email: Your email
   - Developer contact: Your email
5. Add scopes:
   - `email`
   - `profile`
   - `openid`
6. Add test users (if in testing mode) or publish the app

### 3. Configure OAuth 2.0 Client IDs (CRITICAL - Fixes 404 Error)

**This is the most common cause of the 404 error!**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`treasure-seeker-a771e`)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **Web client (auto created by Google Service)** under OAuth 2.0 Client IDs
5. Click to edit
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add these EXACT URLs (one at a time):
   - `https://treasure-seeker-a771e.firebaseapp.com/__/auth/handler`
   - `https://treasure-seeker-a771e.web.app/__/auth/handler`
   - `http://localhost:8080/__/auth/handler` (for local dev - default port)
   - `http://localhost:8081/__/auth/handler` (for local dev - if using port 8081)
   - `http://localhost:3000/__/auth/handler` (for local dev - if using port 3000)
   - Your custom domain with `/__/auth/handler` (if applicable)
   
   **IMPORTANT**: 
   - Make sure the port matches the port your app is actually running on!
   - Check your browser's address bar to see which port you're using (e.g., `localhost:8081`)
   - Each URI must be added separately - don't combine them
   - After adding, click **SAVE** at the bottom
   - Wait 1-2 minutes for changes to propagate

### 4. Enable Google Sign-In Provider

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Enable it
4. Set the **Project support email**
5. Save

### 5. Redeploy Firebase Hosting

After making changes, redeploy:

```bash
npm run build
firebase deploy --only hosting
```

### Alternative: Use Redirect Instead of Popup

The code now automatically falls back to redirect-based authentication if popup fails. This is more reliable for some browsers and configurations.

### Troubleshooting

- **404 Error in Popup**: 
  - This means OAuth redirect URIs aren't configured correctly
  - Go to Google Cloud Console → Credentials → OAuth 2.0 Client IDs
  - Add `http://localhost:8081/__/auth/handler` (or whatever port you're using)
  - Make sure you click SAVE and wait 1-2 minutes
  - The popup will automatically fall back to redirect mode if it detects this error
  
- **Popup Blocked**: Browser settings or extensions blocking popups
- **Invalid Client**: OAuth client ID not configured correctly
- **Domain Not Authorized**: Add domain to Firebase authorized domains list
- **Still seeing 404**: Try clearing browser cache and cookies, then try again

### Testing Locally

For local development, ensure:
- `localhost` is in authorized domains
- `http://localhost:8080/__/auth/handler` is in OAuth redirect URIs
- Firebase emulators are running if using Firebase emulator suite

