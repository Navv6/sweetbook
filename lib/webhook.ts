import type { Project, ProjectWebhookEvent } from "@/types/project";

export type SweetBookWebhookEvent =
  | "order.created"
  | "order.cancelled"
  | "order.restored"
  | "production.confirmed"
  | "production.started"
  | "production.completed"
  | "shipping.departed"
  | "shipping.delivered";

export interface SweetBookWebhookPayload {
  event: SweetBookWebhookEvent;
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

export const EVENT_LABELS: Record<SweetBookWebhookEvent, string> = {
  "order.created": "Order created",
  "order.cancelled": "Order cancelled",
  "order.restored": "Order restored",
  "production.confirmed": "Production confirmed",
  "production.started": "Production started",
  "production.completed": "Production completed",
  "shipping.departed": "Shipping departed",
  "shipping.delivered": "Shipping delivered",
};

const getReceivedAt = (timestamp: number) => {
  const millis = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(millis).toISOString();
};

const toWebhookEventRecord = (
  payload: SweetBookWebhookPayload,
): ProjectWebhookEvent => ({
  id: payload.deliveryId || `${payload.event}-${payload.timestamp}`,
  event: payload.event,
  label: EVENT_LABELS[payload.event] ?? payload.event,
  receivedAt: getReceivedAt(payload.timestamp),
  orderUid: payload.data.orderUid,
  bookUid: payload.data.bookUid,
  trackingNumber: payload.data.trackingNumber,
});

export const applyWebhookEventToProject = (
  project: Project,
  payload: SweetBookWebhookPayload,
): Project => {
  const eventRecord = toWebhookEventRecord(payload);
  const matchesOrder =
    Boolean(payload.data.orderUid) &&
    payload.data.orderUid === project.sweetbookOrderUid;
  const matchesBook =
    Boolean(payload.data.bookUid) &&
    payload.data.bookUid === project.sweetbookBookUid;

  const webhookEvents = [
    eventRecord,
    ...(project.webhookEvents ?? []).filter((item) => item.id !== eventRecord.id),
  ].sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));

  const order =
    project.order && (matchesOrder || matchesBook)
      ? {
          ...project.order,
          orderStatusDisplay: eventRecord.label,
          items: project.order.items.map((item) => ({
            ...item,
            itemStatusDisplay: eventRecord.label,
          })),
        }
      : project.order;

  return {
    ...project,
    order,
    webhookEvents,
    updatedAt: new Date().toISOString(),
  };
};
