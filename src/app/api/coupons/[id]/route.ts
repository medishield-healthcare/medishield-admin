import { authOptions } from "@/auth";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.access_token) {
    return NextResponse.json({ message: "Please sign in to manage coupons." }, { status: 401 });
  }
  if (!/^[a-f\d]{24}$/i.test(params.id)) {
    return NextResponse.json({ message: "Invalid coupon ID." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    const data: unknown = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data) || !Object.keys(data).length) {
      return NextResponse.json({ message: "Send coupon changes as a JSON object." }, { status: 400 });
    }
    body = data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Send a valid JSON object." }, { status: 400 });
  }

  try {
    const apiUrl = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    const response = await axios.put(`${apiUrl}/api/coupon/${params.id}`, body, {
      headers: { Authorization: `Bearer ${session.user.access_token}` },
      timeout: 60000,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const data = response.data;
    if (response.status >= 400) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "Could not update the coupon." },
        { status: response.status },
      );
    }
    if (response.status < 300 && data === null) {
      return NextResponse.json({ message: "Coupon not found. Refresh the list and try again." }, { status: 404 });
    }
    if (response.status >= 300 || !data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ message: "The coupon service returned an invalid response." }, { status: 502 });
    }
    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "The coupon service could not be reached. Refresh the list before retrying." },
      { status: 502 },
    );
  }
}
