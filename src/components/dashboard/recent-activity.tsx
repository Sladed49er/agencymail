"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  MousePointerClick,
  Eye,
  MessageSquare,
  Phone,
  UserPlus,
  Tag,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const activityIcons: Record<string, typeof Mail> = {
  email_sent: Mail,
  email_opened: Eye,
  email_clicked: MousePointerClick,
  sms_sent: MessageSquare,
  sms_received: MessageSquare,
  call_inbound: Phone,
  call_outbound: Phone,
  contact_created: UserPlus,
  tag_added: Tag,
  enrolled_sequence: Zap,
};

export function RecentActivityFeed() {
  const { data: activities, isLoading } =
    trpc.analytics.recentActivity.useQuery({ limit: 15 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No activity yet. Start by importing contacts or creating a campaign.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] || Mail;
        const contactName = [
          activity.contact.firstName,
          activity.contact.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={activity.id} className="flex items-start gap-3 py-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">
                  {contactName || activity.contact.email || "Unknown"}
                </span>
                {" "}
                <span className="text-muted-foreground">
                  {activity.description || activity.type.replace(/_/g, " ")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
