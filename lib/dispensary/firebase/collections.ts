import {
  collection,
  doc,
  query,
  where,
  orderBy,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { dispensaryDb } from "./client";
import type {
  Organization,
  Location,
  Deal,
  PushNotification,
  PlatformNotification,
  Invoice,
} from "@component/lib/dispensary/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val as string);
}

// ─── Converters ────────────────────────────────────────────────────────────

const orgConverter: FirestoreDataConverter<Organization> = {
  toFirestore: (org) => ({ ...org }),
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data();
    return { ...d, id: snap.id, createdAt: tsToDate(d.createdAt), updatedAt: tsToDate(d.updatedAt) } as Organization;
  },
};

const locationConverter: FirestoreDataConverter<Location> = {
  toFirestore: (loc) => ({ ...loc }),
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data();
    return { ...d, id: snap.id, createdAt: tsToDate(d.createdAt), updatedAt: tsToDate(d.updatedAt) } as Location;
  },
};

const dealConverter: FirestoreDataConverter<Deal> = {
  toFirestore: (deal) => ({ ...deal }),
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data();
    return {
      ...d, id: snap.id,
      startDate: tsToDate(d.startDate), endDate: tsToDate(d.endDate),
      createdAt: tsToDate(d.createdAt), updatedAt: tsToDate(d.updatedAt),
    } as Deal;
  },
};

const pushConverter: FirestoreDataConverter<PushNotification> = {
  toFirestore: (n) => ({ ...n }),
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data();
    return { ...d, id: snap.id, sentAt: d.sentAt ? tsToDate(d.sentAt) : undefined, createdAt: tsToDate(d.createdAt) } as PushNotification;
  },
};

const platformNotifConverter: FirestoreDataConverter<PlatformNotification> = {
  toFirestore: (n) => ({ ...n }),
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data();
    return { ...d, id: snap.id, createdAt: tsToDate(d.createdAt) } as PlatformNotification;
  },
};

const invoiceConverter: FirestoreDataConverter<Invoice> = {
  toFirestore: (inv) => ({ ...inv }),
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data();
    return {
      ...d, id: snap.id,
      periodStart: tsToDate(d.periodStart), periodEnd: tsToDate(d.periodEnd),
      createdAt: tsToDate(d.createdAt),
    } as Invoice;
  },
};

// ─── Collection refs ───────────────────────────────────────────────────────

export const orgRef = (orgId: string) =>
  doc(dispensaryDb, "organizations", orgId).withConverter(orgConverter);

export const locationsRef = (orgId: string) =>
  collection(dispensaryDb, "organizations", orgId, "locations").withConverter(locationConverter);

export const locationRef = (orgId: string, locId: string) =>
  doc(dispensaryDb, "organizations", orgId, "locations", locId).withConverter(locationConverter);

export const dealsRef = (orgId: string) =>
  collection(dispensaryDb, "organizations", orgId, "deals").withConverter(dealConverter);

export const dealRef = (orgId: string, dealId: string) =>
  doc(dispensaryDb, "organizations", orgId, "deals", dealId).withConverter(dealConverter);

export const pushNotificationsRef = (orgId: string) =>
  collection(dispensaryDb, "organizations", orgId, "pushNotifications").withConverter(pushConverter);

export const platformNotificationsRef = (orgId: string) =>
  collection(dispensaryDb, "organizations", orgId, "platformNotifications").withConverter(platformNotifConverter);

export const invoicesRef = (orgId: string) =>
  collection(dispensaryDb, "organizations", orgId, "invoices").withConverter(invoiceConverter);

// ─── Common queries ────────────────────────────────────────────────────────

export const activeLocationsQuery = (orgId: string) =>
  query(locationsRef(orgId), where("isActive", "==", true), orderBy("name"));

export const unreadPlatformNotifsQuery = (orgId: string) =>
  query(platformNotificationsRef(orgId), where("read", "==", false), orderBy("createdAt", "desc"));
