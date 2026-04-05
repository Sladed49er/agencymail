"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  getEngagementTier,
  getEngagementColor,
} from "@/modules/analytics/engagement";

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contact, isLoading } = trpc.contacts.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact not found.</p>
        <Link href="/contacts">
          <Button variant="link">Back to Contacts</Button>
        </Link>
      </div>
    );
  }

  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");
  const tier = getEngagementTier(contact.engagementScore);
  const tierColor = getEngagementColor(tier);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Contacts
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {fullName || "Unnamed Contact"}
              </CardTitle>
              <Badge
                variant={
                  contact.status === "ACTIVE"
                    ? "default"
                    : contact.status === "BOUNCED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {contact.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contact.phone}</span>
              </div>
            )}
            {(contact.city || contact.state) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[contact.city, contact.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            <Separator />

            {contact.policyType && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  {contact.policyType}
                  {contact.carrier && ` - ${contact.carrier}`}
                </span>
              </div>
            )}
            {contact.renewalDate && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>
                  Renews {format(new Date(contact.renewalDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
            {contact.agentName && (
              <div className="text-sm text-muted-foreground">
                Agent: {contact.agentName}
              </div>
            )}

            <Separator />

            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Engagement Score:{" "}
                <span className="font-bold">{contact.engagementScore}</span>
              </span>
              <Badge className={`ml-auto ${tierColor}`}>{tier}</Badge>
            </div>

            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Added{" "}
              {formatDistanceToNow(new Date(contact.createdAt), {
                addSuffix: true,
              })}
              {contact.source && ` via ${contact.source}`}
            </div>
          </CardContent>
        </Card>

        {/* Activity + Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="sequences">Sequences</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {contact.activities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No activity recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {contact.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 pb-4 border-b last:border-0"
                        >
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">
                              {activity.description ||
                                activity.type.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(activity.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {contact.campaignMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No campaign messages yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contact.campaignMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {msg.campaign.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {msg.campaign.subject}
                            </p>
                          </div>
                          <Badge
                            variant={
                              msg.status === "OPENED" ||
                              msg.status === "CLICKED"
                                ? "default"
                                : msg.status === "BOUNCED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {msg.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sequences" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {contact.sequenceEnrollments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Not enrolled in any sequences.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contact.sequenceEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {enrollment.sequence.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Step {enrollment.currentStep} | Enrolled{" "}
                              {formatDistanceToNow(
                                new Date(enrollment.enrolledAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {enrollment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
