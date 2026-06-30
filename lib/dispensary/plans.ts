export type PlanId = 'starter' | 'growth' | 'enterprise';

export interface PlanLimits {
  locations:   number;   // max active locations (-1 = unlimited)
  pushPerMonth: number;  // max push notifications per month (-1 = unlimited)
  deals:       number;   // max active deals (-1 = unlimited)
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter:    { locations: 1,  pushPerMonth: 500,   deals: 5   },
  growth:     { locations: 5,  pushPerMonth: 5000,  deals: 25  },
  enterprise: { locations: -1, pushPerMonth: -1,    deals: -1  },
};

export const PLAN_LABELS: Record<PlanId, string> = {
  starter:    'Starter',
  growth:     'Growth',
  enterprise: 'Enterprise',
};

export function getLimits(plan: PlanId | null): PlanLimits {
  return plan ? PLAN_LIMITS[plan] : PLAN_LIMITS.starter;
}

export function isAtLimit(current: number, limit: number): boolean {
  return limit !== -1 && current >= limit;
}

export function limitLabel(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toLocaleString();
}
