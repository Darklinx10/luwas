// app/api/checkEmail/route.js
import { admin } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (_) {
      // no body
    }

    const email = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const userRecord = await admin.auth().getUserByEmail(email);

    return NextResponse.json(
      { exists: true, uid: userRecord.uid },
      { status: 200 }
    );
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
