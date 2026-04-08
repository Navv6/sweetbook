import { createHmac } from "crypto";
import { NextResponse } from "next/server";

// ─── 웹훅 서명 검증 ──────────────────────────────────────────────────────────

const verifySignature = (
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean => {
  const payload = `${timestamp}.${rawBody}`;
  const expected = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  // timing-safe 비교
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
};

// ─── 웹훅 이벤트 타입 ────────────────────────────────────────────────────────

type WebhookEvent =
  | "order.created"
  | "order.cancelled"
  | "order.restored"
  | "production.confirmed"
  | "production.started"
  | "production.completed"
  | "shipping.departed"
  | "shipping.delivered";

interface WebhookPayload {
  event: WebhookEvent;
  deliveryId: string;
  timestamp: number;
  data: {
    orderUid?: string;
    bookUid?: string;
    status?: string;
    trackingNumber?: string;
    [key: string]: unknown;
  };
}

// ─── 이벤트별 한국어 상태 메시지 ─────────────────────────────────────────────

const EVENT_LABELS: Record<WebhookEvent, string> = {
  "order.created": "주문 결제 완료",
  "order.cancelled": "주문 취소",
  "order.restored": "주문 복원",
  "production.confirmed": "제작 확정",
  "production.started": "제작 시작",
  "production.completed": "제작 완료",
  "shipping.departed": "배송 출발",
  "shipping.delivered": "배송 완료",
};

// ─── POST 핸들러 ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const rawBody = await request.text();

  const event = request.headers.get("X-Webhook-Event") ?? "";
  const deliveryId = request.headers.get("X-Webhook-Delivery") ?? "";
  const timestamp = request.headers.get("X-Webhook-Timestamp") ?? "";
  const signature = request.headers.get("X-Webhook-Signature") ?? "";

  console.log(`[webhook] ${event} delivery=${deliveryId}`);

  // 서명 검증 (WEBHOOK_SECRET 환경변수가 있을 때만)
  const secret = process.env.SWEETBOOK_WEBHOOK_SECRET;
  if (secret) {
    const valid = verifySignature(rawBody, timestamp, signature, secret);
    if (!valid) {
      console.warn("[webhook] 서명 검증 실패", { event, deliveryId });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = EVENT_LABELS[payload.event as WebhookEvent] ?? payload.event;
  const { orderUid, bookUid, trackingNumber } = payload.data;

  console.log(`[webhook] ✅ ${label}`, {
    orderUid,
    bookUid,
    trackingNumber,
    raw: payload.data,
  });

  // 이벤트별 처리
  switch (payload.event) {
    case "order.created":
      // TODO: DB에 주문 상태 업데이트, 고객 이메일 발송 등
      console.log(`[webhook] 주문 생성됨: ${orderUid}`);
      break;

    case "production.confirmed":
      console.log(`[webhook] 제작 확정: ${orderUid}`);
      break;

    case "production.completed":
      console.log(`[webhook] 제작 완료: ${bookUid}`);
      break;

    case "shipping.departed":
      console.log(`[webhook] 배송 시작: ${orderUid} 운송장=${trackingNumber ?? "미정"}`);
      break;

    case "shipping.delivered":
      console.log(`[webhook] 배송 완료: ${orderUid}`);
      break;

    case "order.cancelled":
      console.log(`[webhook] 주문 취소: ${orderUid}`);
      break;

    default:
      console.log(`[webhook] 처리되지 않은 이벤트: ${payload.event}`);
  }

  // SweetBook API는 2xx 응답을 받아야 재전송하지 않음
  return NextResponse.json(
    { received: true, event: payload.event, label },
    { status: 200 },
  );
}
