import { createHmac } from "crypto";
import { NextResponse } from "next/server";

import {
  applyWebhookEventToProject,
  EVENT_LABELS,
  type SweetBookWebhookEvent,
  type SweetBookWebhookPayload,
} from "@/lib/webhook";
import {
  findProjectBySweetBookIds,
  saveProject,
} from "@/lib/project-repository";

const verifySignature = (
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean => {
  const payload = `${timestamp}.${rawBody}`;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");

  if (expected.length !== signature.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }

  return diff === 0;
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  const event = request.headers.get("X-Webhook-Event") ?? "";
  const deliveryId = request.headers.get("X-Webhook-Delivery") ?? "";
  const timestamp = request.headers.get("X-Webhook-Timestamp") ?? "";
  const signature = request.headers.get("X-Webhook-Signature") ?? "";

  console.log(`[webhook] ${event} delivery=${deliveryId} ts=${timestamp}`);

  const secret = process.env.SWEETBOOK_WEBHOOK_SECRET?.trim();
  if (secret) {
    const valid = verifySignature(rawBody, timestamp, signature, secret);

    if (!valid) {
      const expected =
        "sha256=" +
        createHmac("sha256", secret)
          .update(`${timestamp}.${rawBody}`)
          .digest("hex");

      console.warn("[webhook] signature mismatch", {
        event,
        deliveryId,
        receivedPrefix: signature.slice(0, 20),
        expectedPrefix: expected.slice(0, 20),
      });

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: SweetBookWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SweetBookWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = EVENT_LABELS[payload.event as SweetBookWebhookEvent] ?? payload.event;
  const { orderUid, bookUid, trackingNumber } = payload.data;

  console.log(`[webhook] ${label}`, {
    orderUid,
    bookUid,
    trackingNumber,
    raw: payload.data,
  });

  try {
    const matchedProject = await findProjectBySweetBookIds({ orderUid, bookUid });

    if (matchedProject) {
      const syncedProject = applyWebhookEventToProject(matchedProject, payload);
      await saveProject(syncedProject);
      console.log(`[webhook] synced project ${syncedProject.id}`);
    }
  } catch (error) {
    console.error("[webhook] failed to sync project", error);
  }

  switch (payload.event) {
    case "order.created":
      console.log(`[webhook] order created: ${orderUid}`);
      break;
    case "production.confirmed":
      console.log(`[webhook] production confirmed: ${orderUid}`);
      break;
    case "production.completed":
      console.log(`[webhook] production completed: ${bookUid}`);
      break;
    case "shipping.departed":
      console.log(
        `[webhook] shipping departed: ${orderUid} tracking=${trackingNumber ?? "pending"}`,
      );
      break;
    case "shipping.delivered":
      console.log(`[webhook] shipping delivered: ${orderUid}`);
      break;
    case "order.cancelled":
      console.log(`[webhook] order cancelled: ${orderUid}`);
      break;
    default:
      console.log(`[webhook] unhandled event: ${payload.event}`);
  }

  return NextResponse.json(
    { received: true, event: payload.event, label },
    { status: 200 },
  );
}
