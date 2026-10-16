import { proxyEventRequest } from "@/lib/event-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyEventRequest(request);
}

export async function POST(request: Request) {
  return proxyEventRequest(request);
}
