import { NextResponse } from "next/server";

import { createProjectOrder } from "@/lib/api";
import type { Project, ShippingInfo } from "@/types/project";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project: Project;
      quantity?: number;
      shipping: ShippingInfo;
    };
    const order = await createProjectOrder(
      body.project,
      body.quantity ?? 1,
      body.shipping,
    );
    const project: Project = {
      ...body.project,
      order,
      sweetbookOrderUid: order.orderUid,
      status: "ordered",
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ project, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "주문 생성에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
