import admin from 'firebase-admin';

console.log('📋 Firebase Admin Initialization Check:');
console.log('  FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('  FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('  Admin apps already initialized:', admin.apps.length);

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
    });
    console.log('✅ Firebase Admin App initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  console.log('⚡ Firebase Admin App already initialized');
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

console.log('✅ adminAuth and adminDb exported');

export default admin;