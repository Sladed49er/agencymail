/**
 * Template merge field system for marketing emails.
 * Variables use {{variable}} syntax and are replaced at send time.
 */

export interface MergeFieldGroup {
  group: string;
  label: string;
  fields: MergeField[];
}

export interface MergeField {
  key: string;
  label: string;
  example: string;
}

export const MERGE_FIELD_GROUPS: MergeFieldGroup[] = [
  {
    group: "contact",
    label: "Contact",
    fields: [
      { key: "{{firstName}}", label: "First Name", example: "John" },
      { key: "{{lastName}}", label: "Last Name", example: "Smith" },
      { key: "{{email}}", label: "Email", example: "john@example.com" },
      { key: "{{phone}}", label: "Phone", example: "(555) 123-4567" },
      { key: "{{city}}", label: "City", example: "Portland" },
      { key: "{{state}}", label: "State", example: "OR" },
    ],
  },
  {
    group: "policy",
    label: "Policy",
    fields: [
      { key: "{{policyType}}", label: "Policy Type", example: "Homeowners" },
      { key: "{{carrier}}", label: "Carrier", example: "Acme Insurance Co." },
      {
        key: "{{renewalDate}}",
        label: "Renewal Date",
        example: "01/15/2027",
      },
    ],
  },
  {
    group: "agent",
    label: "Agent / Agency",
    fields: [
      {
        key: "{{agentName}}",
        label: "Agent Name",
        example: "Sarah Johnson",
      },
      {
        key: "{{agencyName}}",
        label: "Agency Name",
        example: "ABC Insurance Agency",
      },
    ],
  },
  {
    group: "links",
    label: "Links",
    fields: [
      {
        key: "{{unsubscribeUrl}}",
        label: "Unsubscribe Link",
        example: "https://...",
      },
    ],
  },
];

export const ALL_MERGE_FIELDS = MERGE_FIELD_GROUPS.flatMap((g) => g.fields);

/**
 * Replace merge fields in a template string with actual values.
 */
export function replaceMergeFields(
  template: string,
  data: Record<string, string | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result = result.replaceAll(key, value);
    }
  }
  // Remove any unreplaced merge fields
  result = result.replace(/\{\{[^}]+\}\}/g, "");
  return result;
}

/**
 * Build merge field data from contact + org context.
 */
export function buildMergeData(context: {
  contact?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    policyType?: string | null;
    carrier?: string | null;
    renewalDate?: Date | null;
    agentName?: string | null;
  };
  org?: {
    agencyName?: string | null;
    senderName?: string | null;
  };
  unsubscribeUrl?: string;
}): Record<string, string> {
  const { contact, org } = context;
  const data: Record<string, string> = {};

  if (contact) {
    data["{{firstName}}"] = contact.firstName || "";
    data["{{lastName}}"] = contact.lastName || "";
    data["{{email}}"] = contact.email || "";
    data["{{phone}}"] = contact.phone || "";
    data["{{city}}"] = contact.city || "";
    data["{{state}}"] = contact.state || "";
    data["{{policyType}}"] = contact.policyType || "";
    data["{{carrier}}"] = contact.carrier || "";
    data["{{renewalDate}}"] = contact.renewalDate
      ? new Date(contact.renewalDate).toLocaleDateString("en-US")
      : "";
    data["{{agentName}}"] = contact.agentName || "";
  }

  if (org) {
    data["{{agencyName}}"] = org.agencyName || org.senderName || "";
  }

  if (context.unsubscribeUrl) {
    data["{{unsubscribeUrl}}"] = context.unsubscribeUrl;
  }

  return data;
}
