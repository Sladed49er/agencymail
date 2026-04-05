/**
 * Engagement scoring system.
 * Calculates a numeric score for each contact based on their interactions.
 *
 * Scoring:
 * - Email open: 1 point
 * - Email click: 3 points
 * - SMS reply: 5 points
 * - Inbound call: 5 points
 * - Multi-policy holder: 10 points (one-time bonus)
 */

export const ENGAGEMENT_WEIGHTS = {
  email_opened: 1,
  email_clicked: 3,
  sms_received: 5, // inbound SMS = reply
  call_inbound: 5,
  multi_policy: 10,
} as const;

export type EngagementEventType = keyof typeof ENGAGEMENT_WEIGHTS;

export function calculateEngagementDelta(eventType: string): number {
  return (ENGAGEMENT_WEIGHTS as Record<string, number>)[eventType] ?? 0;
}

/**
 * Engagement tier based on score.
 */
export function getEngagementTier(
  score: number
): "cold" | "warm" | "hot" | "champion" {
  if (score >= 50) return "champion";
  if (score >= 20) return "hot";
  if (score >= 5) return "warm";
  return "cold";
}

export function getEngagementColor(tier: string): string {
  switch (tier) {
    case "champion":
      return "text-purple-600 bg-purple-50";
    case "hot":
      return "text-red-600 bg-red-50";
    case "warm":
      return "text-amber-600 bg-amber-50";
    default:
      return "text-blue-600 bg-blue-50";
  }
}
