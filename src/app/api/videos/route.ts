import { proxyVideoRequest } from "@/lib/video-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyVideoRequest(request);
}

export async function POST(request: Request) {
  return proxyVideoRequest(request);
}
