"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Plus, Clock, Send, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof Mail }
> = {
  DRAFT: { label: "Draft", variant: "secondary", icon: Clock },
  SCHEDULED: { label: "Scheduled", variant: "default", icon: Clock },
  SENDING: { label: "Sending", variant: "default", icon: Send },
  SENT: { label: "Sent", variant: "default", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Campaigns
          </h1>
          <p className="text-muted-foreground">
            Create and manage email campaigns.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email campaign to start engaging your contacts.
            </p>
            <Link href="/campaigns/new">
              <Button>Create Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const config = statusConfig[campaign.status] || statusConfig.DRAFT;
            const stats = campaign.stats as Record<string, number> | null;

            return (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold truncate">
                            {campaign.name}
                          </h3>
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.subject || "No subject"}
                          {campaign.segment && (
                            <span>
                              {" "}
                              &middot; Segment: {campaign.segment.name}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        {campaign.status === "SENT" && stats && (
                          <>
                            <div className="text-center">
                              <p className="font-medium text-foreground">
                                {stats.opened ?? 0}
                              </p>
                              <p className="text-xs">Opens</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-foreground">
                                {stats.clicked ?? 0}
                              </p>
                              <p className="text-xs">Clicks</p>
                            </div>
                          </>
                        )}
                        <div className="text-center">
                          <p className="font-medium text-foreground">
                            {campaign._count.messages}
                          </p>
                          <p className="text-xs">Recipients</p>
                        </div>
                        <p className="text-xs whitespace-nowrap">
                          {formatDistanceToNow(new Date(campaign.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
