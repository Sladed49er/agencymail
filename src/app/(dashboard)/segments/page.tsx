"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Plus, Users, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const FILTER_FIELDS = [
  { value: "policyType", label: "Policy Type" },
  { value: "carrier", label: "Carrier" },
  { value: "state", label: "State" },
  { value: "city", label: "City" },
  { value: "agentName", label: "Agent Name" },
  { value: "tags", label: "Tag" },
  { value: "status", label: "Status" },
];

const FILTER_OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "has", label: "has" },
];

interface FilterRow {
  field: string;
  operator: string;
  value: string;
}

export default function SegmentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<FilterRow[]>([
    { field: "policyType", operator: "eq", value: "" },
  ]);

  const { data: segments, isLoading, refetch } = trpc.segments.list.useQuery();

  const createSegment = trpc.segments.create.useMutation({
    onSuccess: () => {
      toast.success("Segment created");
      setShowCreate(false);
      setName("");
      setFilters([{ field: "policyType", operator: "eq", value: "" }]);
      refetch();
    },
  });

  const deleteSegment = trpc.segments.delete.useMutation({
    onSuccess: () => {
      toast.success("Segment deleted");
      refetch();
    },
  });

  const refreshCount = trpc.segments.refreshCount.useMutation({
    onSuccess: () => {
      toast.success("Count refreshed");
      refetch();
    },
  });

  const addFilter = () =>
    setFilters((prev) => [
      ...prev,
      { field: "policyType", operator: "eq", value: "" },
    ]);

  const removeFilter = (idx: number) =>
    setFilters((prev) => prev.filter((_, i) => i !== idx));

  const updateFilter = (idx: number, key: keyof FilterRow, val: string) =>
    setFilters((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [key]: val } : f))
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Segments
          </h1>
          <p className="text-muted-foreground">
            Create saved segments to target specific contacts in campaigns.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !segments || segments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No segments yet</h3>
            <p className="text-muted-foreground">
              Create segments to group contacts by policy type, location, or
              other criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment) => {
            const segFilters = (segment.filters as FilterRow[]) || [];
            return (
              <Card key={segment.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          refreshCount.mutate({ id: segment.id })
                        }
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteSegment.mutate({ id: segment.id })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold">
                      {segment.contactCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      contacts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {segFilters.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {f.field} {f.operator} {f.value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Segment</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name) return toast.error("Segment name is required");
              createSegment.mutate({
                name,
                filters: filters.filter((f) => f.value),
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Auto Policy Holders in Oregon"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Filters</Label>
              {filters.map((filter, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={filter.field}
                    onValueChange={(v) => updateFilter(idx, "field", v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filter.operator}
                    onValueChange={(v) => updateFilter(idx, "operator", v)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_OPERATORS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(idx, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  {filters.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                <Plus className="mr-1 h-3 w-3" />
                Add Filter
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSegment.isPending}>
                Create Segment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
