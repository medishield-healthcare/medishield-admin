import { authOptions } from "@/auth";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Keep the backend token on the server; clients use their existing admin session.
export async function proxyEventRequest(request: Request, id?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.access_token) {
    return NextResponse.json({ message: "Please sign in to manage events." }, { status: 401 });
  }
  if (id !== undefined && !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) {
    return NextResponse.json({ message: "Invalid event ID." }, { status: 400 });
  }

  let body: Record<string, unknown> | undefined;
  if (request.method === "POST" || request.method === "PUT") {
    try {
      body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    } catch {
      return NextResponse.json({ message: "Send a valid JSON object." }, { status: 400 });
    }
  }

  try {
    const apiUrl = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    const response = await axios.request({
      url: `${apiUrl}/api/event${id ? `/${id}` : ""}`,
      method: request.method,
      data: body,
      headers: { Authorization: `Bearer ${session.user.access_token}` },
      timeout: 60000,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    const data = response.data;
    if (response.status >= 400) {
      return NextResponse.json(
        { message: typeof data?.message === "string" ? data.message : "The event request failed." },
        { status: response.status },
      );
    }
    if (response.status >= 300 || !data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ message: "The event service returned an invalid response." }, { status: 502 });
    }
    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "The event service could not be reached. Refresh the list before retrying." },
      { status: 502 },
    );
  }
}
