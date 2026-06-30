import { NextRequest, NextResponse } from "next/server";
import { getDispensaryAdminAuth, getDispensaryAdminDb } from "@component/lib/dispensary/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const idToken    = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const adminAuth = getDispensaryAdminAuth();
    const adminDb   = getDispensaryAdminDb();

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { organizationId } = userDoc.data()!;
    const orgDoc = await adminDb.collection("organizations").doc(organizationId).get();

    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { stripeCustomerId } = orgDoc.data()!;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
    }

    // Dynamically import stripe so the build doesn't fail if STRIPE_SECRET_KEY isn't set
    const Stripe = (await import("stripe")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stripe = new Stripe(process.env.DISPENSARY_STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" } as any);

    const session = await stripe.billingPortal.sessions.create({
      customer:   stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dispensary/billing`,
    });

    return NextResponse.redirect(session.url);
  } catch (err) {
    console.error("Dispensary billing portal error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
