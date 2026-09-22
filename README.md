# Kotoba — JLPT flashcards

A mobile-first JLPT vocabulary app built with Next.js, TypeScript, Firebase Authentication, Cloud Firestore, Tailwind CSS, and SheetJS. Vocabulary is private to each Google account and organized automatically by JLPT level and day.

## Local setup

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app values.
3. Start the app: `pnpm dev`
4. Open `http://localhost:3000`.

The development command listens on `0.0.0.0`, so phones on the same Wi-Fi can open the app using the computer's LAN address, for example `http://192.168.1.20:3000`. On macOS, find the usual Wi-Fi address with `ipconfig getifaddr en0`. If Google sign-in is needed on the phone, also add that IP address to Firebase Authentication's authorized domains.

## Firebase setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Add a Web app under **Project settings → General** and copy its configuration into `.env.local`.
3. Open **Authentication → Sign-in method**, enable **Google**, and choose a project support email.
4. Under **Authentication → Settings → Authorized domains**, add your Vercel production domain (localhost is available for development).
5. In **Google Cloud Console → APIs & Services → Credentials**, open the Web OAuth client used by Firebase and add `https://YOUR_DOMAIN/__/auth/handler` as an authorized redirect URI.
6. Create a Cloud Firestore database. Production mode is recommended.
7. Publish the contents of `firestore.rules` in **Firestore Database → Rules**. These rules permit an authenticated user to access only `users/{their uid}/...`.

No Firebase Storage bucket is used. Imported files are parsed locally and only normalized word records are written to Firestore.

## Data and imports

Import `.csv` and `.xlsx` files with these required columns: `level`, `day`, `kanji`, `reading`, `english`. Optional columns are `partOfSpeech`, `example`, and `notes`. Headers are case-insensitive and tolerate spaces, hyphens, and underscores.

Words use a stable ID derived from level + day + kanji + reading. Re-importing the same word updates vocabulary fields with Firestore merge writes and preserves SRS state, difficult/suspended flags, and review counts. Writes are split into batches of 450, below Firestore's 500-operation limit.

A tiny development file is available at `public/sample-vocabulary.csv`.

## Vercel deployment

1. Push the repository to GitHub, GitLab, or Bitbucket and import it in Vercel.
2. Add the six Firebase Web SDK `NEXT_PUBLIC_FIREBASE_*` values from `.env.example` in **Project → Settings → Environment Variables**. Keep `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` set to the original `PROJECT_ID.firebaseapp.com` value.
3. Deploy. Vercel detects pnpm from `pnpm-lock.yaml` and runs `pnpm build`.
4. Add the deployed hostname to Firebase Authentication's authorized domains.

On Vercel, the app automatically uses its current `*.vercel.app` hostname as Firebase's runtime auth domain and reverse-proxies `/__/auth/*` to Firebase Hosting. This avoids mobile browser storage-partitioning failures. For a custom domain, set `NEXT_PUBLIC_FIREBASE_AUTH_PROXY_DOMAIN` to the hostname without `https://`, authorize that domain in Firebase, and add `https://YOUR_DOMAIN/__/auth/handler` to the Google OAuth client's authorized redirect URIs.

## Verification

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Authentication and Firestore integration require a configured Firebase project. For end-to-end verification, sign in, import the sample CSV, re-import it after grading a word, and confirm the word count remains unchanged while the review state persists.
