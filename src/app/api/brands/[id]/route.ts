import { authOptions } from "@/auth";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

async function proxyBrandRequest(request: Request, id: string, method: "PUT" | "DELETE") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.access_token) {
    return NextResponse.json({ message: "Please sign in to manage brands." }, { status: 401 });
  }
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ message: "Invalid brand ID." }, { status: 400 });
  }

  let body: { name: string; logo: string } | undefined;
  if (method === "PUT") {
    try {
      const data = await request.json();
      if (
        !data ||
        typeof data.name !== "string" ||
        !data.name.trim() ||
        typeof data.logo !== "string" ||
        !data.logo.trim()
      ) {
        return NextResponse.json({ message: "Brand name and logo are required." }, { status: 400 });
      }
      body = { name: data.name.trim(), logo: data.logo.trim() };
    } catch {
      return NextResponse.json({ message: "Send a valid JSON object." }, { status: 400 });
    }
  }

  try {
    const apiUrl = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    const response = await axios.request({
      url: `${apiUrl}/api/brand/${id}`,
      method,
      data: body,
      headers: { Authorization: `Bearer ${session.user.access_token}` },
      timeout: 60000,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const data = response.data;
    if (response.status >= 400) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "The brand request failed." },
        { status: response.status },
      );
    }
    if (response.status < 300 && data === null) {
      return NextResponse.json({ message: "Brand not found. Refresh the list and try again." }, { status: 404 });
    }
    if (response.status >= 300 || !data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ message: "The brand service returned an invalid response." }, { status: 502 });
    }
    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "The brand service could not be reached. Refresh the list before retrying." },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  return proxyBrandRequest(request, params.id, "PUT");
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return proxyBrandRequest(request, params.id, "DELETE");
}
