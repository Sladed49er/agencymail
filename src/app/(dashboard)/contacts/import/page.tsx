"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Papa from "papaparse";

const CONTACT_FIELDS = [
  { value: "skip", label: "Skip this column" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip", label: "ZIP Code" },
  { value: "policyType", label: "Policy Type" },
  { value: "carrier", label: "Carrier" },
  { value: "renewalDate", label: "Renewal Date" },
  { value: "agentName", label: "Agent Name" },
  { value: "externalId", label: "External ID" },
];

type Step = "upload" | "map" | "importing" | "done";

export default function ImportContactsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importResults, setImportResults] = useState({
    imported: 0,
    errors: 0,
  });

  const createContact = trpc.contacts.create.useMutation();

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
        complete: (result) => {
          const rows = result.data as string[][];
          if (rows.length < 2) {
            toast.error("CSV file is empty or has no data rows");
            return;
          }
          setCsvHeaders(rows[0]);
          setCsvData(rows.slice(1).filter((r) => r.some((c) => c.trim())));

          // Auto-map columns based on header names
          const autoMap: Record<number, string> = {};
          rows[0].forEach((header, idx) => {
            const lower = header.toLowerCase().trim();
            if (lower.includes("email")) autoMap[idx] = "email";
            else if (lower.includes("first") && lower.includes("name"))
              autoMap[idx] = "firstName";
            else if (lower.includes("last") && lower.includes("name"))
              autoMap[idx] = "lastName";
            else if (lower.includes("phone")) autoMap[idx] = "phone";
            else if (lower.includes("city")) autoMap[idx] = "city";
            else if (lower.includes("state")) autoMap[idx] = "state";
            else if (lower.includes("zip")) autoMap[idx] = "zip";
            else if (lower.includes("address")) autoMap[idx] = "address";
            else if (lower.includes("policy")) autoMap[idx] = "policyType";
            else if (lower.includes("carrier")) autoMap[idx] = "carrier";
            else if (lower.includes("renewal")) autoMap[idx] = "renewalDate";
            else if (lower.includes("agent")) autoMap[idx] = "agentName";
          });
          setMapping(autoMap);
          setStep("map");
        },
        error: () => {
          toast.error("Failed to parse CSV file");
        },
      });
    },
    []
  );

  const handleImport = async () => {
    setStep("importing");
    let imported = 0;
    let errors = 0;

    for (const row of csvData) {
      const contact: Record<string, string> = {};
      for (const [colIdx, field] of Object.entries(mapping)) {
        if (field !== "skip") {
          contact[field] = row[parseInt(colIdx)]?.trim() || "";
        }
      }

      if (!contact.email && !contact.phone) {
        errors++;
        continue;
      }

      try {
        await createContact.mutateAsync({
          ...contact,
          source: "csv_import",
        });
        imported++;
      } catch {
        errors++;
      }
    }

    setImportResults({ imported, errors });
    setStep("done");
    toast.success(`Imported ${imported} contacts`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Contacts
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Import Contacts</h1>
          <p className="text-muted-foreground">
            Upload a CSV file to import contacts.
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium">Drop a CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                CSV files with headers are supported
              </p>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === "map" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Map Columns
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {csvData.length} rows found. Map CSV columns to contact fields.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {csvHeaders.map((header, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4"
                  >
                    <span className="text-sm font-medium w-48 truncate">
                      {header}
                    </span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <Select
                      value={mapping[idx] || "skip"}
                      onValueChange={(val) =>
                        setMapping((prev) => ({ ...prev, [idx]: val }))
                      }
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview (first 5 rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvHeaders.map((h, i) => (
                        <TableHead key={i}>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {h}
                            </div>
                            {mapping[i] && mapping[i] !== "skip" && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {mapping[i]}
                              </Badge>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (
                          <TableCell key={ci} className="text-sm">
                            {cell || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button onClick={handleImport}>
              Import {csvData.length} Contacts
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 font-medium">Importing contacts...</p>
            <p className="text-sm text-muted-foreground">
              This may take a moment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h3 className="text-xl font-bold mt-4">Import Complete</h3>
            <div className="flex justify-center gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {importResults.imported}
                </p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              {importResults.errors > 0 && (
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {importResults.errors}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Errors
                  </p>
                </div>
              )}
            </div>
            <Button className="mt-6" onClick={() => router.push("/contacts")}>
              View Contacts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
