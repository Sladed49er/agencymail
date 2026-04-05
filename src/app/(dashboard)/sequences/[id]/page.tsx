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
  ArrowDown,
  Zap,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  Tag,
  ClipboardList,
  Play,
  Pause,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const STEP_ICONS: Record<string, typeof Mail> = {
  SEND_EMAIL: Mail,
  SEND_SMS: MessageSquare,
  WAIT: Clock,
  CONDITION: GitBranch,
  ADD_TAG: Tag,
  CREATE_TASK: ClipboardList,
};

export default function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: sequence, isLoading, refetch } =
    trpc.sequences.getById.useQuery({ id });
  const { data: enrollmentStats } =
    trpc.sequences.enrollmentStats.useQuery({ id });

  const updateSequence = trpc.sequences.update.useMutation({
    onSuccess: () => {
      toast.success("Sequence updated");
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sequence not found.</p>
        <Link href="/sequences">
          <Button variant="link">Back to Sequences</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sequences">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Sequences
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{sequence.name}</h1>
            {sequence.description && (
              <p className="text-muted-foreground">{sequence.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              sequence.status === "ACTIVE"
                ? "default"
                : sequence.status === "PAUSED"
                ? "secondary"
                : "outline"
            }
          >
            {sequence.status}
          </Badge>
          {sequence.status === "ACTIVE" ? (
            <Button
              variant="outline"
              onClick={() =>
                updateSequence.mutate({ id, status: "PAUSED" })
              }
            >
              <Pause className="mr-1 h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button
              onClick={() =>
                updateSequence.mutate({ id, status: "ACTIVE" })
              }
            >
              <Play className="mr-1 h-4 w-4" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {/* Enrollment Stats */}
      {enrollmentStats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-2xl font-bold mt-2">
                {enrollmentStats.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-5 w-5 mx-auto text-blue-600" />
              <p className="text-2xl font-bold mt-2">
                {enrollmentStats.active}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold mt-2">
                {enrollmentStats.completed}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold mt-2">
                {enrollmentStats.completionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <Progress
                value={enrollmentStats.completionRate}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Flow</CardTitle>
              <p className="text-sm text-muted-foreground">
                Trigger: {sequence.triggerType.replace(/_/g, " ")}
              </p>
            </CardHeader>
            <CardContent>
              {sequence.steps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No steps configured.
                </p>
              ) : (
                <div className="space-y-2">
                  {sequence.steps.map((step, idx) => {
                    const Icon = STEP_ICONS[step.type] || Zap;
                    const config = step.config as Record<string, unknown>;
                    return (
                      <div key={step.id}>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Step {idx + 1}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {step.type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-sm mt-1">
                              {step.type === "WAIT" &&
                                `Wait ${config.days} day(s)`}
                              {step.type === "SEND_EMAIL" &&
                                `Send email: ${config.subject || "(no subject)"}`}
                              {step.type === "SEND_SMS" &&
                                `Send SMS: ${(config.message as string)?.substring(0, 60) || "(no message)"}`}
                              {step.type === "ADD_TAG" &&
                                `Add tag: ${config.tag}`}
                              {step.type === "CREATE_TASK" &&
                                `Create task: ${config.title}`}
                              {step.type === "CONDITION" &&
                                `If ${config.field} ${config.operator} ${config.value}`}
                            </p>
                          </div>
                        </div>
                        {idx < sequence.steps.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {sequence.enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No contacts enrolled yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequence.enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <Link
                            href={`/contacts/${enrollment.contactId}`}
                            className="font-medium hover:underline"
                          >
                            {[
                              enrollment.contact.firstName,
                              enrollment.contact.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || enrollment.contact.email || "—"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          Step {enrollment.currentStep + 1} of{" "}
                          {sequence.steps.length}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(
                            new Date(enrollment.enrolledAt),
                            { addSuffix: true }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
