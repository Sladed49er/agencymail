import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const orgId = await validateApiKey(request.headers.get("authorization"));
  if (!orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const policyType = searchParams.get("policyType");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { orgId };
  if (status) where.status = status;
  if (policyType) where.policyType = policyType;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        externalId: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        policyType: true,
        carrier: true,
        renewalDate: true,
        agentName: true,
        tags: true,
        status: true,
        engagementScore: true,
        createdAt: true,
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return Response.json({ contacts, total, limit, offset });
}
