"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Save, Plug, CheckCircle2, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: org, isLoading, refetch } = trpc.settings.getOrg.useQuery();

  const [form, setForm] = useState({
    agencyName: "",
    agencyPhone: "",
    website: "",
    senderEmail: "",
    senderName: "",
  });

  useEffect(() => {
    if (org) {
      setForm({
        agencyName: org.agencyName || "",
        agencyPhone: org.agencyPhone || "",
        website: org.website || "",
        senderEmail: org.senderEmail || "",
        senderName: org.senderName || "",
      });
    }
  }, [org]);

  const updateOrg = trpc.settings.updateOrg.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg.mutate(form);
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your agency and email settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agencyName">Agency Name</Label>
              <Input
                id="agencyName"
                value={form.agencyName}
                onChange={(e) => update("agencyName", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used in email templates and campaign footers.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyPhone">Agency Phone</Label>
              <Input
                id="agencyPhone"
                value={form.agencyPhone}
                onChange={(e) => update("agencyPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={form.senderName}
                onChange={(e) => update("senderName", e.target.value)}
                placeholder="e.g., Sarah at Smith Insurance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={form.senderEmail}
                onChange={(e) => update("senderEmail", e.target.value)}
                placeholder="e.g., marketing@smithinsurance.com"
              />
              <p className="text-xs text-muted-foreground">
                This domain must be verified with Resend before sending.
              </p>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Unsubscribe Page</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Your contacts can manage their preferences at:{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}
                  /preferences/[token]
                </code>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateOrg.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateOrg.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CallIntel Webhook */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">CallIntel</p>
                <p className="text-xs text-muted-foreground">
                  Receive call events from CallIntel to log activity on contacts.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Webhook Ready
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs">Webhook URL (give this to CallIntel)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${process.env.NEXT_PUBLIC_APP_URL || "https://your-agencymail.com"}/api/webhooks/callintel`}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhooks/callintel`;
                    navigator.clipboard.writeText(url);
                    toast.success("Webhook URL copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set <code className="bg-muted px-1 py-0.5 rounded">CALLINTEL_WEBHOOK_SECRET</code> in
                your environment to secure this endpoint.
              </p>
            </div>
          </div>

          {/* FormFlow / BookScan incoming */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">FormFlow / BookScan</p>
                <p className="text-xs text-muted-foreground">
                  These apps sync contacts via the <code className="bg-muted px-1 py-0.5 rounded text-xs">/api/v1/contacts/sync</code> endpoint.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                API Ready
              </Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Create an API key on the{" "}
              <a href="/api-setup" className="text-primary underline">
                API Setup
              </a>{" "}
              page and provide it to FormFlow and BookScan as their{" "}
              <code className="bg-muted px-1 py-0.5 rounded">AGENCYMAIL_API_KEY</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
