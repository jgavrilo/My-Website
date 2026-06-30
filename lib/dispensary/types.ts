// ─── User / Auth ───────────────────────────────────────────────────────────

export interface DispensaryUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  organizationId: string;
  role: "owner" | "admin" | "manager" | "viewer";
  createdAt: Date;
}

// ─── Organization ──────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoURL?: string;
  billingEmail: string;
  plan: "starter" | "growth" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Location ──────────────────────────────────────────────────────────────

export interface HoursEntry {
  open: string;
  close: string;
  closed: boolean;
}

export type WeeklyHours = {
  monday:    HoursEntry;
  tuesday:   HoursEntry;
  wednesday: HoursEntry;
  thursday:  HoursEntry;
  friday:    HoursEntry;
  saturday:  HoursEntry;
  sunday:    HoursEntry;
};

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  bio: string;
  hours: WeeklyHours;
  timezone: string;
  fcmTopic: string;
  isActive: boolean;
  imageURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Deals ─────────────────────────────────────────────────────────────────

export type DealStatus = "draft" | "scheduled" | "active" | "expired";

export interface Deal {
  id: string;
  organizationId: string;
  locationIds: string[];
  title: string;
  description: string;
  imageURL?: string;
  startDate: Date;
  endDate: Date;
  status: DealStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Push Notifications ────────────────────────────────────────────────────

export type NotificationStatus = "draft" | "sent" | "failed";

export interface PushNotification {
  id: string;
  organizationId: string;
  locationIds: string[];
  title: string;
  body: string;
  imageURL?: string;
  deepLink?: string;
  sentAt?: Date;
  status: NotificationStatus;
  sentCount?: number;
  createdBy: string;
  createdAt: Date;
}

// ─── Platform Notification Center ─────────────────────────────────────────

export type PlatformNotificationType =
  | "billing"
  | "deal_expired"
  | "new_feature"
  | "system"
  | "alert";

export interface PlatformNotification {
  id: string;
  organizationId: string;
  type: PlatformNotificationType;
  title: string;
  body: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
  createdAt: Date;
}

// ─── Billing ───────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  pdfURL?: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}
