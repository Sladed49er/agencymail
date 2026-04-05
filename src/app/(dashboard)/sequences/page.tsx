"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Plus, Users, Play, Pause } from "lucide-react";
import { toast } from "sonner";

export default function SequencesPage() {
  const { data: sequences, isLoading, refetch } =
    trpc.sequences.list.useQuery();

  const updateSequence = trpc.sequences.update.useMutation({
    onSuccess: () => {
      toast.success("Sequence updated");
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Sequences
          </h1>
          <p className="text-muted-foreground">
            Automated drip campaigns that run on autopilot.
          </p>
        </div>
        <Link href="/sequences/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Sequence
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !sequences || sequences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No sequences yet</h3>
            <p className="text-muted-foreground mb-4">
              Create automated email and SMS sequences to nurture your contacts.
            </p>
            <Link href="/sequences/new">
              <Button>Create Sequence</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sequences.map((sequence) => (
            <Card
              key={sequence.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Link href={`/sequences/${sequence.id}`}>
                    <CardTitle className="text-base hover:underline cursor-pointer">
                      {sequence.name}
                    </CardTitle>
                  </Link>
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
                </div>
                {sequence.description && (
                  <p className="text-sm text-muted-foreground">
                    {sequence.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      {sequence.steps.length} steps
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {sequence._count.enrollments} enrolled
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {sequence.triggerType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {sequence.status === "ACTIVE" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateSequence.mutate({
                            id: sequence.id,
                            status: "PAUSED",
                          })
                        }
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateSequence.mutate({
                            id: sequence.id,
                            status: "ACTIVE",
                          })
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
