import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('🧪 Testing Firestore connection...');

    // Test 1: Collections list
    const collections = await adminDb.listCollections();
    const collectionNames = collections.map(c => c.id);
    console.log('✅ Collections found:', collectionNames);

    // Test 2: Users collection exists and accessible
    const snapshot = await adminDb.collection('users').limit(1).get();
    console.log('✅ Users collection accessed - docs:', snapshot.docs.length);

    // Test 3: Try to read one user
    let sampleUser = null;
    if (snapshot.docs.length > 0) {
      sampleUser = snapshot.docs[0].data();
      console.log('✅ Sample user data:', Object.keys(sampleUser));
    }

    return NextResponse.json({
      status: 'success',
      firestore_working: true,
      collections: collectionNames,
      users_collection_accessible: true,
      user_count_tested: snapshot.docs.length,
      sample_user: sampleUser ? { uid: sampleUser.uid, email: sampleUser.email } : null,
    });
  } catch (error) {
    console.error('❌ Firestore test error:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });

    return NextResponse.json({
      status: 'error',
      firestore_working: false,
      error_message: error.message,
      error_code: error.code,
      error_name: error.name,
    }, { status: 500 });
  }
}
