import admin, { ServiceAccount } from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import { AdData } from '../src/types';

dotenv.config();
let serviceAccount: ServiceAccount;


// Check if we're using the environment variable (production) or local file (development)
if (process.env.NODE_ENV === 'production') {
  // Decode the base64 string to a JSON object
  const base64Decoded = Buffer.from(process.env.FIREBASE_KEY_BASE64!, 'base64').toString();
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

admin.firestore().settings({ databaseId: process.env.FIREBASE_DATABASE_ID });
const db = admin.firestore();

// ----------------------------------------------------


const snapshot = await db.collection('ads').get();
const ads = snapshot.docs.map(doc => doc.data() as AdData);


ads.forEach(async (ad) => {
  const updatedViews = ad.views.map((view, index) => {
    const viewOnDay = index === 0 ?
      0 :
      ad.views[index].count - ad.views[index - 1].count;

    return {
      timestamp: view.timestamp,
      count: view.count,
      viewOnDay
    }
  });

  await db.collection('ads').doc(encodeURIComponent(ad.url)).update({
    ...ad,
    views: updatedViews
  });
  // console.log(updatedViews);
});