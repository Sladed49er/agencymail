"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Eye,
  MousePointerClick,
  AlertTriangle,
  UserMinus,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: campaign, isLoading } = trpc.campaigns.getById.useQuery({ id });
  const { data: stats } = trpc.campaigns.getStats.useQuery({ id });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Link href="/campaigns">
          <Button variant="link">Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.subject}</p>
          </div>
        </div>
        <Badge
          variant={
            campaign.status === "SENT"
              ? "default"
              : campaign.status === "CANCELLED"
              ? "destructive"
              : "secondary"
          }
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-2xl font-bold mt-2">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="h-5 w-5 mx-auto text-blue-600" />
              <p className="text-2xl font-bold mt-2">
                {stats.openRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Open Rate ({stats.opened})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MousePointerClick className="h-5 w-5 mx-auto text-green-600" />
              <p className="text-2xl font-bold mt-2">
                {stats.clickRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Click Rate ({stats.clicked})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto text-amber-600" />
              <p className="text-2xl font-bold mt-2">{stats.bounced}</p>
              <p className="text-sm text-muted-foreground">Bounced</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <UserMinus className="h-5 w-5 mx-auto text-red-600" />
              <p className="text-2xl font-bold mt-2">{stats.unsubscribed}</p>
              <p className="text-sm text-muted-foreground">Unsubscribed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funnel visualization */}
      {stats && stats.sent > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Delivered</span>
                <span>{stats.delivered} / {stats.sent}</span>
              </div>
              <Progress value={(stats.delivered / stats.sent) * 100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Opened</span>
                <span>{stats.opened} / {stats.sent}</span>
              </div>
              <Progress value={stats.openRate} className="[&>div]:bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Clicked</span>
                <span>{stats.clicked} / {stats.sent}</span>
              </div>
              <Progress
                value={stats.clickRate}
                className="[&>div]:bg-green-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recipients">
        <TabsList>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="content">Email Content</TabsTrigger>
        </TabsList>

        <TabsContent value="recipients" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {campaign.messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recipients yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Clicked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.messages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <Link
                            href={`/contacts/${msg.contactId}`}
                            className="font-medium hover:underline"
                          >
                            {[msg.contact.firstName, msg.contact.lastName]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {msg.contact.email || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              msg.status === "BOUNCED"
                                ? "destructive"
                                : msg.status === "OPENED" ||
                                  msg.status === "CLICKED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {msg.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {msg.openedAt
                            ? formatDistanceToNow(new Date(msg.openedAt), {
                                addSuffix: true,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {msg.clickedAt
                            ? formatDistanceToNow(new Date(msg.clickedAt), {
                                addSuffix: true,
                              })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {campaign.links.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tracked links in this campaign.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="text-sm font-mono truncate max-w-md">
                          {link.url}
                        </TableCell>
                        <TableCell className="font-medium">
                          {link._count.clicks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="border rounded-lg p-6 bg-white">
                <div className="border-b pb-3 mb-4">
                  <p className="text-sm text-muted-foreground">Subject:</p>
                  <p className="font-medium">{campaign.subject}</p>
                </div>
                {campaign.body ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: campaign.body }}
                  />
                ) : (
                  <p className="text-muted-foreground">No content.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
