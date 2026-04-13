import { NextResponse } from "next/server";

import { createProjectOrder } from "@/lib/api";
import { saveProject } from "@/lib/project-repository";
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
    await saveProject(project);

    return NextResponse.json({ project, order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create the order.",
      },
      { status: 500 },
    );
  }
}
