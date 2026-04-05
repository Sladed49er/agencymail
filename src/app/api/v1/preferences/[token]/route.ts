import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const pref = await prisma.marketingPreference.findUnique({
    where: { token },
    select: { emailOptIn: true, smsOptIn: true },
  });

  if (!pref) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(pref);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const body = await request.json();
  const { emailOptIn, smsOptIn } = body;

  const pref = await prisma.marketingPreference.findUnique({
    where: { token },
    select: { id: true, contactId: true },
  });

  if (!pref) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.marketingPreference.update({
    where: { id: pref.id },
    data: {
      emailOptIn: emailOptIn ?? true,
      smsOptIn: smsOptIn ?? true,
    },
  });

  // If they unsubscribed from email, update contact status
  if (emailOptIn === false) {
    await prisma.contact.update({
      where: { id: pref.contactId },
      data: { status: "UNSUBSCRIBED" },
    });
  }

  return Response.json({ ok: true });
}
