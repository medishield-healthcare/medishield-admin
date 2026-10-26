import { proxyBlogRequest } from "@/lib/blog-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyBlogRequest(request);
}

export async function POST(request: Request) {
  return proxyBlogRequest(request);
}
