"use client";

import { use, useState, useEffect } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PreferenceCenterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current preferences
    fetch(`/api/v1/preferences/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid link");
        return res.json();
      })
      .then((data) => {
        setEmailOptIn(data.emailOptIn);
        setSmsOptIn(data.smsOptIn);
        setLoading(false);
      })
      .catch(() => {
        setError("This preference link is invalid or has expired.");
        setLoading(false);
      });
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/preferences/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOptIn, smsOptIn }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
    } catch {
      setError("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Preferences Updated</h2>
            <p className="text-muted-foreground mt-2">
              Your communication preferences have been saved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Communication Preferences</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage what types of messages you receive from us.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Email Communications</Label>
              <p className="text-sm text-muted-foreground">
                Marketing emails, newsletters, and promotional content.
              </p>
            </div>
            <Switch checked={emailOptIn} onCheckedChange={setEmailOptIn} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">SMS Messages</Label>
              <p className="text-sm text-muted-foreground">
                Text message notifications and campaigns.
              </p>
            </div>
            <Switch checked={smsOptIn} onCheckedChange={setSmsOptIn} />
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You will still receive transactional messages related to your
            policies regardless of these settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
