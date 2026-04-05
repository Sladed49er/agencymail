"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Plus, Key, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ApiSetupPage() {
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, refetch } = trpc.settings.listApiKeys.useQuery();
  const { data: dataSources } = trpc.settings.listDataSources.useQuery();

  const createKey = trpc.settings.createApiKey.useMutation({
    onSuccess: (result) => {
      setGeneratedKey(result.key);
      setKeyName("");
      refetch();
    },
  });

  const deleteKey = trpc.settings.deleteApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key deleted");
      refetch();
    },
  });

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          API Setup
        </h1>
        <p className="text-muted-foreground">
          Manage API keys and integrate with your management system.
        </p>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="docs">Endpoint Docs</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-4 space-y-4">
          {/* Create Key */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Key name (e.g., Production Sync)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  onClick={() => {
                    if (!keyName) return toast.error("Key name required");
                    createKey.mutate({ name: keyName });
                  }}
                  disabled={createKey.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Generate Key
                </Button>
              </div>

              {generatedKey && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    Save this key now. It will not be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white px-3 py-2 rounded border font-mono">
                      {generatedKey}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyKey}>
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {!apiKeys || apiKeys.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No API keys yet. Generate one above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">
                          {key.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{key.prefix}...</code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {key.lastUsedAt
                            ? formatDistanceToNow(new Date(key.lastUsedAt), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(key.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteKey.mutate({ id: key.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>REST API Endpoints</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use these endpoints to sync contacts from your management system.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <EndpointDoc
                method="POST"
                path="/api/v1/contacts/sync"
                description="Upsert contacts from your management system. Matches by externalId."
                example={`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/v1/contacts/sync \\
  -H "Authorization: Bearer am_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contacts": [
      {
        "externalId": "CLT-001",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com",
        "phone": "(555) 123-4567",
        "policyType": "Homeowners",
        "carrier": "Acme Insurance Co.",
        "renewalDate": "2027-01-15",
        "agentName": "Sarah Johnson"
      }
    ]
  }'`}
              />
              <EndpointDoc
                method="GET"
                path="/api/v1/contacts"
                description="List contacts with optional filters."
                example={`curl ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/v1/contacts?status=ACTIVE&limit=50 \\
  -H "Authorization: Bearer am_your_api_key"`}
              />
              <EndpointDoc
                method="POST"
                path="/api/v1/sms/inbound"
                description="Webhook for incoming SMS from CallIntel."
                example={`curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/v1/sms/inbound \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "+15551234567",
    "body": "Yes, please renew my policy",
    "orgId": "org_xxx"
  }'`}
              />
              <EndpointDoc
                method="GET"
                path="/api/v1/status"
                description="Health check endpoint."
                example={`curl ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/v1/status`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              {!dataSources || dataSources.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No data sources connected yet. Use the API endpoints or
                  import a CSV to add contacts.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources.map((ds) => (
                      <TableRow key={ds.id}>
                        <TableCell className="font-medium">
                          {ds.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ds.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {ds.lastSyncAt
                            ? formatDistanceToNow(new Date(ds.lastSyncAt), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ds.status === "active" ? "default" : "secondary"
                            }
                          >
                            {ds.status}
                          </Badge>
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

function EndpointDoc({
  method,
  path,
  description,
  example,
}: {
  method: string;
  path: string;
  description: string;
  example: string;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant={method === "GET" ? "secondary" : "default"}
          className="font-mono text-xs"
        >
          {method}
        </Badge>
        <code className="text-sm font-mono">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-xs font-mono">
        {example}
      </pre>
    </div>
  );
}
