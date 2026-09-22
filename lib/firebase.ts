import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const configuredAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const explicitAuthProxyDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PROXY_DOMAIN
  ?.replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const vercelBrowserDomain =
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  window.location.hostname.endsWith(".vercel.app")
    ? window.location.hostname
    : undefined;
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Keep the auth helper on the app origin so iOS/Safari does not partition
  // the popup/redirect state. Next.js proxies /__/auth to Firebase Hosting.
  authDomain:
    explicitAuthProxyDomain || vercelBrowserDomain || configuredAuthDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);
// Firebase Auth validates config as soon as its module is created. A harmless
// placeholder lets preview/build environments render the setup screen before
// real public web-app configuration is supplied.
const runtimeConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: "AIzaSyDevelopmentPlaceholder00000000000",
      authDomain: "not-configured.firebaseapp.com",
      projectId: "not-configured",
      appId: "1:000000000000:web:0000000000000000000000",
    };
const app = getApps().length ? getApp() : initializeApp(runtimeConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
