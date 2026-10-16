import { proxyEventRequest } from "@/lib/event-api";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(request: Request, { params }: RouteContext) {
  return proxyEventRequest(request, params.id);
}

export async function PUT(request: Request, { params }: RouteContext) {
  return proxyEventRequest(request, params.id);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return proxyEventRequest(request, params.id);
}
