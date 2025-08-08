import admin, { ServiceAccount } from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount: ServiceAccount;

// Check if we're using the environment variable (production) or local file (development)
if (process.env.NODE_ENV === 'production') {
  // Decode the base64 string to a JSON object
  const base64Decoded = Buffer.from(process.env.FIREBASE_KEY_BASE64, 'base64').toString();
  serviceAccount = JSON.parse(base64Decoded);
} else {
  // Local development fallback
  const { readFileSync } = await import('fs');
  serviceAccount = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'firebase-key.json'), 'utf8')
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export const db = admin.firestore();
