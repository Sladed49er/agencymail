"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Eye, Send, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ALL_MERGE_FIELDS, MERGE_FIELD_GROUPS } from "@/modules/marketing";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segmentId, setSegmentId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abSubjectB, setAbSubjectB] = useState("");

  const { data: segments } = trpc.segments.list.useQuery();
  const { data: templates } = trpc.templates.list.useQuery();

  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: (campaign) => {
      toast.success("Campaign created");
      router.push(`/campaigns/${campaign.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = (status: "draft" | "scheduled") => {
    if (!name) return toast.error("Campaign name is required");
    if (!subject) return toast.error("Subject line is required");

    createCampaign.mutate({
      name,
      subject,
      body,
      segmentId: segmentId || undefined,
      scheduledAt: status === "scheduled" && scheduledAt ? scheduledAt : undefined,
      abTestEnabled,
      abSubjectB: abTestEnabled ? abSubjectB : undefined,
    });
  };

  const loadTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      toast.success(`Loaded template: ${template.name}`);
    }
  };

  const insertMergeField = (field: string) => {
    setBody((prev) => prev + field);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Campaigns
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Campaign</h1>
        </div>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4 space-y-4">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., March Renewal Reminders"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Send To</Label>
                <Select value={segmentId} onValueChange={setSegmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a segment or send to all" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active Contacts</SelectItem>
                    {segments?.map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>
                        {seg.name} ({seg.contactCount} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templates && templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Load Template</Label>
                  <Select onValueChange={loadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Start from a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {t.isSystem && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (System)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your email subject line"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={abTestEnabled}
                  onCheckedChange={setAbTestEnabled}
                />
                <Label>A/B Test Subject Line</Label>
              </div>

              {abTestEnabled && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="abSubjectB">Subject Line B</Label>
                  <Input
                    id="abSubjectB"
                    value={abSubjectB}
                    onChange={(e) => setAbSubjectB(e.target.value)}
                    placeholder="Variant B subject line"
                  />
                  <p className="text-xs text-muted-foreground">
                    50% of recipients will receive each subject. The winner is
                    determined by open rate.
                  </p>
                </div>
              )}

              {/* Merge Fields */}
              <div>
                <Label className="mb-2 block">Insert Merge Field</Label>
                <div className="flex flex-wrap gap-1">
                  {MERGE_FIELD_GROUPS.map((group) => (
                    <div key={group.group} className="flex flex-wrap gap-1">
                      {group.fields.map((field) => (
                        <Badge
                          key={field.key}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={() => insertMergeField(field.key)}
                        >
                          {field.label}
                        </Badge>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body (HTML)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content here. Use HTML for rich formatting."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule Send (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to save as draft.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={createCampaign.isPending}
            >
              <Mail className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            {scheduledAt && (
              <Button
                onClick={() => handleSave("scheduled")}
                disabled={createCampaign.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Schedule Send
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Merge fields will show example values.
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-3 mb-4">
                  <p className="text-sm text-muted-foreground">Subject:</p>
                  <p className="font-medium">
                    {previewMergeFields(subject)}
                  </p>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: previewMergeFields(body),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function previewMergeFields(text: string): string {
  let result = text;
  for (const field of ALL_MERGE_FIELDS) {
    result = result.replaceAll(field.key, field.example);
  }
  return result;
}
