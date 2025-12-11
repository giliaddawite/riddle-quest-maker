# Riddle Quest Maker

Treasure-hunt builder and game client built with React + Vite. Auth, data, and assets are handled entirely through Firebase (Auth, Firestore, Storage). Users can sign in, create hidden-object scenes with riddles, browse community scenes, and play interactive treasure hunts.

**URL**: https://treasure-seeker-a771e.web.app/

- Firebase email/password & Google OAuth authentication
- Scene creator with image uploads to Firebase Storage
- Firestore-backed scene browser and player
- Riddle-driven hidden-object gameplay loop with energy/time mechanics
- Toast notifications, tooltips, responsive UI built with shadcn/tailwind
- Optional demo scenes packaged under `src/lib` for seed content

## Getting Started

```bash
git clone https://github.com/giliaddawite/riddle-quest-maker.git
cd riddle-quest-maker
npm install
cp .env.local.example .env.local   # create this file if it doesn't exist
npm run dev
```

Open http://localhost:8080/ to access the app.

### Required Environment Variables

Create `.env.local` and provide your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=optional-ga-id
```

> Do not commit `.env.local`; it is ignored by git.

## Available Scripts

- `npm run dev` – Start Vite dev server (http://localhost:8080/)
- `npm run build` – Production build
- `npm run build:dev` – Build using development mode
- `npm run preview` – Preview the production build
- `npm run lint` – Run ESLint

## Firebase Setup

1. Create a Firebase project and enable **Authentication** (Email/Password + Google).
2. Create a **Firestore** database in production mode; add a `scenes` collection.
3. Enable **Cloud Storage**; create a bucket (e.g., `scene-images`) and update security rules as needed.
4. Copy Web app credentials into `.env.local` using the keys above.

## Architecture

- `src/pages/Auth.tsx` – Authentication workflows
- `src/pages/Index.tsx` – Auth-guarded landing page
- `src/pages/SceneCreator.tsx` – Uploads images to Storage, writes scene docs to Firestore
- `src/pages/SceneBrowser.tsx` – Lists scenes from Firestore
- `src/pages/GamePlayer.tsx` – Renders hidden-object gameplay for a selected scene
- `src/integrations/firebase/client.ts` – Central Firebase initialization
- `src/lib/demoScenes.ts` – Optional demo data + bundled images (`scene1.png`, etc.)

## Deployment

Build the project and deploy the `dist` folder to any static host. For Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

Ensure hosting rewrite rules serve `index.html` for SPA routing.

## Contributing

- Ensure formatting and linting pass (`npm run lint`).
- Update README when features or workflows change.
- Coordinate Firebase rule changes with the team; avoid committing secrets.

Happy treasure hunting!
