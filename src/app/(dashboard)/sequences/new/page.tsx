"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Clock,
  GitBranch,
  Tag,
  ClipboardList,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type StepType =
  | "SEND_EMAIL"
  | "SEND_SMS"
  | "WAIT"
  | "CONDITION"
  | "ADD_TAG"
  | "CREATE_TASK";

interface Step {
  type: StepType;
  config: Record<string, unknown>;
}

const STEP_TYPES: Array<{
  value: StepType;
  label: string;
  icon: typeof Mail;
}> = [
  { value: "SEND_EMAIL", label: "Send Email", icon: Mail },
  { value: "SEND_SMS", label: "Send SMS", icon: MessageSquare },
  { value: "WAIT", label: "Wait", icon: Clock },
  { value: "CONDITION", label: "Condition", icon: GitBranch },
  { value: "ADD_TAG", label: "Add Tag", icon: Tag },
  { value: "CREATE_TASK", label: "Create Task", icon: ClipboardList },
];

const TRIGGER_TYPES = [
  { value: "contact_added", label: "Contact Added" },
  { value: "tag_applied", label: "Tag Applied" },
  { value: "date_based", label: "Date-Based (e.g., renewal 90 days out)" },
  { value: "manual", label: "Manual Enrollment" },
];

export default function NewSequencePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [steps, setSteps] = useState<Step[]>([
    { type: "SEND_EMAIL", config: { subject: "", templateId: "" } },
    { type: "WAIT", config: { days: 3 } },
    { type: "SEND_EMAIL", config: { subject: "", templateId: "" } },
  ]);

  const createSequence = trpc.sequences.create.useMutation({
    onSuccess: (seq) => {
      toast.success("Sequence created");
      router.push(`/sequences/${seq.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const addStep = (type: StepType) => {
    const defaultConfig: Record<StepType, Record<string, unknown>> = {
      SEND_EMAIL: { subject: "", templateId: "" },
      SEND_SMS: { message: "" },
      WAIT: { days: 1 },
      CONDITION: { field: "", operator: "eq", value: "" },
      ADD_TAG: { tag: "" },
      CREATE_TASK: { title: "", assignTo: "" },
    };
    setSteps((prev) => [...prev, { type, config: defaultConfig[type] }]);
  };

  const removeStep = (idx: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== idx));

  const updateStepConfig = (
    idx: number,
    key: string,
    value: unknown
  ) =>
    setSteps((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, config: { ...s.config, [key]: value } } : s
      )
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Sequence name is required");
    if (steps.length === 0) return toast.error("Add at least one step");

    createSequence.mutate({
      name,
      description,
      triggerType,
      steps,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/sequences">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Sequences
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Sequence</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sequence Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., New Client Onboarding"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this sequence do?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Steps</CardTitle>
            <p className="text-sm text-muted-foreground">
              Build your automation flow step by step.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, idx) => {
              const stepType = STEP_TYPES.find((s) => s.value === step.type);
              const Icon = stepType?.icon || Mail;

              return (
                <div key={idx}>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {stepType?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Step {idx + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {step.type === "SEND_EMAIL" && (
                      <Input
                        placeholder="Email subject..."
                        value={(step.config.subject as string) || ""}
                        onChange={(e) =>
                          updateStepConfig(idx, "subject", e.target.value)
                        }
                      />
                    )}

                    {step.type === "SEND_SMS" && (
                      <Textarea
                        placeholder="SMS message..."
                        value={(step.config.message as string) || ""}
                        onChange={(e) =>
                          updateStepConfig(idx, "message", e.target.value)
                        }
                        rows={2}
                      />
                    )}

                    {step.type === "WAIT" && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Wait</span>
                        <Input
                          type="number"
                          className="w-20"
                          value={(step.config.days as number) || 1}
                          onChange={(e) =>
                            updateStepConfig(
                              idx,
                              "days",
                              parseInt(e.target.value) || 1
                            )
                          }
                          min={1}
                        />
                        <span className="text-sm">days</span>
                      </div>
                    )}

                    {step.type === "ADD_TAG" && (
                      <Input
                        placeholder="Tag name..."
                        value={(step.config.tag as string) || ""}
                        onChange={(e) =>
                          updateStepConfig(idx, "tag", e.target.value)
                        }
                      />
                    )}

                    {step.type === "CREATE_TASK" && (
                      <Input
                        placeholder="Task title..."
                        value={(step.config.title as string) || ""}
                        onChange={(e) =>
                          updateStepConfig(idx, "title", e.target.value)
                        }
                      />
                    )}

                    {step.type === "CONDITION" && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Field"
                          value={(step.config.field as string) || ""}
                          onChange={(e) =>
                            updateStepConfig(idx, "field", e.target.value)
                          }
                          className="w-1/3"
                        />
                        <Select
                          value={(step.config.operator as string) || "eq"}
                          onValueChange={(v) =>
                            updateStepConfig(idx, "operator", v)
                          }
                        >
                          <SelectTrigger className="w-1/3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eq">equals</SelectItem>
                            <SelectItem value="neq">not equals</SelectItem>
                            <SelectItem value="contains">contains</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Value"
                          value={(step.config.value as string) || ""}
                          onChange={(e) =>
                            updateStepConfig(idx, "value", e.target.value)
                          }
                          className="w-1/3"
                        />
                      </div>
                    )}
                  </div>

                  {idx < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Step */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {STEP_TYPES.map((st) => (
                <Button
                  key={st.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(st.value)}
                >
                  <st.icon className="mr-1 h-3 w-3" />
                  {st.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/sequences">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createSequence.isPending}>
            Create Sequence
          </Button>
        </div>
      </form>
    </div>
  );
}
