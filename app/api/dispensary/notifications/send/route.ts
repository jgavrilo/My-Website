import { NextRequest, NextResponse } from "next/server";
import { getDispensaryAdminMessaging, getDispensaryAdminDb } from "@component/lib/dispensary/firebase/admin";

interface SendBody {
  organizationId: string;
  locationIds:    string[];
  title:          string;
  body:           string;
  imageURL?:      string;
  deepLink?:      string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: SendBody = await req.json();
    const { organizationId, locationIds, title, body, imageURL, deepLink } = payload;

    if (!organizationId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let topics: string[] = [];

    if (locationIds.length === 0) {
      const adminDb = getDispensaryAdminDb();
      const snapshot = await adminDb
        .collection("organizations").doc(organizationId)
        .collection("locations").where("isActive", "==", true).get();
      topics = snapshot.docs.map((d) => d.data().fcmTopic as string).filter(Boolean);
    } else {
      const adminDb = getDispensaryAdminDb();
      const refs = locationIds.map((id) =>
        adminDb.collection("organizations").doc(organizationId).collection("locations").doc(id)
      );
      const snaps = await Promise.all(refs.map((r) => r.get()));
      topics = snaps.map((s) => s.data()?.fcmTopic as string).filter(Boolean);
    }

    if (topics.length === 0) {
      return NextResponse.json({ error: "No valid FCM topics found" }, { status: 400 });
    }

    const adminMessaging = getDispensaryAdminMessaging();
    const results = await Promise.allSettled(
      topics.map((topic) =>
        adminMessaging.send({
          topic,
          notification: { title, body, imageUrl: imageURL },
          data: deepLink ? { deepLink } : undefined,
          android: { notification: { clickAction: "FLUTTER_NOTIFICATION_CLICK" } },
          apns: { payload: { aps: { sound: "default", badge: 1 } } },
        })
      )
    );

    return NextResponse.json({
      succeeded: results.filter((r) => r.status === "fulfilled").length,
      failed:    results.filter((r) => r.status === "rejected").length,
      total:     topics.length,
    });
  } catch (err) {
    console.error("Dispensary FCM send error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
