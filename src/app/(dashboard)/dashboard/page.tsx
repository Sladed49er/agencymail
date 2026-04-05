"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Users,
  Mail,
  Zap,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery();
  const { data: performance } =
    trpc.analytics.campaignPerformance.useQuery();

  const stats = [
    {
      label: "Total Contacts",
      value: overview?.totalContacts ?? 0,
      icon: Users,
      href: "/contacts",
      color: "text-blue-600",
    },
    {
      label: "Campaigns Sent",
      value: overview?.sentCampaigns ?? 0,
      icon: Mail,
      href: "/campaigns",
      color: "text-purple-600",
    },
    {
      label: "Active Sequences",
      value: overview?.activeSequences ?? 0,
      icon: Zap,
      href: "/sequences",
      color: "text-amber-600",
    },
    {
      label: "SMS Messages",
      value: overview?.totalSmsMessages ?? 0,
      icon: MessageSquare,
      href: "/sms",
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your marketing overview at a glance.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/campaigns/new">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold mt-1">
                        {stat.value.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Performance + Chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Contact Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {performance ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Emails Sent
                  </span>
                  <span className="font-semibold">
                    {performance.totalSent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Open Rate
                  </span>
                  <Badge variant="secondary">
                    {performance.openRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Click Rate
                  </span>
                  <Badge variant="secondary">
                    {performance.clickRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Bounce Rate
                  </span>
                  <Badge variant="secondary">
                    {performance.bounceRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Campaigns
                  </span>
                  <span className="font-semibold">
                    {performance.campaignCount}
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            )}
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Full Analytics
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityFeed />
        </CardContent>
      </Card>
    </div>
  );
}
