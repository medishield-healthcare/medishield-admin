import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function jsonResponse(data: Record<string, unknown>, status: number) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// The admin session stays in the browser; only this server route sends its token
// to the backend. Forward multipart forms with a freshly generated boundary.
export async function proxyBlogRequest(request: Request, id?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.access_token) {
    return jsonResponse({ message: "Please sign in to manage blogs." }, 401);
  }
  if (id !== undefined && !/^[a-f\d]{24}$/i.test(id)) {
    return jsonResponse({ message: "Invalid blog ID." }, 400);
  }

  let body: FormData | string | undefined;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.user.access_token}`,
    Accept: "application/json",
  };

  if (request.method === "POST" || request.method === "PUT") {
    try {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.toLowerCase().startsWith("multipart/form-data")) {
        body = await request.formData();
      } else if (contentType.toLowerCase().startsWith("application/json")) {
        const data: unknown = await request.json();
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
        body = JSON.stringify(data);
        headers["Content-Type"] = "application/json";
      } else {
        return jsonResponse({ message: "Send multipart form data or a JSON object." }, 400);
      }
    } catch {
      return jsonResponse({ message: "Invalid blog form data." }, 400);
    }
  }

  try {
    const apiUrl = (process.env.API_URL || "http://localhost:5000").replace(/\/+$/, "");
    const response = await fetch(`${apiUrl}/api/blog${id ? `/${id}` : ""}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (response.status >= 400) {
      // Blog controller errors contain only a message and its operation flags.
      if (data && typeof data === "object" && !Array.isArray(data)) {
        return jsonResponse(data as Record<string, unknown>, response.status);
      }
      return jsonResponse({ message: "The blog request failed." }, response.status);
    }
    if (!response.ok || !data || typeof data !== "object" || Array.isArray(data)) {
      return jsonResponse({ message: "The blog service returned an invalid response." }, 502);
    }
    return jsonResponse(data as Record<string, unknown>, response.status);
  } catch {
    return jsonResponse(
      { message: "The blog service could not be reached. Refresh the list before retrying." },
      502,
    );
  }
}
