import { type NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";

/**
 * Station API Key Management
 *
 * POST /api/station/keys — Generate a new API key
 * GET  /api/station/keys — List user's keys (prefix only)
 * DELETE /api/station/keys?prefix=nv_xxxx — Revoke a key
 *
 * Key format: nv_{uid_prefix_8}_{random_32_hex}
 * Storage: Firestore station_api_keys/{sha256_hex}
 * Auth: Firebase ID token from nucleus_id_token cookie
 */

const COLLECTION = "station_api_keys";

async function getAuthenticatedUid(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("nucleus_id_token")?.value;
    if (!token) return null;
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function generateApiKey(uid: string): string {
  const prefix = uid.slice(0, 8);
  const random = randomBytes(16).toString("hex");
  return `nv_${prefix}_${random}`;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function POST(request: NextRequest) {
  const uid = await getAuthenticatedUid();
  if (!uid) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const label = (body as { label?: string }).label || "default";

    const plainKey = generateApiKey(uid);
    const keyHash = hashKey(plainKey);
    const keyPrefix = plainKey.slice(0, 12);

    await adminDb.collection(COLLECTION).doc(keyHash).set({
      uid,
      key_prefix: keyPrefix,
      label,
      active: true,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      key: plainKey,
      prefix: keyPrefix,
      label,
      message: "Save this key — it will not be shown again.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const uid = await getAuthenticatedUid();
  if (!uid) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("uid", "==", uid)
      .where("active", "==", true)
      .orderBy("created_at", "desc")
      .get();

    const keys = snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        prefix: doc.data().key_prefix as string,
        label: doc.data().label as string,
        created_at: doc.data().created_at as string,
      }),
    );

    return NextResponse.json({ keys, count: keys.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const uid = await getAuthenticatedUid();
  if (!uid) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix");
    if (!prefix) {
      return NextResponse.json(
        { error: "Missing prefix parameter" },
        { status: 400 },
      );
    }

    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("uid", "==", uid)
      .where("key_prefix", "==", prefix)
      .where("active", "==", true)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      batch.update(doc.ref, {
        active: false,
        revoked_at: new Date().toISOString(),
      });
    });
    await batch.commit();

    return NextResponse.json({ revoked: prefix });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
