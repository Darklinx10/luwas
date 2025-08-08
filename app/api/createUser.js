// pages/api/createUser.js (or app/api/createUser/route.js in app dir)
// lib/firebaseAdmin.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, displayName, role } = req.body;

  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create user via admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Respond with user info
    res.status(200).json({ uid: userRecord.uid, email, displayName, role });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
      res.status(400).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
