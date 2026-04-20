import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const FIRESTORE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'default';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // important
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminAuth = admin.auth();
export const adminDb = getFirestore(admin.app(), FIRESTORE_DATABASE_ID);

export { FIRESTORE_DATABASE_ID };
export default admin;
