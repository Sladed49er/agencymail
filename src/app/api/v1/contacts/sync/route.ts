import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-auth";

interface SyncContact {
  externalId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  policyType?: string;
  carrier?: string;
  renewalDate?: string;
  agentName?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  const orgId = await validateApiKey(request.headers.get("authorization"));
  if (!orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { contacts: SyncContact[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.contacts)) {
    return Response.json(
      { error: "contacts must be an array" },
      { status: 400 }
    );
  }

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const contact of body.contacts) {
    if (!contact.externalId) {
      errors++;
      continue;
    }

    try {
      const existing = await prisma.contact.findUnique({
        where: { orgId_externalId: { orgId, externalId: contact.externalId } },
      });

      const data = {
        email: contact.email,
        phone: contact.phone,
        firstName: contact.firstName,
        lastName: contact.lastName,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        zip: contact.zip,
        policyType: contact.policyType,
        carrier: contact.carrier,
        renewalDate: contact.renewalDate
          ? new Date(contact.renewalDate)
          : undefined,
        agentName: contact.agentName,
        tags: contact.tags,
      };

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        const newContact = await prisma.contact.create({
          data: {
            orgId,
            externalId: contact.externalId,
            source: "api_sync",
            ...data,
          },
        });

        // Create marketing preference
        await prisma.marketingPreference.create({
          data: { contactId: newContact.id },
        });

        // Log activity
        await prisma.contactActivity.create({
          data: {
            contactId: newContact.id,
            type: "contact_created",
            description: "Contact synced via API",
          },
        });

        created++;
      }
    } catch {
      errors++;
    }
  }

  // Update data source record
  await prisma.dataSource.upsert({
    where: {
      id: `${orgId}_api_sync`,
    },
    update: {
      lastSyncAt: new Date(),
    },
    create: {
      id: `${orgId}_api_sync`,
      orgId,
      type: "API",
      name: "API Contact Sync",
      lastSyncAt: new Date(),
    },
  });

  return Response.json({
    success: true,
    created,
    updated,
    errors,
    total: body.contacts.length,
  });
}
