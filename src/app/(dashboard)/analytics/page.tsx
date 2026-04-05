"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Mail,
  Eye,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ENGAGEMENT_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const { data: performance, isLoading: perfLoading } =
    trpc.analytics.campaignPerformance.useQuery({ days: 30 });
  const { data: engagement, isLoading: engLoading } =
    trpc.analytics.engagementDistribution.useQuery();
  const { data: topCampaigns, isLoading: topLoading } =
    trpc.analytics.topCampaigns.useQuery({ limit: 10 });

  const engagementData = engagement
    ? [
        { name: "Cold", value: engagement.cold },
        { name: "Warm", value: engagement.warm },
        { name: "Hot", value: engagement.hot },
        { name: "Champion", value: engagement.champion },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Track campaign performance, engagement, and growth.
        </p>
      </div>

      {/* Performance Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {perfLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : performance ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {performance.totalSent.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Emails Sent (30d)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {performance.openRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Open Rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MousePointerClick className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {performance.clickRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click Rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {performance.campaignCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Campaigns (30d)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Growth */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Growth (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardChart />
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
            {engagement && (
              <p className="text-sm text-muted-foreground">
                {engagement.total} total contacts
              </p>
            )}
          </CardHeader>
          <CardContent>
            {engLoading ? (
              <Skeleton className="h-[200px]" />
            ) : engagementData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {engagementData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={ENGAGEMENT_COLORS[idx]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {engagementData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: ENGAGEMENT_COLORS[idx] }}
                      />
                      <span className="text-sm">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No engagement data yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <Skeleton className="h-[300px]" />
          ) : !topCampaigns || topCampaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No sent campaigns yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topCampaigns.map((c) => ({
                  name:
                    c.name.length > 20
                      ? c.name.substring(0, 20) + "..."
                      : c.name,
                  "Open Rate": Number(c.openRate.toFixed(1)),
                  "Click Rate": Number(c.clickRate.toFixed(1)),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="Open Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="Click Rate"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
